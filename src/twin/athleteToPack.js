import { normalizeTalentPack, slugify } from "../talent/normalize.js";
import waltPack from "../talent/packs/walt.js";

const WALT_IDS = new Set(["liquor_w", "walt-liquor-research", "walt"]);

function isWaltAthlete(athlete) {
  const id = String(athlete?.id || "").toLowerCase();
  const name = String(athlete?.name || "").toLowerCase();
  return WALT_IDS.has(id) || name.includes("walt liquor") || name.includes("walt taylor");
}

function liveTrust(athlete) {
  return {
    consent: `Built with ${athlete.name}'s participation for this verified twin.`,
    sourceScope: "Verified timeline moments and documented career records.",
    limit: "Not a live person and not verified beyond loaded material.",
    simulation: "Live Inworld voice and Railway-backed twin responses.",
    sourceLabel: "Verified twin archive",
  };
}

function liveStatusCopy() {
  return {
    idle: "Ready",
    submitted: "Request received",
    preparing: "Checking records",
    streaming: "Speaking",
    stopped: "Response stopped — partial answer preserved",
    complete: "Response delivered",
    uncertain: "Outside archive scope",
    failed: "Could not complete response",
  };
}

function synthesizePackFromAthlete(athlete) {
  const moments = athlete.moments || [];
  const eras = moments.map((moment, index) => {
    const id = slugify(`${moment.era || moment.title || "chapter"}-${moment.y || index}`);
    const beatId = slugify(`${moment.title || "moment"}-${moment.y || index}`);
    return {
      id,
      label: moment.era || moment.title || `Chapter ${index + 1}`,
      year: String(moment.y || ""),
      chapterNo: String(index + 1).padStart(2, "0"),
      media: {
        type: "texture",
        tone: index % 2 === 0 ? "studio" : "archival",
        mark: String(moment.y || index + 1),
        label: "Chapter scene",
        title: moment.title,
        purpose: moment.era || moment.title,
        caption: moment.body,
      },
      beats: [
        {
          id: beatId,
          title: moment.title,
          setup: moment.body,
          tape: moment.source || moment.src || "Verified archive moment",
          narr: moment.body,
          askKey: index === 0 ? "opening" : undefined,
          mediaItems: (moment.media || []).map((item, mediaIndex) => ({
            id: `${beatId}-media-${mediaIndex}`,
            type: "texture",
            tone: "archival",
            mark: "Clip",
            label: item.title,
            title: item.title,
            caption: item.meta || "",
            size: "wide",
          })),
        },
      ],
    };
  });

  const firstMoment = moments[0];
  const displayName = athlete.name?.split("(")[0]?.trim() || athlete.name;

  return {
    id: athlete.id,
    displayName,
    initial: athlete.initials || displayName.slice(0, 1),
    portraitSrc: athlete.headshot || "",
    tags: [athlete.cat === "music" ? athlete.genreLabel : athlete.leagueLabel].filter(Boolean),
    stats: (athlete.stats || []).map((s) => ({ value: s.v, label: s.l })),
    verifiedLabel: "Verified by RICON",
    verificationNote: "Built from vetted timeline material and verified records.",
    hook: {
      quoteParts: [{ text: athlete.tagline || `The verified story of ${displayName}.` }],
      attribution: `${displayName} · verified twin`,
      // Distinct from the quote — never reuse tagline here (avoids triple repetition).
      subcopy: "Explore the verified timeline, then ask the twin.",
    },
    twin: {
      available: true,
      modes: ["narrator", "ask"],
      askCtaLabel: "Ask a question",
      narratorLabel: "Narrator",
      bannerTitle: "Digital Twin Available",
      bannerBody: `Interact with ${displayName}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.`,
    },
    trust: liveTrust(athlete),
    statusCopy: liveStatusCopy(),
    eras,
    chat: {
      responses: {},
      questions: {
        opening: firstMoment
          ? `What happened in ${firstMoment.y} with ${firstMoment.title}?`
          : "What should people understand about your story?",
      },
      suggested: [
        { id: "moment", label: "Defining moment", q: "What was your defining moment?" },
        { id: "mindset", label: "Mindset", q: "What mindset separated you from everyone else?" },
        { id: "legacy", label: "Legacy", q: "How should people understand your legacy?" },
      ],
      uncertain: {
        kind: "uncertain",
        chapter: "Verified archive",
        text: "That's beyond what I can speak to with certainty from the verified archive.",
      },
      matchers: [],
      recovery: [],
    },
    copy: {
      empty: "Every response draws from documented moments in the timeline.",
      disclose: "Responses are generated from verified twin material with live voice.",
      composerPlaceholder: "Ask a question…",
      composerAriaLabel: `Ask ${displayName} a question`,
      tapeLabel: "Source tape",
      footer: "",
      storyTrust: "Guided narrator uses verified voice chapters",
      timelineAriaLabel: `${displayName} career timeline`,
      chatEyebrow: "",
      verifiedBadge: "Verified",
      outsideCue: "Outside the verified archive for this twin.",
      mediaProvenance: "Illustrative media placeholder until cleared assets are attached.",
    },
  };
}

/**
 * Map an Untitled athlete profile to a Ricon talent pack for the twin shell.
 */
export function athleteToPack(athlete) {
  if (!athlete) return normalizeTalentPack(synthesizePackFromAthlete({ name: "Twin", moments: [], stats: [] }));

  if (isWaltAthlete(athlete)) {
    return normalizeTalentPack({
      ...waltPack,
      displayName: athlete.name?.split("(")[0]?.trim() || waltPack.displayName,
      portraitSrc: athlete.headshot || waltPack.portraitSrc,
      stats: (athlete.stats || []).map((s) => ({ value: s.v, label: s.l })),
      trust: {
        ...waltPack.trust,
        ...liveTrust(athlete),
        sourceLabel: waltPack.trust.sourceLabel,
      },
      statusCopy: liveStatusCopy(),
    });
  }

  return normalizeTalentPack(synthesizePackFromAthlete(athlete));
}
