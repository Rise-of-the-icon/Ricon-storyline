import { useMemo } from "react";
import { resolveSourceDisplays } from "../../lib/sourceDisplay.ts";

export default function SourceAttribution({ sourceIds = [], responseType, status = "complete" }) {
  const sources = useMemo(() => resolveSourceDisplays(sourceIds), [sourceIds]);
  const isStreaming = status === "streaming";
  const hasVerifiedSources =
    sources.length > 0 && responseType !== "fallback" && responseType !== "refusal";
  const showUnavailable =
    !isStreaming &&
    (responseType === "fallback" || responseType === "refusal" || sources.length === 0);

  if (isStreaming) {
    return (
      <div className="source-attribution" aria-live="polite">
        <div className="source-attribution-header">
          <span className="source-attribution-badge is-pending">
            <span aria-hidden="true">◌ </span>
            Composing verified response…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="source-attribution">
      <div className="source-attribution-header">
        <span className="source-attribution-badge">
          <span aria-hidden="true">✓ </span>
          Verified Twin Response
        </span>
      </div>

      {hasVerifiedSources && (
        <>
          <div className="source-chip-row" aria-label="Response sources">
            {sources.map((source) => (
              <span key={source.id} className="source-chip">
                {source.year && <span className="source-chip-year">{source.year}</span>}
                <span className="source-chip-title">{source.title}</span>
              </span>
            ))}
          </div>

          <details className="source-details">
            <summary className="source-details-toggle">View sources</summary>
            <ul className="source-details-list">
              {sources.map((source) => (
                <li key={source.id} className="source-details-item">
                  <div className="source-details-title">{source.title}</div>
                  <div className="source-details-meta">
                    <span>{source.typeLabel}</span>
                    {source.year && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>{source.year}</span>
                      </>
                    )}
                  </div>
                  <div className="source-details-citation">{source.citation}</div>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}

      {showUnavailable && (
        <p className="source-unavailable">No verified source available for this request</p>
      )}
    </div>
  );
}
