import { DEFAULT_SUBSCRIPTION_PLAN } from "../types/ricon";
import type { ChatSession, UserSession } from "../types/ricon";

const STORAGE_PREFIX = "ricon:poc:";
const MONTHLY_SESSION_KEY = `${STORAGE_PREFIX}session`;
const ACTIVE_CHAT_SESSION_KEY = `${STORAGE_PREFIX}chat-session:active`;
const CHAT_SESSION_RECORD_KEY = `${STORAGE_PREFIX}chat-session:record`;

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

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function activeChatSessionPointerKey(userId: string, twinId: string): string {
  return `${ACTIVE_CHAT_SESSION_KEY}:${userId}:${twinId}`;
}

function chatSessionRecordKey(sessionId: string): string {
  return `${CHAT_SESSION_RECORD_KEY}:${sessionId}`;
}

function createChatSessionId(): string {
  return `chat-session-${crypto.randomUUID()}`;
}

function normalizeUserSession(raw: UserSession | null, userId: string, twinId: string | null): UserSession {
  const monthKey = currentMonthKey();
  const sessionsIncluded = DEFAULT_SUBSCRIPTION_PLAN.sessionsIncluded;

  if (!raw || raw.userId !== userId) {
    return {
      userId,
      selectedTwinId: twinId,
      sessionsRemaining: sessionsIncluded,
      sessionsIncluded,
      monthKey,
      lastActiveAt: new Date().toISOString(),
    };
  }

  const migrated: UserSession = {
    userId: raw.userId,
    selectedTwinId: twinId ?? raw.selectedTwinId,
    sessionsRemaining: typeof raw.sessionsRemaining === "number" ? raw.sessionsRemaining : sessionsIncluded,
    sessionsIncluded:
      typeof raw.sessionsIncluded === "number" ? raw.sessionsIncluded : sessionsIncluded,
    monthKey: typeof raw.monthKey === "string" ? raw.monthKey : monthKey,
    lastActiveAt: raw.lastActiveAt ?? new Date().toISOString(),
  };

  if (migrated.monthKey !== monthKey) {
    return {
      ...migrated,
      monthKey,
      sessionsIncluded,
      sessionsRemaining: sessionsIncluded,
      lastActiveAt: new Date().toISOString(),
    };
  }

  return migrated;
}

function normalizeChatSession(raw: unknown): ChatSession | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.userId !== "string" ||
    typeof record.twinId !== "string" ||
    typeof record.startedAt !== "string"
  ) {
    return null;
  }

  const status = record.status === "ended" ? "ended" : "active";

  return {
    id: record.id,
    userId: record.userId,
    twinId: record.twinId,
    startedAt: record.startedAt,
    endedAt: typeof record.endedAt === "string" ? record.endedAt : null,
    messageCount: typeof record.messageCount === "number" ? record.messageCount : 0,
    status,
    sourceIdsReferenced: Array.isArray(record.sourceIdsReferenced)
      ? record.sourceIdsReferenced.filter((id): id is string => typeof id === "string")
      : [],
  };
}

function readChatSessionRecord(sessionId: string): ChatSession | null {
  return normalizeChatSession(readJson<unknown>(chatSessionRecordKey(sessionId)));
}

function writeChatSessionRecord(session: ChatSession): ChatSession {
  writeJson(chatSessionRecordKey(session.id), session);
  return session;
}

function writeUserSession(session: UserSession): UserSession {
  writeJson(MONTHLY_SESSION_KEY, session);
  return session;
}

export function getUserSession(): UserSession | null {
  return readJson<UserSession>(MONTHLY_SESSION_KEY);
}

export function setUserSession(session: UserSession | null): void {
  writeJson(MONTHLY_SESSION_KEY, session);
}

export function ensureMonthlySessionQuota(userId: string, twinId: string | null): UserSession {
  const normalized = normalizeUserSession(getUserSession(), userId, twinId);
  writeUserSession(normalized);
  return normalized;
}

export function initUserSession(userId: string, twinId: string | null): UserSession {
  return ensureMonthlySessionQuota(userId, twinId);
}

export function getSessionUsageSummary(userId: string, twinId: string | null): {
  sessionsRemaining: number;
  sessionsIncluded: number;
  label: string;
} {
  const quota = ensureMonthlySessionQuota(userId, twinId);
  return {
    sessionsRemaining: quota.sessionsRemaining,
    sessionsIncluded: quota.sessionsIncluded,
    label: `${quota.sessionsRemaining} of ${quota.sessionsIncluded} sessions remaining this month`,
  };
}

export function getActiveChatSession(userId: string, twinId: string): ChatSession | null {
  const sessionId = readJson<string>(activeChatSessionPointerKey(userId, twinId));
  if (!sessionId) return null;

  const session = readChatSessionRecord(sessionId);
  if (!session || session.userId !== userId || session.twinId !== twinId) {
    writeJson(activeChatSessionPointerKey(userId, twinId), null);
    return null;
  }

  if (session.status === "ended") {
    writeJson(activeChatSessionPointerKey(userId, twinId), null);
    return null;
  }

  return session;
}

export function startChatSession(userId: string, twinId: string): ChatSession | null {
  const existing = getActiveChatSession(userId, twinId);
  if (existing) return existing;

  const quota = ensureMonthlySessionQuota(userId, twinId);
  if (quota.sessionsRemaining <= 0) return null;

  const now = new Date().toISOString();
  const session: ChatSession = {
    id: createChatSessionId(),
    userId,
    twinId,
    startedAt: now,
    endedAt: null,
    messageCount: 0,
    status: "active",
    sourceIdsReferenced: [],
  };

  writeUserSession({
    ...quota,
    sessionsRemaining: quota.sessionsRemaining - 1,
    selectedTwinId: twinId,
    lastActiveAt: now,
  });
  writeChatSessionRecord(session);
  writeJson(activeChatSessionPointerKey(userId, twinId), session.id);
  return session;
}

export function recordChatSessionMessage(
  sessionId: string,
  options: { sourceIds?: string[] } = {}
): ChatSession | null {
  const session = readChatSessionRecord(sessionId);
  if (!session || session.status !== "active") return null;

  const sourceIds = options.sourceIds ?? [];
  const mergedSources = Array.from(new Set([...session.sourceIdsReferenced, ...sourceIds]));

  const updated: ChatSession = {
    ...session,
    messageCount: session.messageCount + 1,
    sourceIdsReferenced: mergedSources,
  };

  return writeChatSessionRecord(updated);
}

export function endChatSession(userId: string, twinId: string): ChatSession | null {
  const session = getActiveChatSession(userId, twinId);
  if (!session) return null;

  const ended: ChatSession = {
    ...session,
    status: "ended",
    endedAt: new Date().toISOString(),
  };

  writeChatSessionRecord(ended);
  writeJson(activeChatSessionPointerKey(userId, twinId), null);

  const quota = ensureMonthlySessionQuota(userId, twinId);
  writeUserSession({
    ...quota,
    lastActiveAt: ended.endedAt ?? new Date().toISOString(),
  });

  return ended;
}

/** POC helper — resets monthly allowance to the plan default. */
export function mockResetMonthlySessions(userId: string, twinId: string | null = null): UserSession {
  const sessionsIncluded = DEFAULT_SUBSCRIPTION_PLAN.sessionsIncluded;
  const reset: UserSession = {
    userId,
    selectedTwinId: twinId ?? getUserSession()?.selectedTwinId ?? null,
    sessionsRemaining: sessionsIncluded,
    sessionsIncluded,
    monthKey: currentMonthKey(),
    lastActiveAt: new Date().toISOString(),
  };
  return writeUserSession(reset);
}

/** @deprecated Use startChatSession — kept for backward compatibility. */
export function consumeSession(userId: string): UserSession | null {
  const session = getUserSession();
  if (!session || session.userId !== userId) return null;
  if (session.sessionsRemaining <= 0) return session;

  const updated: UserSession = {
    ...ensureMonthlySessionQuota(userId, session.selectedTwinId),
    sessionsRemaining: session.sessionsRemaining - 1,
    lastActiveAt: new Date().toISOString(),
  };
  return writeUserSession(updated);
}
