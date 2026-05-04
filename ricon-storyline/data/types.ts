export interface Source {
  id: string;
  fact: string;
  sourceName: string;
  sourceType: "article" | "official_record" | "athlete_verified";
  sourceUrl?: string;
  dateAccessed: string;
}

export interface TimestampEvent {
  time: number;
  action: "show_stat" | "show_label" | "show_quote" | "show_context";
  // The POC payload intentionally stays open for timeline-specific overlays.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
}

export interface Moment {
  id: string;
  athleteId: string;
  era: string;
  date: string;
  title: string;
  summary: string;
  mediaType: "static" | "animation" | "clip";
  mediaUrl?: string;
  audioUrl?: string;
  timestampEvents: TimestampEvent[];
  verified: boolean;
  sources: Source[];
  collectibleId?: string;
}

export interface Collectible {
  id: string;
  momentId: string;
  title: string;
  imageUrl: string;
  editionSize: number;
  price: number;
  currency: string;
  provenance: string;
}

export interface Athlete {
  id: string;
  slug: string;
  name: string;
  sport: string;
  position: string;
  careerYears: string;
  portraitUrl: string;
  heroImageUrl: string;
  verified: boolean;
  verifiedDate: string;
  tagline: string;
  bio: string;
  moments: Moment[];
}
