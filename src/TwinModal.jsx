import { useEffect, useMemo, useRef, useState } from "react";
import { triggerHaptic } from "./haptics.js";

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
    else if (italic) parts.push(<em key={key}>{italic}</em>);
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

function VoiceSynthesisPanel({ active, status, onPlay, onStop, mode }) {
  return (
    <div className="voice-panel">
      <div>
        <div className="mono" style={{ fontSize: 8, color: "#7BC8E8", letterSpacing: 2, marginBottom: 5 }}>
          {mode === "narrator" ? "NARRATOR VOICE VISUALIZATION" : "AI RESPONSE VISUALIZATION"}
        </div>
        <div className="mono" style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>{status}</div>
      </div>
      <div className="voice-bars" aria-hidden="true">{[0,1,2,3,4].map(i => <span key={i} style={{ animationPlayState: active ? "running" : "paused" }} />)}</div>
      <button className="proof-btn mono" onClick={active ? onStop : onPlay} style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)", cursor: "pointer", whiteSpace: "nowrap" }}>
        {active ? "STOP VISUAL" : "SHOW VOICE"}
      </button>
    </div>
  );
}

export default function TwinModal({ athlete, moment, mode, onClose, onSwitchMode, chapterForContext, suggestionsFor, buildSystemPrompt, persona }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingId, setStreamingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("ready");
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(() => chapterForContext(athlete, moment));
  const apiHistory = useRef([]);
  const abortRef = useRef(null);
  const lastRequestRef = useRef(null);
  const bottomRef = useRef(null);
  const composerRef = useRef(null);
  const modeRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceInputSupported = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const starterSuggestions = useMemo(() => suggestionsFor(athlete, currentChapter, "starter"), [athlete, currentChapter, suggestionsFor]);
  const followupSuggestions = useMemo(() => suggestionsFor(athlete, currentChapter, "followup"), [athlete, currentChapter, suggestionsFor]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (!voiceInputSupported) setVoiceStatus("Voice input is unavailable in this browser.");
  }, [voiceInputSupported]);
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
  useEffect(() => () => { recognitionRef.current?.stop?.(); abortRef.current?.abort?.(); }, []);

  const showVoice = (index = "latest") => { setSpeakingIndex(index); setVoiceStatus("Voice visualization only. Audio muted for demo quality."); };
  const stopVoiceVisual = () => { setSpeakingIndex(null); setVoiceStatus("Voice visual stopped"); };
  const startVoiceInput = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setVoiceStatus("Voice input is unavailable in this browser."); return; }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => { setIsListening(true); setVoiceStatus("Listening for your question"); };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setInput(transcript);
      setVoiceStatus(transcript ? "Voice captured. Send when ready." : "No voice captured.");
    };
    recognition.onerror = () => setVoiceStatus("Voice input failed or permission was denied.");
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const errorMessageFor = (status, text) => {
    if (status === 429) return "The companion is receiving high traffic right now. Please wait a few seconds, then retry.";
    if (status === 401 || status === 403) return "The companion service is not authorized. Check the server API key configuration and retry.";
    if (status >= 500) return "The companion service is temporarily unavailable. Retry in a moment or switch modes.";
    return text || "We couldn't reach the companion service. Check your connection and try again.";
  };

  const streamTwin = async ({ history, assistantId, onComplete }) => {
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(null); setStreamingId(assistantId);

    const res = await fetch("/api/twin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ athlete, system: buildSystemPrompt(athlete), messages: history.map(({ role, content }) => ({ role, content })) }),
    });
    if (!res.ok) throw new Error(errorMessageFor(res.status, await res.text()));
    if (!res.body) throw new Error("Streaming is unavailable in this browser. Try refreshing or using a modern browser.");

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
  };

  const runTwinRequest = async ({ history, userMessage = null, replaceAssistantId = null, modeTag = mode, onComplete }) => {
    const assistantId = replaceAssistantId || `assistant-${Date.now()}`;
    lastRequestRef.current = { history: [...history], assistantId, modeTag };
    if (userMessage) setMessages(p => [...p, userMessage, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    else if (replaceAssistantId) setMessages(p => p.map(msg => (msg.id === replaceAssistantId ? { ...msg, content: "", streaming: true } : msg)));
    else setMessages(p => [...p, { id: assistantId, role: "assistant", content: "", streaming: true }]);
    try {
      await streamTwin({ history, assistantId, onComplete });
      showVoice(assistantId);
    } catch (err) {
      if (err.name === "AbortError") setMessages(p => p.map(msg => (msg.id === assistantId ? { ...msg, streaming: false, stopped: true, content: msg.content || "Generation stopped." } : msg)));
      else {
        setError(err.message || "Unable to reach the Digital Twin. Please try again.");
        setMessages(p => p.map(msg => (msg.id === assistantId ? { ...msg, streaming: false, failed: true, content: msg.content || "" } : msg)));
      }
    } finally {
      setLoading(false); setStreamingId(null); abortRef.current = null;
    }
  };

  const retryLatest = () => {
    const last = lastRequestRef.current;
    if (!last || loading) return;
    runTwinRequest({ history: last.history, replaceAssistantId: last.assistantId, modeTag: last.modeTag, onComplete: (reply) => { apiHistory.current = [...last.history, { role: "assistant", content: reply }]; } });
  };
  const stopGeneration = () => abortRef.current?.abort?.();
  const triggerNarrator = async () => {
    const prompt = "You are narrating your own legacy for a fan experiencing your verified story for the first time. Open with a powerful, cinematic first-person statement.";
    apiHistory.current = [{ role: "user", content: prompt }];
    setMessages([]);
    await runTwinRequest({ history: apiHistory.current, onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply }) });
  };
  const continueNarrator = async () => {
    if (loading) return;
    apiHistory.current.push({ role: "user", content: "Continue the story with a different defining chapter." });
    await runTwinRequest({ history: apiHistory.current, onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply }) });
  };
  const sendQA = async (override) => {
    const text = typeof override === "string" ? override : input;
    if (!text.trim() || loading) return;
    triggerHaptic("primary");
    const userMsg = { id: `user-${Date.now()}`, role: "user", content: text };
    apiHistory.current.push({ role: "user", content: text });
    setInput(""); setError(null); composerRef.current?.focus?.();
    await runTwinRequest({ history: apiHistory.current, userMessage: userMsg, onComplete: (reply) => apiHistory.current.push({ role: "assistant", content: reply }) });
  };
  const switchMode = (m) => {
    if (m === modeRef.current) return;
    modeRef.current = m;
    apiHistory.current = [];
    abortRef.current?.abort?.();
    setMessages([]); setError(null);
    onSwitchMode(m);
    triggerHaptic("success");
    if (m === "narrator") setTimeout(triggerNarrator, 50);
  };
  useEffect(() => { modeRef.current = mode; if (mode === "narrator") triggerNarrator(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="twin-modal" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(4,4,4,0.97)", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", animation: "fadeIn 0.35s ease" }}>
      <div className="scanline-fx" />
      <div className="twin-header" style={{ padding: "calc(22px + var(--safe-top)) calc(36px + var(--safe-right)) 22px calc(36px + var(--safe-left))", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        <div className="twin-title">
          <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: "#7BC8E8", marginBottom: 4 }}>{persona.icon} {persona.name.toUpperCase()} · VERIFIED RICON RECORD</div>
          <div className="bebas" style={{ fontSize: 26, letterSpacing: 4, color: "#F0EBE3" }}>{athlete.name}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="twin-mode-toggle" style={{ display: "flex", gap: 2, background: "#111", padding: 2, borderRadius: 3 }}>
          {["narrator","qa"].map(m => <button key={m} onClick={() => switchMode(m)} className={mode === m ? "mode-btn-active" : ""} style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "8px 16px", border: "none", borderRadius: 2, cursor: "pointer", background: mode === m ? "#C9A84C" : "transparent", color: mode === m ? "#080808" : "#555" }}>{m === "narrator" ? "▶ NARRATOR" : "✦ Q&A"}</button>)}
        </div>
        <button className="twin-close" onClick={onClose} style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, color: "#444", background: "none", border: "1px solid #1e1e1e", padding: "8px 14px", cursor: "pointer", borderRadius: 2 }}>CLOSE ✕</button>
      </div>
      <div className="twin-layout" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="twin-chat" style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
            {messages.length === 0 && !loading && !error && <div className="twin-empty" style={{ textAlign: "center", paddingTop: 80 }}><div className="cormorant" style={{ fontStyle: "italic", fontSize: 22, color: "rgba(240,235,227,0.18)", marginBottom: 12 }}>{mode === "narrator" ? persona.emptyState.narratorHeadline : persona.emptyState.qaHeadline}</div>{mode === "qa" && <SuggestionChips suggestions={starterSuggestions} onSelect={sendQA} disabled={loading} />}</div>}
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 30 }}>
                {msg.role === "user" ? <div style={{ display: "flex", justifyContent: "flex-end" }}><div className="twin-message-user" style={{ maxWidth: "58%", padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}><div style={{ fontSize: 14, color: "rgba(240,235,227,0.65)", lineHeight: 1.65 }}>{msg.content}</div></div></div> : (
                  <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.42)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(201,168,76,0.05)" }}><span className="bebas" style={{ fontSize: 11, color: "#C9A84C", letterSpacing: 1 }}>{persona.avatarGlyph}</span></div>
                    <div className="assistant-message-bubble" style={{ flex: 1, paddingTop: 2 }}>
                      <div style={{ minHeight: 56 }}>{msg.content ? <SafeMarkdown content={msg.content} streaming={msg.streaming} /> : (msg.streaming ? <span className="stream-shimmer" style={{ display: "inline-block" }} /> : <SafeMarkdown content="The twin is momentarily silent." />)}</div>
                      {!msg.streaming && <VoiceSynthesisPanel active={speakingIndex === msg.id || speakingIndex === "latest"} status={voiceStatus} onPlay={() => showVoice(msg.id)} onStop={stopVoiceVisual} mode={mode} />}
                      {(i === messages.length - 1 && !loading) && <div style={{ marginTop: 12 }}><SuggestionChips suggestions={followupSuggestions} onSelect={sendQA} disabled={loading} /></div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {error && <div className="mono" style={{ padding: "14px 18px", background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.2)", color: "rgba(255,150,150,0.8)", fontSize: 10, borderRadius: 2, lineHeight: 1.6 }}><div style={{ marginBottom: 8 }}>{error}</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="proof-btn mono" onClick={retryLatest} disabled={loading} style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#C9A84C", background: "transparent", border: "1px solid rgba(201,168,76,0.25)" }}>RETRY</button><button className="proof-btn mono" onClick={() => switchMode(mode === "qa" ? "narrator" : "qa")} disabled={loading} style={{ fontSize: 8, letterSpacing: 2, padding: "8px 10px", color: "#7BC8E8", background: "transparent", border: "1px solid rgba(123,200,232,0.3)" }}>SWITCH MODE</button></div></div>}
            <div ref={bottomRef} />
          </div>
          {mode === "qa" ? (
            <div className="twin-input-bar" style={{ padding: "18px calc(36px + var(--safe-right)) calc(20px + var(--safe-bottom)) calc(36px + var(--safe-left))", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="mono" role="status" aria-live="polite" style={{ fontSize: 8, color: isListening ? "#7BC8E8" : "#555", letterSpacing: 2, marginBottom: 10 }}>
                {isListening ? "MICROPHONE ACTIVE · SPEAK YOUR PROMPT" : voiceStatus}
              </div>
              <div className="twin-input-row" style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={isListening ? () => recognitionRef.current?.stop?.() : startVoiceInput}
                  disabled={loading || !voiceInputSupported}
                  aria-label={isListening ? `Stop voice input for ${athlete.name}` : `Start voice input for ${athlete.name}`}
                  aria-pressed={isListening}
                  style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "13px 16px", background: "transparent", color: !voiceInputSupported ? "#555" : "#C9A84C", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 2 }}
                >
                  {isListening ? "STOP MIC" : "ASK BY VOICE"}
                </button>
                <label htmlFor="twin-composer" className="sr-only">Ask the AI companion a question</label>
                <textarea id="twin-composer" ref={composerRef} className="twin-input" rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQA(); } }} placeholder={`Ask ${athlete.name.split(" ")[0]} anything...`} aria-describedby="twin-composer-help" style={{ flex: 1, minHeight: 48, maxHeight: 130, resize: "vertical", background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.07)", color: "#F0EBE3", padding: "13px 18px", fontFamily: '"DM Sans"', fontSize: 14, borderRadius: 2 }} />
                <span id="twin-composer-help" className="sr-only">Dictated text is inserted for review. Press Enter to send, or Shift+Enter for a new line.</span>
                <button onClick={() => sendQA()} disabled={loading || !input.trim()} aria-label={`Send message to ${athlete.name}`} style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "13px 22px", background: loading || !input.trim() ? "#161616" : "#C9A84C", color: loading || !input.trim() ? "#3a3a3a" : "#080808", border: "none", borderRadius: 2 }}>SEND →</button>
                {loading && <button onClick={stopGeneration} style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "13px 18px", background: "rgba(255,70,70,0.08)", color: "rgba(255,150,150,0.92)", border: "1px solid rgba(255,70,70,0.28)", borderRadius: 2 }}>STOP</button>}
              </div>
            </div>
          ) : (
            messages.length > 0 && <div className="twin-narrator-actions" style={{ padding: "20px calc(36px + var(--safe-right)) calc(20px + var(--safe-bottom)) calc(36px + var(--safe-left))", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {loading ? <button className="twin-btn" onClick={stopGeneration} style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "rgba(255,70,70,0.08)", color: "rgba(255,150,150,0.92)", border: "1px solid rgba(255,70,70,0.28)", borderRadius: 2 }}>STOP GENERATION</button> : <button className="twin-btn" onClick={continueNarrator} style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#7BC8E8", border: "1px solid rgba(123,200,232,0.3)", borderRadius: 2 }}>▶ CONTINUE THE STORY</button>}
              {!loading && <button className="twin-btn" onClick={retryLatest} style={{ fontFamily: '"Space Mono"', fontSize: 9, letterSpacing: 2, padding: "11px 22px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 2 }}>RETRY RESPONSE</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
