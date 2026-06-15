import type { ContentDrop } from "../types/ricon";

/** Seed content drops — merged with localStorage overrides via storage.ts */
export const SEED_CONTENT_DROPS: ContentDrop[] = [
  {
    id: "drop-jordan-001",
    twinId: "jordan",
    title: "The Last Shot — Behind the Broadcast",
    type: "behind-the-scenes",
    summary: "Archive notes on the Game 6 sequence Utah, 1998.",
    body: "Verified broadcast log and locker-room reflection tied to the final championship run. The twin can reference this drop once published.",
    source: {
      id: "src-jordan-drop-001",
      label: "NBA Finals Records · June 14 1998",
      twinId: "jordan",
      year: "1998",
    },
    status: "published",
    publishedAt: "2026-05-01T12:00:00.000Z",
    createdBy: "ricon-talent-team",
  },
  {
    id: "drop-jordan-002",
    twinId: "jordan",
    title: "Pre-Game Focus — 1991 Finals",
    type: "pre-match",
    summary: "Documented pre-game mindset before the first title.",
    body: "First championship series preparation. Verified notes on focus, pressure, and the shift from individual dominance to team legacy.",
    source: {
      id: "src-jordan-drop-002",
      label: "NBA Finals Records, 1991",
      twinId: "jordan",
      year: "1991",
    },
    status: "published",
    publishedAt: "2026-05-10T09:00:00.000Z",
    createdBy: "ricon-talent-team",
  },
  {
    id: "drop-tupac-001",
    twinId: "tupac",
    title: "Studio Diary — Me Against the World Sessions",
    type: "studio diary",
    summary: "Recording context while incarcerated, March 1995.",
    body: "Verified session notes on Me Against the World — the most intimate album released while incarcerated, debuting at number one.",
    source: {
      id: "src-tupac-drop-001",
      label: "Interscope Records and Billboard Charts, March 1995",
      twinId: "tupac",
      year: "1995",
    },
    status: "published",
    publishedAt: "2026-05-08T15:30:00.000Z",
    createdBy: "ricon-talent-team",
  },
  {
    id: "drop-brady-001",
    twinId: "brady",
    title: "Training Log — Comeback Season Prep",
    type: "training",
    summary: "Preparation notes ahead of the Tampa chapter.",
    body: "Verified training and preparation context for the move to Tampa Bay and the seventh Super Bowl pursuit.",
    source: {
      id: "src-brady-drop-001",
      label: "Super Bowl LV Records, February 2021",
      twinId: "brady",
      year: "2021",
    },
    status: "approved",
    publishedAt: null,
    createdBy: "ricon-talent-team",
  },
  {
    id: "drop-brady-002",
    twinId: "brady",
    title: "28-3 — Reflection on the Comeback",
    type: "reflection",
    summary: "Post-game reflection on Super Bowl LI.",
    body: "The greatest comeback in Super Bowl history. Verified reflection on trailing Atlanta 28-3 and what shifted in the second half.",
    source: {
      id: "src-brady-drop-002",
      label: "Super Bowl LI Records, February 2017",
      twinId: "brady",
      year: "2017",
    },
    status: "published",
    publishedAt: "2026-05-12T18:00:00.000Z",
    createdBy: "ricon-talent-team",
  },
  {
    id: "drop-shaquille-001",
    twinId: "shaq",
    title: "Announcement — Miami Championship Ring",
    type: "announcement",
    summary: "2006 title reflection and full-circle moment.",
    body: "Miami championship context — the fourth ring earned on new terms with Dwyane Wade.",
    source: {
      id: "src-shaq-drop-001",
      label: "NBA Finals Records, 2006",
      twinId: "shaq",
      year: "2006",
    },
    status: "draft",
    publishedAt: null,
    createdBy: "ricon-talent-team",
  },
];

export function getSeedContentDrops(): ContentDrop[] {
  return SEED_CONTENT_DROPS;
}

export function getSeedContentDropsByTwinId(twinId: string): ContentDrop[] {
  return SEED_CONTENT_DROPS.filter((drop) => drop.twinId === twinId);
}

export function getPublishedSeedDrops(): ContentDrop[] {
  return SEED_CONTENT_DROPS.filter((drop) => drop.status === "published");
}
