import { getTwinById } from "../data/twins";
import { appendRedirectParam } from "./fanExperience";
import {
  getSelectedTwinId,
  getStoredSubscription,
  getStoredUser,
  hasActiveSubscription,
} from "./storage";

export type TwinAccessReason = "guest" | "no_subscription" | "granted";

export interface TwinAccessState {
  reason: TwinAccessReason;
  canAccessChat: boolean;
  ctaLabel: string;
  ctaRoute: string;
  title: string;
  message: string;
  subscribedTwinName?: string;
}

function chatIntentRoute(twinId: string): string {
  return `/legend/${twinId}?openTwin=qa`;
}

function checkoutRouteForTwin(twinId: string): string {
  const selectedTwinId = getSelectedTwinId();
  const intent = chatIntentRoute(twinId);
  if (selectedTwinId === twinId) return appendRedirectParam("/subscribe", intent);
  return appendRedirectParam("/select-twin", intent);
}

export function getTwinAccessState(twinId: string): TwinAccessState {
  const twin = getTwinById(twinId);
  const twinName = twin?.name ?? "this legend";

  const user = getStoredUser();
  if (!user) {
    return {
      reason: "guest",
      canAccessChat: false,
      ctaLabel: "Create account",
      ctaRoute: appendRedirectParam("/signup", chatIntentRoute(twinId)),
      title: "Fan account required",
      message: `Create a free RICON fan account to unlock interactive chat with ${twinName}'s verified digital twin.`,
    };
  }

  const subscription = getStoredSubscription();
  if (!subscription || !hasActiveSubscription(user.id)) {
    return {
      reason: "no_subscription",
      canAccessChat: false,
      ctaLabel: "Activate Digital Twins",
      ctaRoute: checkoutRouteForTwin(twinId),
      title: "Subscription required",
      message: `Subscribe to Storyline Access ($9.99/month) to chat with ${twinName} and every verified digital twin. Public story and timeline content remains free to browse.`,
    };
  }

  return {
    reason: "granted",
    canAccessChat: true,
    ctaLabel: "Open chat",
    ctaRoute: `/legend/${twinId}`,
    title: "Digital twin active",
    message: `You have full access to ${twinName}'s verified digital twin.`,
  };
}

export function canAccessTwinChat(twinId: string, bypassGate = false): boolean {
  if (bypassGate) return true;
  return getTwinAccessState(twinId).canAccessChat;
}
