import { getCoreFactsByTwinId } from "../data/coreFacts";
import { buildCoreReply } from "./coreReplyEngine";
import { getPublishedContentDrops } from "./storage";
import type { CoreReply, LegacyLegend } from "../types/ricon";

type AthleteLike = LegacyLegend;

export type TwinReply = CoreReply & {
  momentTitle?: string;
};

export function buildTwinResponse(athlete: AthleteLike, question: string): TwinReply {
  const reply = buildCoreReply({
    userMessage: question,
    twinId: athlete.id,
    twinName: athlete.name,
    coreFacts: getCoreFactsByTwinId(athlete.id),
    contentDrops: getPublishedContentDrops(athlete.id),
  });

  const momentTitle = reply.factIds?.length
    ? getCoreFactsByTwinId(athlete.id).find((fact) => fact.id === reply.factIds![0])?.title
    : undefined;

  return {
    ...reply,
    momentTitle,
  };
}

/** Static thread for Figma capture demos. */
export function buildQaCaptureMessages(athlete: AthleteLike) {
  const prompts = [
    "What was your defining moment?",
    "Who should I vote for?",
    "Can you make up a story about yourself?",
  ];
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const prompt of prompts) {
    messages.push({ role: "user", content: prompt });
    messages.push({ role: "assistant", content: buildTwinResponse(athlete, prompt).content });
  }
  return messages;
}

export { buildCoreReply, classificationLabel } from "./coreReplyEngine";
export { renderFallbackTemplate, buildClassificationReply } from "./fallbackTemplates";
