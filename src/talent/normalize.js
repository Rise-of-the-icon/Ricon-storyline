/**
 * Normalize a talent pack: assign chapter numbers, beat numbers,
 * ensure media arrays, and compile chat matchers.
 * @param {import("./types.js").TalentStoryPack} pack
 */
export function normalizeTalentPack(pack) {
  let beatNo = 0;
  const eras = (pack.eras || []).map((era, index) => {
    const id = era.id || slugify(era.label);
    const chapterNo = era.chapterNo || String(index + 1).padStart(2, "0");
    const beats = (era.beats || []).map((beat) => {
      beatNo += 1;
      return {
        ...beat,
        id: beat.id || slugify(beat.title),
        no: String(beatNo).padStart(2, "0"),
        mediaItems: [].concat(beat.mediaItems || []),
        askKey: beat.askKey ?? beat.ask,
      };
    });
    return {
      ...era,
      id,
      chapterNo,
      media: era.media || null,
      beats,
    };
  });

  const matchers = (pack.chat?.matchers || []).map((m) => ({
    id: m.id,
    pattern: m.pattern instanceof RegExp ? m.pattern : new RegExp(m.pattern, "i"),
  }));

  const totalMoments = eras.reduce((sum, era) => sum + era.beats.length, 0);

  return {
    ...pack,
    tags: pack.tags || [],
    stats: pack.stats || [],
    verifiedLabel: pack.verifiedLabel || "Verified by RICON",
    verificationNote: pack.verificationNote || "",
    twin: {
      available: pack.twin?.available !== false,
      modes: pack.twin?.modes?.length ? pack.twin.modes : ["narrator", "ask"],
      askCtaLabel: pack.twin?.askCtaLabel || `Ask ${pack.displayName} a question`,
      narratorLabel: pack.twin?.narratorLabel || "Narrator",
      bannerTitle: pack.twin?.bannerTitle || "Digital Twin Available",
      bannerBody:
        pack.twin?.bannerBody ||
        `Interact with ${pack.displayName}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.`,
    },
    eras,
    totalMoments,
    chat: {
      ...pack.chat,
      matchers,
      recovery: pack.chat?.recovery || [],
    },
  };
}

export function slugify(label = "") {
  return String(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Match a user prompt against pack chat matchers / responses.
 * @param {ReturnType<typeof normalizeTalentPack>} pack
 * @param {string} text
 */
export function matchTalentResponse(pack, text) {
  const t = text.toLowerCase();
  for (const matcher of pack.chat.matchers) {
    if (matcher.pattern.test(t)) {
      const response = pack.chat.responses[matcher.id];
      if (response) return { id: matcher.id, ...response };
    }
  }
  return { id: "uncertain", ...pack.chat.uncertain };
}
