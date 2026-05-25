import { RAW_LEGENDS } from "./legendsRaw.js";
import type { LegacyLegend, Twin, TwinStat } from "../types/ricon";

/** Twins not yet available for paid subscription in the POC. */
const SUBSCRIPTION_EXCLUDED_IDS = new Set<string>([]);

type RawLegend = (typeof RAW_LEGENDS)[number];

function toTwinStat(raw: { l: string; v: string }): TwinStat {
  return { label: raw.l, value: raw.v };
}

function toTwin(raw: RawLegend): Twin {
  const category = raw.cat === "music" ? "music" : "sports";
  const sportOrIndustry =
    category === "music"
      ? (raw.genreLabel ?? raw.position ?? "Music")
      : (raw.leagueLabel ?? raw.league ?? "Sports");

  return {
    id: raw.id,
    name: raw.name,
    category,
    sportOrIndustry,
    yearsActive: raw.years,
    image: raw.headshot ?? raw.heroImage ?? "",
    shortDescription: raw.tagline,
    stats: raw.stats.map(toTwinStat),
    availableForSubscription: !SUBSCRIPTION_EXCLUDED_IDS.has(raw.id),
  };
}

const TWINS: Twin[] = RAW_LEGENDS.map(toTwin);
const LEGACY_LEGENDS: LegacyLegend[] = RAW_LEGENDS as LegacyLegend[];

const twinById = new Map(TWINS.map((twin) => [twin.id, twin]));
const legacyById = new Map(LEGACY_LEGENDS.map((legend) => [legend.id, legend]));

export function getTwins(): Twin[] {
  return TWINS;
}

export function getSubscribableTwins(): Twin[] {
  return TWINS.filter((twin) => twin.availableForSubscription);
}

export function getTwinById(id: string): Twin | undefined {
  return twinById.get(id);
}

export function getLegacyLegendById(id: string): LegacyLegend | undefined {
  return legacyById.get(id);
}

export function getLegacyLegends(): LegacyLegend[] {
  return LEGACY_LEGENDS;
}

export { TWINS };
