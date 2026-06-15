import type { ContentDrop } from "../types/ricon";
import { getAllContentDrops } from "./storage";

export function formatDropType(type: ContentDrop["type"]): string {
  return type
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPublishedDate(iso: string | null | undefined): string {
  if (!iso) return "Recently published";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getContentDropById(dropId: string): ContentDrop | undefined {
  return getAllContentDrops().find((drop) => drop.id === dropId && drop.status === "published");
}

export function getPublishedDropsSorted(twinId?: string): ContentDrop[] {
  const drops = getAllContentDrops().filter((drop) => drop.status === "published");
  const scoped = twinId ? drops.filter((drop) => drop.twinId === twinId) : drops;
  return scoped.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export function partitionDropsByTwin(drops: ContentDrop[], twinId: string) {
  const twinDrops = drops.filter((drop) => drop.twinId === twinId);
  const otherDrops = drops.filter((drop) => drop.twinId !== twinId);
  return { twinDrops, otherDrops };
}

export function buildDropChatPrompt(drop: ContentDrop): string {
  return `Tell me about the content drop "${drop.title}" — ${drop.summary}`;
}

export function buildDropChatHref(drop: ContentDrop): string {
  const params = new URLSearchParams({
    openTwin: "qa",
    dropId: drop.id,
  });
  return `/legend/${drop.twinId}?${params.toString()}`;
}
