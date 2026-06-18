import { useState, useEffect, useId, useRef } from "react";
const API_BASE = import.meta.env.VITE_TWIN_API_URL || "https://ricon-storyline-production.up.railway.app";
const WS_BASE  = (import.meta.env.VITE_TWIN_API_URL || "https://ricon-storyline-production.up.railway.app")
  .replace("https://", "wss://").replace("http://", "ws://");

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const STREAM_ERROR_MESSAGE = "This moment is unavailable from the verified archive. Try a different question.";
const NARRATOR_VOICE_CACHE_KEY = "ricon:narrator-voice-cache:v3";
const NARRATOR_VOICE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NARRATOR_MODEL_ID = "inworld-tts-2";

const NARRATOR_VOICE_ID_BY_MERGE_KEY = {
  "david west": "default--z5zasdfwci5ofrt-gmsjw__test",
  "tom hoover": "default--z5zasdfwci5ofrt-gmsjw__tom_hoover",
  "walt liquor": "default--z5zasdfwci5ofrt-gmsjw__walt",
  "walt taylor aka walt liquor": "default--z5zasdfwci5ofrt-gmsjw__walt",
};

const NARRATOR_VOICE_ID_BY_TWIN_ID = {
  "2aa2a157-7849-44a7-b695-f715c39d5bd7": "default--z5zasdfwci5ofrt-gmsjw__test",
  "c28f8898-da88-4887-b1e9-2d61396a91b9": "default--z5zasdfwci5ofrt-gmsjw__tom_hoover",
  "walt-liquor-research": "default--z5zasdfwci5ofrt-gmsjw__walt",
};

const clean = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
const STOP_WORDS = new Set(["what", "when", "where", "your", "were", "with", "that", "this", "from", "about", "moment"]);

const signatureMoment = (athlete) => {
  return [...athlete.moments].reverse().find(moment => moment.type === "iconic" || moment.type === "championship")
    || athlete.moments[athlete.moments.length - 1];
};

const pickMoment = (athlete, query, fallbackIndex = 0) => {
  const q = clean(query);
  const explicitYear = athlete.moments.find(moment => q.includes(moment.y));
  if (explicitYear) return explicitYear;

  if (q.includes("best") || q.includes("biggest") || q.includes("defining") || q.includes("signature")) {
    return signatureMoment(athlete);
  }

  const queryWords = q.split(/\s+/).filter(word => word.length > 3 && !STOP_WORDS.has(word));
  const byWords = athlete.moments.find(moment => {
    const haystack = clean(`${moment.title} ${moment.era} ${moment.type} ${moment.body}`);
    return queryWords.some(word => haystack.includes(word));
  });

  return byWords || athlete.moments[fallbackIndex % athlete.moments.length];
};

const statLine = (athlete) => athlete.stats.map(s => `${s.v} ${s.l}`).join(", ");

const roleContext = (athlete) => athlete.cat === "music"
  ? `${athlete.genreLabel} across ${athlete.years}, with documented works including ${athlete.credits}`
  : `${athlete.position} across ${athlete.years}, with ${athlete.teams}`;

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

function firstPersonLine(text, athleteName) {
  const escapeRegExp = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameTokens = String(athleteName || "")
    .match(/[A-Za-z]+/g)
    ?.filter(token => token.length > 2 && !["aka", "the"].includes(token.toLowerCase())) || [];
  let line = String(text || "");
  if (athleteName) {
    line = line.replace(new RegExp(`\\b${escapeRegExp(athleteName)}\\b`, "gi"), "I");
  }
  nameTokens.forEach((token) => {
    line = line.replace(new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi"), "I");
  });
  return line
    .replace(/\bhe was\b/gi, "I was")
    .replace(/\bshe was\b/gi, "I was")
    .replace(/\bhe is\b/gi, "I am")
    .replace(/\bshe is\b/gi, "I am")
    .replace(/\bhis\b/gi, "my")
    .replace(/\bher\b/gi, "my")
    .replace(/\bhim\b/gi, "me")
    .replace(/\s+/g, " ")
    .trim();
}

const buildNarratorMessage = (athlete, beatIndex) => {
  const beat = narratorBeats[beatIndex % narratorBeats.length];
  const moment = beat.getMoment(athlete);
  const line = beat.line(athlete);
  return {
    role: "assistant",
    content: firstPersonLine(line, athlete.name),
    moment,
    media: beat.media,
  };
};

const answerQuestion = (athlete, question) => {
  const q = clean(question);
  const moment = pickMoment(athlete, question, 1);

  if (q.includes("stat") || q.includes("average") || q.includes("ppg") || q.includes("championship") || q.includes("ring")) {
      return `The verified line is ${statLine(athlete)}. My documented context is ${roleContext(athlete)}. The numbers matter because they point back to documented chapters like ${moment.y}, ${moment.title}.`;
  }

  if (q.includes("team") || q.includes("played for") || q.includes("album") || q.includes("song") || q.includes("work")) {
    const path = athlete.cat === "music" ? `The verified works are ${athlete.credits}` : `The verified teams are ${athlete.teams}`;
    return `${path}. That path is part of the story, but the clearest archive marker here is ${moment.y}: ${moment.title}. ${moment.body}`;
  }

  if (q.includes("best") || q.includes("biggest") || q.includes("defining") || q.includes("moment")) {
    return `One defining chapter is ${moment.y}: ${moment.title}. ${moment.body} That is not mythology in this experience. It is one of the verified moments this twin is allowed to speak from.`;
  }

  if (q.includes("who") || q.includes("summary") || q.includes("legacy")) {
    return `I am ${athlete.name}: ${athlete.tagline} The verified record says ${statLine(athlete)}. The story says ${moment.y}, ${moment.title}, because that is where the numbers become memory.`;
  }

  return `That's beyond what I can speak to with certainty, but what I lived and what's documented, I can tell you. In ${moment.y}, ${moment.title}. ${moment.body}`;
};

const streamText = async (text, onToken) => {
  const tokens = text.match(/\S+\s*/g) || [];
  for (const token of tokens) {
    await wait(28);
    onToken(token);
  }
};

const qaCaptureMessages = (athlete) => [
  { role: "user", content: "What day is it?" },
  { role: "assistant", content: answerQuestion(athlete, "What day is it?") },
  { role: "user", content: "What about basketball cleats?" },
  { role: "assistant", content: answerQuestion(athlete, "What about basketball cleats?") },
  { role: "user", content: "I love you." },
  { role: "assistant", content: answerQuestion(athlete, "I love you.") },
];

const voicePrompts = [
  { icon: "▣", label: "Relive a defining moment", prompt: "What was your defining moment?" },
  { icon: "◌", label: "Ask about the mindset", prompt: "What mindset separated you from everyone else?" },
  { icon: "◇", label: "Explain the legacy", prompt: "How should people understand your legacy?" },
];

function narratorVoiceIdForAthlete(athlete) {
  const byId = NARRATOR_VOICE_ID_BY_TWIN_ID[athlete?.id];
  if (byId) return byId;
  const key = clean(athlete?.name || "").replace(/\s+/g, " ").trim();
  if (key.includes("walt liquor")) return NARRATOR_VOICE_ID_BY_MERGE_KEY["walt liquor"];
  if (key.includes("david west")) return NARRATOR_VOICE_ID_BY_MERGE_KEY["david west"];
  if (key.includes("tom hoover")) return NARRATOR_VOICE_ID_BY_MERGE_KEY["tom hoover"];
  return (
    NARRATOR_VOICE_ID_BY_MERGE_KEY[key] ||
    import.meta.env.VITE_WALT_VOICE_ID ||
    "default--z5zasdfwci5ofrt-gmsjw__walt"
  );
}

function narratorCacheId({ athleteName, beatIndex, text, voiceId }) {
  const textPart = btoa(unescape(encodeURIComponent(text))).slice(0, 64);
  return `${clean(athleteName).trim()}::${beatIndex}::${voiceId}::${textPart}`;
}

function readNarratorCache() {
  try {
    const raw = window.localStorage.getItem(NARRATOR_VOICE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeNarratorCache(cache) {
  try {
    window.localStorage.setItem(NARRATOR_VOICE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // best-effort cache only
  }
}

function base64ToAudioUrl(audioBase64) {
  const bytes = Uint8Array.from(atob(audioBase64), (ch) => ch.charCodeAt(0));
  const blob = new Blob([bytes], { type: "audio/mp3" });
  return URL.createObjectURL(blob);
}

export const OPENING_NARRATIVE_PROMPT = "Begin the story of your career from the beginning, in one paragraph.";

export const prewarmOpeningNarrative = async (athlete) => {
  await wait(650);
  return {
    ...buildNarratorMessage(athlete, 0),
    prompt: OPENING_NARRATIVE_PROMPT,
    prewarmed: true,
  };
};

export default function TwinModal({ athlete, mode, onClose, onSwitchMode, prewarmedNarrative }) {
  const [messages, setMessages] = useState([]);
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
  const modeRef = useRef(null);
  const pendingNarratorAutoplayRef = useRef(false);
  const pendingNarratorBeatRef = useRef(0);
  const narratorRetryHandlerRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");

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

  const stopStreamingAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    nextPlayRef.current = 0;
  };

  const playAudioBase64 = (audioBase64) => {
    if (!audioBase64) return false;
    if (audioRef.current) {
      audioRef.current.pause?.();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    const src = base64ToAudioUrl(audioBase64);
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onplay = () => setVoiceState("speaking");
    audio.onended = () => {
      URL.revokeObjectURL(src);
      setVoiceState("idle");
      setVoiceSessionActive(false);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(src);
      setVoiceState("idle");
      setVoiceSessionActive(false);
    };
    audio.play().catch(() => {
      URL.revokeObjectURL(src);
      setVoiceState("idle");
      setVoiceSessionActive(false);
    });
    return true;
  };

  const synthesizeAthleteVoice = async (text, emotionFamily = "Character") => {
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
  };

  const finalizeCurrent = (isError = false) => {
    const cur = currentMsgRef.current;
    if (cur.index === null) return;
    const idx = cur.index;
    const question = cur.question;
    if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
    currentMsgRef.current = { index: null, buffer: "", audioStarted: false, question: null };

    if (isError && question) {
      console.warn("Realtime failed");
    }
    setMessages(p => p.map((m, i) =>
      i === idx
        ? (isError
            ? { role: "assistant", content: STREAM_ERROR_MESSAGE, streaming: false, error: true }
            : { ...m, content: "", streaming: false })
        : m
    ));
    setLoading(false);
    setVoiceState("idle");
    setVoiceSessionActive(false);
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

    if (t === "response.output_audio.delta") {
      if (responseTimerRef.current) { clearTimeout(responseTimerRef.current); responseTimerRef.current = null; }
      playPCM16Chunk(msg.delta);
    }
    else if (t === "response.done") {
      finalizeCurrent(""); // voice-only — no text shown
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
    if (voiceTimer.current) window.clearTimeout(voiceTimer.current);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort?.();
    }
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause?.();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    stopStreamingAudio();
    closeRealtimeWS();
    removeNarratorRetryListeners();
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
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
        hardStopMedia();
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
      hardStopMedia();
    };
  }, []);

  const playNarratorAudio = (beatIndex) => {
    const run = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        const beat = messages[beatIndex];
        const text = beat?.content || buildNarratorMessage(athlete, beatIndex).content;
        const voiceId = narratorVoiceIdForAthlete(athlete);
        const cacheKey = narratorCacheId({
          athleteName: athlete.name,
          beatIndex,
          text,
          voiceId,
        });
        const cache = readNarratorCache();
        const cached = cache[cacheKey];
        let audioBase64 = null;

        if (cached?.audioBase64 && cached?.expiresAtISO) {
          const expiresAt = Date.parse(cached.expiresAtISO);
          if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
            audioBase64 = cached.audioBase64;
          } else {
            delete cache[cacheKey];
            writeNarratorCache(cache);
          }
        }

        if (!audioBase64) {
          try {
            const response = await fetch(
              `${API_BASE.replace(/\/$/, "")}/api/research/voice/speak`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text,
                  emotion_family: "Character",
                  voice_id: voiceId,
                  model_id: NARRATOR_MODEL_ID,
                }),
              },
            );
            if (response.ok) {
              const payload = await response.json();
              audioBase64 = payload.audio_base64;
            }
          } catch {
            // Final fallback is browser speech synthesis. Do not call /twin/speak:
            // that endpoint does not accept a per-athlete Inworld voice ID.
          }
        }

        if (audioBase64) {
          cache[cacheKey] = {
            audioBase64,
            generatedAtISO: new Date().toISOString(),
            expiresAtISO: new Date(
              Date.now() + NARRATOR_VOICE_CACHE_TTL_MS,
            ).toISOString(),
          };
          writeNarratorCache(cache);
        }

        if (!audioBase64) {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 0.82;
            utterance.volume = 0.9;
            utterance.onstart = () => setVoiceState("speaking");
            utterance.onend = () => setVoiceState("idle");
            utterance.onerror = () => setVoiceState("idle");
            window.speechSynthesis.speak(utterance);
            pendingNarratorAutoplayRef.current = false;
            removeNarratorRetryListeners();
            return;
          }
          throw new Error("No narrator audio available");
        }

        const src = base64ToAudioUrl(audioBase64);
        const audio = new Audio(src);
        audioRef.current = audio;
        audio.onplay = () => setVoiceState("speaking");
        audio.onended = () => {
          URL.revokeObjectURL(src);
          setVoiceState("idle");
        };
        audio.onerror = () => {
          URL.revokeObjectURL(src);
          setVoiceState("idle");
        };
        audio.currentTime = 0;
        audio.play().then(() => {
          pendingNarratorAutoplayRef.current = false;
          removeNarratorRetryListeners();
        }).catch(() => {
          setVoiceState("idle");
          pendingNarratorAutoplayRef.current = true;
          pendingNarratorBeatRef.current = beatIndex;
          if (!narratorRetryHandlerRef.current) {
            narratorRetryHandlerRef.current = () => {
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
        setVoiceState("idle");
      }
    };
    void run();
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
    utterance.onend = () => { setVoiceState("idle"); setVoiceSessionActive(false); };
    utterance.onerror = () => { setVoiceState("idle"); setVoiceSessionActive(false); };
    window.speechSynthesis.speak(utterance);
  };

  const triggerNarrator = async () => {
    if (prewarmedNarrative) {
      setLoading(false);
      narratorIndex.current = 0;
      setActiveBeat(0);
      setMessages([{ ...prewarmedNarrative, prewarmed: true }]);
      pendingNarratorBeatRef.current = 0;
      pendingNarratorAutoplayRef.current = true;
      return;
    }

    setLoading(true);
    narratorIndex.current = 0;
    setActiveBeat(0);
    await wait(650);
    const firstBeat = buildNarratorMessage(athlete, 0);
    setMessages([firstBeat]);
    setLoading(false);
    pendingNarratorBeatRef.current = 0;
    pendingNarratorAutoplayRef.current = true;
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

  const sendQA = (questionOverride) => {
    const question = (questionOverride ?? input).trim();
    if (!question || loading) return;

    setMessages(p => [...p, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setVoiceState("thinking");
    stopStreamingAudio();

    const assistantIndex = messages.length + 1;
    currentMsgRef.current = { index: null, buffer: "", audioStarted: false, question: null };
    setMessages(p => [...p, { role: "assistant", content: "", streaming: true, audioOnly: true }]);

    void (async () => {
      let reply = "";
      try {
        const response = await fetch(`${API_BASE.replace(/\/$/, "")}/api/storyline/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            profile: athlete,
          }),
        });
        if (response.ok) {
          const payload = await response.json();
          reply = payload.text || "";
        }
        if (!reply) reply = answerQuestion(athlete, question);
        reply = firstPersonLine(reply, athlete.name);
        setMessages(p => p.map((m, i) =>
          i === assistantIndex ? { ...m, content: "", streaming: false, audioOnly: true } : m
        ));
        setLoading(false);
        const audioBase64 = await synthesizeAthleteVoice(reply, "Character");
        if (audioBase64) {
          playAudioBase64(audioBase64);
        } else {
          speakReply(reply);
        }
      } catch {
        setMessages(p => p.map((m, i) =>
          i === assistantIndex
            ? { role: "assistant", content: STREAM_ERROR_MESSAGE, streaming: false, error: true }
            : m
        ));
        setLoading(false);
        setVoiceState("idle");
        setVoiceSessionActive(false);
      }
    })();
  };

  const sendSuggestedPrompt = (prompt) => {
    setVoiceState("idle");
    sendQA(prompt);
  };

  const startVoiceInteraction = () => {
    if (loading || voiceState === "listening" || voiceState === "thinking") return;

    if (voiceState === "speaking") {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause?.();
      setVoiceState("idle");
      setVoiceSessionActive(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSessionActive(true);
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
      setVoiceSessionActive(false);
      inputRef.current?.focus();
    };
    recognition.onend = () => {
      const question = finalTranscript.trim();
      recognitionRef.current = null;
      if (!question) {
        setVoiceState("idle");
        setVoiceSessionActive(false);
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
      setVoiceSessionActive(false);
      inputRef.current?.focus();
    }
  };

  const stopVoiceInteraction = () => {
    hardStopMedia();
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
  };

  const switchMode = (m) => {
    if (m === modeRef.current) return;
    hardStopMedia();
    pendingNarratorAutoplayRef.current = false;
    modeRef.current = m;
    setMessages([]);
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
    onSwitchMode(m);
    if (m === "narrator") setTimeout(triggerNarrator, 50);
    if (m === "qa") setTimeout(openRealtimeWS, 50);
  };

  const handleClose = () => {
    hardStopMedia();
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
    onClose();
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
      setMessages(qaCaptureMessages(athlete));
      return;
    }
    if (mode === "narrator") triggerNarrator();
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
        </div>
        <button ref={closeButtonRef} type="button" className="close-button" onClick={handleClose}>Close <span aria-hidden="true">✕</span></button>
      </div>

      <div className="modal-layout">
        <div className="twin-rail">
          <div className="avatar-wrap">
            <div className="avatar-ring outer ring-b" aria-hidden="true" />
            <div className="avatar-ring mid ring-a" aria-hidden="true" />
            <div className="avatar-ring inner ring-a" aria-hidden="true" />
            <div className={loading ? "avatar-core loading" : "avatar-core"}>
              {athlete.headshot && (
                <img className="avatar-headshot" src={athlete.headshot} alt={`${athlete.name} headshot`} />
              )}
              <span className="avatar-initials">{athlete.initials}</span>
            </div>
          </div>
          <div className="twin-state">
            <div className={loading ? "twin-state-label loading" : "twin-state-label"} aria-live="polite">
              {loading ? <><span aria-hidden="true">◉ </span>Speaking...</> : <><span aria-hidden="true">● </span>Ready</>}
            </div>
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
          <div className="messages" aria-live={mode === "qa" ? "polite" : "off"} aria-busy={loading}>
              {messages.length === 0 && !loading && !voiceIsActive && (
                mode === "qa" ? (
                  <div className="qa-empty-state">
                    <div className="empty-title">Ask from the verified archive</div>
                    <div className="empty-meta">Every response draws from documented moments, cited sources, and verified records.</div>
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

            {messages.map((msg, i) => {
              if (mode === "qa") return null;
              return (
              <div key={i} className={`${mode === "narrator" ? "message narrator-beat" : "message"}${msg.prewarmed ? " prewarm-fade" : ""}`}>
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
                      <div className={msg.error ? "assistant-text stream-error" : "assistant-text"}>
                        {msg.content}
                        {msg.streaming && <span className="stream-cursor" aria-hidden="true">|</span>}
                      </div>
                      {!msg.error && <div className="verified-meta"><span aria-hidden="true">✓ </span>Verified twin response</div>}
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
            )})}

            {loading && mode !== "qa" && (
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
            <div className="modal-composer voice-dock">
              <div className="dock-input-wrap">
                <input
                  id="twin-question-input"
                  ref={inputRef}
                  className="twin-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendQA())}
                  placeholder="Ask from the verified archive"
                  disabled={loading}
                  aria-label={`Ask ${athlete.name} a question`}
                />
              </div>
              <button
                type="button"
                className={`voice-button ${voiceState}`}
                onClick={startVoiceInteraction}
                disabled={loading && voiceState !== "speaking"}
                aria-label={voiceState === "speaking" ? "Stop voice playback" : "Start voice interaction"}
              >
                <span aria-hidden="true">{voiceState === "speaking" ? "■" : "🎙"}</span>
              </button>
              <button
                type="button"
                className={voiceIsActive ? "send-icon-button stop-mode" : "send-icon-button"}
                onClick={voiceIsActive ? stopVoiceInteraction : () => sendQA()}
                disabled={!voiceIsActive && (loading || !input.trim())}
                aria-label={voiceIsActive ? "Exit voice mode" : "Send message"}
              >
                <span aria-hidden="true">{voiceIsActive ? "×" : "→"}</span>
              </button>
            </div>
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
