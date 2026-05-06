import michaelJordanLastShotStory from "../data/stories/michael-jordan-last-shot";
import type {
  MomentKind,
  Story,
  StoryChapter,
  StoryMoment,
  SuggestedPrompt,
} from "../data/stories/types";

export const sampleStories: Story[] = [michaelJordanLastShotStory];

function safeStories(stories: Story[] = sampleStories) {
  return Array.isArray(stories) ? stories.filter(Boolean) : [];
}

export function getStoryBySlug(slug: string, stories: Story[] = sampleStories): Story | null {
  if (!slug) return null;
  return safeStories(stories).find((story) => story.slug === slug) || null;
}

export function getFeaturedStory(stories: Story[] = sampleStories): Story | null {
  const list = safeStories(stories);
  return list.find((story) => story.status === "published") || list[0] || null;
}

export function getStoryMoments(story?: Story | null): StoryMoment[] {
  if (!story) return [];
  const chapterMoments = (story.chapters || []).flatMap((chapter) => chapter.moments || []);
  const timelineMoments = story.timeline || [];
  const seen = new Set<string>();
  return [...chapterMoments, ...timelineMoments].filter((moment) => {
    if (!moment?.id || seen.has(moment.id)) return false;
    seen.add(moment.id);
    return true;
  });
}

export function getMomentById(story: Story | null | undefined, momentId: string): StoryMoment | null {
  if (!story || !momentId) return null;
  return getStoryMoments(story).find((moment) => moment.id === momentId) || null;
}

export function getNextMoment(story: Story | null | undefined, momentId: string): StoryMoment | null {
  const moments = getStoryMoments(story);
  const index = moments.findIndex((moment) => moment.id === momentId);
  if (index < 0 || index >= moments.length - 1) return null;
  return moments[index + 1] || null;
}

export function getPreviousMoment(story: Story | null | undefined, momentId: string): StoryMoment | null {
  const moments = getStoryMoments(story);
  const index = moments.findIndex((moment) => moment.id === momentId);
  if (index <= 0) return null;
  return moments[index - 1] || null;
}

export function getChapterByMomentId(story: Story | null | undefined, momentId: string): StoryChapter | null {
  if (!story || !momentId) return null;
  return (story.chapters || []).find((chapter) => (
    (chapter.moments || []).some((moment) => moment.id === momentId)
  )) || null;
}

export function getSuggestedPromptsForMoment(
  story: Story | null | undefined,
  momentId: string,
): SuggestedPrompt[] {
  if (!story || !momentId) return [];
  const moment = getMomentById(story, momentId);
  const chapter = getChapterByMomentId(story, momentId);
  const promptIds = new Set([
    ...(moment?.suggestedPromptIds || []),
    ...(chapter?.suggestedPromptIds || []),
  ]);

  return (story.suggestedPrompts || []).filter((prompt) => (
    promptIds.has(prompt.id) ||
    prompt.momentId === momentId ||
    prompt.chapterId === chapter?.id
  ));
}

export function getVerificationBadges(
  item?: Pick<Story | StoryChapter | StoryMoment, "verification"> | null,
): string[] {
  return item?.verification?.badges?.filter(Boolean) || [];
}

export function formatStoryDate(value?: string | null, locale = "en-US"): string {
  if (!value) return "";
  if (/^\d{4}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatRuntime(seconds?: number | null): string {
  if (!Number.isFinite(seconds) || Number(seconds) < 0) return "0:00";
  const total = Math.floor(Number(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function groupMomentsByChapter(story: Story | null | undefined): Array<{
  chapter: StoryChapter;
  moments: StoryMoment[];
}> {
  if (!story) return [];
  return (story.chapters || []).map((chapter) => ({
    chapter,
    moments: chapter.moments || [],
  }));
}

export function filterMomentsByCategory(
  story: Story | null | undefined,
  category?: MomentKind | MomentKind[] | string | string[] | null,
): StoryMoment[] {
  const moments = getStoryMoments(story);
  if (!category) return moments;
  const categories = new Set((Array.isArray(category) ? category : [category]).filter(Boolean));
  if (!categories.size) return moments;
  return moments.filter((moment) => categories.has(moment.kind));
}
