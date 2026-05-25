import type { CoreReply, MessageClassification } from "../types/ricon";

export type FallbackTemplateId =
  | "no_verified_data"
  | "political_refusal"
  | "fabrication_refusal"
  | "sensitive_private_refusal"
  | "not_enough_context"
  | "redirect_verified_topics"
  | "content_drop_unavailable"
  | "stream_interrupted";

export interface FallbackTemplateContext {
  twinName?: string;
  suggestedMoment?: {
    year: string;
    title: string;
  };
}

function firstName(twinName?: string): string {
  return twinName?.split(" ")[0] ?? "I";
}

const TEMPLATE_COPY: Record<FallbackTemplateId, (ctx: FallbackTemplateContext) => string> = {
  no_verified_data: (ctx) => {
    const name = firstName(ctx.twinName);
    return `${name === "I" ? "I don't" : `${name} doesn't`} have verified material that matches that yet — and won't guess. Try a documented career moment, a published drop, or a legacy chapter with a clear anchor.`;
  },

  political_refusal: () =>
    "I can't guide your vote or speak outside the verified record. What I can do is talk about the documented moments, mindset, and legacy that are approved here.",

  fabrication_refusal: (ctx) => {
    const offer = ctx.suggestedMoment
      ? ` Ask about ${ctx.suggestedMoment.year}: ${ctx.suggestedMoment.title}, and I'll take you inside what's documented.`
      : " Pick a real moment from the verified record, and I'll take you there.";
    return `I won't invent stories about myself. The value here is what was actually lived and approved.${offer}`;
  },

  sensitive_private_refusal: () =>
    "That's private or sensitive ground, and I won't speculate. Keep me on documented moments, mindset, and legacy — that's where this twin stays trustworthy.",

  not_enough_context: () =>
    "I need a sharper anchor — a year, a defining moment, mindset, or legacy chapter. I'll keep the answer on the verified record only.",

  redirect_verified_topics: () =>
    "That's outside what's verified here. I won't guess. Try asking about a documented career moment, mindset, or legacy chapter.",

  content_drop_unavailable: () =>
    "There isn't an approved drop on that yet. Ask about a documented career moment, or check the feed for what's published.",

  stream_interrupted: () =>
    "That reply didn't finish cleanly. Send it again, or ask about a documented moment I can answer with confidence.",
};

export function renderFallbackTemplate(
  templateId: FallbackTemplateId,
  context: FallbackTemplateContext = {}
): string {
  return TEMPLATE_COPY[templateId](context);
}

export function fallbackTemplateForClassification(
  classification: MessageClassification,
  options: { emptyQuery?: boolean } = {}
): FallbackTemplateId {
  if (options.emptyQuery) return "not_enough_context";

  switch (classification) {
    case "political_or_civic_persuasion":
      return "political_refusal";
    case "fabrication_request":
      return "fabrication_refusal";
    case "unsafe_or_sensitive":
      return "sensitive_private_refusal";
    case "content_drop_question":
      return "content_drop_unavailable";
    case "grounded_fact_question":
      return "no_verified_data";
    case "personal_advice_safe":
      return "redirect_verified_topics";
    case "out_of_scope":
    default:
      return "redirect_verified_topics";
  }
}

export function responseTypeForTemplate(templateId: FallbackTemplateId): CoreReply["responseType"] {
  if (
    templateId === "political_refusal" ||
    templateId === "fabrication_refusal" ||
    templateId === "sensitive_private_refusal"
  ) {
    return "refusal";
  }
  return "fallback";
}

export function buildTemplateReply(
  templateId: FallbackTemplateId,
  classification: MessageClassification,
  context: FallbackTemplateContext = {},
  confidence?: number
): CoreReply {
  return {
    content: renderFallbackTemplate(templateId, context),
    responseType: responseTypeForTemplate(templateId),
    sourceIds: [],
    classification,
    confidence:
      confidence ??
      (responseTypeForTemplate(templateId) === "refusal" ? 1 : 0.2),
  };
}

export function buildClassificationReply(
  classification: MessageClassification,
  context: FallbackTemplateContext = {},
  options: { emptyQuery?: boolean; confidence?: number } = {}
): CoreReply {
  const templateId = fallbackTemplateForClassification(classification, options);
  return buildTemplateReply(templateId, classification, context, options.confidence);
}
