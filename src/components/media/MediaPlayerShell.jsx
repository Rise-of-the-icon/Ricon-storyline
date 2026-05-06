import { useEffect, useMemo, useRef, useState } from "react";
import CaptionToggle from "./CaptionToggle.jsx";
import TranscriptPanel from "./TranscriptPanel.jsx";
import "./MediaPlayerShell.css";

const formatTime = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export default function MediaPlayerShell({
  media,
  chapters = [],
  activeMoment,
  onMomentChange,
  onAskAboutMoment,
}) {
  const duration = Number(media?.durationSeconds) > 0 ? Number(media.durationSeconds) : 24;
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const transcriptButtonRef = useRef(null);
  const unavailable = !media?.url;
  const markers = useMemo(() => (
    chapters.flatMap((chapter) => chapter.moments || []).map((moment, index, all) => ({
      id: moment.id,
      label: moment.title,
      time: Math.min(duration, Math.round((index / Math.max(all.length - 1, 1)) * duration)),
    }))
  ), [chapters, duration]);
  const transcriptLines = useMemo(() => {
    if (Array.isArray(media?.transcriptLines)) return media.transcriptLines;
    return chapters.flatMap((chapter) => chapter.moments || []).map((moment, index, all) => ({
      id: `transcript-${moment.id}`,
      momentId: moment.id,
      startTime: Math.min(duration, Math.round((index / Math.max(all.length - 1, 1)) * duration)),
      text: moment.summary || moment.title,
    }));
  }, [chapters, duration, media?.transcriptLines]);

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 320);
    return () => window.clearTimeout(id);
  }, [media?.id]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setCurrentTime((value) => {
        const next = Math.min(value + 1, duration);
        if (next >= duration) setPlaying(false);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [duration, playing]);

  const seekTo = (value) => setCurrentTime(Math.min(Math.max(Number(value) || 0, 0), duration));
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`media-player-frame ${transcriptOpen ? "media-player-frame-transcript-open" : ""}`}>
      <div className="media-player-shell" aria-label={`${activeMoment?.title || "Story"} media player`}>
        <div className="media-player-placeholder" aria-hidden="true">{activeMoment?.title?.slice(0, 2) || "RS"}</div>

        {loading && <div className="media-player-state" role="status">Loading placeholder media shell...</div>}
        {error && <div className="media-player-state" role="alert">{error}</div>}
        {unavailable && !loading && <div className="media-player-state" role="status">Media unavailable. Placeholder playback controls are available for demo flow.</div>}
        {captionsOn && (
          <div className="media-player-caption-preview" role="status" aria-live="polite">
            {media?.captionUrl ? activeMoment?.summary : "Captions placeholder enabled. Real caption files are not loaded in this demo shell."}
          </div>
        )}

        <div className="media-player-content">
          <div>
            <div className="media-player-kicker">{media?.kind || "placeholder"} playback</div>
            <h2 className="media-player-title">{activeMoment?.title}</h2>
            <p className="media-player-summary">{activeMoment?.summary}</p>
          </div>

          <div className="media-player-controls">
            <div className="media-player-progress-row">
              <span>{formatTime(currentTime)}</span>
              <div className="media-player-range-wrap">
                <div className="media-player-track">
                  <div className="media-player-fill" style={{ width: `${progress}%` }} />
                </div>
                {markers.map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    className="media-player-marker"
                    style={{ left: `${(marker.time / duration) * 100}%` }}
                    title={marker.label}
                    aria-label={`Jump to ${marker.label}`}
                    onClick={() => {
                      seekTo(marker.time);
                      onMomentChange?.(marker.id);
                    }}
                  />
                ))}
                <input className="media-player-range" type="range" min="0" max={duration} value={currentTime} onChange={(event) => seekTo(event.target.value)} aria-label="Scrub story playback" />
              </div>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="media-player-buttons">
              <button className="media-player-control-button" type="button" onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button>
              <CaptionToggle enabled={captionsOn} available={Boolean(media?.captionUrl)} onToggle={() => setCaptionsOn((value) => !value)} />
              <button ref={transcriptButtonRef} className="media-player-control-button" type="button" aria-pressed={transcriptOpen} onClick={() => setTranscriptOpen((value) => !value)}>Transcript</button>
              <button className="media-player-control-button" type="button" aria-pressed={fullscreen} onClick={() => setFullscreen((value) => !value)}>Fullscreen</button>
              <button className="media-player-control-button" type="button" onClick={() => setError((value) => value ? "" : "Demo error state: media failed to load. Retry by pressing this button again.")}>Error State</button>
              <button type="button" className="media-player-control-button media-player-ask" onClick={() => onAskAboutMoment?.(activeMoment)}>Ask About This</button>
            </div>
          </div>
        </div>
      </div>
      <TranscriptPanel
        open={transcriptOpen}
        lines={transcriptLines}
        activeMomentId={activeMoment?.id}
        onClose={() => setTranscriptOpen(false)}
        onMomentChange={onMomentChange}
        triggerRef={transcriptButtonRef}
      />
    </div>
  );
}
