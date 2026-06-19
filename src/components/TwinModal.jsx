import { useState, useEffect, useId, useRef } from "react";
const API_BASE = import.meta.env.VITE_TWIN_API_URL || "https://ricon-storyline-production.up.railway.app";
const WS_BASE  = (import.meta.env.VITE_TWIN_API_URL || "https://ricon-storyline-production.up.railway.app")
  .replace("https://", "wss://").replace("http://", "ws://");

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const STREAM_ERROR_MESSAGE = "This moment is unavailable from the verified archive. Try a different question.";
const NARRATOR_VOICE_CACHE_KEY = "ricon:narrator-voice-cache:v6";
const NARRATOR_MODEL_ID = "inworld-tts-2";
const RESEARCH_VOICE_CACHE_VERSION = 1;

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

const athleteKey = (athlete) => clean(`${athlete?.id || ""} ${athlete?.name || ""}`).replace(/\s+/g, " ").trim();
const isDavidWest = (athlete) => athleteKey(athlete).includes("west d") || athleteKey(athlete).includes("david west");
const isTomHoover = (athlete) => athleteKey(athlete).includes("tom hoover");
const isWaltLiquor = (athlete) => athleteKey(athlete).includes("walt liquor");

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

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const narratorMomentBody = (athlete, moment) => {
  const fullName = athlete?.name || "";
  const aliases = new Set([fullName]);
  if (fullName.includes("(")) {
    aliases.add(fullName.replace(/\s*\([^)]*\)/g, "").trim());
    const aka = fullName.match(/\((?:aka\s+)?([^)]*)\)/i)?.[1]?.trim();
    if (aka) aliases.add(aka);
  }

  let text = moment?.body || "";
  aliases.forEach(alias => {
    if (!alias) return;
    text = text
      .replace(new RegExp(`${escapeRegExp(alias)}'s`, "gi"), "my")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+was\\s+given\\b`, "gi"), "I was given")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+was\\s+named\\b`, "gi"), "I was named")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+was\\s+selected\\b`, "gi"), "I was selected")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+attends\\b`, "gi"), "I attended")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+plays\\b`, "gi"), "I played")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+enters\\b`, "gi"), "I entered")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+wins\\b`, "gi"), "I won")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+becomes\\b`, "gi"), "I became")
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b\\s+\\w+`, "gi"), match => {
        const verb = match.split(/\s+/).pop();
        return verb ? `I ${verb}` : "I";
      })
      .replace(new RegExp(`\\b${escapeRegExp(alias)}\\b`, "gi"), "I");
  });

  return text
    .replace(/\bI,\s+.*?\bplays\b/gi, "I played")
    .replace(/\bI,\s+.*?\battends\b/gi, "I attended")
    .replace(/\bI,\s+.*?\bwins\b/gi, "I won")
    .replace(/\bgive\s+Walt\s+room\b/gi, "give me room")
    .replace(/\bHe\b/g, "I")
    .replace(/\bhe\b/g, "I")
    .replace(/\bHis\b/g, "My")
    .replace(/\bhis\b/g, "my")
    .replace(/\bHim\b/g, "Me")
    .replace(/\bhim\b/g, "me")
    .replace(/\bI was given my first opportunity\b/g, "I got my first opportunity")
    .replace(/\bI was named\b/g, "I was named")
    .trim();
};

const isStudioAnthropicQaAthlete = (athlete) => {
  const key = athleteKey(athlete);
  return athlete?.id === "west_d" ||
    athlete?.id === "2aa2a157-7849-44a7-b695-f715c39d5bd7" ||
    athlete?.id === "c28f8898-da88-4887-b1e9-2d61396a91b9" ||
    athlete?.id === "walt-liquor-research" ||
    key.includes("david west") ||
    key.includes("tom hoover") ||
    key.includes("walt liquor");
};

const narratorBeats = [
  {
    media: [{ title: "Draft Night Archive", meta: "1984 · Source footage placeholder" }],
    getMoment: (athlete) => athlete.moments[0],
    line: (athlete) => {
      const first = athlete.moments[0];
      const signature = athlete.moments.find(m => m.type === "championship" || m.type === "record") || athlete.moments[1] || first;
      return `I am ${athlete.name}. ${athlete.years} was the arc, but ${first.y} is where my story first broke through. ${narratorMomentBody(athlete, first)} From there, I kept building evidence through the work itself. ${signature.y}: ${signature.title}. I still point to that moment because it carries the weight of what I was trying to do.`;
    },
  },
  {
    media: [],
    getMoment: (athlete) => athlete.moments[Math.min(2, athlete.moments.length - 1)],
    line: (athlete) => {
      const turn = athlete.moments[Math.min(2, athlete.moments.length - 1)];
      const title = athlete.moments.find(m => m.type === "championship") || turn;
      return `The turning point was not only one play, one song, or one headline. It was the moment I understood I could shape the story through what I did next. In ${turn.y}, ${turn.title} became proof of that. Then ${title.y} arrived: ${title.title}. I had to turn talent into a standard, that standard into pressure, and that pressure into legacy.`;
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
      return `Legacy is what remains after the numbers stop moving. My line reads like this: ${statLine(athlete)}. But those facts only matter because I lived the moments behind them. ${final.y}: ${final.title}. ${narratorMomentBody(athlete, final)} That is the part I want people to hear when they listen back.`;
    },
  },
];

const buildDavidNarratorMessage = (athlete, beatIndex) => {
  const beat = narratorBeats[beatIndex % narratorBeats.length];
  const moments = athlete?.moments || [];
  const moment = beat.getMoment(athlete);
  const lines = [
    "I am David West. My story starts at Xavier, where the work became visible before the league ever called my name. By 2003, I was the AP National Player of the Year, my jersey was already retired, and New Orleans took me eighteenth overall. I entered the league knowing exactly what I valued: preparation, intelligence, and earning every inch.",
    "The middle of my career was about proving that substance still matters. I became an All-Star, battled through the New Orleans and Indiana chapters, and played the game with a physicality and patience that reflected who I was. When I walked away from money to chase something bigger, that was not a stunt. That was conviction.",
    "Legacy, to me, is not just two championships or fifteen seasons. It is the choices behind the record: what I gave up, what I stood for, and how I carried the work when nobody was measuring it. I won in Golden State, but the meaning was built long before the rings. That is the part I want people to understand.",
  ];
  return {
    role: "assistant",
    content: lines[beatIndex % lines.length],
    moment: moment || moments[beatIndex % Math.max(moments.length, 1)],
    media: beat.media,
  };
};

const buildTomNarratorMessage = (athlete, beatIndex) => {
  const beat = narratorBeats[beatIndex % narratorBeats.length];
  const moments = athlete?.moments || [];
  const moment = beat.getMoment(athlete);
  const lines = [
    "I am Tom Hoover. My story starts in Washington, D.C., and it moved through Villanova, where I learned how much the game asks from a big man. I was 6-foot-9, but height was only the beginning. I had to build timing, toughness, and patience, because every step after college demanded more than potential.",
    "The next chapter was about staying with the work. I played through the professional basketball landscape of the 1960s, when opportunity was never simple and every roster spot had to be earned. Wilmington became part of that story, and the EPBL titles there mattered because they came through repetition, trust, and a team that knew how to win.",
    "When people look back at my legacy, I want them to see more than a transaction line or a box score. I was part of an era where the game was still finding its shape, and I kept showing up inside that change. The meaning is in the persistence: the college years, the pro years, the championships, and the proof that the work held.",
  ];
  return {
    role: "assistant",
    content: lines[beatIndex % lines.length],
    moment: moment || moments[beatIndex % Math.max(moments.length, 1)],
    media: beat.media,
  };
};

const buildWaltNarratorMessage = (athlete, beatIndex) => {
  const beat = narratorBeats[beatIndex % narratorBeats.length];
  const moments = athlete?.moments || [];
  const moment = beat.getMoment(athlete);
  const lines = [
    "I am Walt Taylor, also known as Walt Liquor. My breakthrough came in December 2020, when I got my first shot at music supervising a major television production. I had not done it before, but I stepped into the room like I belonged there. That first chance forced me to trust my ear, my instincts, and the sound I was bringing with me.",
    "The turning point was learning how to turn pressure into taste. A producer heard something in my choices and gave me room to fix mistakes before they became visible. That room mattered. It let me shape the music around the show instead of just filling space, and it taught me that an unconventional sound can become the thing that makes a project breathe.",
    "When people talk about my story, I want them to understand that it was not built from a perfect plan. It was built from a chance, a little nerve, and the willingness to make the sound work under pressure. All The Queen's Men became the proof point, but the real legacy is the lesson: sometimes you grow into the job by taking it seriously before anyone is sure you can do it.",
  ];
  return {
    role: "assistant",
    content: lines[beatIndex % lines.length],
    moment: moment || moments[beatIndex % Math.max(moments.length, 1)],
    media: beat.media,
  };
};

const buildNarratorMessage = (athlete, beatIndex) => {
  if (isDavidWest(athlete)) return buildDavidNarratorMessage(athlete, beatIndex);
  if (isTomHoover(athlete)) return buildTomNarratorMessage(athlete, beatIndex);
  if (isWaltLiquor(athlete)) return buildWaltNarratorMessage(athlete, beatIndex);
  const beat = narratorBeats[beatIndex % narratorBeats.length];
  const moment = beat.getMoment(athlete);
  return {
    role: "assistant",
    content: beat.line(athlete),
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

  if (isStudioAnthropicQaAthlete(athlete) && q.includes("legacy")) {
    const path = athlete.cat === "music" ? athlete.credits : athlete.teams;
    return `I want people to understand my legacy through the choices I made and the work I put into ${path || "my career"}. The numbers and dates matter, but they only tell part of it. What I hope lasts is the way I carried myself, what I stood for, and the impact I had on the people who were paying attention.`;
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

function narratorStaticAudioUrl(athlete, beatIndex) {
  const key = athleteKey(athlete);
  if (key.includes("david west")) return `/narrator-audio/david-west-${beatIndex}.mp3`;
  if (key.includes("tom hoover")) return `/narrator-audio/tom-hoover-${beatIndex}.mp3`;
  if (key.includes("walt liquor")) return `/narrator-audio/walt-liquor-${beatIndex}.mp3`;
  return "";
}

function narratorCacheId({ athleteName, beatIndex, text, voiceId }) {
  const textPart = btoa(unescape(encodeURIComponent(text))).slice(0, 64);
  return `${clean(athleteName).trim()}::${beatIndex}::${voiceId}::${textPart}`;
}

async function researchVoiceCacheKey({ text, voiceId, emotionFamily = "Character", modelId = NARRATOR_MODEL_ID }) {
  if (!window.crypto?.subtle) return "";
  const payload = {
    cache_version: RESEARCH_VOICE_CACHE_VERSION,
    emotion_family: emotionFamily,
    model_id: modelId,
    text: text.trim(),
    voice_id: voiceId.trim(),
  };
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await window.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function researchVoiceCacheUrl(cacheKey) {
  if (!cacheKey) return "";
  return `${API_BASE.replace(/\/$/, "")}/static/research_voice/${cacheKey}.mp3`;
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

async function synthesizeNarratorAudioToCacheForAthlete(athlete, beatIndex, text) {
  const voiceId = narratorVoiceIdForAthlete(athlete);
  const cacheKey = narratorCacheId({
    athleteName: athlete.name,
    beatIndex,
    text,
    voiceId,
  });
  const cache = readNarratorCache();
  if (cache[cacheKey]?.audioBase64) return cache[cacheKey].audioBase64;

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
    if (!response.ok) return null;
    const payload = await response.json();
    const audioBase64 = payload.audio_base64 || null;
    if (!audioBase64) return null;
    cache[cacheKey] = {
      audioBase64,
      generatedAtISO: new Date().toISOString(),
    };
    writeNarratorCache(cache);
    return audioBase64;
  } catch {
    return null;
  }
}

function base64ToAudioUrl(audioBase64) {
  const bytes = Uint8Array.from(atob(audioBase64), (ch) => ch.charCodeAt(0));
  const blob = new Blob([bytes], { type: "audio/mp3" });
  return URL.createObjectURL(blob);
}

export const OPENING_NARRATIVE_PROMPT = "Begin the story of your career from the beginning, in one paragraph.";

export const prewarmNarratorAudio = (athlete) => {
  const beats = narratorBeats.map((_, index) => buildNarratorMessage(athlete, index));
  void (async () => {
    await synthesizeNarratorAudioToCacheForAthlete(athlete, 0, beats[0].content);
    await Promise.all(
      beats.slice(1).map((beat, offset) =>
        synthesizeNarratorAudioToCacheForAthlete(athlete, offset + 1, beat.content)
      )
    );
  })();
  return beats;
};

export const prewarmOpeningNarrative = async (athlete) => {
  const beats = prewarmNarratorAudio(athlete);
  return {
    ...beats[0],
    prompt: OPENING_NARRATIVE_PROMPT,
    prewarmed: true,
  };
};

export default function TwinModal({ athlete, mode, onClose, onSwitchMode, prewarmedNarrative }) {
  const figmaTwinMode = new URLSearchParams(window.location.search).get("figmaTwin");
  const initialMessages = () => {
    if (figmaTwinMode === "narrator") {
      return narratorBeats.map((_, index) => buildNarratorMessage(athlete, index));
    }
    if (figmaTwinMode === "qaThread") return qaCaptureMessages(athlete);
    if (mode === "narrator") {
      return narratorBeats.map((_, index) => {
        const beat = buildNarratorMessage(athlete, index);
        return index === 0 && prewarmedNarrative ? { ...beat, prewarmed: true } : beat;
      });
    }
    return [];
  };
  const [messages, setMessages] = useState(initialMessages);
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
  const mediaSessionRef = useRef(0);
  const mountedRef = useRef(false);
  const switchModeTimerRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

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

  const stopVoicePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause?.();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
      audioRef.current.load?.();
      audioRef.current = null;
    }
    stopStreamingAudio();
    setVoiceState("idle");
    setVoiceSessionActive(false);
  };

  const currentMediaSession = () => mediaSessionRef.current;
  const isMediaSessionActive = (session) => mountedRef.current && session === mediaSessionRef.current;
  const invalidateMediaSession = () => {
    mediaSessionRef.current += 1;
    pendingNarratorAutoplayRef.current = false;
    pendingQuestionRef.current = null;
    if (switchModeTimerRef.current) {
      window.clearTimeout(switchModeTimerRef.current);
      switchModeTimerRef.current = null;
    }
  };

  const playAudioBase64 = (audioBase64, session = currentMediaSession()) => {
    if (!audioBase64 || !isMediaSessionActive(session)) return false;
    stopVoicePlayback();
    if (!isMediaSessionActive(session)) return false;
    const src = base64ToAudioUrl(audioBase64);
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onplay = () => {
      if (isMediaSessionActive(session)) setVoiceState("speaking");
    };
    audio.onended = () => {
      URL.revokeObjectURL(src);
      if (isMediaSessionActive(session)) {
        setVoiceState("idle");
        setVoiceSessionActive(false);
      }
    };
    audio.onerror = () => {
      URL.revokeObjectURL(src);
      if (isMediaSessionActive(session)) {
        setVoiceState("idle");
        setVoiceSessionActive(false);
      }
    };
    audio.play().catch(() => {
      URL.revokeObjectURL(src);
      if (isMediaSessionActive(session)) {
        setVoiceState("idle");
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
      if (isMediaSessionActive(session)) setVoiceState("idle");
      if (audioRef.current === audio) audioRef.current = null;
    };
    audio.onerror = () => {
      if (isMediaSessionActive(session)) setVoiceState("idle");
      if (audioRef.current === audio) audioRef.current = null;
    };
    try {
      await audio.play();
      return isMediaSessionActive(session);
    } catch {
      if (audioRef.current === audio) audioRef.current = null;
      if (isMediaSessionActive(session)) setVoiceState("idle");
      return false;
    }
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

  const generateProfileQaAnswer = async (question) => {
    if (!isStudioAnthropicQaAthlete(athlete)) return null;
    try {
      const response = await fetch(`${API_BASE.replace(/\/$/, "")}/api/twin/generate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, profile: athlete }),
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return {
        text: payload.text || "",
      };
    } catch {
      return null;
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

  const playNonStreamingQaAnswer = async (question, assistantIndex) => {
    const session = currentMediaSession();
    const generated = await generateProfileQaAnswer(question);
    if (!isMediaSessionActive(session)) return;
    const reply = generated?.text || answerQuestion(athlete, question);
    setMessages(p => p.map((m, i) =>
      i === assistantIndex ? { ...m, content: reply, streaming: false } : m
    ));
    setLoading(false);
    const audioBase64 = await synthesizeAthleteVoice(reply, "Character");
    if (!isMediaSessionActive(session)) return;
    if (audioBase64) {
      playAudioBase64(audioBase64, session);
      return;
    }
    setMessages(p => p.map((m, i) =>
      i === assistantIndex
        ? { role: "assistant", content: STREAM_ERROR_MESSAGE, streaming: false, error: true }
        : m
    ));
    setVoiceState("idle");
    setVoiceSessionActive(false);
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
      void playNonStreamingQaAnswer(question, idx);
      return;
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
      mountedRef.current = false;
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
    setLoading(true);
    await wait(620);
    if (!isMediaSessionActive(session)) return;
    const nextIndex = narratorIndex.current >= narratorBeats.length - 1 ? 0 : narratorIndex.current + 1;
    narratorIndex.current = nextIndex;
    setActiveBeat(nextIndex);
    const nextBeat = messages[nextIndex] || await generateNarratorMessage(nextIndex);
    setMessages(p => p[nextIndex] ? p : [...p, nextBeat]);
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
    setLoading(false);
    if (targetBeat) playNarratorAudio(index, targetBeat.content);
  };

  const sendQA = (questionOverride) => {
    const question = (questionOverride ?? input).trim();
    if (!question || loading) return;

    invalidateMediaSession();
    setMessages(p => [...p, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    stopVoicePlayback();
    setVoiceState("thinking");

    const assistantIndex = messages.length + 1;
    currentMsgRef.current = { index: null, buffer: "", audioStarted: false, question: null };
    setMessages(p => [...p, { role: "assistant", content: "", streaming: true }]);

    currentMsgRef.current = { index: assistantIndex, buffer: "", audioStarted: false, question };
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
    if (loading || voiceState === "listening" || voiceState === "thinking") return;

    if (voiceState === "speaking") {
      stopVoicePlayback();
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
    const session = currentMediaSession();
    pendingNarratorAutoplayRef.current = false;
    modeRef.current = m;
    const narratorMessages = m === "narrator"
      ? narratorBeats.map((_, index) => buildNarratorMessage(athlete, index))
      : [];
    setMessages(narratorMessages);
    setVoiceState("idle");
    setVoiceSessionActive(false);
    setLoading(false);
    onSwitchMode(m);
    switchModeTimerRef.current = window.setTimeout(() => {
      switchModeTimerRef.current = null;
      if (!isMediaSessionActive(session)) return;
      if (m === "narrator") {
        pendingNarratorBeatRef.current = 0;
        pendingNarratorAutoplayRef.current = true;
        void preGenerateNarratorVoices(narratorMessages);
      }
      if (m === "qa") openRealtimeWS();
    }, 50);
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
      return;
    }
    if (figmaTwinMode === "qaThread") {
      return;
    }
    if (mode === "narrator") {
      pendingNarratorBeatRef.current = 0;
      pendingNarratorAutoplayRef.current = true;
      void preGenerateNarratorVoices(messages.length > 0
        ? messages
        : narratorBeats.map((_, index) => buildNarratorMessage(athlete, index)));
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
              const hideQaAnswerText = mode === "qa" && msg.role === "assistant" && !msg.error;
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
                        {!hideQaAnswerText && msg.content}
                        {!hideQaAnswerText && msg.streaming && <span className="stream-cursor" aria-hidden="true">|</span>}
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
