import { getCoreFacts, getSourceReferencesByIds } from "../data/coreFacts";
import { getAllContentDrops } from "./storage";
import type { ContentDropType } from "../types/ricon";

export interface SourceDisplayItem {
  id: string;
  title: string;
  typeLabel: string;
  year?: string;
  citation: string;
}

function formatDropType(type: ContentDropType): string {
  return type
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSourceIndex(): Map<string, SourceDisplayItem> {
  const index = new Map<string, SourceDisplayItem>();

  for (const fact of getCoreFacts()) {
    index.set(fact.source.id, {
      id: fact.source.id,
      title: fact.title,
      typeLabel: "Core Fact",
      year: fact.source.year ?? fact.dateRange,
      citation: fact.source.label,
    });
  }

  for (const drop of getAllContentDrops()) {
    if (drop.status !== "published") continue;
    index.set(drop.source.id, {
      id: drop.source.id,
      title: drop.title,
      typeLabel: formatDropType(drop.type),
      year: drop.source.year,
      citation: drop.source.label,
    });
  }

  return index;
}

function getSourceIndex(): Map<string, SourceDisplayItem> {
  return buildSourceIndex();
}

export function resolveSourceDisplays(sourceIds: string[]): SourceDisplayItem[] {
  if (!sourceIds.length) return [];

  const seen = new Set<string>();
  const items: SourceDisplayItem[] = [];

  for (const sourceId of sourceIds) {
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);

    const indexed = getSourceIndex().get(sourceId);
    if (indexed) {
      items.push(indexed);
      continue;
    }

    const reference = getSourceReferencesByIds([sourceId])[0];
    if (reference) {
      items.push({
        id: reference.id,
        title: reference.label,
        typeLabel: reference.factId ? "Core Fact" : "Verified Source",
        year: reference.year,
        citation: reference.label,
      });
    }
  }

  return items;
}
