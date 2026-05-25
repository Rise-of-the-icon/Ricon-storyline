/**
 * Backward-compatible adapter for existing Storyline UI components.
 * Canonical data lives in legendsRaw.js, twins.ts, coreFacts.ts, and contentDrops.ts.
 */
import {
  FEATURED_HERO,
  FEATURED_PICK_IDS,
  FILTERS,
  TYPE_CONFIG,
  buildSystemPrompt,
} from "./legendsRaw.js";
import { getLegacyLegendById, getLegacyLegends } from "./twins.ts";

export { TYPE_CONFIG, buildSystemPrompt, FEATURED_HERO, FILTERS };
export { getTwins, getTwinById, getSubscribableTwins } from "./twins.ts";
export { getCoreFacts, getCoreFactsByTwinId, getSourceReferencesByIds } from "./coreFacts.ts";
export {
  getSeedContentDrops,
  getPublishedSeedDrops,
} from "./contentDrops.ts";
export {
  getStoredUser,
  setStoredUser,
  getStoredSubscription,
  setStoredSubscription,
  getSelectedTwinId,
  setSelectedTwinId,
  getUserSession,
  getConversationMessages,
  getAllContentDrops,
  getPublishedContentDrops,
} from "../lib/storage.ts";

/** @deprecated Use getLegacyLegends() — kept for existing imports */
export const LEGENDS = getLegacyLegends();

export const FEATURED_PICKS = FEATURED_PICK_IDS.map((id) => getLegacyLegendById(id)).filter(
  Boolean
);

export const NBA_LEGENDS = LEGENDS.filter((legend) => legend.league === "nba");
export const NFL_LEGENDS = LEGENDS.filter((legend) => legend.league === "nfl");
export const MLB_LEGENDS = LEGENDS.filter((legend) => legend.league === "mlb");
export const MUSIC_LEGENDS = LEGENDS.filter((legend) => legend.cat === "music");
