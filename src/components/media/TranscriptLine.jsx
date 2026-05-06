import { forwardRef } from "react";

const formatTranscriptTime = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const TranscriptLine = forwardRef(function TranscriptLine({ line, active, onSelect, onKeyDown }, ref) {
  const canJump = Boolean(line?.momentId);
  return (
    <button
      ref={ref}
      type="button"
      className={`transcript-line ${active ? "transcript-line-active" : ""}`}
      onClick={() => onSelect?.(line)}
      onKeyDown={onKeyDown}
      disabled={!canJump}
      aria-current={active ? "true" : undefined}
      aria-label={canJump ? `Jump to transcript line ${line.text}` : `Transcript line ${line.text}`}
    >
      <span className="transcript-line-time">{formatTranscriptTime(line.startTime)}</span>
      <span className="transcript-line-copy">{line.text}</span>
      {canJump && <span className="transcript-line-action">Jump</span>}
    </button>
  );
});

export default TranscriptLine;
