import { getTwinById } from "../data/twins";
import type { Subscription, Twin, User } from "../types/ricon";
import {
  getSelectedTwinId,
  getStoredSubscription,
  getStoredUser,
  hasActiveSubscription,
  setSelectedTwinId,
  setStoredSubscription,
} from "./storage";

export type FanExperiencePhase = "guest" | "authenticated" | "twin_selected" | "subscribed";

export interface FanExperienceSnapshot {
  user: User | null;
  subscription: Subscription | null;
  selectedTwinId: string | null;
  selectedTwin: Twin | undefined;
  subscribedTwin: Twin | undefined;
  phase: FanExperiencePhase;
  isSubscriber: boolean;
  hasSelectedTwin: boolean;
}

/** Allow only same-origin relative paths (prevents open redirects). */
export function sanitizeRedirectPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  return trimmed;
}

export function buildRedirectQuery(path: string | null | undefined): string {
  const safe = sanitizeRedirectPath(path);
  return safe ? `?redirect=${encodeURIComponent(safe)}` : "";
}

export function appendRedirectParam(route: string, redirect: string | null | undefined): string {
  const safe = sanitizeRedirectPath(redirect);
  if (!safe) return route;
  const joiner = route.includes("?") ? "&" : "?";
  return `${route}${joiner}redirect=${encodeURIComponent(safe)}`;
}

export function getValidSelectedTwinId(): string | null {
  const twinId = getSelectedTwinId();
  if (!twinId) return null;

  const twin = getTwinById(twinId);
  if (!twin?.availableForSubscription) return null;

  return twinId;
}

export function getFanExperienceSnapshot(): FanExperienceSnapshot {
  const user = getStoredUser();
  const subscription = getStoredSubscription();
  const selectedTwinId = getValidSelectedTwinId();
  const selectedTwin = selectedTwinId ? getTwinById(selectedTwinId) : undefined;

  const subscriptionValid =
    Boolean(user && subscription && subscription.userId === user.id && hasActiveSubscription(user.id));

  const subscribedTwin =
    subscriptionValid && subscription?.twinId ? getTwinById(subscription.twinId) : undefined;

  const isSubscriber = Boolean(subscriptionValid && subscribedTwin);
  const hasSelectedTwin = Boolean(selectedTwinId && selectedTwin);

  let phase: FanExperiencePhase = "guest";
  if (user) {
    phase = isSubscriber ? "subscribed" : hasSelectedTwin ? "twin_selected" : "authenticated";
  }

  return {
    user,
    subscription: subscriptionValid ? subscription : null,
    selectedTwinId,
    selectedTwin,
    subscribedTwin,
    phase,
    isSubscriber,
    hasSelectedTwin,
  };
}

/** Normalize inconsistent localStorage after refresh or manual edits. */
export function repairFanExperienceState(): void {
  const user = getStoredUser();
  const subscription = getStoredSubscription();
  const selectedTwinId = getSelectedTwinId();

  if (!user) {
    if (subscription) setStoredSubscription(null);
    if (selectedTwinId) setSelectedTwinId(null);
    return;
  }

  if (subscription && subscription.userId !== user.id) {
    setStoredSubscription(null);
  }

  const activeSubscription = getStoredSubscription();
  if (activeSubscription && !hasActiveSubscription(user.id)) {
    setStoredSubscription(null);
  }

  if (selectedTwinId && !getTwinById(selectedTwinId)) {
    setSelectedTwinId(null);
  }

  const repairedSubscription = getStoredSubscription();
  if (repairedSubscription?.twinId && !getTwinById(repairedSubscription.twinId)) {
    setStoredSubscription(null);
  }

  if (repairedSubscription?.twinId && !getValidSelectedTwinId()) {
    setSelectedTwinId(repairedSubscription.twinId);
  }
}

export function resolvePostAuthDestination(redirect?: string | null): string {
  const safeRedirect = sanitizeRedirectPath(redirect);
  const snapshot = getFanExperienceSnapshot();

  if (snapshot.isSubscriber) {
    return safeRedirect ?? "/fan/home";
  }

  if (snapshot.hasSelectedTwin) {
    return appendRedirectParam("/subscribe", safeRedirect);
  }

  return appendRedirectParam("/select-twin", safeRedirect);
}

export function resolveSignupGuardRedirect(redirect?: string | null): string | null {
  const snapshot = getFanExperienceSnapshot();
  if (!snapshot.user) return null;
  return resolvePostAuthDestination(redirect);
}

export function resolveSelectTwinGuardRedirect(redirect?: string | null): string | null {
  const snapshot = getFanExperienceSnapshot();
  if (!snapshot.user) return appendRedirectParam("/signup", redirect);
  if (snapshot.isSubscriber) return resolvePostAuthDestination(redirect);
  return null;
}

export function resolveSubscribeGuardRedirect(): string | null {
  const snapshot = getFanExperienceSnapshot();
  if (!snapshot.user) return appendRedirectParam("/signup", null);
  if (!snapshot.hasSelectedTwin) return appendRedirectParam("/select-twin", null);
  if (snapshot.isSubscriber) return "/fan/home";
  if (!snapshot.selectedTwin) return "/select-twin";
  return null;
}

export function resolveFanHomeGuardRedirect(): string | null {
  const snapshot = getFanExperienceSnapshot();
  if (!snapshot.user) return "/signup";
  if (!snapshot.hasSelectedTwin) return "/select-twin";
  if (!snapshot.isSubscriber) return "/subscribe";
  if (!snapshot.subscribedTwin) return "/select-twin";
  return null;
}
