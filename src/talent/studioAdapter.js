/**
 * Sketch adapter: Storyline Studio DigitalTwinProfile → TalentStoryPack.
 * Not wired to live Studio data yet — documents the migration seam for a host details page.
 *
 * @param {object} profile - Studio DigitalTwinProfile-like object
 * @param {object} [overrides] - pack fields to merge (persona, trust, chat, copy)
 * @returns {import("./types.js").TalentStoryPack}
 */
export function studioProfileToTalentPack(profile, overrides = {}) {
  const name = profile?.coreIdentity?.name || profile?.wikipedia?.title || "Talent";
  const initial = String(name).trim().charAt(0).toUpperCase() || "T";
  const timeline = Array.isArray(profile?.timeline) ? profile.timeline : [];

  // Group timeline events by decade as provisional "eras"
  const byDecade = new Map();
  for (const event of timeline) {
    const decade = event.decade || `${Math.floor((event.year || 0) / 10) * 10}s`;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade).push(event);
  }

  const eras = [...byDecade.entries()].map(([decade, events]) => ({
    id: String(decade).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label: decade,
    year: decade,
    beats: events.map((event) => ({
      id: event.id || `event-${event.year}-${String(event.title || "").slice(0, 24)}`,
      title: event.title || "Untitled moment",
      setup: event.description || event.summary || "",
      tape: event.source?.citation || event.source?.notes || "",
      narr: "",
      mediaItems: [],
    })),
  }));

  return {
    id: profile?.twinId || "studio-import",
    displayName: name,
    initial,
    portraitSrc: profile?.wikipedia?.imageUrl,
    tags: [],
    verifiedLabel: "Verified by RICON",
    verificationNote: "Built from vetted historical sources and editorial archive.",
    hook: {
      quoteParts: [{ text: profile?.wikipedia?.summary || `${name}'s verified storyline.` }],
      attribution: `${name} · verified twin`,
      subcopy:
        profile?.wikipedia?.description &&
        profile.wikipedia.description !== profile?.wikipedia?.summary
          ? profile.wikipedia.description
          : "Explore the verified timeline, then ask the twin.",
    },
    twin: {
      available: true,
      modes: ["narrator", "ask"],
      askCtaLabel: "Ask a question",
      narratorLabel: "Narrator",
      bannerTitle: "Digital Twin Available",
      bannerBody: `Interact with ${name}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.`,
    },
    trust: {
      consent: profile?.consentAcknowledged
        ? "Consent acknowledged in Storyline Studio."
        : "Consent status not confirmed for this profile.",
      sourceScope: "Producer-approved timeline events from Storyline Studio.",
      limit: "Not a live person and not verified beyond loaded material.",
      simulation: "Streaming and voice controls are prototype behaviors.",
      sourceLabel: "Storyline Studio approved timeline",
    },
    statusCopy: {
      idle: "Ready",
      submitted: "Request received",
      preparing: `Checking ${name}'s material`,
      streaming: "Composing reply",
      stopped: "Response stopped — partial answer preserved",
      complete: "Answer ready for review",
      uncertain: "Outside approved material",
      failed: "Could not complete response",
    },
    eras,
    chat: {
      responses: {},
      questions: {},
      suggested: [],
      uncertain: {
        kind: "uncertain",
        chapter: "Outside verified material",
        text: "That isn't covered in the approved timeline material loaded for this twin.",
      },
      matchers: [],
      recovery: [],
    },
    copy: {
      empty: `Grounded in ${name}'s approved timeline. Ask about a verified moment — if the material doesn't cover it, the twin will say so.`,
      disclose: `Responses are AI-generated from ${name}'s verified timeline. Voice and streaming are simulated preview behaviors.`,
      composerPlaceholder: "Ask a question…",
      composerAriaLabel: `Message ${name}'s twin`,
      tapeLabel: "Source note",
      outsideCue: `Outside what ${name}'s archive covers`,
      storyTrust: "AI-assisted story experience · grounded in approved timeline",
      chatHeading: "Ask the twin",
      chatEyebrow: "",
      footer: "Concept prototype · Studio adapter sketch",
      mediaProvenance: "Illustrative media placeholder · replace with cleared RICON asset",
      timelineAriaLabel: `${name}'s timeline, in order`,
      verifiedBadge: "Verified twin",
    },
    ...overrides,
  };
}
