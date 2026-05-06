export type MockAIResponseType =
  | "explanation"
  | "comparison"
  | "timelineJump"
  | "statExplanation"
  | "culturalContext"
  | "musicContext"
  | "sourceContext"
  | "recommendation";

export type MockAIResponse = {
  id: string;
  type: MockAIResponseType;
  prompt: string;
  response: string;
  relatedMomentId?: string;
  chips?: string[];
  statusLabel?: string;
  promptIds?: string[];
  categories?: string[];
  keywords?: string[];
};

export const mockAIResponses: MockAIResponse[] = [
  {
    id: "explain-last-shot-legacy",
    type: "explanation",
    prompt: "Why was this moment legendary?",
    response:
      "Demo response: this moment is legendary because the verified sequence carries both basketball stakes and legacy closure. The shot matters because it follows the steal, lands in the final seconds, and becomes the lasting image of the Bulls dynasty.",
    relatedMomentId: "moment-pull-up-over-russell",
    chips: ["Legacy", "Finals", "Demo"],
    statusLabel: "Demo · source-grounded",
    promptIds: ["prompt-legacy", "prompt-stakes"],
    categories: ["Game", "Legacy"],
    keywords: ["legendary", "matter", "legacy", "why"],
  },
  {
    id: "timeline-before-shot",
    type: "timelineJump",
    prompt: "What happened right before this?",
    response:
      "Demo response: right before the jumper, Jordan created the final chance by stripping Karl Malone. That defensive read is part of the verified sequence and is the cleanest jump point for understanding the shot.",
    relatedMomentId: "moment-steal-on-malone",
    chips: ["Timeline Jump", "Setup", "Verified Sequence"],
    statusLabel: "Demo · timeline-linked",
    promptIds: ["prompt-defensive-read"],
    categories: ["Game"],
    keywords: ["before", "right before", "previous", "setup", "steal"],
  },
  {
    id: "compare-clutch-moment",
    type: "comparison",
    prompt: "Compare this to another NBA clutch moment.",
    response:
      "Demo response: compared with many clutch shots, this one has unusual finality. RICON can compare pressure, time, source record, and legacy impact without claiming unsupported details as verified.",
    relatedMomentId: "moment-pull-up-over-russell",
    chips: ["Comparison", "NBA", "Clutch"],
    statusLabel: "Demo · comparative context",
    categories: ["Game", "Legacy"],
    keywords: ["compare", "another", "clutch", "versus", "vs"],
  },
  {
    id: "stats-six-finals",
    type: "statExplanation",
    prompt: "Explain the stats behind this story.",
    response:
      "Demo response: the key verified stats are six championships and six Finals MVPs. In this product layer, stats are treated as context markers, not decorative trivia.",
    relatedMomentId: "moment-pull-up-over-russell",
    chips: ["Stats", "Finals MVP", "Championships"],
    statusLabel: "Demo · stat context",
    categories: ["Stats"],
    keywords: ["stats", "numbers", "finals mvp", "championship"],
  },
  {
    id: "culture-last-shot",
    type: "culturalContext",
    prompt: "Show me the cultural impact.",
    response:
      "Demo response: the cultural impact is the way this image became shorthand for finishing the job. RICON can map that influence across documentary memory, sneaker mythology, and fan language while marking what is interpretation.",
    relatedMomentId: "moment-pull-up-over-russell",
    chips: ["Culture", "Interpretation", "Legacy"],
    statusLabel: "Demo · interpretation labeled",
    categories: ["Culture", "Legacy"],
    keywords: ["culture", "impact", "commercial", "mythology", "meaning"],
  },
  {
    id: "music-era-context",
    type: "musicContext",
    prompt: "What music defined this era?",
    response:
      "Demo response: the late-90s context points toward arena anthems, hip-hop's mainstream rise, and global sports marketing soundtracks. This is cultural context, not a verified claim about the game broadcast.",
    chips: ["Music", "Era Context", "Not Broadcast Claim"],
    statusLabel: "Demo · cultural context",
    categories: ["Music", "Culture"],
    keywords: ["music", "sound", "soundtrack", "era", "song"],
  },
  {
    id: "source-context-finals",
    type: "sourceContext",
    prompt: "What sources support this?",
    response:
      "Demo response: this story is anchored to official Finals records and play-by-play references in the mock source layer. Placeholder media still needs rights review before production use.",
    relatedMomentId: "moment-pull-up-over-russell",
    chips: ["Sources", "Rights Review", "Verified Layer"],
    statusLabel: "Demo · source context",
    categories: ["Legacy", "Game"],
    keywords: ["source", "verified", "proof", "record", "rights"],
  },
  {
    id: "recommend-next-moment",
    type: "recommendation",
    prompt: "What should I watch next?",
    response:
      "Demo response: watch the steal on Malone next if you want the setup, then return to the jumper. The sequence is stronger when the defensive read and final release are seen together.",
    relatedMomentId: "moment-steal-on-malone",
    chips: ["Recommendation", "Watch Next", "Timeline"],
    statusLabel: "Demo · recommendation",
    categories: ["Career", "Game", "Legacy"],
    keywords: ["recommend", "watch next", "next", "where should i go"],
  },
];

export function resolveMockAIResponse({
  promptId,
  question,
  category,
}: {
  promptId?: string;
  question?: string;
  category?: string;
}): MockAIResponse {
  const normalizedQuestion = String(question || "").toLowerCase();

  if (promptId) {
    const byPromptId = mockAIResponses.find((item) => item.promptIds?.includes(promptId));
    if (byPromptId) return byPromptId;
  }

  if (normalizedQuestion) {
    const byKeyword = mockAIResponses.find((item) => (
      item.keywords?.some((keyword) => normalizedQuestion.includes(keyword))
    ));
    if (byKeyword) return byKeyword;
  }

  if (category) {
    const byCategory = mockAIResponses.find((item) => item.categories?.includes(category));
    if (byCategory) return byCategory;
  }

  return mockAIResponses[0];
}
