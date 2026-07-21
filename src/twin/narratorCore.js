export const API_BASE = import.meta.env.VITE_TWIN_API_URL || "https://ricon-storyline-production.up.railway.app";
export const WS_BASE = (import.meta.env.VITE_TWIN_API_URL || "https://ricon-storyline-production.up.railway.app")
  .replace("https://", "wss://").replace("http://", "ws://");

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export const STREAM_ERROR_MESSAGE = "This moment is unavailable from the verified archive. Try a different question.";
export const TWIN_SERVICE_UNAVAILABLE_MESSAGE =
  "Twin service is unavailable. Start the backend or check VITE_TWIN_API_URL.";
export const NARRATOR_VOICE_CACHE_KEY = "ricon:narrator-voice-cache:v6";
export const NARRATOR_MODEL_ID = "inworld-tts-2";
export const RESEARCH_VOICE_CACHE_VERSION = 1;

export const NARRATOR_VOICE_ID_BY_MERGE_KEY = {
  "david west": "default--z5zasdfwci5ofrt-gmsjw__test",
  "tom hoover": "default--z5zasdfwci5ofrt-gmsjw__tom_hoover",
  "walt liquor": "default--z5zasdfwci5ofrt-gmsjw__walt",
  "walt taylor": "default--z5zasdfwci5ofrt-gmsjw__walt",
  "walt taylor aka walt liquor": "default--z5zasdfwci5ofrt-gmsjw__walt",
};

export const NARRATOR_VOICE_ID_BY_TWIN_ID = {
  west_d: "default--z5zasdfwci5ofrt-gmsjw__test",
  hoover_t: "default--z5zasdfwci5ofrt-gmsjw__tom_hoover",
  liquor_w: "default--z5zasdfwci5ofrt-gmsjw__walt",
  "2aa2a157-7849-44a7-b695-f715c39d5bd7": "default--z5zasdfwci5ofrt-gmsjw__test",
  "c28f8898-da88-4887-b1e9-2d61396a91b9": "default--z5zasdfwci5ofrt-gmsjw__tom_hoover",
  "walt-liquor-research": "default--z5zasdfwci5ofrt-gmsjw__walt",
};

export const clean = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
export const STOP_WORDS = new Set(["what", "when", "where", "your", "were", "with", "that", "this", "from", "about", "moment"]);

export const athleteKey = (athlete) => clean(`${athlete?.id || ""} ${athlete?.name || ""}`).replace(/\s+/g, " ").trim();
export const isDavidWest = (athlete) =>
  athlete?.id === "west_d" ||
  athleteKey(athlete).includes("west d") ||
  athleteKey(athlete).includes("david west");
export const isTomHoover = (athlete) =>
  athlete?.id === "hoover_t" ||
  athlete?.id === "c28f8898-da88-4887-b1e9-2d61396a91b9" ||
  athleteKey(athlete).includes("tom hoover");
export const isWaltLiquor = (athlete) => {
  const key = athleteKey(athlete);
  return (
    athlete?.id === "liquor_w" ||
    athlete?.id === "walt-liquor-research" ||
    key.includes("walt liquor") ||
    key.includes("walt taylor")
  );
};

export async function checkTwinApiHealth() {
  try {
    const response = await fetch(`${API_BASE.replace(/\/$/, "")}/health`, {
      method: "GET",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
export const signatureMoment = (athlete) => {
  return [...athlete.moments].reverse().find(moment => moment.type === "iconic" || moment.type === "championship")
    || athlete.moments[athlete.moments.length - 1];
};

export const pickMoment = (athlete, query, fallbackIndex = 0) => {
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

export const statLine = (athlete) => athlete.stats.map(s => `${s.v} ${s.l}`).join(", ");

export const roleContext = (athlete) => athlete.cat === "music"
  ? `${athlete.genreLabel} across ${athlete.years}, with documented works including ${athlete.credits}`
  : `${athlete.position} across ${athlete.years}, with ${athlete.teams}`;

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const narratorMomentBody = (athlete, moment) => {
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

export const isStudioAnthropicQaAthlete = (athlete) => {
  const key = athleteKey(athlete);
  return athlete?.id === "west_d" ||
    athlete?.id === "hoover_t" ||
    athlete?.id === "liquor_w" ||
    athlete?.id === "2aa2a157-7849-44a7-b695-f715c39d5bd7" ||
    athlete?.id === "c28f8898-da88-4887-b1e9-2d61396a91b9" ||
    athlete?.id === "walt-liquor-research" ||
    key.includes("david west") ||
    key.includes("tom hoover") ||
    key.includes("walt liquor") ||
    key.includes("walt taylor");
};

export const narratorBeats = [
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

export const buildDavidNarratorMessage = (athlete, beatIndex) => {
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

export const buildTomNarratorMessage = (athlete, beatIndex) => {
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

export const buildWaltNarratorMessage = (athlete, beatIndex) => {
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

export const buildNarratorMessage = (athlete, beatIndex) => {
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

export const answerQuestion = (athlete, question) => {
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

export const streamText = async (text, onToken) => {
  const tokens = text.match(/\S+\s*/g) || [];
  for (const token of tokens) {
    await wait(28);
    onToken(token);
  }
};

export const qaCaptureMessages = (athlete) => [
  { role: "user", content: "What day is it?" },
  { role: "assistant", content: answerQuestion(athlete, "What day is it?") },
  { role: "user", content: "What about basketball cleats?" },
  { role: "assistant", content: answerQuestion(athlete, "What about basketball cleats?") },
  { role: "user", content: "I love you." },
  { role: "assistant", content: answerQuestion(athlete, "I love you.") },
];

export const voicePrompts = [
  { icon: "▣", label: "Relive a defining moment", prompt: "What was your defining moment?" },
  { icon: "◌", label: "Ask about the mindset", prompt: "What mindset separated you from everyone else?" },
  { icon: "◇", label: "Explain the legacy", prompt: "How should people understand your legacy?" },
];

export function narratorVoiceIdForAthlete(athlete) {
  const byId = NARRATOR_VOICE_ID_BY_TWIN_ID[athlete?.id];
  if (byId) return byId;
  const key = clean(athlete?.name || "").replace(/\s+/g, " ").trim();
  if (key.includes("walt liquor") || key.includes("walt taylor")) {
    return NARRATOR_VOICE_ID_BY_MERGE_KEY["walt liquor"];
  }
  if (key.includes("david west")) return NARRATOR_VOICE_ID_BY_MERGE_KEY["david west"];
  if (key.includes("tom hoover")) return NARRATOR_VOICE_ID_BY_MERGE_KEY["tom hoover"];
  return (
    NARRATOR_VOICE_ID_BY_MERGE_KEY[key] ||
    import.meta.env.VITE_WALT_VOICE_ID ||
    "default--z5zasdfwci5ofrt-gmsjw__walt"
  );
}

export function narratorStaticAudioUrl(athlete, beatIndex) {
  const key = athleteKey(athlete);
  if (key.includes("david west") || athlete?.id === "west_d") {
    return `/narrator-audio/david-west-${beatIndex}.mp3`;
  }
  if (key.includes("tom hoover") || athlete?.id === "hoover_t") {
    return `/narrator-audio/tom-hoover-${beatIndex}.mp3`;
  }
  if (key.includes("walt liquor") || key.includes("walt taylor") || athlete?.id === "liquor_w") {
    return `/narrator-audio/walt-liquor-${beatIndex}.mp3`;
  }
  return "";
}

export function narratorCacheId({ athleteName, beatIndex, text, voiceId }) {
  const textPart = btoa(unescape(encodeURIComponent(text))).slice(0, 64);
  return `${clean(athleteName).trim()}::${beatIndex}::${voiceId}::${textPart}`;
}

export async function researchVoiceCacheKey({ text, voiceId, emotionFamily = "Character", modelId = NARRATOR_MODEL_ID }) {
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

export function researchVoiceCacheUrl(cacheKey) {
  if (!cacheKey) return "";
  return `${API_BASE.replace(/\/$/, "")}/static/research_voice/${cacheKey}.mp3`;
}

export function readNarratorCache() {
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

export function writeNarratorCache(cache) {
  try {
    window.localStorage.setItem(NARRATOR_VOICE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // best-effort cache only
  }
}

export async function synthesizeNarratorAudioToCacheForAthlete(athlete, beatIndex, text) {
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

export function base64ToAudioUrl(audioBase64) {
  const bytes = Uint8Array.from(atob(audioBase64), (ch) => ch.charCodeAt(0));
  const blob = new Blob([bytes], { type: "audio/mp3" });
  return URL.createObjectURL(blob);
}

export const OPENING_NARRATIVE_PROMPT = "Begin the story of your career from the beginning, in one paragraph.";

export const buildNarratorMessages = (athlete) =>
  narratorBeats.map((_, index) => buildNarratorMessage(athlete, index));

export const buildOpeningNarratorMessages = (athlete, prewarmedNarrative = null) => {
  const firstBeat = buildNarratorMessage(athlete, 0);
  return [prewarmedNarrative ? { ...firstBeat, prewarmed: true } : firstBeat];
};

export const prewarmNarratorAudio = (athlete) => {
  const beats = buildNarratorMessages(athlete);
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
