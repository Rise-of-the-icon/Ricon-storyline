import { RAW_LEGENDS } from "./legendsRaw.js";
import { getAllContentDrops } from "../lib/storage";
import type { CoreFact, LegacyLegend, LegacyMoment, SourceReference } from "../types/ricon";

function buildSourceReference(
  twinId: string,
  factId: string,
  label: string,
  year?: string
): SourceReference {
  return {
    id: `src-${twinId}-${factId}`,
    label,
    twinId,
    year,
    factId,
  };
}

function summarize(text: string, max = 140): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function momentToCoreFact(twinId: string, moment: LegacyMoment, index: number): CoreFact {
  const factId = `${moment.y}-${moment.type}-${index}`;
  return {
    id: `fact-${twinId}-${factId}`,
    twinId,
    title: moment.title,
    summary: summarize(moment.body),
    verifiedText: moment.body,
    tags: [moment.type, moment.era, moment.y],
    source: buildSourceReference(twinId, factId, moment.src, moment.y),
    approved: true,
    dateRange: moment.y,
  };
}

const CORE_FACTS: CoreFact[] = (RAW_LEGENDS as LegacyLegend[]).flatMap((legend) =>
  legend.moments.map((moment: LegacyMoment, index: number) =>
    momentToCoreFact(legend.id, moment, index)
  )
);

const factsById = new Map(CORE_FACTS.map((fact) => [fact.id, fact]));
const factsByTwinId = CORE_FACTS.reduce<Map<string, CoreFact[]>>((acc, fact) => {
  const list = acc.get(fact.twinId) ?? [];
  list.push(fact);
  acc.set(fact.twinId, list);
  return acc;
}, new Map());

export function getCoreFacts(): CoreFact[] {
  return CORE_FACTS;
}

export function getCoreFactById(id: string): CoreFact | undefined {
  return factsById.get(id);
}

export function getCoreFactsByTwinId(twinId: string): CoreFact[] {
  return factsByTwinId.get(twinId) ?? [];
}

export function getSourceReferencesByIds(sourceIds: string[]): SourceReference[] {
  const sources = new Map<string, SourceReference>();
  for (const fact of CORE_FACTS) {
    sources.set(fact.source.id, fact.source);
  }
  for (const drop of getAllContentDrops()) {
    if (drop.status === "published") {
      sources.set(drop.source.id, drop.source);
    }
  }
  return sourceIds
    .map((id) => sources.get(id))
    .filter((source): source is SourceReference => Boolean(source));
}

export { CORE_FACTS };
