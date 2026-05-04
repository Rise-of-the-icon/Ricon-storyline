export const RICON_COLORS = {
  ink: "#0D0D0D",
  paper: "#FAF9F6",
  cyan: "#00B4D8",
  orange: "#FF6B35",
  violet: "#7B2D8E",
  "gray-ricon": "#1A1A1A",
} as const;

export type RiconColorName = keyof typeof RICON_COLORS;
export type RiconColorValue = (typeof RICON_COLORS)[RiconColorName];
