import { useEffect, useMemo, useRef, useState, useId } from "react";
import { triggerHaptic } from "./haptics.js";
import { ErrorState, EmptyState, LoadingState, RetryAction } from "./ui/StateStates.jsx";

const COMPANION_PHASE = {
  CLOSED: "closed",
  OPENING: "opening",
  READY: "ready",
  COMPOSING: "composing",
  SUBMITTING: "submitting",
  STREAMING: "streaming/responding",
  RESPONSE_COMPLETE: "responseComplete",
  ERROR: "error",
  UNAVAILABLE: "unavailable"
};

const isPendingPhase = (phase) => (
  phase === COMPANION_PHASE.SUBMITTING || phase === COMPANION_PHASE.STREAMING
);
const MAX_COMPOSER_CHARS = 480;
const VOICE_STATE = {
  IDLE: "idle",
  LISTENING: "listening",
  PROCESSING: "processing",
  STOPPED: "stopped",
  UNAVAILABLE: "unavailable"
};

const isSafeUrl = (url) => /^https?:\/\//i.test(url) || /^mailto:/i.test(url);

const renderInlineMarkdown = (text, keyPrefix = "inline") => {
  const parts = [];
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|https?:\/\/[^\s<)]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [raw, , linkText, linkUrl, code, bold, italic] = match;
    const key = `${keyPrefix}-${match.index}`;

    if (linkText && isSafeUrl(linkUrl)) parts.push(<a key={key} href={linkUrl} target="_blank" rel="noreferrer">{linkText}</a>);
    else if (code) parts.push(<code key={key}>{code}</code>);
    else if (bold) parts.push(<strong key={key}>{bold}</strong>);
    else if (italic) parts.push(<span key={key}>{italic}</span>);
    else if (isSafeUrl(raw)) parts.push(<a key={key} href={raw} target="_blank" rel="noreferrer">{raw}</a>);
    else parts.push(raw);
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

function SafeMarkdown({ content, streaming }) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;
  let fence = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ");
    blocks.push(<p key={`p-${blocks.length}`}>{renderInlineMarkdown(text, `p-${blocks.length}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(<Tag key={`list-${blocks.length}`}>{list.items.map((item, index) => <li key={index}>{renderInlineMarkdown(item, `li-${blocks.length}-${index}`)}</li>)}</Tag>);
    list = null;
  };

  lines.forEach((line) => {
    const fenceMatch = line.match(/^```([\w-]+)?\s*$/);
    if (fenceMatch) {
      if (fence) {
        blocks.push(<pre key={`code-${blocks.length}`}><code>{fence.lines.join("\n")}</code></pre>);
        fence = null;
      } else {
        flushParagraph(); flushList();
        fence = { lang: fenceMatch[1] || "", lines: [] };
      }
      return;
    }
    if (fence) { fence.lines.push(line); return; }
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const orderedList = Boolean(ordered);
      if (!list || list.ordered !== orderedList) flushList();
      if (!list) list = { ordered: orderedList, items: [] };
      list.items.push((unordered || ordered)[1]);
      return;
    }
    if (!line.trim()) { flushParagraph(); flushList(); return; }
    paragraph.push(line.trim());
  });

  flushParagraph(); flushList();
  if (fence) blocks.push(<pre key={`pending-code-${blocks.length}`} className="markdown-pending"><code>{fence.lines.join("\n")}</code></pre>);
  return <div className="assistant-markdown cormorant">{blocks.length ? blocks : null}</div>;
}

function deriveResponseSections(content) {
  const text = String(content || "").trim();
  if (!text) {
    return {
      shortAnswer: "",
      whyItMatters: "",
      verifiedContext: "",
      goDeeper: ""
    };
  }

  const normalized = text.replace(/\r\n/g, "\n");
  const headingMatches = Array.from(normalized.matchAll(/^(SHORT ANSWER|WHY IT MATTERS|VERIFIED CONTEXT|GO DEEPER|UNKNOWNS)\s*:\s*$/gim));
  if (headingMatches.length) {
    const sections = {
      shortAnswer: "",
      whyItMatters: "",
      verifiedContext: "",
      goDeeper: ""
    };
    const mapKey = {
      "SHORT ANSWER": "shortAnswer",
      "WHY IT MATTERS": "whyItMatters",
      "VERIFIED CONTEXT": "verifiedContext",
      "GO DEEPER": "goDeeper",
      "UNKNOWNS": "goDeeper"
    };
    for (let i = 0; i < headingMatches.length; i += 1) {
      const heading = headingMatches[i][1].toUpperCase();
      const start = headingMatches[i].index + headingMatches[i][0].length;
      const end = i < headingMatches.length - 1 ? headingMatches[i + 1].index : normalized.length;
      const body = normalized.slice(start, end).trim();
      const key = mapKey[heading];
      if (!key || !body) continue;
      sections[key] = sections[key] ? `${sections[key]}\n\n${body}` : body;
    }
    if (!sections.shortAnswer) sections.shortAnswer = normalized;
    if (!sections.verifiedContext) {
      sections.verifiedContext = "Verified context is limited for this question. I can only confirm what appears in the documented record.";
    }
    return sections;
  }

  const blocks = normalized
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const shortAnswer = blocks[0] || text;
  const whyItMatters = blocks[1] || "";
  const contextCandidate = blocks.find((block) => /(verified|source|record|year|\b19\d{2}\b|\b20\d{2}\b)/i.test(block) && block !== shortAnswer && block !== whyItMatters) || "";
  const remaining = blocks.filter((block) => block !== shortAnswer && block !== whyItMatters && block !== contextCandidate);
  const goDeeper = remaining.join("\n\n");

  return {
    shortAnswer,
    whyItMatters,
    verifiedContext: contextCandidate || "Verified context is limited for this question. I can only confirm what appears in the documented record.",
    goDeeper
  };
}

function AIResponse({ content, streaming }) {
  const [expanded, setExpanded] = useState(false);
  const sectionId = useId();
  const sections = useMemo(() => deriveResponseSections(content), [content]);
  const hasExpandable = Boolean(sections.goDeeper);

  return (
    <div>
      {sections.shortAnswer && (
        <div style={{ marginBottom: sections.whyItMatters || sections.verifiedContext || hasExpandable ? 10 : 0 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#7BC8E8", marginBottom: 5 }}>SHORT ANSWER</div>
          <SafeMarkdown content={sections.shortAnswer} streaming={streaming} />
        </div>
      )}
      {sections.whyItMatters && (
        <div style={{ marginBottom: sections.verifiedContext || hasExpandable ? 10 : 0 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#C9A84C", marginBottom: 5 }}>WHY IT MATTERS</div>
          <SafeMarkdown content={sections.whyItMatters} streaming={false} />
        </div>
      )}
      {sections.verifiedContext && (
        <div style={{ marginBottom: hasExpandable ? 10 : 0 }}>
          <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#7BC8E8", marginBottom: 5 }}>VERIFIED CONTEXT</div>
          <SafeMarkdown content={sections.verifiedContext} streaming={false} />
        </div>
      )}
      {hasExpandable && (
        <div>
          <button
            type="button"
            className="proof-btn mono"
            aria-expanded={expanded}
            aria-controls={sectionId}
            onClick={() => setExpanded((v) => !v)}
            style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer", marginBottom: expanded ? 10 : 0 }}
          >
            {expanded ? "SHOW LESS" : "SHOW MORE"}
          </button>
          {expanded && (
            <div id={sectionId}>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 2, color: "#C9A84C", marginBottom: 5 }}>GO DEEPER</div>
              <SafeMarkdown content={sections.goDeeper} streaming={false} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionChips({ suggestions, onSelect, disabled = false, label = "Suggested prompts" }) {
  if (!suggestions.length) return null;
  return (
    <div aria-label={label} className="suggestion-row twin-prompt-row">
      {suggestions.map((suggestion) => (
        <button key={`${suggestion.label}-${suggestion.prompt}`} type="button" className="suggestion-chip" onClick={() => onSelect(suggestion.prompt)} disabled={disabled}>
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}

function dedupeSuggestions(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.label}::${item.prompt}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function VoiceSynthesisPanel({ active, status, onPlay, onStop, mode }) {
  return (
    <div className="voice-panel">
      <div>
        <div className="mono" style={{ fontSize: 8, color: "#7BC8E8", letterSpacing: 2, marginBottom: 5 }}>
          {mode === "narrator" ? "NARRATOR VOICE VISUALIZATION" : "AI RESPONSE VISUALIZATION"}
        </div>
        <div className="mono" style={{ fontSize: 8, color: "#8f8f8f", letterSpacing: 1 }}>{status}</div>
      </div>
      <div className="voice-bars" aria-hidden="true">{[0,1,2,3,4].map(i => <span key={i} style={{ animationPlayState: active ? "running" : "paused" }} />)}</div>
      <button className="proof-btn mono" onClick={active ? onStop : onPlay} style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer", whiteSpace: "nowrap" }}>
        {active ? "STOP VISUAL" : "SHOW VOICE"}
      </button>
    </div>
  );
}

export default function TwinModal({ athlete, moment, mode, onClose, onSwitchMode, chapterForContext, suggestionsFor, buildSystemPrompt, persona }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const guardrailedSystemPrompt = useMemo(() => {
    const chapter = chapterForContext(athlete, moment);
    const chapterLine = chapter ? `Current chapter focus: ${chapter.number} - ${chapter.title} (${chapter.year}).` : "";
    return `${buildSystemPrompt(athlete)}

RESPONSE GUARDRAILS (RICON VERIFICATION STANDARD):
- Distinguish clearly between VERIFIED RECORD, NARRATIVE INTERPRETATION, and UNKNOWN/UNVERIFIED.
- Never present interpretation or speculation as verified fact.
- If the user asks beyond documented sources, say this exactly once in your response:
"I can’t verify that from the current RICON source record."
- Keep tone premium, concise, story-driven, and source-grounded.
- Keep answers tight and readable for an on-screen chat panel.
${chapterLine}

RESPONSE FORMAT (use these section headings):
SHORT ANSWER:
<1-2 concise sentences>

WHY IT MATTERS:
<brief narrative interpretation anchored to known context>

VERIFIED CONTEXT:
<what is directly supported by documented moments/sources, or state limitation>

GO DEEPER:
<optional expanded context; include UNKNOWN/UNVERIFIED note where needed>`;
  }, [athlete, moment, chapterForContext, buildSystemPrompt]);
  const modeDescriptor = mode === "narrator"
    ? "Narrator mode · guided chapter playback"
    : "Ask mode · direct questions on this chapter";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isComposingInput, setIsComposingInput] = useState(false);
  const [phase, setPhase] = useState(COMPANION_PHASE.OPENING);
  const [error, setError] = useState(null);
  const [streamingId, setStreamingId] = useState(null);
  const [voiceState, setVoiceState] = useState(VOICE_STATE.IDLE);
  const [voiceStatus, setVoiceStatus] = useState("ready");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [companionHealth, setCompanionHealth] = useState({
    status: "checking",
    message: "Verifying Twin availability..."
  });
  const [currentChapter, setCurrentChapter] = useState(() => chapterForContext(athlete, moment));
  const apiHistory = useRef([]);
  const requestInFlightRef = useRef(false);
  const abortRef = useRef(null);
  const lastRequestRef = useRef(null);
  const bottomRef = useRef(null);
  const chatScrollRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const nearBottomRef = useRef(true);
  const isProgrammaticScrollRef = useRef(false);
  const suggestionHistoryRef = useRef([]);
  const composerRef = useRef(null);
  const modeRef = useRef(null);
  const recognitionRef = useRef(null);
  const warnedFallbackRef = useRef(false);
  const draftKey = `ricon:twin:draft:${athlete?.id || "unknown"}:qa`;
  const voiceInputSupported = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isDev = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);
  const companionUnavailable = companionHealth.status === "unavailable";
  const companionReadyForPrompts = companionHealth.status === "available" || companionHealth.status === "degraded";
  const pendingResponse = isPendingPhase(phase);
  const trimmedInput = input.trim();
  const remainingChars = MAX_COMPOSER_CHARS - input.length;
  const canRetryLatest = Boolean(lastRequestRef.current) && !pendingResponse && (phase === COMPANION_PHASE.ERROR || phase === COMPANION_PHASE.RESPONSE_COMPLETE);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const lastUserQuestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user" && messages[i]?.content) return messages[i].content;
    }
    return "";
  }, [messages]);
  const starterSuggestions = useMemo(() => suggestionsFor(athlete, currentChapter, "starter"), [athlete, currentChapter, suggestionsFor]);
  const followupSuggestions = useMemo(() => suggestionsFor(athlete, currentChapter, "followup"), [athlete, currentChapter, suggestionsFor]);
  const contextualSuggestions = useMemo(() => {
    const firstName = athlete?.name?.split(" ")[0] || "the athlete";
    const chapterTitle = currentChapter?.title || moment?.title || "this chapter";
    const chapterYear = currentChapter?.year || moment?.y || "this season";
    const sceneLabel = moment?.title || chapterTitle;
    const previousQuestion = lastUserQuestion.trim();
    const lowerQuestion = previousQuestion.toLowerCase();

    const narratorCore = [
      { label: "Continue the story", prompt: `Continue the story from "${sceneLabel}" and connect it to the next defining chapter.` },
      { label: "Explain the stakes", prompt: `Narrate the stakes in ${chapterYear} around "${sceneLabel}" and why everything was on the line.` },
      { label: "Why this mattered", prompt: `In first person, explain why "${sceneLabel}" became a legacy-defining moment.` },
      { label: "Legacy connection", prompt: `Connect "${sceneLabel}" to the larger legacy arc in ${firstName}'s career.` },
      { label: "Verified source context", prompt: `Add the verified source context behind "${sceneLabel}" without breaking the cinematic voice.` }
    ];

    const qaCore = [
      { label: "Explain the stakes", prompt: `Explain the stakes in ${chapterYear} during "${sceneLabel}".` },
      { label: "Why did this matter?", prompt: `Why did "${sceneLabel}" matter in the larger legacy?` },
      { label: "What to notice", prompt: `What should I notice in the footage for "${sceneLabel}" that most fans miss?` },
      { label: "Legacy connection", prompt: `How does "${sceneLabel}" connect to the broader storyline and legacy arc?` },
      { label: "Verified source context", prompt: `Show the verified source context for "${sceneLabel}" and what it confirms.` }
    ];

    const followupByQuestion = lowerQuestion
      ? [
          { label: "Go deeper", prompt: `Go deeper on my question: "${previousQuestion}". Keep it grounded in verified context from "${sceneLabel}".` },
          { label: "Give evidence", prompt: `What verified evidence best supports your answer to: "${previousQuestion}"?` }
        ]
      : [];

    const parentSuggestions = mode === "narrator" ? followupSuggestions : starterSuggestions;
    const pool = dedupeSuggestions([
      ...(mode === "narrator" ? narratorCore : qaCore),
      ...followupByQuestion,
      ...parentSuggestions
    ]);

    const lastSignature = suggestionHistoryRef.current[suggestionHistoryRef.current.length - 1] || "";
    const filtered = pool.filter((item) => `${item.label}::${item.prompt}` !== lastSignature);
    return (filtered.length ? filtered : pool).slice(0, 4);
  }, [athlete, currentChapter, followupSuggestions, starterSuggestions, lastUserQuestion, mode, moment]);

  const scrollToLatest = (behavior = "smooth") => {
    isProgrammaticScrollRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, behavior === "auto" ? 0 : 260);
  };
  useEffect(() => {
    const node = chatScrollRef.current;
    if (!node) return undefined;
    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
      const nearBottom = distanceFromBottom < 96;
      nearBottomRef.current = nearBottom;
      if (nearBottom) setShowJumpToLatest(false);
    };
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    const messageCount = messages.length;
    const lastMessage = messages[messageCount - 1];
    const addedNewMessage = messageCount > previousMessageCountRef.current;
    const startedNewResponse = addedNewMessage && lastMessage?.role === "assistant";
    const shouldFollow = nearBottomRef.current;

    if (startedNewResponse) {
      if (shouldFollow) {
        scrollToLatest("smooth");
      } else {
        setShowJumpToLatest(true);
      }
    } else if (pendingResponse) {
      if (shouldFollow) {
        scrollToLatest("auto");
      } else {
        setShowJumpToLatest(true);
      }
    } else if (addedNewMessage) {
      if (shouldFollow) scrollToLatest("smooth");
      else setShowJumpToLatest(true);
    }

    previousMessageCountRef.current = messageCount;
  }, [messages, pendingResponse]);
  useEffect(() => {
    if (!voiceInputSupported) {
      setVoiceState(VOICE_STATE.UNAVAILABLE);
      setVoiceStatus("Voice input is not available on this device.");
    }
  }, [voiceInputSupported]);
  const checkCompanionHealth = async ({ silent = false } = {}) => {
    if (!silent) {
      setCompanionHealth((current) => ({ ...current, status: "checking", message: "Verifying Twin availability..." }));
    }
    try {
      const response = await fetch("/api/twin/health", { method: "GET", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      const status = payload.status === "available" || payload.status === "degraded" || payload.status === "unavailable"
        ? payload.status
        : "unavailable";
      const message = typeof payload.message === "string" && payload.message.trim()
        ? payload.message
        : (status === "available"
          ? "Twin is ready."
          : status === "degraded"
            ? "Twin is available with limited live responses."
            : "Twin is temporarily unavailable.");
      setCompanionHealth({ status, message });
      if (status === "unavailable") {
        if (!isPendingPhase(phase)) setPhase(COMPANION_PHASE.UNAVAILABLE);
      } else if (phase === COMPANION_PHASE.OPENING || phase === COMPANION_PHASE.UNAVAILABLE) {
        setPhase(COMPANION_PHASE.READY);
      }
      if (isDev && !response.ok) {
        console.warn(`[RICON Twin] Health check returned ${response.status}. Using "${status}" state.`);
      }
      return status;
    } catch {
      const status = "unavailable";
      const message = "The Twin is temporarily unavailable. Keep exploring verified chapters while we reconnect.";
      setCompanionHealth({ status, message });
      if (!isPendingPhase(phase)) setPhase(COMPANION_PHASE.UNAVAILABLE);
      if (isDev) {
        console.warn("[RICON Twin] Unable to reach /api/twin/health. Companion marked unavailable.");
      }
      return status;
    }
  };
  useEffect(() => {
    checkCompanionHealth({ silent: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode !== "qa") return;
    try {
      const saved = window.sessionStorage.getItem(draftKey);
      if (saved) setInput(saved.slice(0, MAX_COMPOSER_CHARS));
    } catch {
      // Ignore session storage access issues.
    }
  }, [draftKey, mode]);
  useEffect(() => {
    if (typeof window === "undefined" || mode !== "qa") return;
    try {
      if (input) window.sessionStorage.setItem(draftKey, input);
      else window.sessionStorage.removeItem(draftKey);
    } catch {
      // Ignore session storage access issues.
    }
  }, [draftKey, input, mode]);
  useEffect(() => {
    if (mode !== "qa" || isPendingPhase(phase)) return;
    if (companionUnavailable) {
      setPhase(COMPANION_PHASE.UNAVAILABLE);
      return;
    }
    if (input.trim()) {
      setPhase(COMPANION_PHASE.COMPOSING);
      return;
    }
    if (phase === COMPANION_PHASE.COMPOSING || phase === COMPANION_PHASE.ERROR || phase === COMPANION_PHASE.RESPONSE_COMPLETE) {
      setPhase(COMPANION_PHASE.READY);
    }
  }, [input, mode, phase, companionUnavailable]);
  useEffect(() => {
    const updateChapter = () => setCurrentChapter(chapterForContext(athlete, moment));
    updateChapter();
    window.addEventListener("hashchange", updateChapter);
    window.addEventListener("popstate", updateChapter);
    return () => {
      window.removeEventListener("hashchange", updateChapter);
      window.removeEventListener("popstate", updateChapter);
    };
  }, [athlete, moment, chapterForContext]);
  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    abortRef.current?.abort?.();
    setPhase(COMPANION_PHASE.CLOSED);
  }, []);
  useEffect(() => {
    if (!toastMessage) return undefined;
    const id = window.setTimeout(() => setToastMessage(""), 2200);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const copyText = async (text, successMessage) => {
    const value = String(text || "").trim();
    if (!value) {
      setToastMessage("Nothing to copy yet.");
      return false;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement("textarea");
        el.value = value;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setToastMessage(successMessage);
      return true;
    } catch {
      setToastMessage("Copy unavailable on this device. You can copy manually.");
      return false;
    }
  };

  const copyConversation = async () => {
    const transcript = messages
      .map((msg) => `${msg.role === "assistant" ? persona.name : "You"}: ${String(msg.content || "").trim()}`)
      .filter(Boolean)
      .join("\n\n");
    await copyText(transcript, "Conversation copied.");
  };

  const copyMomentLink = async () => {
    const chapterId = currentChapter?.id || (moment ? `chapter-${(athlete?.moments || []).findIndex((m) => m.title === moment.title) + 1}` : "chapter-1");
    const url = `${window.location.origin}${window.location.pathname}#${chapterId}`;
    await copyText(url, "Moment link copied.");
  };

  const showVoice = (index = "latest") => { setSpeakingIndex(index); setVoiceStatus("Voice visualization only. Audio muted for demo quality."); };
  const stopVoiceVisual = () => { setSpeakingIndex(null); setVoiceStatus("Voice visual stopped"); };
  const startVoiceInput = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceState(VOICE_STATE.UNAVAILABLE);
      setVoiceStatus("Voice input is not available on this device.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      setVoiceState(VOICE_STATE.LISTENING);
      setVoiceStatus("Listening for your question");
    };
    recognition.onresult = (event) => {
      setVoiceState(VOICE_STATE.PROCESSING);
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
      setVoiceStatus(transcript ? "Voice captured. Send when ready." : "No voice captured.");
    };
    recognition.onerror = (event) => {
      const denied = event?.error === "not-allowed" || event?.error === "service-not-allowed";
      setVoiceState(VOICE_STATE.STOPPED);
      setVoiceStatus(denied ? "Microphone access is blocked. Enable it in browser settings to use voice input." : "Voice capture failed. You can continue typing your question.");
    };
    recognition.onend = () => {
      setVoiceState(VOICE_STATE.STOPPED);
      if (!String(voiceStatus || "").trim()) setVoiceStatus("Voice input stopped.");
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const errorMessageFor = (status, text) => {
    if (status === 429) return "Twin traffic is high right now. Please wait a moment, then try again.";
    if (status === 401 || status === 403) return "Twin access is unavailable right now. Continue through the verified timeline and try again shortly.";
    if (status === 503) return "Twin is temporarily offline. You can keep exploring chapters while we reconnect.";
    if (status >= 500) return "Twin is temporarily unavailable. Retry in a moment or switch modes.";
    return "We couldn't reach the Twin right now. Please retry in a moment.";
  };

  const streamTwin = async ({ history, assistantId, onComplete }) => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null); setStreamingId(assistantId);
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      const res = await fetch("/api/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ athlete, system: guardrailedSystemPrompt, messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      const fallbackMode = res.headers.get("X-RICON-Companion-Fallback");
      if (isDev && fallbackMode && !warnedFallbackRef.current) {
        warnedFallbackRef.current = true;
        console.warn(`[RICON Twin] Companion is running in fallback mode (${fallbackMode}). Configure server-side ANTHROPIC_API_KEY / ANTHROPIC_MODEL for live responses.`);
      }
      if (!res.ok) throw new Error(errorMessageFor(res.status, await res.text()));
      if (!res.body) throw new Error("Live response is unavailable in this browser. Please refresh and try again.");
      setPhase(COMPANION_PHASE.STREAMING);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((msg) => (msg.id === assistantId ? { ...msg, content: fullText, streaming: true } : msg)));
      }
      const reply = fullText || "The twin is momentarily silent.";
      setMessages((current) => current.map((msg) => (msg.id === assistantId ? { ...msg, content: reply, streaming: false } : msg)));
      triggerHaptic("message");
      onComplete?.(reply);
      return reply;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const runTwinRequest = async ({ history, userMessage = null, replaceAssistantId = null, modeTag = mode, onComplete }) => {
    if (requestInFlightRef.current) return false;
    const currentHealth = companionReadyForPrompts ? companionHealth.status : await checkCompanionHealth({ silent: true });
    if (currentHealth === "unavailable") {
      setError("The Twin is temporarily unavailable. Continue exploring verified chapters while we reconnect.");
      setPhase(COMPANION_PHASE.UNAVAILABLE);
      return false;
    }
    requestInFlightRef.current = true;
    setPhase(COMPANION_PHASE.SUBMITTING);
    const assistantId = replaceAssistantId || `assistant-${Date.now()}`;
    lastRequestRef.current = { history: [...history], assistantId, modeTag };
    if (userMessage) setMessages(p => [...p, userMessage, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    else if (replaceAssistantId) setMessages(p => p.map(msg => (msg.id === replaceAssistantId ? { ...msg, content: "", streaming: true } : msg)));
    else setMessages(p => [...p, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    try {
      await streamTwin({ history, assistantId, onComplete });
      showVoice(assistantId);
      setPhase(COMPANION_PHASE.RESPONSE_COMPLETE);
      return true;
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(p => p.map(msg => (msg.id === assistantId ? { ...msg, streaming: false, stopped: true, content: msg.content || "Generation stopped." } : msg)));
        setError("The response timed out. Please retry.");
        setPhase(COMPANION_PHASE.ERROR);
      }
      else {
      setError(err.message || "Unable to reach the Twin right now. Please try again.");
        setMessages(p => p.map(msg => (msg.id === assistantId ? { ...msg, streaming: false, failed: true, content: msg.content || "" } : msg)));
        setPhase((err.message || "").toLowerCase().includes("unavailable") ? COMPANION_PHASE.UNAVAILABLE : COMPANION_PHASE.ERROR);
      }
      return false;
    } finally {
      requestInFlightRef.current = false;
      setStreamingId(null); abortRef.current = null;
    }
  };

  const retryLatest = () => {
    const last = lastRequestRef.current;
    if (!last || !canRetryLatest) return;
    checkCompanionHealth().then((status) => {
      if (status === "unavailable") return;
      runTwinRequest({ history: last.history, replaceAssistantId: last.assistantId, modeTag: last.modeTag, onComplete: (reply) => { apiHistory.current = [...last.history, { role: "assistant", content: reply }]; } });
    });
  };
  const stopGeneration = () => abortRef.current?.abort?.();
  const triggerNarrator = async () => {
    const prompt = "You are narrating your own legacy for a fan experiencing your verified story for the first time. Open with a powerful, cinematic first-person statement.";
    apiHistory.current = [{ role: "user", content: prompt }];
    setMessages([]);
    await runTwinRequest({ history: apiHistory.current, onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply }) });
  };
  const continueNarrator = async () => {
    if (pendingResponse) return;
    apiHistory.current.push({ role: "user", content: "Continue the story with a different defining chapter." });
    await runTwinRequest({ history: apiHistory.current, onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply }) });
  };
  const sendQA = async (override) => {
    const text = typeof override === "string" ? override : input;
    if (!text.trim() || pendingResponse || !companionReadyForPrompts) return;
    triggerHaptic("primary");
    const userMsg = { id: `user-${Date.now()}`, role: "user", content: text };
    apiHistory.current.push({ role: "user", content: text });
    setError(null);
    const succeeded = await runTwinRequest({ history: apiHistory.current, userMessage: userMsg, onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply }) });
    if (succeeded && typeof override !== "string") {
      setInput("");
      try {
        if (typeof window !== "undefined") window.sessionStorage.removeItem(draftKey);
      } catch {
        // Ignore session storage access issues.
      }
    }
    composerRef.current?.focus?.();
  };
  const useSuggestedPrompt = async (prompt) => {
    const signature = `suggested::${prompt}`;
    suggestionHistoryRef.current = [...suggestionHistoryRef.current.slice(-5), signature];
    await sendQA(prompt);
  };
  const switchMode = (m) => {
    if (m === modeRef.current) return;
    modeRef.current = m;
    apiHistory.current = [];
    abortRef.current?.abort?.();
    setMessages([]); setError(null);
    setPhase(COMPANION_PHASE.READY);
    onSwitchMode(m);
    triggerHaptic("success");
    if (m === "narrator") setTimeout(triggerNarrator, 50);
  };
  useEffect(() => { modeRef.current = mode; if (mode === "narrator") triggerNarrator(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    closeButtonRef.current?.focus?.();
  }, []);
  useEffect(() => {
    const root = modalRef.current;
    if (!root) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(root.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    root.addEventListener("keydown", handleKeyDown);
    return () => root.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div ref={modalRef} className="twin-modal" role="dialog" aria-modal="true" aria-label={`Ask the Twin for ${athlete.name}`} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(4,4,4,0.97)", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.35s ease" }}>
      <div className="scanline-fx" />
      <div className="twin-header" style={{ padding: "calc(22px + var(--safe-top)) calc(36px + var(--safe-right)) 22px calc(36px + var(--safe-left))", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <div className="twin-title">
          <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8", marginBottom: 4 }}>{persona.icon} {persona.name.toUpperCase()} · VERIFIED RICON RECORD</div>
          <div className="bebas" style={{ fontSize: 26, letterSpacing: 4, color: "#F0EBE3" }}>{athlete.name}</div>
          <div className="mono" role="status" aria-live="polite" style={{ fontSize: 8, letterSpacing: 1.4, color: "#9a9a9a", marginTop: 6 }}>
            {modeDescriptor}
          </div>
          {moment && (
            <div className="mono" style={{ fontSize: 8, letterSpacing: 1.2, color: "#8f8f8f", marginTop: 5 }}>
              STORY CONTEXT · {moment.y} · {moment.title}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <div>
          <div className="mono" style={{ fontSize: 8, color: "#9a9a9a", letterSpacing: 2, marginBottom: 6, textAlign: "right" }}>TWIN MODE</div>
          <div className="twin-mode-toggle" style={{ display: "flex", gap: 2, background: "#111", padding: 2, borderRadius: 3 }}>
            {["narrator", "qa"].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={mode === m ? "mode-btn-active" : ""}
                aria-pressed={mode === m}
                aria-label={m === "narrator" ? "Switch to Narrator mode for guided story continuation" : "Switch to Q and A mode for direct questions"}
                style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "8px 16px", border: mode === m ? "1px solid #FFD87A" : "1px solid transparent", borderRadius: 2, cursor: "pointer", background: mode === m ? "#C9A84C" : "transparent", color: mode === m ? "#080808" : "#9a9a9a", boxShadow: mode === m ? "0 0 0 1px rgba(201,168,76,0.35) inset" : "none" }}
              >
                {m === "narrator" ? "▶ NARRATOR" : "✦ Q&A"}
              </button>
            ))}
          </div>
          <div className="mono" style={{ fontSize: 8, color: mode === "narrator" ? "#7BC8E8" : "#C9A84C", letterSpacing: 1, marginTop: 6, textAlign: "right" }}>
            {mode === "narrator" ? "Guided chapter continuation" : "Direct chapter Q&A"}
          </div>
        </div>
        <button
          type="button"
          className="proof-btn mono"
          onClick={copyConversation}
          disabled={!messages.length}
          aria-label="Copy Twin conversation"
          style={{ fontSize: 9, letterSpacing: 2, padding: "8px 12px", color: messages.length ? "#C9A84C" : "#8a8a8a", background: "transparent", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 2, cursor: messages.length ? "pointer" : "not-allowed" }}
        >
          COPY THREAD
        </button>
        <button
          type="button"
          className="proof-btn mono"
          onClick={copyMomentLink}
          aria-label="Copy shareable story moment link"
          style={{ fontSize: 9, letterSpacing: 2, padding: "8px 12px", color: "#7BC8E8", background: "transparent", border: "1px solid rgba(123,200,232,0.32)", borderRadius: 2, cursor: "pointer" }}
        >
          SHARE CHAPTER
        </button>
        <button ref={closeButtonRef} className="twin-close" onClick={onClose} aria-label="Close Ask Twin modal" style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, color: "#9a9a9a", background: "none", border: "1px solid #3a3a3a", padding: "8px 14px", cursor: "pointer", borderRadius: 2 }}>CLOSE ✕</button>
      </div>
      <div className="twin-layout" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div ref={chatScrollRef} className="twin-chat" style={{ flex: 1, overflowY: "auto", padding: "36px 40px", position: "relative" }}>
            {companionHealth.status === "checking" && messages.length === 0 && !pendingResponse && (
              <LoadingState
                label="Preparing Twin"
                message="Verifying the channel before this session opens."
              />
            )}
            {companionUnavailable && messages.length === 0 && !pendingResponse && (
              <ErrorState
                title="Twin in archive mode"
                message={companionHealth.message}
                action={<RetryAction label="RETRY TWIN" onRetry={() => checkCompanionHealth()} ariaLabel="Retry Twin health check" />}
                ariaLabel="Twin unavailable"
              />
            )}
            {messages.length === 0 && !pendingResponse && !error && !companionUnavailable && companionHealth.status !== "checking" && (
              <EmptyState
                title={mode === "narrator" ? persona.emptyState.narratorHeadline : persona.emptyState.qaHeadline}
                message={mode === "qa" ? persona.emptyState.description : "Step into a verified chapter and continue the story on demand."}
                ariaLabel="Twin empty state"
                action={<SuggestionChips suggestions={contextualSuggestions} onSelect={useSuggestedPrompt} disabled={pendingResponse || !companionReadyForPrompts} />}
              />
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 30 }}>
                {msg.role === "user" ? <div style={{ display: "flex", justifyContent: "flex-end" }}><div className="twin-message-user" style={{ maxWidth: "58%", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}><div style={{ fontSize: 14, color: "rgba(240,235,227,0.65)", lineHeight: 1.65 }}>{msg.content}</div></div></div> : (
                  <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(201,168,76,0.05)" }}><span className="bebas" style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 1 }}>{persona.avatarGlyph}</span></div>
                    <div className="assistant-message-bubble" style={{ flex: 1, paddingTop: 2 }}>
                      <div style={{ minHeight: 56 }}>{msg.content ? <AIResponse content={msg.content} streaming={msg.streaming} /> : (msg.streaming ? <span className="stream-shimmer" style={{ display: "inline-block" }} /> : <AIResponse content="The twin is momentarily silent." streaming={false} />)}</div>
                      {!msg.streaming && <VoiceSynthesisPanel active={speakingIndex === msg.id || speakingIndex === "latest"} status={voiceStatus} onPlay={() => showVoice(msg.id)} onStop={stopVoiceVisual} mode={mode} />}
                      {(i === messages.length - 1 && !pendingResponse) && <div style={{ marginTop: 12 }}><SuggestionChips suggestions={contextualSuggestions} onSelect={useSuggestedPrompt} disabled={pendingResponse || !companionReadyForPrompts} /></div>}
                      {!msg.streaming && msg.content && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            type="button"
                            className="proof-btn mono"
                            onClick={() => copyText(msg.content, "Response copied.")}
                            aria-label="Copy AI response"
                            style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer" }}
                          >
                            COPY RESPONSE
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {error && (
              <ErrorState
                title="Twin response interrupted"
                message={error}
                ariaLabel="Twin request error"
                action={(
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <RetryAction label="RETRY ANSWER" onRetry={retryLatest} disabled={!canRetryLatest} ariaLabel="Retry Twin response" />
                    <RetryAction label="SWITCH MODE" onRetry={() => switchMode(mode === "qa" ? "narrator" : "qa")} disabled={pendingResponse} ariaLabel="Switch Twin mode" />
                  </div>
                )}
              />
            )}
            <div ref={bottomRef} />
            {showJumpToLatest && (
              <div style={{ position: "sticky", bottom: 12, display: "flex", justifyContent: "flex-end", pointerEvents: "none" }}>
                <button
                  type="button"
                  className="proof-btn mono"
                  onClick={() => {
                    nearBottomRef.current = true;
                    setShowJumpToLatest(false);
                    scrollToLatest("smooth");
                  }}
                  style={{ pointerEvents: "auto", fontSize: 9, letterSpacing: 2, padding: "10px 14px", color: "#080808", background: "#C9A84C", border: "1px solid #C9A84C", borderRadius: 2, cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,0.45)" }}
                  aria-label="Jump to latest Twin response"
                >
                  LATEST ANSWER
                </button>
              </div>
            )}
          </div>
          {mode === "qa" ? (
            <div className="twin-input-bar" style={{ padding: "18px calc(36px + var(--safe-right)) calc(20px + var(--safe-bottom)) calc(36px + var(--safe-left))", borderTop: "1px solid rgba(255,255,255,0.05)", position: "sticky", bottom: 0, zIndex: 20, background: "rgba(6,6,6,0.96)" }}>
              {!pendingResponse && (
                <div style={{ marginBottom: 12 }}>
                  <SuggestionChips
                    suggestions={contextualSuggestions}
                    onSelect={useSuggestedPrompt}
                    disabled={pendingResponse || !companionReadyForPrompts}
                    label="Twin suggestions"
                  />
                </div>
              )}
              <div className="mono" role="status" aria-live="polite" style={{ fontSize: 8, color: voiceState === VOICE_STATE.LISTENING ? "#7BC8E8" : "#9a9a9a", letterSpacing: 2, marginBottom: 10 }}>
                {voiceState === VOICE_STATE.LISTENING ? "MICROPHONE ACTIVE · SPEAK YOUR PROMPT" : voiceState === VOICE_STATE.PROCESSING ? "PROCESSING VOICE INPUT..." : voiceStatus}
              </div>
              <div className="mono" role="status" aria-live="polite" style={{ fontSize: 8, color: companionUnavailable ? "#C9A84C" : "#3a3a3a", letterSpacing: 2, marginBottom: 10 }}>
                TWIN STATUS · {companionHealth.status.toUpperCase()} · {companionHealth.message}
              </div>
              <div className="mono" aria-live="polite" style={{ fontSize: 8, color: remainingChars < 40 ? "#C9A84C" : "#8f8f8f", letterSpacing: 1, marginBottom: 10 }}>
                DRAFT {input.length}/{MAX_COMPOSER_CHARS}
              </div>
              <div className="twin-input-row" style={{ display: "flex", gap: 10 }}>
                {voiceInputSupported ? (
                  <button
                    onClick={voiceState === VOICE_STATE.LISTENING ? () => recognitionRef.current?.stop?.() : startVoiceInput}
                    disabled={pendingResponse || !companionReadyForPrompts}
                    aria-label={voiceState === VOICE_STATE.LISTENING ? `Stop voice input for ${athlete.name}` : `Start voice input for ${athlete.name}`}
                    aria-pressed={voiceState === VOICE_STATE.LISTENING}
                    style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 16px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 2 }}
                  >
                    {voiceState === VOICE_STATE.LISTENING ? "STOP MIC" : voiceState === VOICE_STATE.PROCESSING ? "PROCESSING..." : "ASK BY VOICE"}
                  </button>
                ) : (
                  <span className="mono" title="Voice input is unavailable in this browser." style={{ alignSelf: "center", fontSize: 8, letterSpacing: 1.5, color: "#8f8f8f", padding: "0 4px" }}>
                    VOICE INPUT UNAVAILABLE
                  </span>
                )}
                <label htmlFor="twin-composer" className="sr-only">Ask the Twin a question</label>
                <textarea id="twin-composer" ref={composerRef} className="twin-input" rows={1} value={input} maxLength={MAX_COMPOSER_CHARS} onCompositionStart={() => setIsComposingInput(true)} onCompositionEnd={() => setIsComposingInput(false)} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !isComposingInput) { e.preventDefault(); sendQA(); } }} placeholder={`Ask ${athlete.name.split(" ")[0]} anything...`} aria-describedby="twin-composer-help" style={{ flex: 1, minHeight: 48, maxHeight: 130, resize: "vertical", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)", color: "#F0EBE3", padding: "13px 18px", fontFamily: '"Inter"', fontSize: 14, borderRadius: 2 }} />
                <span id="twin-composer-help" className="sr-only">Dictated text is inserted for review. Press Enter to send, or Shift+Enter for a new line.</span>
                <button onClick={() => sendQA()} disabled={pendingResponse || !trimmedInput || !companionReadyForPrompts} aria-label={`Send message to ${athlete.name}`} style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 22px", background: pendingResponse || !trimmedInput || !companionReadyForPrompts ? "#161616" : "#C9A84C", color: pendingResponse || !trimmedInput || !companionReadyForPrompts ? "#3a3a3a" : "#080808", border: "none", borderRadius: 2 }}>SEND →</button>
                {pendingResponse && <button onClick={stopGeneration} style={{ fontFamily: '"Inter"', fontSize: 10, letterSpacing: 2, padding: "13px 18px", background: "rgba(255,70,70,0.08)", color: "rgba(255,150,150,0.92)", border: "1px solid rgba(255,70,70,0.28)", borderRadius: 2 }}>STOP</button>}
              </div>
            </div>
          ) : (
            messages.length > 0 && <div className="twin-narrator-actions" style={{ padding: "20px calc(36px + var(--safe-right)) calc(20px + var(--safe-bottom)) calc(36px + var(--safe-left))", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {pendingResponse ? <button className="twin-btn" onClick={stopGeneration} style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "rgba(255,70,70,0.08)", color: "rgba(255,179,179,0.96)", border: "1px solid rgba(255,70,70,0.36)", borderRadius: 2 }}>STOP ANSWER</button> : <button className="twin-btn" onClick={continueNarrator} disabled={!companionReadyForPrompts} style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: !companionReadyForPrompts ? "#8a8a8a" : "#7BC8E8", border: "1px solid rgba(123,200,232,0.3)", borderRadius: 2 }}>▶ CONTINUE CHAPTER</button>}
              {!pendingResponse && <button className="twin-btn" onClick={retryLatest} disabled={!canRetryLatest} style={{ fontFamily: '"Inter"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: canRetryLatest ? "#C9A84C" : "#8a8a8a", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 2 }}>RETRY ANSWER</button>}
            </div>
          )}
        </div>
      </div>
      {toastMessage && (
        <div role="status" aria-live="polite" style={{ position: "fixed", right: "max(16px, calc(12px + var(--safe-right)))", bottom: "max(16px, calc(12px + var(--safe-bottom)))", zIndex: 1200, background: "rgba(10,10,10,0.95)", border: "1px solid rgba(201,168,76,0.35)", color: "#F0EBE3", padding: "10px 12px", borderRadius: 2, fontSize: 12, letterSpacing: 0.3, boxShadow: "0 12px 28px rgba(0,0,0,0.45)" }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
