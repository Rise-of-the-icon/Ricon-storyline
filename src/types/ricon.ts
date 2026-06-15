/** Shared Fan Experience POC data model for RICON Storyline. */

export type TwinCategory = "sports" | "music";

export type MessageRole = "user" | "twin" | "system";

export type ResponseType = "grounded" | "fallback" | "refusal";

export type MessageClassification =
  | "grounded_fact_question"
  | "content_drop_question"
  | "personal_advice_safe"
  | "out_of_scope"
  | "political_or_civic_persuasion"
  | "fabrication_request"
  | "unsafe_or_sensitive";

export interface CoreReply {
  content: string;
  responseType: ResponseType;
  sourceIds: string[];
  classification: MessageClassification;
  confidence: number;
  factIds?: string[];
  contentDropIds?: string[];
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "none";

export type BillingInterval = "month" | "year";

export type ContentDropType =
  | "pre-match"
  | "studio diary"
  | "training"
  | "behind-the-scenes"
  | "announcement"
  | "reflection";

export type ContentDropStatus = "draft" | "approved" | "published";

export interface TwinStat {
  label: string;
  value: string;
}

export interface Twin {
  id: string;
  name: string;
  category: TwinCategory;
  sportOrIndustry: string;
  yearsActive: string;
  image: string;
  shortDescription: string;
  stats: TwinStat[];
  availableForSubscription: boolean;
}

/** Extended legend record used by existing Storyline UI components. */
export interface LegacyStat {
  l: string;
  v: string;
}

export interface LegacyMoment {
  y: string;
  era: string;
  type: string;
  title: string;
  body: string;
  src: string;
  media?: Array<{ title: string; meta: string }>;
}

export interface LegacyLegend {
  id: string;
  name: string;
  initials: string;
  headshot?: string;
  heroImage?: string;
  years: string;
  position: string;
  tagline: string;
  teams: string;
  stats: LegacyStat[];
  voice: string;
  moments: LegacyMoment[];
  cat: TwinCategory;
  league?: string;
  leagueLabel?: string;
  genre?: string;
  genreLabel?: string;
  credits?: string;
}

export type AuthProvider = "email" | "google" | "apple" | "poc";

export interface User {
  id: string;
  email: string;
  name: string;
  authProvider: AuthProvider;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  twinId: string;
  planName: string;
  price: number;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  trialEnabled: boolean;
  startedAt: string;
}

export interface SourceReference {
  id: string;
  label: string;
  twinId: string;
  year?: string;
  factId?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  twinId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  sourceIds: string[];
  responseType?: ResponseType;
  classification?: MessageClassification;
  confidence?: number;
}

export interface ConversationThread {
  schemaVersion: 2;
  conversationId: string;
  userId: string;
  twinId: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

export interface CoreFact {
  id: string;
  twinId: string;
  title: string;
  summary: string;
  verifiedText: string;
  tags: string[];
  source: SourceReference;
  approved: boolean;
  dateRange: string;
}

export interface ContentDrop {
  id: string;
  twinId: string;
  title: string;
  type: ContentDropType;
  summary: string;
  body: string;
  source: SourceReference;
  status: ContentDropStatus;
  publishedAt: string | null;
  createdBy: string;
}

export type NotificationAudience = "all-fans" | "subscribers";

export interface FanNotification {
  id: string;
  audience: NotificationAudience;
  userId: string | null;
  twinId: string;
  dropId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface UserSession {
  userId: string;
  selectedTwinId: string | null;
  sessionsRemaining: number;
  sessionsIncluded: number;
  monthKey: string;
  lastActiveAt: string;
}

export type ChatSessionStatus = "active" | "ended";

export interface ChatSession {
  id: string;
  userId: string;
  twinId: string;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  status: ChatSessionStatus;
  sourceIdsReferenced: string[];
}

export interface SubscriptionCompletion {
  completedAt: string;
  userId: string;
  twinId: string;
  subscriptionId: string;
}

export interface SubscriptionPlan {
  id: string;
  planName: string;
  price: number;
  billingInterval: BillingInterval;
  trialEnabled: boolean;
  sessionsIncluded: number;
  description: string;
}

export const DEFAULT_SUBSCRIPTION_PLAN: SubscriptionPlan = {
  id: "storyline-monthly",
  planName: "Storyline Access",
  price: 9.99,
  billingInterval: "month",
  trialEnabled: true,
  sessionsIncluded: 6,
  description: "All verified digital twins · $9.99/month",
};
