import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { formatDropType, formatPublishedDate } from "../../lib/contentDropFeed";

export default function ContentDropDetailModal({
  drop,
  twinName,
  askTwinHref,
  askTwinLabel = "Ask the twin about this",
  onClose,
}) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    previousActiveElement.current = document.activeElement;
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [onClose]);

  if (!drop) return null;

  return (
    <div
      ref={modalRef}
      className="modal-root feed-drop-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="modal-header">
        <div>
          <div id={descriptionId} className="modal-status">
            <span aria-hidden="true">✦ </span>
            {formatDropType(drop.type)} · {twinName}
          </div>
          <h2 id={titleId} className="modal-title">{drop.title}</h2>
        </div>
        <div className="nav-spacer" />
        <button ref={closeButtonRef} type="button" className="close-button" onClick={onClose}>
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="feed-drop-modal-body">
        <div className="feed-drop-meta-row">
          <span className="feed-type-pill">{formatDropType(drop.type)}</span>
          <span className="feed-card-date">{formatPublishedDate(drop.publishedAt)}</span>
        </div>

        <p className="feed-drop-summary">{drop.summary}</p>
        <div className="feed-drop-body">{drop.body}</div>

        <div className="feed-drop-source-panel">
          <div className="feed-drop-source-label">Verified source</div>
          <div className="feed-card-source">
            <span className="feed-verified-mark" aria-hidden="true">✓</span>
            <span>
              {drop.source.label}
              {drop.source.year ? ` · ${drop.source.year}` : ""}
            </span>
          </div>
        </div>

        <div className="feed-drop-actions">
          <Link to={askTwinHref} className="primary-button premium-button">
            <span aria-hidden="true">◉ </span>
            {askTwinLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
