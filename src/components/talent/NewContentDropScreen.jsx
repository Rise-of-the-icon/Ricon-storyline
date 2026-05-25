import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getTwins } from "../../data/twins";
import { upsertContentDrop } from "../../lib/storage";
import { createPublishedDropNotification } from "../../lib/notificationStorage";
import { formatDropType } from "../../lib/contentDropFeed";
import {
  buildContentDropFromForm,
  CONTENT_DROP_STATUS_OPTIONS,
  CONTENT_DROP_TYPE_OPTIONS,
  createEmptyContentDropForm,
  formValuesToPreviewDrop,
  validateContentDropForm,
} from "../../lib/contentDropForm";
import ContentDropCard from "../feed/ContentDropCard";
import TalentLayout from "./TalentLayout";

function SuccessState({ drop, onSubmitAnother }) {
  const twin = getTwins().find((item) => item.id === drop.twinId);

  return (
    <div className="talent-success-card" role="status">
      <div className="talent-success-kicker">Submitted</div>
      <h2 className="talent-success-title">Content drop submitted</h2>
      <p className="talent-success-copy">
        <strong>{drop.title}</strong> for {twin?.name ?? "your twin"} was saved locally
        {drop.status === "published" ? " and will appear in the fan feed." : "."}
      </p>
      <div className="talent-success-actions">
        {drop.status === "published" && (
          <Link to="/feed" className="primary-button premium-button">
            View in Feed
          </Link>
        )}
        <button type="button" className="secondary-button" onClick={onSubmitAnother}>
          Submit another
        </button>
      </div>
    </div>
  );
}

export default function NewContentDropScreen() {
  const twins = getTwins();
  const [form, setForm] = useState(createEmptyContentDropForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedDrop, setSubmittedDrop] = useState(null);

  const previewDrop = useMemo(() => formValuesToPreviewDrop(form), [form]);
  const selectedTwin = twins.find((twin) => twin.id === form.twinId);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateContentDropForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    window.setTimeout(() => {
      const drop = buildContentDropFromForm(form);
      upsertContentDrop(drop);
      if (drop.status === "published") {
        createPublishedDropNotification(drop);
      }
      setSubmittedDrop(drop);
      setSubmitting(false);
    }, 280);
  };

  const handleSubmitAnother = () => {
    setSubmittedDrop(null);
    setForm(createEmptyContentDropForm());
    setErrors({});
  };

  if (submittedDrop) {
    return (
      <TalentLayout title="New content drop" lead="Talent-side submission for the fan feed POC.">
        <SuccessState drop={submittedDrop} onSubmitAnother={handleSubmitAnother} />
      </TalentLayout>
    );
  }

  return (
    <TalentLayout
      title="New content drop"
      lead="Submit approved material for the fan feed. Published drops appear immediately in localStorage for this demo."
    >
      <div className="talent-form-layout">
        <form className="talent-form auth-card" onSubmit={handleSubmit} noValidate>
          <h2 className="auth-card-title">Drop details</h2>
          <p className="auth-card-copy">
            Required fields are validated before save. Only published drops surface to fans.
          </p>

          <div className="auth-form">
            <div className="form-field">
              <label className="form-label" htmlFor="drop-twin">
                Twin
              </label>
              <select
                id="drop-twin"
                className={errors.twinId ? "form-input has-error" : "form-input"}
                value={form.twinId}
                onChange={(event) => updateField("twinId", event.target.value)}
              >
                <option value="">Select twin</option>
                {twins.map((twin) => (
                  <option key={twin.id} value={twin.id}>
                    {twin.name}
                  </option>
                ))}
              </select>
              {errors.twinId && <span className="form-error">{errors.twinId}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="drop-title">
                Title
              </label>
              <input
                id="drop-title"
                className={errors.title ? "form-input has-error" : "form-input"}
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="The Last Shot — Behind the Broadcast"
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="drop-type">
                Content type
              </label>
              <select
                id="drop-type"
                className={errors.type ? "form-input has-error" : "form-input"}
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
              >
                <option value="">Select type</option>
                {CONTENT_DROP_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {formatDropType(type)}
                  </option>
                ))}
              </select>
              {errors.type && <span className="form-error">{errors.type}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="drop-summary">
                Summary
              </label>
              <textarea
                id="drop-summary"
                className={errors.summary ? "form-input has-error twin-textarea" : "form-input twin-textarea"}
                rows={3}
                value={form.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                placeholder="One-line fan-facing summary"
              />
              {errors.summary && <span className="form-error">{errors.summary}</span>}
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="drop-body">
                Body / content
              </label>
              <textarea
                id="drop-body"
                className={errors.body ? "form-input has-error twin-textarea" : "form-input twin-textarea"}
                rows={6}
                value={form.body}
                onChange={(event) => updateField("body", event.target.value)}
                placeholder="Full verified copy fans will read in the drop detail view"
              />
              {errors.body && <span className="form-error">{errors.body}</span>}
            </div>

            <fieldset className="talent-fieldset">
              <legend className="form-label">Source</legend>
              <div className="form-field">
                <label className="form-label" htmlFor="drop-source-title">
                  Source title
                </label>
                <input
                  id="drop-source-title"
                  className={errors.sourceTitle ? "form-input has-error" : "form-input"}
                  value={form.sourceTitle}
                  onChange={(event) => updateField("sourceTitle", event.target.value)}
                  placeholder="NBA Finals Records · June 14 1998"
                />
                {errors.sourceTitle && <span className="form-error">{errors.sourceTitle}</span>}
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="drop-source-note">
                  Source URL or note
                </label>
                <input
                  id="drop-source-note"
                  className="form-input"
                  value={form.sourceNote}
                  onChange={(event) => updateField("sourceNote", event.target.value)}
                  placeholder="Optional URL or archive note"
                />
              </div>
            </fieldset>

            <div className="talent-form-row">
              <div className="form-field">
                <label className="form-label" htmlFor="drop-publish-date">
                  Publish date
                </label>
                <input
                  id="drop-publish-date"
                  type="date"
                  className={errors.publishDate ? "form-input has-error" : "form-input"}
                  value={form.publishDate}
                  onChange={(event) => updateField("publishDate", event.target.value)}
                />
                {errors.publishDate && <span className="form-error">{errors.publishDate}</span>}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="drop-status">
                  Status
                </label>
                <select
                  id="drop-status"
                  className="form-input"
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                >
                  {CONTENT_DROP_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button premium-button auth-submit"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit content drop"}
            </button>
          </div>
        </form>

        <aside className="talent-preview-panel" aria-labelledby="talent-preview-title">
          <div className="talent-preview-header">
            <h2 id="talent-preview-title" className="section-kicker">
              FAN CARD PREVIEW
            </h2>
            <p className="talent-preview-copy">
              Live preview of how this drop will appear in the feed.
            </p>
          </div>

          {previewDrop ? (
            <ContentDropCard
              drop={{
                ...previewDrop,
                publishedAt:
                  form.status === "published" && form.publishDate
                    ? new Date(`${form.publishDate}T12:00:00`).toISOString()
                    : null,
              }}
              twinName={selectedTwin?.name ?? "Twin"}
              highlighted={form.status === "published"}
              onOpen={() => {}}
            />
          ) : (
            <div className="talent-preview-empty">
              Select a twin and add a title to preview the fan card.
            </div>
          )}

          <div className="talent-preview-meta">
            <span className="feed-type-pill">
              Status · {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
            </span>
            {form.status !== "published" && (
              <p className="talent-preview-note">
                Draft and approved drops are saved locally but hidden from the fan feed.
              </p>
            )}
          </div>
        </aside>
      </div>
    </TalentLayout>
  );
}
