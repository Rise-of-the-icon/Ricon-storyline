import type {
  ConversationMessage,
  ConversationThread,
  MessageClassification,
  MessageRole,
  ResponseType,
} from "../types/ricon";

const STORAGE_PREFIX = "ricon:poc:";
const THREAD_KEY = `${STORAGE_PREFIX}conversation:v2`;
const LEGACY_MESSAGE_KEY = `${STORAGE_PREFIX}messages`;

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

function threadStorageKey(userId: string, twinId: string): string {
  return `${THREAD_KEY}:${userId}:${twinId}`;
}

function legacyStorageKey(userId: string, twinId: string): string {
  return `${LEGACY_MESSAGE_KEY}:${userId}:${twinId}`;
}

function createConversationId(): string {
  return `conv-${crypto.randomUUID()}`;
}

function isValidRole(role: unknown): role is MessageRole {
  return role === "user" || role === "twin" || role === "system";
}

function normalizeLegacyMessage(
  raw: unknown,
  userId: string,
  twinId: string,
  conversationId: string
): ConversationMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.content !== "string") return null;

  const role = record.role === "assistant" ? "twin" : record.role;
  if (!isValidRole(role)) return null;

  return {
    id: record.id,
    conversationId,
    userId: typeof record.userId === "string" ? record.userId : userId,
    twinId: typeof record.twinId === "string" ? record.twinId : twinId,
    role,
    content: record.content,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    sourceIds: Array.isArray(record.sourceIds)
      ? record.sourceIds.filter((id): id is string => typeof id === "string")
      : [],
    responseType:
      record.responseType === "grounded" ||
      record.responseType === "fallback" ||
      record.responseType === "refusal"
        ? record.responseType
        : undefined,
    classification: isValidClassification(record.classification) ? record.classification : undefined,
    confidence: typeof record.confidence === "number" ? record.confidence : undefined,
  };
}

function isValidClassification(value: unknown): value is MessageClassification {
  return (
    value === "grounded_fact_question" ||
    value === "content_drop_question" ||
    value === "personal_advice_safe" ||
    value === "out_of_scope" ||
    value === "political_or_civic_persuasion" ||
    value === "fabrication_request" ||
    value === "unsafe_or_sensitive"
  );
}

function sortMessages(messages: ConversationMessage[]): ConversationMessage[] {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function dedupeMessages(messages: ConversationMessage[]): ConversationMessage[] {
  const byId = new Map<string, ConversationMessage>();
  for (const message of sortMessages(messages)) {
    byId.set(message.id, message);
  }
  return sortMessages(Array.from(byId.values()));
}

function createEmptyThread(userId: string, twinId: string): ConversationThread {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    conversationId: createConversationId(),
    userId,
    twinId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function migrateLegacyThread(userId: string, twinId: string): ConversationThread | null {
  const legacy = readJson<unknown[]>(legacyStorageKey(userId, twinId));
  if (!Array.isArray(legacy) || legacy.length === 0) return null;

  const conversationId = createConversationId();
  const messages = dedupeMessages(
    legacy
      .map((item) => normalizeLegacyMessage(item, userId, twinId, conversationId))
      .filter((message): message is ConversationMessage => Boolean(message))
  );

  if (messages.length === 0) return null;

  const now = new Date().toISOString();
  const thread: ConversationThread = {
    schemaVersion: 2,
    conversationId,
    userId,
    twinId,
    createdAt: messages[0]?.createdAt ?? now,
    updatedAt: messages[messages.length - 1]?.createdAt ?? now,
    messages,
  };

  writeJson(threadStorageKey(userId, twinId), thread);
  writeJson(legacyStorageKey(userId, twinId), null);
  return thread;
}

function readThread(userId: string, twinId: string): ConversationThread {
  const key = threadStorageKey(userId, twinId);
  const stored = readJson<ConversationThread>(key);

  if (stored?.schemaVersion === 2 && stored.userId === userId && stored.twinId === twinId) {
    return {
      ...stored,
      messages: dedupeMessages(
        stored.messages.filter(
          (message) =>
            message &&
            typeof message.id === "string" &&
            typeof message.content === "string" &&
            isValidRole(message.role)
        )
      ),
    };
  }

  const migrated = migrateLegacyThread(userId, twinId);
  if (migrated) return migrated;

  const empty = createEmptyThread(userId, twinId);
  writeJson(key, empty);
  return empty;
}

function writeThread(thread: ConversationThread): ConversationThread {
  const normalized: ConversationThread = {
    ...thread,
    messages: dedupeMessages(thread.messages),
    updatedAt: new Date().toISOString(),
  };
  writeJson(threadStorageKey(thread.userId, thread.twinId), normalized);
  return normalized;
}

export function getActiveConversationId(userId: string, twinId: string): string {
  return readThread(userId, twinId).conversationId;
}

export function loadConversationMessages(userId: string, twinId: string): ConversationMessage[] {
  return readThread(userId, twinId).messages;
}

export function saveConversationMessage(
  userId: string,
  twinId: string,
  message: Omit<ConversationMessage, "conversationId" | "userId" | "twinId"> & {
    conversationId?: string;
    userId?: string;
    twinId?: string;
  }
): ConversationMessage[] {
  const thread = readThread(userId, twinId);
  const normalized: ConversationMessage = {
    id: message.id,
    conversationId: thread.conversationId,
    userId,
    twinId,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
    sourceIds: message.sourceIds ?? [],
    responseType: message.responseType,
    classification: message.classification,
    confidence: message.confidence,
  };

  const index = thread.messages.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    thread.messages[index] = normalized;
  } else {
    thread.messages.push(normalized);
  }

  return writeThread(thread).messages;
}

export function startNewConversation(userId: string, twinId: string): ConversationThread {
  writeJson(legacyStorageKey(userId, twinId), null);
  return writeThread(createEmptyThread(userId, twinId));
}

export function clearConversation(userId: string, twinId: string): void {
  writeJson(threadStorageKey(userId, twinId), null);
  writeJson(legacyStorageKey(userId, twinId), null);
}

/** @deprecated Use loadConversationMessages */
export function getConversationMessages(userId: string, twinId: string): ConversationMessage[] {
  return loadConversationMessages(userId, twinId);
}

/** @deprecated Use saveConversationMessage */
export function appendConversationMessage(
  userId: string,
  twinId: string,
  message: ConversationMessage
): ConversationMessage[] {
  return saveConversationMessage(userId, twinId, message);
}

/** @deprecated Use clearConversation */
export function setConversationMessages(
  userId: string,
  twinId: string,
  messages: ConversationMessage[]
): void {
  const thread = readThread(userId, twinId);
  writeThread({
    ...thread,
    messages: dedupeMessages(messages),
  });
}

export function clearConversationMessages(userId: string, twinId: string): void {
  clearConversation(userId, twinId);
}

export function createMessageId(): string {
  return `msg-${crypto.randomUUID()}`;
}

export type SaveUserMessageInput = {
  id: string;
  content: string;
  createdAt?: string;
};

export type SaveTwinMessageInput = {
  id: string;
  content: string;
  sourceIds: string[];
  responseType?: ResponseType;
  classification?: MessageClassification;
  confidence?: number;
  createdAt?: string;
};

export function saveUserMessage(
  userId: string,
  twinId: string,
  input: SaveUserMessageInput
): ConversationMessage[] {
  return saveConversationMessage(userId, twinId, {
    id: input.id,
    role: "user",
    content: input.content,
    createdAt: input.createdAt ?? new Date().toISOString(),
    sourceIds: [],
  });
}

export function saveTwinMessage(
  userId: string,
  twinId: string,
  input: SaveTwinMessageInput
): ConversationMessage[] {
  return saveConversationMessage(userId, twinId, {
    id: input.id,
    role: "twin",
    content: input.content,
    createdAt: input.createdAt ?? new Date().toISOString(),
    sourceIds: input.sourceIds,
    responseType: input.responseType,
    classification: input.classification,
    confidence: input.confidence,
  });
}
