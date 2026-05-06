export default function CaptionToggle({ enabled, available = false, onToggle }) {
  return (
    <button
      type="button"
      className="media-player-control-button"
      aria-pressed={enabled}
      aria-describedby={!available ? "caption-toggle-note" : undefined}
      onClick={onToggle}
    >
      Captions
      {!available && <span id="caption-toggle-note" className="sr-only">Captions are a UI-only placeholder for this media.</span>}
    </button>
  );
}
