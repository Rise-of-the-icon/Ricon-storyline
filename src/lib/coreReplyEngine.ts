import type {
  ContentDrop,
  ContentDropType,
  CoreFact,
  CoreReply,
  MessageClassification,
} from "../types/ricon";
import {
  buildClassificationReply,
  buildTemplateReply,
  type FallbackTemplateContext,
} from "./fallbackTemplates";

const STOP_WORDS = new Set([
  "what",
  "when",
  "where",
  "your",
  "were",
  "with",
  "that",
  "this",
  "from",
  "about",
  "moment",
  "tell",
  "have",
  "does",
  "would",
  "could",
  "should",
  "the",
  "and",
  "for",
  "you",
  "are",
  "can",
  "how",
  "why",
  "who",
]);

export interface CoreReplyInput {
  userMessage: string;
  twinId: string;
  twinName?: string;
  coreFacts: CoreFact[];
  contentDrops: ContentDrop[];
}

interface ScoredFact {
  fact: CoreFact;
  score: number;
}

interface ScoredDrop {
  drop: ContentDrop;
  score: number;
}

const POLITICAL_PATTERNS = [
  /\bwho should i vote\b/,
  /\bwho (?:should|do) i vote for\b/,
  /\bwho to vote for\b/,
  /\b(?:vote|voting) for\b/,
  /\belection\b/,
  /\bballot\b/,
  /\bpresident(?:ial)?\b/,
  /\bpolitic(?:al|s)\b/,
  /\brepublican\b/,
  /\bdemocrat(?:ic)?\b/,
  /\bcongress\b/,
  /\bsenate\b/,
  /\bcampaign\b/,
  /\bgovernor\b/,
  /\bendorse(?:ment|ing)?\b/,
  /\bwhich party\b/,
  /\bcivic duty\b/,
];

const FABRICATION_PATTERNS = [
  /\bmake up\b/,
  /\bmade up\b/,
  /\binvent(?:ed|ing)?\b/,
  /\bfictional\b/,
  /\bfake story\b/,
  /\bpretend\b/,
  /\bcreate a story\b/,
  /\bwrite me a story\b/,
  /\bmake a story\b/,
  /\bfanfic(?:tion)?\b/,
  /\bjust imagine\b/,
  /\bwhat if you (?:had|were|did)\b/,
  /\bcan you (?:make|create|invent)\b.*\bstory\b/,
];

const UNSAFE_PATTERNS = [
  /\bhow (?:to|do i) (?:kill|hurt|harm)\b/,
  /\bcommit suicide\b/,
  /\bself harm\b/,
  /\bmake a bomb\b/,
  /\billegal (?:drugs|weapons)\b/,
];

const PRIVATE_DATA_PATTERNS = [
  /\b(?:phone number|home address|email address|social security)\b/,
  /\bwhere do you live\b/,
  /\bwhat(?:'s| is) your address\b/,
  /\bpersonal (?:details|information|data)\b/,
  /\bprivate (?:life|details|information)\b/,
];

const CONTENT_DROP_PATTERNS = [
  /\bcontent drops?\b/,
  /\blatest drop\b/,
  /\bnew drop\b/,
  /\bnewest drop\b/,
  /\brecent drop\b/,
  /\bnew story\b/,
  /\blatest story\b/,
  /\bbehind the scenes\b/,
  /\bstudio diary\b/,
  /\bbroadcast\b/,
  /\btraining log\b/,
  /\btraining\b/,
  /\bpre match\b/,
  /\bpre-match\b/,
  /\bexclusive drop\b/,
  /\bannouncement\b/,
  /\breflection\b/,
];

const LATEST_DROP_PATTERNS = [
  /\blatest drop\b/,
  /\bnew drop\b/,
  /\bnewest drop\b/,
  /\brecent drop\b/,
  /\bnew story\b/,
  /\blatest story\b/,
  /\bwhat(?:'s| is) new\b/,
  /\bwhat did you (?:just )?publish\b/,
];

const DROP_TYPE_QUERY_PHRASES: Record<ContentDropType, string[]> = {
  "pre-match": ["pre match", "pre-match", "pregame", "pre game"],
  "studio diary": ["studio diary", "diary"],
  training: ["training log", "training"],
  "behind-the-scenes": ["behind the scenes", "behind-the-scenes", "bts"],
  announcement: ["announcement"],
  reflection: ["reflection"],
};

const ADVICE_PATTERNS = [
  /\bmindset\b/,
  /\bmental(?:ity)?\b/,
  /\badvice\b/,
  /\bmotivat(?:e|ion)\b/,
  /\bwork ethic\b/,
  /\bdiscipline\b/,
  /\bhow should i (?:approach|handle|deal)\b/,
  /\bseparated you\b/,
  /\bprepare(?:d|ation)?\b/,
  /\bpressure\b/,
  /\bfocus\b/,
];

const GROUNDED_HINT_PATTERNS = [
  /\bdefining moment\b/,
  /\blegacy\b/,
  /\bchampionship\b/,
  /\bstat(?:s|istics)?\b/,
  /\bwhen did\b/,
  /\btell me about\b/,
  /\bwhat happened\b/,
  /\bverified\b/,
  /\bdocumented\b/,
  /\bcareer\b/,
  /\btitle\b/,
  /\bring\b/,
  /\balbum\b/,
  /\bsong\b/,
  /\bteam\b/,
  /\bseason\b/,
  /\bgame\b/,
  /\bfinals\b/,
];

function clean(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
}

function tokenize(text: string): string[] {
  return clean(text)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  const normalized = clean(text);
  return patterns.some((pattern) => pattern.test(normalized));
}

function approvedFacts(facts: CoreFact[]): CoreFact[] {
  return facts.filter((fact) => fact.approved);
}

function publishedDrops(drops: ContentDrop[], twinId: string): ContentDrop[] {
  return drops
    .filter((drop) => drop.status === "published" && drop.twinId === twinId)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

function extractQuotedPhrase(query: string): string | undefined {
  const match = query.match(/"([^"]+)"/) ?? query.match(/'([^']+)'/);
  return match?.[1]?.trim();
}

function isLatestDropQuery(query: string): boolean {
  return matchesAny(query, LATEST_DROP_PATTERNS);
}

function pickLatestDrop(drops: ContentDrop[]): ContentDrop | undefined {
  return drops[0];
}

function pickDropByTypeIntent(drops: ContentDrop[], query: string): ContentDrop | undefined {
  const normalized = clean(query);

  for (const [type, phrases] of Object.entries(DROP_TYPE_QUERY_PHRASES) as Array<
    [ContentDropType, string[]]
  >) {
    if (!phrases.some((phrase) => normalized.includes(clean(phrase)))) continue;

    const typed = drops.filter((drop) => drop.type === type);
    if (typed.length) return typed[0];
  }

  return undefined;
}

function resolveContentDrop(
  drops: ContentDrop[],
  query: string,
  dropMatches: ScoredDrop[]
): ContentDrop | undefined {
  if (isLatestDropQuery(query)) {
    return pickLatestDrop(drops);
  }

  if (dropMatches[0]?.score >= 2) return dropMatches[0].drop;

  const typeDrop = pickDropByTypeIntent(drops, query);
  if (typeDrop) return typeDrop;

  const quoted = extractQuotedPhrase(query);
  if (quoted) {
    const titleMatch = drops.find((drop) => clean(drop.title).includes(clean(quoted)));
    if (titleMatch) return titleMatch;
  }

  if (dropMatches[0]?.drop) return dropMatches[0].drop;

  if (matchesAny(query, CONTENT_DROP_PATTERNS)) {
    return pickLatestDrop(drops);
  }

  return undefined;
}

function scoreFact(fact: CoreFact, queryTokens: string[], rawQuery: string): number {
  const normalizedQuery = clean(rawQuery);
  const haystack = clean(
    `${fact.title} ${fact.summary} ${fact.verifiedText} ${fact.tags.join(" ")} ${fact.dateRange}`
  );

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 2;
  }

  if (normalizedQuery.includes(clean(fact.title))) score += 8;
  if (normalizedQuery.includes(clean(fact.dateRange))) score += 5;

  if (fact.tags.some((tag) => normalizedQuery.includes(clean(tag)))) score += 3;

  return score;
}

function scoreDrop(drop: ContentDrop, queryTokens: string[], rawQuery: string): number {
  const normalizedQuery = clean(rawQuery);
  const haystack = clean(`${drop.title} ${drop.summary} ${drop.body} ${drop.type}`);

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 2;
  }

  if (normalizedQuery.includes(clean(drop.title))) score += 10;

  const quoted = extractQuotedPhrase(rawQuery);
  if (quoted && clean(drop.title).includes(clean(quoted))) score += 15;

  for (const token of tokenize(drop.title)) {
    if (normalizedQuery.includes(token)) score += 3;
  }

  const typePhrases = DROP_TYPE_QUERY_PHRASES[drop.type] ?? [drop.type.replace(/-/g, " ")];
  if (typePhrases.some((phrase) => normalizedQuery.includes(clean(phrase)))) score += 5;

  return score;
}

function retrieveFacts(facts: CoreFact[], query: string, limit = 3): ScoredFact[] {
  const tokens = tokenize(query);
  return facts
    .map((fact) => ({ fact, score: scoreFact(fact, tokens, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function retrieveDrops(drops: ContentDrop[], query: string, limit = 2): ScoredDrop[] {
  const tokens = tokenize(query);
  return drops
    .map((drop) => ({ drop, score: scoreDrop(drop, tokens, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function computeConfidence(topScore: number, queryTokenCount: number, floor = 0.35): number {
  if (topScore <= 0) return 0.15;
  const normalized = topScore / Math.max(queryTokenCount * 2, 4);
  return Math.min(0.98, Math.max(floor, Number(normalized.toFixed(2))));
}

function classifyMessage(
  query: string,
  factMatches: ScoredFact[],
  dropMatches: ScoredDrop[]
): MessageClassification {
  if (matchesAny(query, UNSAFE_PATTERNS) || matchesAny(query, PRIVATE_DATA_PATTERNS)) {
    return "unsafe_or_sensitive";
  }
  if (matchesAny(query, FABRICATION_PATTERNS)) return "fabrication_request";
  if (matchesAny(query, POLITICAL_PATTERNS)) return "political_or_civic_persuasion";

  const topFactScore = factMatches[0]?.score ?? 0;
  const topDropScore = dropMatches[0]?.score ?? 0;
  const hasDropIntent = matchesAny(query, CONTENT_DROP_PATTERNS);
  const hasAdviceIntent = matchesAny(query, ADVICE_PATTERNS);
  const hasGroundedHint = matchesAny(query, GROUNDED_HINT_PATTERNS);

  if (hasDropIntent || (topDropScore >= 4 && topDropScore > topFactScore)) {
    return "content_drop_question";
  }

  if (topFactScore >= 4 || (hasGroundedHint && topFactScore >= 2 && !hasDropIntent)) {
    return "grounded_fact_question";
  }

  if (hasAdviceIntent) return "personal_advice_safe";

  if (topDropScore >= 2) return "content_drop_question";
  if (topFactScore >= 2) return "grounded_fact_question";

  return "out_of_scope";
}

function twinContext(twinName?: string, fact?: CoreFact): FallbackTemplateContext {
  return {
    twinName,
    suggestedMoment: fact
      ? { year: fact.dateRange, title: fact.title }
      : undefined,
  };
}

function buildPoliticalRefusal(): CoreReply {
  return buildTemplateReply("political_refusal", "political_or_civic_persuasion");
}

function buildFabricationRefusal(facts: CoreFact[], twinName?: string): CoreReply {
  const suggested = facts[0];
  return buildTemplateReply("fabrication_refusal", "fabrication_request", {
    twinName,
    suggestedMoment: suggested
      ? { year: suggested.dateRange, title: suggested.title }
      : undefined,
  });
}

function buildUnsafeRefusal(): CoreReply {
  return buildTemplateReply("sensitive_private_refusal", "unsafe_or_sensitive");
}

function buildFallback(classification: MessageClassification, twinName?: string): CoreReply {
  return buildClassificationReply(classification, { twinName });
}

function buildGroundedFactReply(fact: CoreFact, confidence: number): CoreReply {
  return {
    content: `From the verified record — ${fact.dateRange}: ${fact.title}. ${fact.verifiedText}`,
    responseType: "grounded",
    sourceIds: [fact.source.id],
    classification: "grounded_fact_question",
    confidence,
    factIds: [fact.id],
  };
}

function buildDropIntro(drop: ContentDrop, query: string): string {
  if (isLatestDropQuery(query)) {
    return `The latest verified drop says — ${drop.title}. ${drop.body}`;
  }

  switch (drop.type) {
    case "studio diary":
      return `From the approved studio diary — ${drop.title}. ${drop.body}`;
    case "pre-match":
      return `From the approved pre-match drop — ${drop.title}. ${drop.body}`;
    case "behind-the-scenes":
      return `From the approved behind-the-scenes drop — ${drop.title}. ${drop.body}`;
    case "training":
      return `From the approved training drop — ${drop.title}. ${drop.body}`;
    case "announcement":
      return `From the approved announcement — ${drop.title}. ${drop.body}`;
    case "reflection":
      return `From the approved reflection — ${drop.title}. ${drop.body}`;
    default:
      return `From the latest verified drop — ${drop.title}. ${drop.body}`;
  }
}

function buildContentDropReply(drop: ContentDrop, confidence: number, query: string): CoreReply {
  return {
    content: buildDropIntro(drop, query),
    responseType: "grounded",
    sourceIds: [drop.source.id],
    classification: "content_drop_question",
    confidence,
    contentDropIds: [drop.id],
  };
}

function buildAdviceReply(fact: CoreFact, confidence: number, twinName?: string): CoreReply {
  const name = twinName?.split(" ")[0] ?? "I";
  return {
    content: `${name} won't hand out generic life advice, but the verified record shows how mindset showed up in practice. In ${fact.dateRange}, ${fact.title}: ${fact.verifiedText}`,
    responseType: "grounded",
    sourceIds: [fact.source.id],
    classification: "personal_advice_safe",
    confidence,
    factIds: [fact.id],
  };
}

function pickSignatureFact(facts: CoreFact[], query: string): CoreFact | undefined {
  const normalized = clean(query);
  if (!/\b(defining|signature|best|biggest|greatest|legacy|iconic)\b/.test(normalized)) {
    return undefined;
  }

  return (
    facts.find((fact) => fact.tags.includes("iconic") || fact.tags.includes("championship")) ??
    facts.find((fact) => fact.tags.includes("record")) ??
    facts[facts.length - 1]
  );
}

function pickLegacyFact(facts: CoreFact[], query: string): CoreFact | undefined {
  const normalized = clean(query);
  if (!/\b(legacy|career|summary|who are you|who is)\b/.test(normalized)) {
    return undefined;
  }

  return facts[facts.length - 1] ?? facts[0];
}

function pickMindsetFact(facts: CoreFact[], query: string): ScoredFact | undefined {
  const mindsetTags = new Set(["iconic", "championship", "record", "training", "reflection"]);
  const scored = retrieveFacts(facts, query, facts.length);
  const mindsetMatch = scored.find(
    (item) =>
      item.score >= 2 &&
      item.fact.tags.some((tag) => mindsetTags.has(tag) || clean(query).includes(clean(tag)))
  );
  return mindsetMatch ?? scored.find((item) => item.score >= 3);
}

export function buildCoreReply(input: CoreReplyInput): CoreReply {
  const facts = approvedFacts(input.coreFacts);
  const drops = publishedDrops(input.contentDrops, input.twinId);
  const query = input.userMessage.trim();

  if (!query) {
    return buildClassificationReply("out_of_scope", twinContext(input.twinName), { emptyQuery: true });
  }

  const factMatches = retrieveFacts(facts, query);
  const dropMatches = retrieveDrops(drops, query);
  const classification = classifyMessage(query, factMatches, dropMatches);
  const queryTokens = tokenize(query);

  if (classification === "political_or_civic_persuasion") {
    return buildPoliticalRefusal();
  }

  if (classification === "fabrication_request") {
    return buildFabricationRefusal(facts, input.twinName);
  }

  if (classification === "unsafe_or_sensitive") {
    return buildUnsafeRefusal();
  }

  if (classification === "content_drop_question") {
    const resolvedDrop = resolveContentDrop(drops, query, dropMatches);
    if (resolvedDrop) {
      const matchScore =
        dropMatches.find((item) => item.drop.id === resolvedDrop.id)?.score ??
        (isLatestDropQuery(query) || pickDropByTypeIntent(drops, query) ? 6 : 4);
      return buildContentDropReply(
        resolvedDrop,
        computeConfidence(matchScore, queryTokens.length),
        query
      );
    }
    return buildFallback("content_drop_question", input.twinName);
  }

  if (classification === "grounded_fact_question") {
    const topFact =
      factMatches[0]?.fact ?? pickSignatureFact(facts, query) ?? pickLegacyFact(facts, query);
    if (topFact) {
      const score = factMatches[0]?.score ?? 6;
      return buildGroundedFactReply(topFact, computeConfidence(score, queryTokens.length));
    }
    return buildFallback("grounded_fact_question", input.twinName);
  }

  if (classification === "personal_advice_safe") {
    const mindsetFact = pickMindsetFact(facts, query);
    if (mindsetFact) {
      return buildAdviceReply(
        mindsetFact.fact,
        computeConfidence(mindsetFact.score, queryTokens.length, 0.45),
        input.twinName
      );
    }
    return buildFallback("personal_advice_safe", input.twinName);
  }

  if (factMatches[0]?.score >= 2) {
    return buildGroundedFactReply(
      factMatches[0].fact,
      computeConfidence(factMatches[0].score, queryTokens.length, 0.4)
    );
  }

  const signatureFact = pickSignatureFact(facts, query) ?? pickLegacyFact(facts, query);
  if (signatureFact) {
    return buildGroundedFactReply(signatureFact, 0.55);
  }

  if (dropMatches[0]?.score >= 2) {
    return buildContentDropReply(
      dropMatches[0].drop,
      computeConfidence(dropMatches[0].score, queryTokens.length, 0.4),
      query
    );
  }

  const dropIntentMatch = resolveContentDrop(drops, query, dropMatches);
  if (dropIntentMatch) {
    return buildContentDropReply(dropIntentMatch, 0.45, query);
  }

  return buildFallback("out_of_scope", input.twinName);
}

export function classificationLabel(classification: MessageClassification): string {
  switch (classification) {
    case "political_or_civic_persuasion":
      return "Political guidance refused";
    case "fabrication_request":
      return "Fabrication refused";
    case "unsafe_or_sensitive":
      return "Sensitive request refused";
    case "out_of_scope":
      return "Outside verified scope";
    case "personal_advice_safe":
      return "Verified mindset response";
    case "content_drop_question":
      return "Content drop response";
    case "grounded_fact_question":
      return "Core fact response";
    default:
      return "Verified twin response";
  }
}
