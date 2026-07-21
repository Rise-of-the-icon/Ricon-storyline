import { useState, useEffect, useId, useRef } from "react";
import {
  wait, STREAM_ERROR_MESSAGE, TWIN_SERVICE_UNAVAILABLE_MESSAGE, narratorBeats, buildNarratorMessage, answerQuestion,
  qaCaptureMessages, voicePrompts, narratorVoiceIdForAthlete, narratorStaticAudioUrl,
  narratorCacheId, researchVoiceCacheKey, researchVoiceCacheUrl, readNarratorCache,
  synthesizeNarratorAudioToCacheForAthlete, base64ToAudioUrl, buildNarratorMessages,
  buildOpeningNarratorMessages, isStudioAnthropicQaAthlete, API_BASE, WS_BASE, NARRATOR_MODEL_ID,
} from "./narratorCore.js";

const UNCERTAIN_PHRASES = [
  "beyond what i can speak to",
  "not really something i got into",
  "outside the verified",
  "outside verified",
  "not something i covered",
  "can't speak to that with certainty",
  "cannot speak to that with certainty",
];

export function detectResponseKind(text) {
  const normalized = String(text || "").toLowerCase();
  if (!normalized) return "grounded";
  if (UNCERTAIN_PHRASES.some((phrase) => normalized.includes(phrase))) return "uncertain";
  return "grounded";
}

function nextMessageId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function useTwinEngine({ athlete, mode, onClose, onSwitchMode, prewarmedNarrative }) {
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");
  const initialNarratorMessages = () => {
    if (figmaTwinMode === "narrator") {
      return buildNarratorMessages(athlete);
    }
    return buildOpeningNarratorMessages(athlete, prewarmedNarrative);
  };
  const initialQaMessages = () => {
    if (figmaTwinMode === "qaThread") return qaCaptureMessages(athlete).map((msg) => ({
      ...msg,
      id: msg.id || nextMessageId(msg.role === "user" ? "u" : "t"),
      kind: msg.role === "assistant" ? detectResponseKind(msg.content) : undefined,
    }));
    return [];
  };
  const [narratorMessages, setNarratorMessages] = useState(initialNarratorMessages);
  const [qaMessages, setQaMessages] = useState(initialQaMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [voiceState, setVoiceState] = useState("idle");
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
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
  const modeRef = useRef(mode);
  const qaTurnRef = useRef(0);
  const voiceConversationRef = useRef(false);
  const voiceRelistenTimerRef = useRef(null);
  const startVoiceInteractionRef = useRef(null);
  const pendingNarratorAutoplayRef = useRef(false);
  const pendingNarratorBeatRef = useRef(0);
  const narratorRetryHandlerRef = useRef(null);
  const mediaSessionRef = useRef(0);
  const mountedRef = useRef(false);
  const switchModeTimerRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);
  const shouldCloseOnEscapeRef = useRef(() => true);
  const titleId = useId();
  const descriptionId = useId();

  const messages = mode === "qa" ? qaMessages : narratorMessages;

  const setMessages = (updater) => {
    const apply = (prev) => (typeof updater === "function" ? updater(prev) : updater);
    if (modeRef.current === "qa") setQaMessages(apply);
    else setNarratorMessages(apply);
  };

  // ── Web Audio API for streaming PCM16 chunks ─────────────────────
  const initAudioCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayRef.current = 0;
    }
  };

  const playPCM16Chunk = (base64Audio) => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    const bytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
    const pcm16 = new Int16Array(bytes.buffer);
    const buf   = ctx.createBuffer(1, pcm16.length, 24000);
    const f32   = buf.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 32768;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const t = Math.max(ctx.currentTime, nextPlayRef.current);
    nextPlayRef.current = t + buf.duration;
    src.start(t);
  };

  const clearVoiceRelisten = () => {
    if (voiceRelistenTimerRef.current) {
      window.clearTimeout(voiceRelistenTimerRef.current);
      voiceRelistenTimerRef.current = null;
    }
  };

  const endVoiceConversation = () => {
    voiceConversationRef.current = false;
    clearVoiceRelisten();
    setVoiceSessionActive(false);
  };

  const scheduleVoiceRelisten = () => {
    clearVoiceRelisten();
    if (!voiceConversationRef.current || modeRef.current !== "qa" || !mountedRef.current) return;
    let delay = 320;
    if (audioCtxRef.current && nextPlayRef.current > 0) {
      const remainingMs = Math.max(0, (nextPlayRef.current - audioCtxRef.current.currentTime) * 1000);
      delay = Math.max(320, remainingMs + 180);
    }
    voiceRelistenTimerRef.current = window.setTimeout(() => {
      voiceRelistenTimerRef.current = null;
      if (!voiceConversationRef.current || modeRef.current !== "qa" || !mountedRef.current) return;
      startVoiceInteractionRef.current?.();
    }, delay);
  };

  const stopStreamingAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    nextPlayRef.current = 0;
  };

  const stopVoicePlayback = () => {
    clearVoiceRelisten();
    if (audioRef.current) {
      audioRef.current.pause?.();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current.load?.();
      audioRef.current = null;
    }
    stopStreamingAudio();
    setVoiceState("idle");
    if (!voiceConversationRef.current) {
      setVoiceSessionActive(false);
    }
  };

  const currentMediaSession = () => mediaSessionRef.current;
  const isMediaSessionActive = (session) => mountedRef.current && session === mediaSessionRef.current;
  const invalidateMediaSession = () => {
    mediaSessionRef.current += 1;
    pendingNarratorAutoplayRef.current = false;
    pendingQuestionRef.current = null;
    clearVoiceRelisten();
    if (switchModeTimerRef.current) {
      window.clearTimeout(switchModeTimerRef.current);
      switchModeTimerRef.current = null;
    }
  };

  const playAudioBase64 = (audioBase64, session = currentMediaSession()) => {
    if (!audioBase64 || !isMediaSessionActive(session)) return false;
    stopVoicePlayback();
    if (!isMediaSessionActive(session)) return false;
    if (voiceConversationRef.current) setVoiceSessionActive(true);
    const src = base64ToAudioUrl(audioBase64);
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onplay = () => {
      if (isMediaSessionActive(session)) setVoiceState("speaking");
    };
    audio.onended = () => {
      URL.revokeObjectURL(src);
      if (!isMediaSessionActive(session)) return;
      setVoiceState("idle");
      if (voiceConversationRef.current && modeRef.current === "qa") {
        scheduleVoiceRelisten();
      } else {
        setVoiceSessionActive(false);
      }
    };
    audio.onerror = () => {
      URL.revokeObjectURL(src);
      if (!isMediaSessionActive(session)) return;
      setVoiceState("idle");
      if (voiceConversationRef.current && modeRef.current === "qa") {
        scheduleVoiceRelisten();
      } else {
        setVoiceSessionActive(false);
      }
    };
    audio.play().catch(() => {
      URL.revokeObjectURL(src);
      if (!isMediaSessionActive(session)) return;
      setVoiceState("idle");
      if (voiceConversationRef.current && modeRef.current === "qa") {
        scheduleVoiceRelisten();
      } else {
        setVoiceSessionActive(false);
      }
    });
    return true;
  };

  const playAudioUrl = async (url, session = currentMediaSession()) => {
    if (!url || !isMediaSessionActive(session)) return false;
    const audio = new Audio(url);
    audio.preload = "auto";
    audioRef.current = audio;
    audio.onplay = () => {
      if (isMediaSessionActive(session)) setVoiceState("speaking");
    };
    audio.onended = () => {
      if (!isMediaSessionActive(session)) return;
      setVoiceState("idle");
      if (audioRef.current === audio) audioRef.current = null;
      if (voiceConversationRef.current && modeRef.current === "qa") {
        scheduleVoiceRelisten();
      } else {
        setVoiceSessionActive(false);
      }
    };
    audio.onerror = () => {
      if (!isMediaSessionActive(session)) return;
      setVoiceState("idle");
      if (audioRef.current === audio) audioRef.current = null;
      if (voiceConversationRef.current && modeRef.current === "qa") {
        scheduleVoiceRelisten();
      } else {
        setVoiceSessionActive(false);
      }
    };
    try {
      await audio.play();
      return isMediaSessionActive(session);
    } catch {
      if (audioRef.current === audio) audioRef.current = null;
      if (isMediaSessionActive(session)) {
        setVoiceState("idle");
        if (voiceConversationRef.current && modeRef.current === "qa") {
          scheduleVoiceRelisten();
        } else {
          setVoiceSessionActive(false);
        }
      }
      return false;
    }
  };

  const synthesizeAthleteVoice = async (text, emotionFamily = "Character") => {
    try {
      const voiceId = narratorVoiceIdForAthlete(athlete);
      const response = await fetch(
        `${API_BASE.replace(/\/$/, "")}/api/research/voice/speak`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            emotion_family: emotionFamily,
            voice_id: voiceId,
            model_id: NARRATOR_MODEL_ID,
          }),
        },
      );
      if (!response.ok) return null;
      const payload = await response.json();
      return payload.audio_base64 || null;
    } catch {
      return null;
    }
  };

  const generateProfileQaAnswer = async (question) => {
    if (!isStudioAnthropicQaAthlete(athlete)) return { text: null, unavailable: false };
    try {
      const response = await fetch(`${API_BASE.replace(/\/$/, "")}/api/twin/generate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, profile: athlete }),
      });
      if (!response.ok) return { text: null, unavailable: true };
      const payload = await response.json();
      const text = payload.text || "";
      if (!text) return { text: null, unavailable: true };
      return { text, unavailable: false };
    } catch {
      return { text: null, unavailable: true };
    }
  };

  const generateNarratorMessage = async (beatIndex) => {
    return buildNarratorMessage(athlete, beatIndex);
  };

  const synthesizeNarratorAudioToCache = async (beatIndex, text) => {
    return synthesizeNarratorAudioToCacheForAthlete(athlete, beatIndex, text);
  };

  const preGenerateNarratorVoices = async (beats) => {
    await Promise.all(
      beats.map((beat, index) => synthesizeNarratorAudioToCache(index, beat.content))
    );
  };

  const playNonStreamingQaAnswer = async (question, assistantIndex, turn = qaTurnRef.current) => {
    const session = currentMediaSession();
    try {
      const generated = await generateProfileQaAnswer(question);
      if (turn !== qaTurnRef.current || !isMediaSessionActive(session)) {
        setLoading(false);
        setVoiceState("idle");
        if (!voiceConversationRef.current) setVoiceSessionActive(false);
        return;
      }

      const isCoreTwin = isStudioAnthropicQaAthlete(athlete);
      if (isCoreTwin && (!generated?.text || generated.unavailable)) {
        setMessages(p => p.map((m, i) =>
          i === assistantIndex
            ? {
                ...m,
                content: TWIN_SERVICE_UNAVAILABLE_MESSAGE,
                streaming: false,
                stopped: false,
                error: true,
                kind: "grounded",
                prompt: question || m.prompt,
                voiceError: false,
              }
            : m
        ));
        setLoading(false);
        setVoiceState("idle");
        if (voiceConversationRef.current && modeRef.current === "qa") {
          scheduleVoiceRelisten();
        } else {
          setVoiceSessionActive(false);
        }
        return;
      }

      const reply = generated?.text || answerQuestion(athlete, question);
      const kind = detectResponseKind(reply);
      setMessages(p => p.map((m, i) =>
        i === assistantIndex
          ? {
              ...m,
              content: reply,
              streaming: false,
              stopped: false,
              error: false,
              kind,
              prompt: question || m.prompt,
              voiceError: false,
            }
          : m
      ));
      setLoading(false);
      const audioBase64 = await synthesizeAthleteVoice(reply, "Character");
      if (turn !== qaTurnRef.current || !isMediaSessionActive(session)) {
        setVoiceState("idle");
        if (!voiceConversationRef.current) setVoiceSessionActive(false);
        return;
      }
      if (audioBase64) {
        playAudioBase64(audioBase64, session);
        return;
      }
      // Keep the good text reply; voice failure is non-fatal.
      setMessages(p => p.map((m, i) =>
        i === assistantIndex
          ? {
              ...m,
              content: reply,
              streaming: false,
              stopped: false,
              kind,
              prompt: question || m.prompt,
              voiceError: true,
            }
          : m
      ));
      setVoiceState("idle");
      if (voiceConversationRef.current && modeRef.current === "qa") {
        scheduleVoiceRelisten();
      } else {
        setVoiceSessionActive(false);
      }
    } catch {
      if (turn !== qaTurnRef.current) return;
      setLoading(false);
      setVoiceState("idle");
      if (!voiceConversationRef.current) setVoiceSessionActive(false);
      setMessages(p => p.map((m, i) =>
        i === assistantIndex
          ? {
              ...m,
              content: m.content || (isStudioAnthropicQaAthlete(athlete)
                ? TWIN_SERVICE_UNAVAILABLE_MESSAGE
                : STREAM_ERROR_MESSAGE),
              streaming: false,
              error: !m.content,
              prompt: question || m.prompt,
            }
          : m
      ));
    }
  };

  const finalizeCurrent = (isError = false) => {
    const cur = currentMsgRef.current;
    if (cur.index === null) return;
    const idx = cur.index;
    const question = cur.question;
    const buffer = cur.buffer || "";
    if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
    currentMsgRef.current = { index: null, buffer: "", audioStarted: false, question: null };

    if (isError && question) {
      console.warn("Realtime failed");
      void playNonStreamingQaAnswer(question, idx, qaTurnRef.current);
      return;
    }
    const finalContent = buffer || "";
    const kind = isError ? "grounded" : detectResponseKind(finalContent);
    setMessages(p => p.map((m, i) =>
      i === idx
        ? (isError
            ? {
                ...m,
                id: m.id || nextMessageId("t"),
                role: "assistant",
                content: STREAM_ERROR_MESSAGE,
                streaming: false,
                error: true,
                stopped: false,
                prompt: question || m.prompt,
              }
            : {
                ...m,
                content: finalContent || m.content || "",
                streaming: false,
                stopped: false,
                error: false,
                kind,
                prompt: question || m.prompt,
              })
        : m
    ));
    setLoading(false);
    if (isError) {
      setVoiceState("idle");
      endVoiceConversation();
      return;
    }
    // Keep session alive for turn-taking; wait for any queued PCM to finish before re-listening.
    setVoiceState("idle");
    if (voiceConversationRef.current && modeRef.current === "qa") {
      setVoiceSessionActive(true);
      scheduleVoiceRelisten();
    } else {
      setVoiceSessionActive(false);
    }
  };

  const handleRealtimeEvent = (msg) => {
    const t = msg.type;

    if (t === "ready") {
      wsReadyRef.current = true;
      if (pendingQuestionRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "question", text: pendingQuestionRef.current }));
        pendingQuestionRef.current = null;
        startResponseTimer();
      }
      return;
    }

    const cur = currentMsgRef.current;
    if (cur.index === null) return;
    if (cur.turn != null && cur.turn !== qaTurnRef.current) return;

    if (t === "response.text.delta") {
      const delta = msg.delta || msg.text || "";
      if (!delta) return;
      const nextBuffer = (cur.buffer || "") + delta;
      currentMsgRef.current = { ...cur, buffer: nextBuffer };
      setMessages(p => p.map((m, i) =>
        i === cur.index ? { ...m, content: nextBuffer, streaming: true } : m
      ));
      return;
    }

    if (t === "response.output_audio.delta") {
      if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
      if (!cur.audioStarted) {
        currentMsgRef.current = { ...cur, audioStarted: true };
        setVoiceState("speaking");
        setVoiceSessionActive(true);
      }
      playPCM16Chunk(msg.delta);
    }
    else if (t === "response.done") {
      finalizeCurrent(false);
    }
    else if (t === "error") {
      finalizeCurrent(true);
    }
  };

  const startResponseTimer = () => {
    if (responseTimerRef.current) return;
    responseTimerRef.current = setTimeout(() => {
      console.warn("Response timeout");
      responseTimerRef.current = null;
      finalizeCurrent(true);
    }, 25000);
  };

  const openRealtimeWS = () => {
    if (wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
         wsRef.current.readyState === WebSocket.CONNECTING)) return;
    wsReadyRef.current = false;
    const socket = new WebSocket(`${WS_BASE}/twin/ws`);
    wsRef.current = socket;
    socket.onopen  = () => {
      console.log("✓ Realtime WS connected");
      socket.send(JSON.stringify({
        type: "configure",
        voice_id: narratorVoiceIdForAthlete(athlete),
        profile: athlete,
      }));
      if (pendingQuestionRef.current) {
        socket.send(JSON.stringify({ type: "question", text: pendingQuestionRef.current }));
        pendingQuestionRef.current = null;
        startResponseTimer();
      }
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };
    socket.onclose = () => {
      if (wsRef.current === socket) {
        wsReadyRef.current = false;
        wsRef.current = null;
        // If a request was in flight, fall back to REST immediately
        if (currentMsgRef.current.index !== null) {
          finalizeCurrent(true);
        }
      }
    };
    socket.onerror = (e) => console.error("WS error:", e);
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      handleRealtimeEvent(msg);
    };
  };

  const closeRealtimeWS = () => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    wsRef.current?.close();
    wsRef.current = null;
    wsReadyRef.current = false;
    pendingQuestionRef.current = null;
    if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
  };

  const removeNarratorRetryListeners = () => {
    const handler = narratorRetryHandlerRef.current;
    if (!handler) return;
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("keydown", handler, true);
    narratorRetryHandlerRef.current = null;
  };

  const hardStopMedia = () => {
    invalidateMediaSession();
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort?.();
    }
    recognitionRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause?.();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current.load?.();
      audioRef.current = null;
    }
    stopStreamingAudio();
    closeRealtimeWS();
    removeNarratorRetryListeners();
    voiceConversationRef.current = false;
    clearVoiceRelisten();
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    mountedRef.current = true;
    previousActiveElement.current = document.activeElement;
    window.requestAnimationFrame(() => {
      if (mode === "qa") inputRef.current?.focus();
      else closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (shouldCloseOnEscapeRef.current && !shouldCloseOnEscapeRef.current()) {
          return;
        }
        event.preventDefault();
        hardStopMedia();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        if (el.closest("[hidden]")) return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      });
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
      mountedRef.current = false;
      endVoiceConversation();
      hardStopMedia();
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      hardStopMedia();
    };
  }, []);

  const playNarratorAudio = (beatIndex, textOverride = "") => {
    const session = currentMediaSession();
    const run = async () => {
      try {
        if (!isMediaSessionActive(session)) return;
        stopVoicePlayback();
        if (!isMediaSessionActive(session)) return;
        const beat = messages[beatIndex];
        const text = textOverride || beat?.content || buildNarratorMessage(athlete, beatIndex).content;
        const voiceId = narratorVoiceIdForAthlete(athlete);
        const cacheKey = narratorCacheId({
          athleteName: athlete.name,
          beatIndex,
          text,
          voiceId,
        });
        const cache = readNarratorCache();
        const playedStaticAsset = await playAudioUrl(narratorStaticAudioUrl(athlete, beatIndex), session);
        if (playedStaticAsset) {
          pendingNarratorAutoplayRef.current = false;
          removeNarratorRetryListeners();
          return;
        }

        const cachedAudioBase64 = cache[cacheKey]?.audioBase64 || "";
        if (cachedAudioBase64) {
          playAudioBase64(cachedAudioBase64, session);
          return;
        }

        const backendCacheKey = await researchVoiceCacheKey({ text, voiceId });
        if (!isMediaSessionActive(session)) return;
        const playedCachedUrl = await playAudioUrl(researchVoiceCacheUrl(backendCacheKey), session);
        if (playedCachedUrl) {
          pendingNarratorAutoplayRef.current = false;
          removeNarratorRetryListeners();
          return;
        }

        const audioBase64 = await synthesizeNarratorAudioToCache(beatIndex, text);
        if (!isMediaSessionActive(session)) return;

        if (!audioBase64) {
          throw new Error("No narrator audio available");
        }

        const src = base64ToAudioUrl(audioBase64);
        const audio = new Audio(src);
        audioRef.current = audio;
        audio.onplay = () => {
          if (isMediaSessionActive(session)) setVoiceState("speaking");
        };
        audio.onended = () => {
          URL.revokeObjectURL(src);
          if (isMediaSessionActive(session)) setVoiceState("idle");
        };
        audio.onerror = () => {
          URL.revokeObjectURL(src);
          if (isMediaSessionActive(session)) setVoiceState("idle");
        };
        audio.currentTime = 0;
        audio.play().then(() => {
          if (!isMediaSessionActive(session)) return;
          pendingNarratorAutoplayRef.current = false;
          removeNarratorRetryListeners();
        }).catch(() => {
          if (!isMediaSessionActive(session)) return;
          setVoiceState("idle");
          pendingNarratorAutoplayRef.current = true;
          pendingNarratorBeatRef.current = beatIndex;
          if (!narratorRetryHandlerRef.current) {
            narratorRetryHandlerRef.current = () => {
              if (!isMediaSessionActive(session)) return;
              const beatToRetry = pendingNarratorBeatRef.current;
              removeNarratorRetryListeners();
              pendingNarratorAutoplayRef.current = false;
              window.setTimeout(() => playNarratorAudio(beatToRetry), 0);
            };
            window.addEventListener("pointerdown", narratorRetryHandlerRef.current, true);
            window.addEventListener("keydown", narratorRetryHandlerRef.current, true);
          }
        });
      } catch {
        if (isMediaSessionActive(session)) setVoiceState("idle");
      }
    };
    void run();
  };

  const continueNarrator = async () => {
    const session = currentMediaSession();
    stopVoicePlayback();
    if (!isMediaSessionActive(session)) return;
    const isRestart = narratorIndex.current >= narratorBeats.length - 1;
    const nextIndex = isRestart ? 0 : narratorIndex.current + 1;
    narratorIndex.current = nextIndex;
    setActiveBeat(nextIndex);
    const nextBeat = await generateNarratorMessage(nextIndex);
    setMessages(p => {
      if (isRestart) return [nextBeat];
      return p[nextIndex] ? p : [...p, nextBeat];
    });
    setLoading(false);
    playNarratorAudio(nextIndex, nextBeat.content);
  };

  const selectNarratorBeat = async (index) => {
    if (loading) return;
    const session = currentMediaSession();
    stopVoicePlayback();
    if (!isMediaSessionActive(session)) return;
    setActiveBeat(index);
    narratorIndex.current = index;
    if (messages[index]) {
      playNarratorAudio(index);
      return;
    }
    setLoading(true);
    try {
      await wait(420);
      if (!isMediaSessionActive(session)) return;
      narratorIndex.current = Math.max(narratorIndex.current, index);
      const generatedBeats = await Promise.all(
        Array.from({ length: index + 1 }, (_, i) => messages[i] || generateNarratorMessage(i))
      );
      if (!isMediaSessionActive(session)) return;
      let targetBeat = generatedBeats[index] || null;
      setMessages(p => {
        const next = [...p];
        for (let i = 0; i <= index; i += 1) {
          if (!next[i]) next[i] = generatedBeats[i];
        }
        return next;
      });
      if (targetBeat) playNarratorAudio(index, targetBeat.content);
    } finally {
      setLoading(false);
    }
  };

  const sendQA = (questionOverride, options = {}) => {
    const opts = typeof options === "object" && options !== null ? options : {};
    const question = (questionOverride ?? input).trim();
    if (!question || loading) return;

    invalidateMediaSession();
    qaTurnRef.current += 1;
    modeRef.current = "qa";

    setQaMessages((p) => {
      const assistantIndex = p.length + 1;
      currentMsgRef.current = {
        index: assistantIndex,
        buffer: "",
        audioStarted: false,
        question,
        turn: qaTurnRef.current,
      };
      return [
        ...p,
        { id: nextMessageId("u"), role: "user", content: question },
        {
          id: nextMessageId("t"),
          role: "assistant",
          content: "",
          streaming: true,
          stopped: false,
          prompt: question,
          contextLabel: opts.contextLabel || undefined,
        },
      ];
    });
    setInput("");
    setLoading(true);
    stopVoicePlayback();
    setVoiceState("thinking");
    pendingQuestionRef.current = question;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "question", text: question }));
      pendingQuestionRef.current = null;
      startResponseTimer();
    } else {
      openRealtimeWS();
    }
  };

  const sendSuggestedPrompt = (prompt) => {
    setVoiceState("idle");
    sendQA(prompt);
  };

  const startVoiceInteraction = () => {
    if (voiceState === "thinking") return;
    if (loading && voiceState !== "speaking" && voiceState !== "listening") return;

    if (voiceState === "listening") {
      // Cancel current listen turn and end the voice session.
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort?.();
        recognitionRef.current = null;
      }
      endVoiceConversation();
      setVoiceState("idle");
      setLoading(false);
      inputRef.current?.focus();
      return;
    }

    if (voiceState === "speaking") {
      // Barge-in: stop twin audio, then listen again.
      stopVoicePlayback();
      voiceConversationRef.current = true;
      setVoiceSessionActive(true);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);

    if (!SpeechRecognition) {
      endVoiceConversation();
      setVoiceState("idle");
      inputRef.current?.focus();
      return;
    }

    clearVoiceRelisten();
    voiceConversationRef.current = true;
    setVoiceSessionActive(true);
    setVoiceState("listening");

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
      recognitionRef.current = null;
      endVoiceConversation();
      setVoiceState("idle");
      inputRef.current?.focus();
    };
    recognition.onend = () => {
      const question = finalTranscript.trim();
      recognitionRef.current = null;
      if (!question) {
        endVoiceConversation();
        setVoiceState("idle");
        return;
      }
      setVoiceState("thinking");
      setVoiceSessionActive(true);
      sendQA(question);
    };
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      endVoiceConversation();
      setVoiceState("idle");
      inputRef.current?.focus();
    }
  };
  startVoiceInteractionRef.current = startVoiceInteraction;

  const stopGeneration = () => {
    const cur = currentMsgRef.current;
    qaTurnRef.current += 1;
    pendingQuestionRef.current = null;
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    endVoiceConversation();
    stopVoicePlayback();

    if (cur.index !== null) {
      const buffer = cur.buffer || "";
      setQaMessages((prev) => prev.map((m, i) => {
        if (i !== cur.index) return m;
        const content = (buffer || m.content || "").trim();
        if (content) {
          return {
            ...m,
            content: buffer || m.content,
            streaming: false,
            stopped: true,
            error: false,
            isPartial: true,
            kind: detectResponseKind(buffer || m.content),
            prompt: cur.question || m.prompt,
          };
        }
        return {
          ...m,
          content: "Response stopped before an answer was ready.",
          streaming: false,
          stopped: true,
          error: false,
          isPartial: false,
          prompt: cur.question || m.prompt,
        };
      }));
    }
    currentMsgRef.current = { index: null, buffer: "", audioStarted: false, question: null };
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
  };

  const stopVoiceInteraction = () => {
    const cur = currentMsgRef.current;
    const hadStreaming = cur.index !== null;
    endVoiceConversation();
    if (hadStreaming || loading) {
      stopGeneration();
      hardStopMedia();
      setLoading(false);
      return;
    }
    hardStopMedia();
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
  };

  const switchMode = (m) => {
    if (m === modeRef.current) return;
    // Preserve Ask history, but seal any in-flight stream before tearing media down.
    if (modeRef.current === "qa" && (currentMsgRef.current.index !== null || loading)) {
      const cur = currentMsgRef.current;
      qaTurnRef.current += 1;
      if (cur.index !== null) {
        const buffer = cur.buffer || "";
        setQaMessages((prev) => prev.map((msg, i) => {
          if (i !== cur.index) return msg;
          const content = (buffer || msg.content || "").trim();
          if (content) {
            return {
              ...msg,
              content: buffer || msg.content,
              streaming: false,
              stopped: true,
              error: false,
              isPartial: true,
              kind: detectResponseKind(buffer || msg.content),
              prompt: cur.question || msg.prompt,
            };
          }
          return {
            ...msg,
            content: "Response stopped before an answer was ready.",
            streaming: false,
            stopped: true,
            error: false,
            isPartial: false,
            prompt: cur.question || msg.prompt,
          };
        }));
      }
      currentMsgRef.current = { index: null, buffer: "", audioStarted: false, question: null };
    }
    endVoiceConversation();
    hardStopMedia();
    pendingNarratorAutoplayRef.current = false;
    modeRef.current = m;
    // Preserve Ask history; reset Narrator to opening beats (same as before for narrator).
    if (m === "narrator") {
      setNarratorMessages(buildOpeningNarratorMessages(athlete));
      narratorIndex.current = 0;
      setActiveBeat(0);
    }
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
    onSwitchMode(m);
    // Capture session AFTER hardStopMedia invalidated it, then open QA socket on that session.
    const session = currentMediaSession();
    const allNarratorMessages = m === "narrator" ? buildNarratorMessages(athlete) : [];
    switchModeTimerRef.current = window.setTimeout(() => {
      switchModeTimerRef.current = null;
      if (!isMediaSessionActive(session)) return;
      if (m === "narrator") {
        pendingNarratorBeatRef.current = 0;
        // Returning to Narrator should not auto-start voice either.
        pendingNarratorAutoplayRef.current = false;
        void preGenerateNarratorVoices(allNarratorMessages);
      }
      if (m === "qa") openRealtimeWS();
    }, 50);
  };

  const handleClose = () => {
    endVoiceConversation();
    hardStopMedia();
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
    onClose();
  };

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    modeRef.current = mode;
    if (figmaTwinMode === "narrator") {
      narratorIndex.current = narratorBeats.length - 1;
      setActiveBeat(narratorBeats.length - 1);
      return;
    }
    if (figmaTwinMode === "qaThread") {
      return;
    }
    if (mode === "narrator") {
      pendingNarratorBeatRef.current = 0;
      // Do not autoplay on open — user starts voice via Play / Continue.
      pendingNarratorAutoplayRef.current = false;
      void preGenerateNarratorVoices(buildNarratorMessages(athlete));
    }
    if (mode === "qa") {
      // Pre-warm: open WS so session is ready before user asks
      openRealtimeWS();
    }
  }, []);

  useEffect(() => {
    if (mode !== "narrator" || messages.length === 0 || !pendingNarratorAutoplayRef.current) return;
    pendingNarratorAutoplayRef.current = false;
    const timer = window.setTimeout(() => {
      playNarratorAudio(pendingNarratorBeatRef.current);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [mode, messages.length]);

  const voiceIsActive = voiceSessionActive || voiceState === "listening" || voiceState === "thinking" || voiceState === "speaking";

  return {
    // ids / refs for shell
    titleId,
    descriptionId,
    modalRef,
    closeButtonRef,
    inputRef,
    bottomRef,
    shouldCloseOnEscapeRef,
    // state
    messages,
    setMessages,
    input,
    setInput,
    loading,
    activeBeat,
    voiceState,
    voiceSessionActive,
    voiceIsActive,
    // actions
    hardStopMedia,
    stopVoicePlayback,
    playNarratorAudio,
    continueNarrator,
    selectNarratorBeat,
    sendQA,
    sendSuggestedPrompt,
    startVoiceInteraction,
    stopVoiceInteraction,
    stopGeneration,
    switchMode,
    handleClose,
    // constants for UI
    narratorBeatCount: narratorBeats.length,
    voicePrompts,
  };
}
