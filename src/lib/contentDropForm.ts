import type { ContentDrop, ContentDropStatus, ContentDropType } from "../types/ricon";

export interface ContentDropFormValues {
  twinId: string;
  title: string;
  type: ContentDropType | "";
  summary: string;
  body: string;
  sourceTitle: string;
  sourceNote: string;
  publishDate: string;
  status: ContentDropStatus;
}

export const CONTENT_DROP_TYPE_OPTIONS: ContentDropType[] = [
  "pre-match",
  "studio diary",
  "training",
  "behind-the-scenes",
  "announcement",
  "reflection",
];

export const CONTENT_DROP_STATUS_OPTIONS: ContentDropStatus[] = [
  "draft",
  "approved",
  "published",
];

export function createEmptyContentDropForm(): ContentDropFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    twinId: "",
    title: "",
    type: "",
    summary: "",
    body: "",
    sourceTitle: "",
    sourceNote: "",
    publishDate: today,
    status: "draft",
  };
}

export type ContentDropFormErrors = Partial<Record<keyof ContentDropFormValues, string>>;

export function validateContentDropForm(values: ContentDropFormValues): ContentDropFormErrors {
  const errors: ContentDropFormErrors = {};

  if (!values.twinId.trim()) errors.twinId = "Select a twin.";
  if (!values.title.trim()) errors.title = "Title is required.";
  if (!values.type) errors.type = "Select a content type.";
  if (!values.summary.trim()) errors.summary = "Summary is required.";
  if (!values.body.trim()) errors.body = "Body content is required.";
  if (!values.sourceTitle.trim()) errors.sourceTitle = "Source title is required.";

  if (values.status === "published" && !values.publishDate) {
    errors.publishDate = "Publish date is required for published drops.";
  }

  return errors;
}

export function buildContentDropFromForm(
  values: ContentDropFormValues,
  options: { dropId?: string; createdBy?: string } = {}
): ContentDrop {
  const twinId = values.twinId.trim();
  const dropId = options.dropId ?? `drop-${twinId}-${crypto.randomUUID()}`;
  const sourceId = `src-${twinId}-${dropId.replace(/^drop-/, "")}`;
  const sourceLabel = values.sourceNote.trim()
    ? `${values.sourceTitle.trim()} · ${values.sourceNote.trim()}`
    : values.sourceTitle.trim();

  const publishYear = values.publishDate
    ? new Date(`${values.publishDate}T12:00:00`).getFullYear().toString()
    : undefined;

  const publishedAt =
    values.status === "published" && values.publishDate
      ? new Date(`${values.publishDate}T12:00:00`).toISOString()
      : null;

  return {
    id: dropId,
    twinId,
    title: values.title.trim(),
    type: values.type as ContentDropType,
    summary: values.summary.trim(),
    body: values.body.trim(),
    source: {
      id: sourceId,
      label: sourceLabel,
      twinId,
      year: publishYear,
    },
    status: values.status,
    publishedAt,
    createdBy: options.createdBy ?? "ricon-talent-team",
  };
}

export function formValuesToPreviewDrop(values: ContentDropFormValues): ContentDrop | null {
  if (!values.twinId || !values.title.trim() || !values.type) return null;

  try {
    return buildContentDropFromForm(
      {
        ...values,
        status: values.status === "published" ? "published" : "approved",
      },
      { dropId: "preview-drop", createdBy: "preview" }
    );
  } catch {
    return null;
  }
}
