import { getSeedContentDrops } from "../data/contentDrops";
import { DEFAULT_SUBSCRIPTION_PLAN } from "../types/ricon";
import type {
  ContentDrop,
  Subscription,
  SubscriptionCompletion,
  User,
} from "../types/ricon";
import { initUserSession } from "./sessionStorage";

const STORAGE_PREFIX = "ricon:poc:";

const KEYS = {
  user: `${STORAGE_PREFIX}user`,
  subscription: `${STORAGE_PREFIX}subscription`,
  session: `${STORAGE_PREFIX}session`,
  selectedTwinId: `${STORAGE_PREFIX}selected-twin-id`,
  messages: `${STORAGE_PREFIX}messages`,
  contentDrops: `${STORAGE_PREFIX}content-drops`,
  subscriptionComplete: `${STORAGE_PREFIX}subscription-complete`,
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T | null): void {
  if (!isBrowser()) return;
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ——— User ———

export function getStoredUser(): User | null {
  return readJson<User>(KEYS.user);
}

export function setStoredUser(user: User | null): void {
  writeJson(KEYS.user, user);
}

export function createPocUser(
  input: Pick<User, "email" | "name"> & { authProvider?: User["authProvider"] }
): User {
  return {
    id: `user-${crypto.randomUUID()}`,
    email: input.email,
    name: input.name,
    authProvider: input.authProvider ?? "email",
    createdAt: new Date().toISOString(),
  };
}

export function signUpAndPersistUser(
  input: Pick<User, "email" | "name"> & { authProvider?: User["authProvider"] }
): User {
  const user = createPocUser(input);
  setStoredUser(user);
  initUserSession(user.id, getSelectedTwinId());
  return user;
}

// ——— Subscription ———

export function getStoredSubscription(): Subscription | null {
  return readJson<Subscription>(KEYS.subscription);
}

export function setStoredSubscription(subscription: Subscription | null): void {
  writeJson(KEYS.subscription, subscription);
}

export function createPocSubscription(
  userId: string,
  twinId: string,
  options: { startTrial?: boolean } = {}
): Subscription {
  const plan = DEFAULT_SUBSCRIPTION_PLAN;
  const startTrial = options.startTrial ?? plan.trialEnabled;
  return {
    id: `sub-${crypto.randomUUID()}`,
    userId,
    twinId,
    planName: plan.planName,
    price: plan.price,
    billingInterval: plan.billingInterval,
    status: startTrial ? "trialing" : "active",
    trialEnabled: startTrial,
    startedAt: new Date().toISOString(),
  };
}

export function completePocCheckout(
  userId: string,
  twinId: string,
  options: { startTrial: boolean }
): Subscription {
  const subscription = createPocSubscription(userId, twinId, options);
  setStoredSubscription(subscription);
  initUserSession(userId, twinId);
  setSelectedTwinId(twinId);
  markSubscriptionComplete(subscription);
  return subscription;
}

export function markSubscriptionComplete(subscription: Subscription): SubscriptionCompletion {
  const completion: SubscriptionCompletion = {
    completedAt: new Date().toISOString(),
    userId: subscription.userId,
    twinId: subscription.twinId,
    subscriptionId: subscription.id,
  };
  writeJson(KEYS.subscriptionComplete, completion);
  return completion;
}

export function getSubscriptionCompletion(): SubscriptionCompletion | null {
  return readJson<SubscriptionCompletion>(KEYS.subscriptionComplete);
}

export function hasCompletedSubscription(userId: string): boolean {
  const completion = getSubscriptionCompletion();
  const subscription = getStoredSubscription();
  if (!subscription || subscription.userId !== userId) return false;
  if (!hasActiveSubscription(userId)) return false;
  return Boolean(completion && completion.userId === userId && completion.subscriptionId === subscription.id);
}

export function hasActiveSubscription(userId: string, twinId?: string): boolean {
  const sub = getStoredSubscription();
  if (!sub || sub.userId !== userId) return false;
  if (twinId && sub.twinId !== twinId) return false;
  return sub.status === "active" || sub.status === "trialing";
}

// ——— Selected twin ———

export function getSelectedTwinId(): string | null {
  return readJson<string>(KEYS.selectedTwinId);
}

export function setSelectedTwinId(twinId: string | null): void {
  writeJson(KEYS.selectedTwinId, twinId);
}

// ——— Session (monthly allowance + chat sessions — see sessionStorage.ts) ———

export {
  consumeSession,
  endChatSession,
  ensureMonthlySessionQuota,
  getActiveChatSession,
  getSessionUsageSummary,
  getUserSession,
  initUserSession,
  mockResetMonthlySessions,
  recordChatSessionMessage,
  setUserSession,
  startChatSession,
} from "./sessionStorage";

// ——— Conversation history (see conversationStorage.ts) ———

export {
  clearConversation,
  clearConversationMessages,
  createMessageId,
  getActiveConversationId,
  getConversationMessages,
  appendConversationMessage,
  loadConversationMessages,
  saveConversationMessage,
  saveTwinMessage,
  saveUserMessage,
  setConversationMessages,
  startNewConversation,
} from "./conversationStorage";

// ——— Content drops (seed + local overrides) ———

export function getAllContentDrops(): ContentDrop[] {
  const overrides = readJson<ContentDrop[]>(KEYS.contentDrops) ?? [];
  const seed = getSeedContentDrops();
  const byId = new Map<string, ContentDrop>();

  for (const drop of seed) {
    byId.set(drop.id, drop);
  }
  for (const drop of overrides) {
    byId.set(drop.id, drop);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.publishedAt ?? "";
    const bTime = b.publishedAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

export function getContentDropsByTwinId(twinId: string): ContentDrop[] {
  return getAllContentDrops().filter((drop) => drop.twinId === twinId);
}

export function getPublishedContentDrops(twinId?: string): ContentDrop[] {
  const drops = twinId ? getContentDropsByTwinId(twinId) : getAllContentDrops();
  return drops.filter((drop) => drop.status === "published");
}

export function upsertContentDrop(drop: ContentDrop): ContentDrop[] {
  const overrides = readJson<ContentDrop[]>(KEYS.contentDrops) ?? [];
  const index = overrides.findIndex((item) => item.id === drop.id);
  const next =
    index >= 0
      ? overrides.map((item, i) => (i === index ? drop : item))
      : [...overrides, drop];
  writeJson(KEYS.contentDrops, next);
  return getAllContentDrops();
}

// ——— POC reset ———

export function clearPocStorage(): void {
  if (!isBrowser()) return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

export { KEYS as STORAGE_KEYS, DEFAULT_SUBSCRIPTION_PLAN };
