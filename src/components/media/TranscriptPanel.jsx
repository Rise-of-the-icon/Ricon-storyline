import { useEffect, useMemo, useRef, useState } from "react";
import TranscriptLine from "./TranscriptLine.jsx";
import TranscriptSearch from "./TranscriptSearch.jsx";

export default function TranscriptPanel({
  open,
  lines = [],
  activeMomentId,
  onClose,
  onMomentChange,
  triggerRef,
}) {
  const closeRef = useRef(null);
  const lineRefs = useRef([]);
  const [query, setQuery] = useState("");
  const visibleLines = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return lines;
    return lines.filter((line) => line.text.toLowerCase().includes(term));
  }, [lines, query]);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus?.();
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose?.();
      window.setTimeout(() => triggerRef?.current?.focus?.(), 0);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, triggerRef]);

  if (!open) return null;

  const closePanel = () => {
    onClose?.();
    window.setTimeout(() => triggerRef?.current?.focus?.(), 0);
  };

  const selectLine = (line) => {
    if (!line?.momentId) return;
    onMomentChange?.(line.momentId);
  };

  const handleLineKeyDown = (event, index) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? visibleLines.length - 1
        : Math.min(Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0), visibleLines.length - 1);
    lineRefs.current[nextIndex]?.focus?.();
  };

  return (
    <aside className="transcript-panel" role="dialog" aria-modal="false" aria-labelledby="transcript-panel-title">
      <div className="transcript-panel-header">
        <div>
          <div className="media-player-kicker">Transcript</div>
          <h3 id="transcript-panel-title">Moment transcript</h3>
        </div>
        <button ref={closeRef} type="button" className="transcript-panel-close" onClick={closePanel} aria-label="Close transcript panel">
          Close
        </button>
      </div>

      <TranscriptSearch value={query} onChange={setQuery} />

      {visibleLines.length ? (
        <div className="transcript-line-list" role="list" aria-label="Transcript lines">
          {visibleLines.map((line, index) => (
            <div key={line.id} role="listitem">
              <TranscriptLine
                ref={(node) => {
                  if (node) lineRefs.current[index] = node;
                }}
                line={line}
                active={line.momentId === activeMomentId}
                onSelect={selectLine}
                onKeyDown={(event) => handleLineKeyDown(event, index)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="transcript-empty" role="status">
          No transcript lines are available for this media yet. Transcript ingestion will connect here when real assets are attached.
        </div>
      )}
    </aside>
  );
}
