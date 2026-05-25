import { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { setSelectedTwinId } from "../lib/storage";

export default function TwinAccessGateModal({ athlete, access, onClose }) {
  const navigate = useNavigate();
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

  const handleCta = () => {
    setSelectedTwinId(athlete.id);
    onClose();
    navigate(access.ctaRoute);
  };

  const firstName = athlete.name.split(" ")[0].replace(/^The$/, athlete.name.split(" ")[1] || "legend");

  return (
    <div
      ref={modalRef}
      className="modal-root twin-gate-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="modal-header">
        <div>
          <div className="modal-status">
            <span aria-hidden="true">◌ </span>
            Digital Twin · Locked
          </div>
          <h2 id={titleId} className="modal-title">{athlete.name}</h2>
        </div>
        <div className="nav-spacer" />
        <button ref={closeButtonRef} type="button" className="close-button" onClick={onClose}>
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="twin-gate-body">
        <div className="twin-gate-card">
          <div className="twin-gate-lock" aria-hidden="true">
            ◉
          </div>

          <h3 className="twin-gate-title">{access.title}</h3>
          <p id={descriptionId} className="twin-gate-copy">
            {access.message}
          </p>

          <div className="twin-gate-preview">
            {athlete.headshot && (
              <img className="twin-gate-avatar" src={athlete.headshot} alt="" />
            )}
            <div>
              <div className="twin-gate-preview-label">Verified digital twin</div>
              <div className="twin-gate-preview-name">{firstName}&apos;s interactive Q&amp;A &amp; narrator modes</div>
            </div>
          </div>

          <ul className="twin-gate-features">
            <li>Narrator mode — relive verified career moments</li>
            <li>Q&amp;A mode — ask questions grounded in Core facts</li>
            <li>Storyline Access · $9.99/month · All twins · Cancel anytime</li>
          </ul>

          <button
            type="button"
            className="primary-button premium-button cta-glow twin-gate-cta"
            onClick={handleCta}
          >
            <span aria-hidden="true">◉ </span>
            {access.ctaLabel}
          </button>

          <button type="button" className="ghost-button twin-gate-dismiss" onClick={onClose}>
            Continue browsing story
          </button>
        </div>
      </div>
    </div>
  );
}
