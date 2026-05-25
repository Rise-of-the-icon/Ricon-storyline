import { getTwinById } from "../data/twins";
import type { ContentDrop, FanNotification } from "../types/ricon";

const STORAGE_KEY = "ricon:poc:notifications";
const UPDATE_EVENT = "ricon:notifications-updated";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readNotifications(): FanNotification[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FanNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications: FanNotification[]): FanNotification[] {
  if (!isBrowser()) return notifications;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  return notifications;
}

export function getFanNotifications(): FanNotification[] {
  return readNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadNotificationCount(): number {
  return getFanNotifications().filter((notification) => !notification.read).length;
}

export function createPublishedDropNotification(drop: ContentDrop): FanNotification {
  const twin = getTwinById(drop.twinId);
  const twinName = twin?.name ?? "your twin";

  const notification: FanNotification = {
    id: `notif-${crypto.randomUUID()}`,
    audience: "all-fans",
    userId: null,
    twinId: drop.twinId,
    dropId: drop.id,
    title: `New verified drop from ${twinName}`,
    message: "A new approved story is ready in RICON Core",
    createdAt: new Date().toISOString(),
    read: false,
  };

  const next = [notification, ...readNotifications()];
  writeNotifications(next);
  return notification;
}

export function markNotificationRead(notificationId: string): FanNotification[] {
  const next = readNotifications().map((notification) =>
    notification.id === notificationId ? { ...notification, read: true } : notification
  );
  return writeNotifications(next);
}

export function markNotificationsReadForDrop(dropId: string): FanNotification[] {
  const next = readNotifications().map((notification) =>
    notification.dropId === dropId ? { ...notification, read: true } : notification
  );
  return writeNotifications(next);
}

export function markAllNotificationsRead(): FanNotification[] {
  const next = readNotifications().map((notification) => ({ ...notification, read: true }));
  return writeNotifications(next);
}

export function subscribeToNotificationUpdates(callback: () => void): () => void {
  if (!isBrowser()) return () => undefined;

  const handleUpdate = () => callback();
  window.addEventListener(UPDATE_EVENT, handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

export function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isBrowser() || typeof window.Notification === "undefined") {
    return Promise.resolve("unsupported");
  }
  return window.Notification.requestPermission();
}

export function showBrowserNotification(notification: FanNotification): void {
  if (!isBrowser() || typeof window.Notification === "undefined") return;
  if (window.Notification.permission !== "granted") return;

  const native = new window.Notification(notification.title, {
    body: notification.message,
    tag: notification.id,
  });

  native.onclick = () => {
    window.focus();
    window.location.assign(`/feed?dropId=${encodeURIComponent(notification.dropId)}`);
    native.close();
  };
}

export { UPDATE_EVENT as NOTIFICATION_UPDATE_EVENT };
