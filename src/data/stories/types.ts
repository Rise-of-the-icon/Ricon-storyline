export type StoryVertical = "nba" | "music" | "culture" | "crossover";

export type StoryStatus = "draft" | "review" | "published" | "archived";

export type VerificationLevel =
  | "source-cited"
  | "multi-source"
  | "talent-ready"
  | "rights-cleared";

export type MediaKind = "video" | "audio" | "image" | "text";

export type MediaRole =
  | "hero"
  | "chapter"
  | "timeline"
  | "poster"
  | "transcript"
  | "supporting";

export type SourceKind =
  | "official-record"
  | "published-archive"
  | "broadcast"
  | "interview"
  | "photo"
  | "rights-document"
  | "internal";

export type PromptIntent =
  | "starter"
  | "followup"
  | "context"
  | "source"
  | "timeline"
  | "creative";

export type MomentKind =
  | "draft"
  | "record"
  | "iconic"
  | "championship"
  | "retirement"
  | "return"
  | "release"
  | "performance"
  | "collaboration"
  | "cultural";

export type PlaybackTimestamp = {
  label: string;
  startSeconds: number;
  endSeconds?: number;
  description?: string;
};

export type StoryStat = {
  id: string;
  label: string;
  value: string;
  context?: string;
  sourceId?: string;
};

export type StorySource = {
  id: string;
  title: string;
  kind: SourceKind;
  publisher?: string;
  author?: string;
  date?: string;
  url?: string;
  citation?: string;
  rightsStatus?: "unknown" | "review-needed" | "cleared" | "restricted";
  notes?: string;
};

export type VerificationMetadata = {
  status: "unverified" | "in-review" | "verified";
  level: VerificationLevel;
  badges: string[];
  sourceIds: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  rightsStatus?: "unknown" | "review-needed" | "cleared" | "restricted";
  notes?: string;
};

export type StoryMedia = {
  id: string;
  kind: MediaKind;
  role: MediaRole;
  title?: string;
  url: string;
  mimeType?: string;
  posterUrl?: string;
  alt?: string;
  captionUrl?: string;
  transcriptUrl?: string;
  durationSeconds?: number;
  timestamps?: PlaybackTimestamp[];
  sourceIds?: string[];
  verification?: VerificationMetadata;
};

export type SuggestedPrompt = {
  id: string;
  label: string;
  prompt: string;
  intent: PromptIntent;
  chapterId?: string;
  momentId?: string;
};

export type RelatedStory = {
  id: string;
  title: string;
  vertical: StoryVertical;
  slug?: string;
  year?: string;
  relationship:
    | "same-talent"
    | "same-era"
    | "same-team"
    | "influence"
    | "cultural-context"
    | "follow-up";
};

export type StoryMoment = {
  id: string;
  title: string;
  kind: MomentKind;
  date?: string;
  year?: string;
  summary: string;
  body?: string;
  mediaIds?: string[];
  sourceIds?: string[];
  verification?: VerificationMetadata;
  timestamps?: PlaybackTimestamp[];
  relatedStoryIds?: string[];
  suggestedPromptIds?: string[];
};

export type StoryChapter = {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  date?: string;
  year?: string;
  summary: string;
  body?: string;
  moments: StoryMoment[];
  mediaIds?: string[];
  sourceIds?: string[];
  verification?: VerificationMetadata;
  suggestedPromptIds?: string[];
};

export type StoryTalent = {
  id: string;
  name: string;
  role?: string;
  initials?: string;
  teamOrCollective?: string;
};

export type Story = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  vertical: StoryVertical;
  status: StoryStatus;
  year?: string;
  date?: string;
  talent: StoryTalent[];
  tags: string[];
  summary: string;
  description?: string;
  stats?: StoryStat[];
  chapters: StoryChapter[];
  timeline: StoryMoment[];
  media: StoryMedia[];
  sources: StorySource[];
  suggestedPrompts: SuggestedPrompt[];
  verification: VerificationMetadata;
  relatedStories?: RelatedStory[];
  updatedAt?: string;
};
