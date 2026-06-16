import { useState, useEffect, useId, useRef, useCallback } from "react";
import { buildQaCaptureMessages, buildTwinResponse } from "../lib/twinResponse";
import { renderFallbackTemplate } from "../lib/fallbackTemplates";
import { simulateTextStream } from "../lib/simulateStream";
import {
  createMessageId,
  loadConversationMessages,
  saveTwinMessage,
  saveUserMessage,
  startNewConversation,
} from "../lib/conversationStorage";
import {
  endChatSession,
  ensureMonthlySessionQuota,
  getActiveChatSession,
  getSessionUsageSummary,
  recordChatSessionMessage,
  startChatSession,
} from "../lib/sessionStorage";
import { getStoredUser } from "../lib/storage";
import ChatSessionBar from "./chat/ChatSessionBar";
import SourceAttribution from "./chat/SourceAttribution";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const statLine = (athlete) => athlete.stats.map(s => `${s.v} ${s.l}`).join(", ");

const narratorBeats = [
  {
    media: [{ title: "Draft Night Archive", meta: "1984 · Source footage placeholder" }],
    getMoment: (athlete) => athlete.moments[0],
    line: (athlete) => {
      const first = athlete.moments[0];
      const signature = athlete.moments.find(m => m.type === "championship" || m.type === "record") || athlete.moments[1] || first;
      return `I am ${athlete.name}. ${athlete.years} was the arc, but ${first.y} is where the signal first broke through. ${first.body} From there, every season became evidence. ${signature.y}: ${signature.title}. That is one of the moments people use to explain me, because it still carries the weight of what I was built to do.`;
    },
  },
  {
    media: [],
    getMoment: (athlete) => athlete.moments[Math.min(2, athlete.moments.length - 1)],
    line: (athlete) => {
      const turn = athlete.moments[Math.min(2, athlete.moments.length - 1)];
      const title = athlete.moments.find(m => m.type === "championship") || turn;
      return `The turning point was not one play. It was the moment the league understood I could bend the story around me. In ${turn.y}, ${turn.title} became documented proof. Then ${title.y} arrived: ${title.title}. Talent became standard. Standard became pressure. Pressure became legacy.`;
    },
  },
  {
    media: [
      { title: "Final Sequence", meta: "1998 · Broadcast clip placeholder" },
      { title: "Legacy Montage", meta: "Career archive placeholder" },
    ],
    getMoment: (athlete) => athlete.moments[athlete.moments.length - 1],
    line: (athlete) => {
      const final = athlete.moments[athlete.moments.length - 1];
      return `Legacy is what remains after the numbers stop moving. Mine reads like this: ${statLine(athlete)}. But the record only matters because it is attached to lived moments. ${final.y}: ${final.title}. ${final.body} That is the part the archive keeps.`;
    },
  },
];

const buildNarratorMessage = (athlete, beatIndex) => {
  const beat = narratorBeats[beatIndex % narratorBeats.length];
  const moment = beat.getMoment(athlete);
  return {
    role: "assistant",
    content: beat.line(athlete),
    moment,
    media: beat.media,
  };
};

const voicePrompts = [
  { icon: "▣", label: "Relive a defining moment", prompt: "What was your defining moment?" },
  { icon: "◌", label: "Ask about the mindset", prompt: "What mindset separated you from everyone else?" },
  { icon: "◇", label: "Explain the legacy", prompt: "How should people understand your legacy?" },
];

export default function TwinModal({ athlete, mode, onClose, onSwitchMode, initialPrompt = "" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [streamPhase, setStreamPhase] = useState("idle");
  const [activeBeat, setActiveBeat] = useState(0);
  const [voiceState, setVoiceState] = useState("idle");
  const [chatSession, setChatSession] = useState(null);
  const [sessionQuota, setSessionQuota] = useState(null);
  const [endedSessionRecap, setEndedSessionRecap] = useState(null);
  const chatSessionRef = useRef(null);
  const narratorIndex = useRef(0);
  const voiceTimer = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef    = useRef(null);
  const wsRef       = useRef(null);
  const audioCtxRef = useRef(null);
  const nextPlayRef = useRef(0);
  const wsReadyRef  = useRef(false);
  const currentMsgRef = useRef({ index: null, buffer: "", audioStarted: false });
  const pendingQuestionRef = useRef(null);
  const responseTimerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const modeRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);
  const streamAbortRef = useRef({ aborted: false });
  const conversationEpochRef = useRef(0);
  const titleId = useId();
  const descriptionId = useId();
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");
  const sessionTrackingEnabled = Boolean(getStoredUser()) && !figmaTwinMode;

  const refreshSessionState = useCallback(() => {
    const user = getStoredUser();
    if (!user || figmaTwinMode) {
      setChatSession(null);
      setSessionQuota(null);
      setEndedSessionRecap(null);
      chatSessionRef.current = null;
      return;
    }

    const quota = ensureMonthlySessionQuota(user.id, athlete.id);
    const active = getActiveChatSession(user.id, athlete.id);
    setSessionQuota(quota);
    setChatSession(active);
    chatSessionRef.current = active;
  }, [athlete.id, figmaTwinMode]);

  useEffect(() => {
    if (mode === "qa") refreshSessionState();
  }, [mode, refreshSessionState]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, streamPhase]);
  useEffect(() => {
    if (mode === "qa" && initialPrompt) {
      setInput(initialPrompt);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [initialPrompt, mode]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    previousActiveElement.current = document.activeElement;
    window.requestAnimationFrame(() => {
      if (mode === "qa") inputRef.current?.focus();
      else closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
      recognitionRef.current?.abort?.();
      window.speechSynthesis?.cancel();
      audioRef.current?.pause?.();
    };
  }, []);

  const playNarratorAudio = (beatIndex) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setTimeout(() => {
        const src = `/beat_${beatIndex}.mp3`;
        const audio = new Audio(src);
        audioRef.current = audio;
        audio.onplay = () => setVoiceState("speaking");
        audio.onended = () => setVoiceState("idle");
        audio.onerror = () => {
          console.warn(`Narrator audio failed to load: ${src}`);
          setVoiceState("idle");
        };
        audio.currentTime = 0;
        audio.play().catch(() => setVoiceState("idle"));
      }, 50);
    } catch {
      setVoiceState("idle");
    }
  };

  const speakReply = (reply) => {
    if (!("speechSynthesis" in window)) {
      setVoiceState("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.rate = 0.9;
    utterance.pitch = 0.82;
    utterance.volume = 0.9;
    utterance.onstart = () => setVoiceState("speaking");
    utterance.onend = () => setVoiceState("idle");
    utterance.onerror = () => setVoiceState("idle");
    window.speechSynthesis.speak(utterance);
  };

  const triggerNarrator = async () => {
    setLoading(true);
    narratorIndex.current = 0;
    setActiveBeat(0);
    await wait(650);
    const firstBeat = buildNarratorMessage(athlete, 0);
    setMessages([firstBeat]);
    setLoading(false);
    playNarratorAudio(0);
  };

  const continueNarrator = async () => {
    setLoading(true);
    await wait(620);
    const nextIndex = narratorIndex.current >= narratorBeats.length - 1 ? 0 : narratorIndex.current + 1;
    narratorIndex.current = nextIndex;
    setActiveBeat(nextIndex);
    const nextBeat = buildNarratorMessage(athlete, nextIndex);
    setMessages(p => {
      if (p[nextIndex]) return p;
      return [...p, nextBeat];
    });
    setLoading(false);
    playNarratorAudio(nextIndex);
  };

  const selectNarratorBeat = async (index) => {
    if (loading) return;
    setActiveBeat(index);
    narratorIndex.current = index;
    if (messages[index]) {
      playNarratorAudio(index);
      return;
    }
    setLoading(true);
    await wait(420);
    narratorIndex.current = Math.max(narratorIndex.current, index);
    let targetBeat = null;
    setMessages(p => {
      const next = [...p];
      for (let i = 0; i <= index; i += 1) {
        if (!next[i]) next[i] = buildNarratorMessage(athlete, i);
      }
      targetBeat = next[index];
      return next;
    });
    setLoading(false);
    if (targetBeat) playNarratorAudio(index);
  };

  const mapStoredToUi = useCallback((stored) => ({
    id: stored.id,
    role: stored.role === "twin" ? "assistant" : stored.role,
    content: stored.content,
    status: "complete",
    responseType: stored.responseType,
    classification: stored.classification,
    confidence: stored.confidence,
    sourceIds: stored.sourceIds ?? [],
  }), []);

  const loadQaHistory = useCallback(() => {
    const user = getStoredUser();
    if (!user || figmaTwinMode) return [];
    return loadConversationMessages(user.id, athlete.id).map(mapStoredToUi);
  }, [athlete.id, figmaTwinMode, mapStoredToUi]);

  const isQaBusy = streamPhase !== "idle";
  const isComposerBusy = loading || isQaBusy;

  const handleNewConversation = useCallback(() => {
    const user = getStoredUser();
    if (!user || figmaTwinMode) return;

    conversationEpochRef.current += 1;
    streamAbortRef.current = { aborted: true };
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel();

    startNewConversation(user.id, athlete.id);
    setMessages([]);
    setStreamPhase("idle");
    setLoading(false);
    setInput("");
    setVoiceState("idle");

    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [athlete.id, figmaTwinMode]);

  const handleEndSession = useCallback(() => {
    const user = getStoredUser();
    if (!user || isComposerBusy || figmaTwinMode) return;
    streamAbortRef.current.aborted = true;
    window.speechSynthesis?.cancel();
    setStreamPhase("idle");
    setVoiceState("idle");
    const ended = endChatSession(user.id, athlete.id);
    if (!ended) return;
    setEndedSessionRecap(ended);
    setChatSession(null);
    chatSessionRef.current = null;
    setSessionQuota(ensureMonthlySessionQuota(user.id, athlete.id));
  }, [athlete.id, figmaTwinMode, isComposerBusy]);

  const handleStartAnotherSession = useCallback(() => {
    setEndedSessionRecap(null);
    refreshSessionState();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [refreshSessionState]);

  const ensureActiveChatSession = useCallback(() => {
    const user = getStoredUser();
    if (!user || figmaTwinMode) return null;

    let session = chatSessionRef.current ?? getActiveChatSession(user.id, athlete.id);
    if (session?.status === "active") {
      chatSessionRef.current = session;
      setChatSession(session);
      return session;
    }

    const quota = ensureMonthlySessionQuota(user.id, athlete.id);
    setSessionQuota(quota);
    if (quota.sessionsRemaining <= 0) return null;

    session = startChatSession(user.id, athlete.id);
    if (!session) return null;

    chatSessionRef.current = session;
    setChatSession(session);
    setSessionQuota(ensureMonthlySessionQuota(user.id, athlete.id));
    setEndedSessionRecap(null);
    return session;
  }, [athlete.id, figmaTwinMode]);

  const sessionUsage = sessionQuota
    ? getSessionUsageSummary(sessionQuota.userId, athlete.id)
    : null;
  const isSessionEnded = Boolean(endedSessionRecap);
  const isSessionsExhausted =
    sessionTrackingEnabled &&
    !chatSession &&
    !isSessionEnded &&
    (sessionQuota?.sessionsRemaining ?? 0) <= 0;
  const isComposerLocked = sessionTrackingEnabled && (isSessionEnded || isSessionsExhausted);

  const sendQA = async (questionOverride, speakResponse = false) => {
    const question = (questionOverride ?? input).trim();
    if (!question || isComposerBusy || isComposerLocked) return;

    streamAbortRef.current = { aborted: false };
    const user = getStoredUser();
    let activeSession = null;

    if (sessionTrackingEnabled && user) {
      activeSession = ensureActiveChatSession();
      if (!activeSession) return;
      recordChatSessionMessage(activeSession.id);
      const updated = getActiveChatSession(user.id, athlete.id);
      if (updated) {
        chatSessionRef.current = updated;
        setChatSession(updated);
      }
    }

    const userMsgId = createMessageId();

    setMessages((p) => [...p, { id: userMsgId, role: "user", content: question, status: "complete" }]);
    setInput("");

    if (user) {
      saveUserMessage(user.id, athlete.id, {
        id: userMsgId,
        content: question,
      });
    }

    const reply = buildTwinResponse(athlete, question);
    const assistantId = createMessageId();
    const streamEpoch = conversationEpochRef.current;
    setStreamPhase("thinking");

    try {
      await simulateTextStream(reply.content, {
        thinkingMs: 650 + Math.floor(Math.random() * 900),
        chunkDelayMs: 32,
        onStart: () => {
          if (streamEpoch !== conversationEpochRef.current) return;
          setStreamPhase("streaming");
          setMessages((p) => [
            ...p,
            { id: assistantId, role: "assistant", content: "", status: "streaming" },
          ]);
        },
        onChunk: (partial) => {
          if (streamEpoch !== conversationEpochRef.current) return;
          setMessages((p) =>
            p.map((m) => (m.id === assistantId ? { ...m, content: partial, status: "streaming" } : m))
          );
        },
        onComplete: (fullText) => {
          if (streamEpoch !== conversationEpochRef.current) return;
          const completed = {
            id: assistantId,
            role: "assistant",
            content: fullText,
            status: "complete",
            responseType: reply.responseType,
            classification: reply.classification,
            confidence: reply.confidence,
            sourceIds: reply.sourceIds,
          };
          setMessages((p) => p.map((m) => (m.id === assistantId ? completed : m)));
          setStreamPhase("idle");

          if (user) {
            saveTwinMessage(user.id, athlete.id, {
              id: assistantId,
              content: fullText,
              sourceIds: reply.sourceIds,
              responseType: reply.responseType,
              classification: reply.classification,
              confidence: reply.confidence,
            });
          }

          if (sessionTrackingEnabled && user) {
            const sessionId = chatSessionRef.current?.id ?? activeSession?.id;
            if (sessionId) {
              recordChatSessionMessage(sessionId, { sourceIds: reply.sourceIds });
              const updated = getActiveChatSession(user.id, athlete.id);
              if (updated) {
                chatSessionRef.current = updated;
                setChatSession(updated);
              }
            }
          }

          if (speakResponse) speakReply(fullText);
          else setVoiceState("idle");
        },
        signal: streamAbortRef.current,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        if (streamEpoch !== conversationEpochRef.current) return;
        setStreamPhase("idle");
        setMessages((p) => p.filter((m) => m.id !== assistantId && m.status !== "streaming"));
        return;
      }
      setStreamPhase("idle");
      setMessages((p) => [
        ...p.filter((m) => m.id !== assistantId),
        {
          id: assistantId,
          role: "assistant",
          content: renderFallbackTemplate("stream_interrupted"),
          status: "complete",
          responseType: "fallback",
          classification: "out_of_scope",
          sourceIds: [],
        },
      ]);
    }
  };

  const sendSuggestedPrompt = (prompt) => {
    if (isComposerBusy) return;
    setVoiceState("idle");
    sendQA(prompt);
  };

  const startVoiceInteraction = () => {
    if (isComposerBusy || voiceState === "listening" || voiceState === "thinking") return;

    if (voiceState === "speaking") {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause?.();
      setVoiceState("idle");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceState("listening");
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);

    if (!SpeechRecognition) {
      inputRef.current?.focus();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalTranscript = "";
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      setInput((finalTranscript || interimTranscript).trim());
    };
    recognition.onerror = () => {
      setVoiceState("idle");
      inputRef.current?.focus();
    };
    recognition.onend = () => {
      const question = finalTranscript.trim();
      recognitionRef.current = null;
      if (!question) {
        setVoiceState("idle");
        return;
      }
      setVoiceState("thinking");
      sendQA(question, true);
    };
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setVoiceState("idle");
      inputRef.current?.focus();
    }
  };

  const stopVoiceInteraction = () => {
    streamAbortRef.current.aborted = true;
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort?.();
    }
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    audioRef.current?.pause?.();
    setVoiceState("idle");
    setStreamPhase("idle");
    setLoading(false);
  };

  const switchMode = (m) => {
    if (m === modeRef.current) return;
    streamAbortRef.current.aborted = true;
    modeRef.current = m;
    setStreamPhase("idle");
    setVoiceState("idle");
    window.speechSynthesis?.cancel();
    audioRef.current?.pause?.();
    onSwitchMode(m);
    if (m === "narrator") {
      setMessages([]);
      setTimeout(triggerNarrator, 50);
      return;
    }
    if (m === "qa") {
      setMessages(loadQaHistory());
    }
  };

  useEffect(() => {
    modeRef.current = mode;
    if (figmaTwinMode === "narrator") {
      narratorIndex.current = narratorBeats.length - 1;
      setActiveBeat(narratorBeats.length - 1);
      setMessages(narratorBeats.map((_, index) => buildNarratorMessage(athlete, index)));
      return;
    }
    if (figmaTwinMode === "qaThread") {
      setMessages(buildQaCaptureMessages(athlete).map((msg, index) => ({
        id: `figma-${index}`,
        ...msg,
        status: "complete",
      })));
      return;
    }
    if (mode === "qa") {
      setMessages(loadQaHistory());
      return;
    }
    if (mode === "narrator") triggerNarrator();
  }, [athlete.id, mode, figmaTwinMode, loadQaHistory]);

  const voiceIsActive = voiceState === "listening" || voiceState === "thinking" || voiceState === "speaking";
  const railIsActive = loading || streamPhase !== "idle";
  const railStatusLabel =
    streamPhase === "thinking"
      ? "Preparing response..."
      : loading || streamPhase === "streaming"
        ? "Speaking..."
        : "Ready";

  return (
    <div
      ref={modalRef}
      className="modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="modal-header">
        <div>
          <div id={descriptionId} className="modal-status"><span aria-hidden="true">◉ </span>Digital Twin · Verified Data</div>
          <h2 id={titleId} className="modal-title">{athlete.name}</h2>
        </div>
        <div className="nav-spacer" />
        <div className="mode-toggle">
          {["narrator", "qa"].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={mode === m ? "mode-button mode-btn-active" : "mode-button"}
              aria-pressed={mode === m}
            >
              {m === "narrator" ? <><span aria-hidden="true">▶ </span>Narrator</> : <><span aria-hidden="true">✦ </span>Q&A</>}
            </button>
          ))}
          {mode === "qa" && !figmaTwinMode && getStoredUser() && (
            <button
              type="button"
              className="mode-button"
              onClick={handleNewConversation}
              aria-label="Start a new conversation"
            >
              New conversation
            </button>
          )}
        </div>
        <button ref={closeButtonRef} type="button" className="close-button" onClick={onClose}>Close <span aria-hidden="true">✕</span></button>
      </div>

      <div className="modal-layout">
        <div className="twin-rail">
          <div className="avatar-wrap">
            <div className="avatar-ring outer ring-b" aria-hidden="true" />
            <div className="avatar-ring mid ring-a" aria-hidden="true" />
            <div className="avatar-ring inner ring-a" aria-hidden="true" />
            <div className={railIsActive ? "avatar-core loading" : "avatar-core"}>
              {athlete.headshot && (
                <img className="avatar-headshot" src={athlete.headshot} alt={`${athlete.name} headshot`} />
              )}
              <span className="avatar-initials">{athlete.initials}</span>
            </div>
          </div>
          <div className="twin-state">
            <div className={railIsActive ? "twin-state-label loading" : "twin-state-label"} aria-live="polite">
              {railIsActive ? <><span aria-hidden="true">◉ </span>{railStatusLabel}</> : <><span aria-hidden="true">● </span>Ready</>}
            </div>
            <div className="twin-version">Verified Twin v1.0</div>
          </div>
          <div className="rail-stats">
            {athlete.stats.slice(0, 2).map((s, i) => (
              <div key={i} className="rail-stat">
                <div className="stat-value">{s.v}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-main">
          {mode === "qa" && sessionTrackingEnabled && sessionUsage && (
            <ChatSessionBar
              sessionsRemaining={sessionUsage.sessionsRemaining}
              sessionsIncluded={sessionUsage.sessionsIncluded}
              usageLabel={sessionUsage.label}
              activeSession={chatSession}
              endedSession={endedSessionRecap}
              isExhausted={isSessionsExhausted}
              onEndSession={handleEndSession}
              onStartAnotherSession={handleStartAnotherSession}
              twinName={athlete.name}
              endDisabled={isComposerBusy}
            />
          )}
          <div className="messages" aria-live={mode === "qa" ? "polite" : "off"} aria-busy={loading || isQaBusy}>
              {messages.length === 0 && !loading && !voiceIsActive && streamPhase === "idle" && !isComposerLocked && (
                mode === "qa" ? (
                  <div className="qa-empty-state">
                    <div className="empty-title">Ask {athlete.name.split(" ")[0]} anything.</div>
                    <div className="empty-meta">Verified twin Q&A · Voice optional</div>
                    <div className="voice-prompts compact">
                      {voicePrompts.map(prompt => (
                        <button key={prompt.label} type="button" className="voice-chip" onClick={() => sendSuggestedPrompt(prompt.prompt)}>
                          <span aria-hidden="true">{prompt.icon}</span>
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-title">Preparing the story...</div>
                  </div>
                )
              )}

              {mode === "qa" && voiceIsActive && (
                <div className="voice-status-card">
                  <span className={voiceIsActive ? "live-dot active" : "live-dot"} aria-hidden="true" />
                  {voiceState === "listening" && "Listening. Ask naturally."}
                  {voiceState === "thinking" && "Checking verified records."}
                  {voiceState === "speaking" && "Speaking response."}
                </div>
              )}

            {messages.map((msg, i) => (
              <div key={msg.id ?? `msg-${i}`} className={mode === "narrator" ? "message narrator-beat" : "message"}>
                {msg.role === "user" ? (
                  <div className="user-message">
                    <div className="user-bubble">{msg.content}</div>
                  </div>
                ) : (
                  <div className={mode === "narrator" && i === activeBeat ? "assistant-message narrator-active" : "assistant-message"}>
                    {mode === "narrator" ? (
                      <button type="button" className="narrator-marker" onClick={() => selectNarratorBeat(i)} aria-label={`Play chapter ${i + 1}`}>
                        <span>{msg.moment?.y}</span>
                      </button>
                    ) : (
                      <div className="assistant-avatar">{athlete.initials}</div>
                    )}
                    <div className="assistant-copy">
                      {mode === "narrator" && (
                        <button type="button" className="narrator-chapter" onClick={() => selectNarratorBeat(i)}>
                          <span>{msg.moment?.era}</span>
                          {msg.moment?.title}
                        </button>
                      )}
                      <div
                        className={
                          msg.status === "streaming"
                            ? "assistant-text is-streaming"
                            : "assistant-text"
                        }
                      >
                        {msg.content || (msg.status === "streaming" ? "\u00A0" : "")}
                      </div>
                      {mode === "qa" && (
                        <SourceAttribution
                          sourceIds={msg.sourceIds}
                          responseType={msg.responseType}
                          status={msg.status ?? "complete"}
                        />
                      )}
                      {mode === "narrator" && (
                        <div className="verified-meta"><span aria-hidden="true">✓ </span>Verified twin response</div>
                      )}
                      {mode === "narrator" && msg.media?.length > 0 && (
                        <div className="narrator-media-row">
                          {msg.media.map((item, mediaIndex) => (
                            <button key={mediaIndex} type="button" className="video-card" aria-label={`Play ${item.title}`}>
                              <span className="video-play" aria-hidden="true">▶</span>
                              <span className="video-copy">
                                <span>{item.title}</span>
                                <small>{item.meta}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {mode === "qa" && streamPhase === "thinking" && !messages.some((m) => m.status === "streaming") && (
              <div className="assistant-message stream-thinking" style={{ animation: "fadeIn 0.3s ease" }}>
                <div className="assistant-avatar">{athlete.initials}</div>
                <div className="assistant-copy">
                  <div className="stream-thinking-label">Preparing response…</div>
                  <div className="typing">
                    {[0, 1, 2].map((dot) => (
                      <div key={dot} className="typing-dot" style={{ animationDelay: `${dot * 0.2}s` }} aria-hidden="true" />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {loading && mode === "narrator" && (
              <div className="assistant-message" style={{ animation: "fadeIn 0.3s ease" }}>
                <div className="assistant-avatar">{athlete.initials}</div>
                <div className="typing">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} aria-hidden="true" />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {mode === "qa" ? (
            isComposerLocked ? (
              isSessionsExhausted && (
                <div className="composer-disabled-note" role="status">
                  No monthly sessions remaining. Manage your plan to continue.
                </div>
              )
            ) : (
            <div className="modal-composer voice-dock">
              <div className="dock-input-wrap">
                <textarea
                  id="twin-question-input"
                  ref={inputRef}
                  className="twin-input twin-textarea"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendQA();
                    }
                  }}
                  placeholder={`Ask ${athlete.name.split(" ")[0]}...`}
                  aria-label={`Ask ${athlete.name} a question`}
                />
              </div>
              <button
                type="button"
                className={`voice-button ${voiceState}`}
                onClick={startVoiceInteraction}
                disabled={isComposerBusy && voiceState !== "speaking"}
                aria-label={voiceState === "speaking" ? "Stop voice playback" : "Start voice interaction"}
              >
                <span aria-hidden="true">{voiceState === "speaking" ? "■" : "🎙"}</span>
              </button>
              <button
                type="button"
                className={voiceIsActive ? "send-icon-button stop-mode" : "send-icon-button"}
                onClick={voiceIsActive ? stopVoiceInteraction : () => sendQA()}
                disabled={!voiceIsActive && (isComposerBusy || !input.trim())}
                aria-label={voiceIsActive ? "Exit voice mode" : "Send message"}
              >
                <span aria-hidden="true">{voiceIsActive ? "×" : "→"}</span>
              </button>
            </div>
            )
          ) : (
            messages.length > 0 && !loading && (
              <div className="modal-composer narrator-actions">
                <button type="button" className="secondary-button" onClick={continueNarrator}>
                  <span aria-hidden="true">▶ </span>{activeBeat >= narratorBeats.length - 1 ? "Restart story" : "Continue the story"}
                </button>
                <button type="button" className="secondary-button" onClick={() => switchMode("qa")}>
                  <span aria-hidden="true">✦ </span>Switch to Q&A
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
