import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send, Square, Mic, Play, Pause, Info, ShieldCheck,
  ArrowDown, Sparkles, MapPinned, Copy, RotateCcw,
  MessageCircle, AlertTriangle, X,
  SkipBack, SkipForward, ChevronLeft, ChevronRight,
} from "lucide-react";
import DigitalTwinModeBar from "./DigitalTwinModeBar.jsx";
import "../../styles/talent-storyline.css";

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const fn = () => setR(m.matches);
    m.addEventListener?.("change", fn);
    return () => m.removeEventListener?.("change", fn);
  }, []);
  return r;
}

function GrooveWave({ mini = false }) {
  const grooves = mini ? [9, 12, 9, 14, 10, 13] : [16, 22, 16, 26, 18, 24, 14, 20, 16, 24];
  const waves = mini ? [7, 15, 10, 18, 12, 16, 10, 14] : [10, 26, 16, 34, 20, 38, 22, 30, 14, 28, 18, 24];
  return (
    <div className={"wt-sigwrap" + (mini ? " wt-mini" : "")} aria-hidden="true"
      style={mini ? { height: 18, margin: 0 } : undefined}>
      <div className="wt-groove">{grooves.map((h, i) => <span key={i} style={{ "--h": h + "px" }} />)}</div>
      <div className="wt-sig-mid" />
      <div className="wt-wave">{waves.map((h, i) => <span key={i} style={{ "--h": h + "px", "--d": (i * 0.07) + "s" }} />)}</div>
    </div>
  );
}

function StoryStartControls({ storyMode, storyHasStarted, firstChapterId, onPlay, onExplore }) {
  const active = storyMode === "starting" || storyMode === "playing";
  return (
    <div className="wt-start">
      <button type="button" className="wt-play" onClick={onPlay} disabled={active}>
        <Play size={15} /> {active ? "Story playing" : storyHasStarted ? "Replay story" : "Play the story"}
      </button>
      <a className="wt-manual" href={`#chapter-${firstChapterId}`} onClick={onExplore}>
        Explore manually <ArrowDown size={12} />
      </a>
    </div>
  );
}

function StoryProgress({
  storyMode, storyHasStarted, activeStoryIndex, totalChapters, chapterLabel,
  hasUserPausedStory, onPrevious, onNext, onPause, onResume, onStop, onReplay,
}) {
  if (!storyHasStarted) return null;
  const progress = totalChapters ? Math.round(((activeStoryIndex + 1) / totalChapters) * 100) : 0;
  const canGoBack = activeStoryIndex > 0;
  const canGoNext = activeStoryIndex < totalChapters - 1;
  const isMoving = storyMode === "starting" || storyMode === "playing";
  const label = storyMode === "complete"
    ? "Story complete"
    : storyMode === "paused" || hasUserPausedStory
      ? "Story paused"
      : storyMode === "starting"
        ? "Opening story"
        : "Now playing";
  return (
    <div className="wt-story-progress" aria-live="polite">
      <div className="wt-story-progress-meta">
        <span className="label">{label}</span>
        <span className="chapter">{String(activeStoryIndex + 1).padStart(2, "0")} · {chapterLabel}</span>
      </div>
      <span className="bar" aria-hidden="true"><span style={{ "--p": `${progress}%` }} /></span>
      <div className="wt-story-controls" aria-label="Guided story controls">
        <button type="button" onClick={onPrevious} disabled={!canGoBack} aria-label="Previous narrator chapter">
          <SkipBack size={13} />
        </button>
        {isMoving ? (
          <button type="button" onClick={onPause} aria-label="Pause guided story"><Pause size={13} /> Pause</button>
        ) : (
          <button
            type="button"
            onClick={storyMode === "complete" ? onReplay : onResume}
            aria-label={storyMode === "complete" ? "Replay guided story" : "Resume guided story"}
          >
            <Play size={13} /> {storyMode === "complete" ? "Replay" : "Resume"}
          </button>
        )}
        <button type="button" onClick={onNext} disabled={!canGoNext} aria-label="Next narrator chapter">
          <SkipForward size={13} />
        </button>
        <button type="button" onClick={onReplay} aria-label="Restart story"><RotateCcw size={13} /></button>
        <button type="button" onClick={onStop} aria-label="Stop guided story"><Square size={12} /> Stop</button>
      </div>
    </div>
  );
}

function ChapterMediaPlate({ media, era }) {
  if (!media) return null;
  return (
    <div className="wt-era-hero wt-reveal" data-tone={media.tone}>
      <div className="wt-era-hero-content">
        <div className="wt-era-kicker">Chapter {era.chapterNo}</div>
        <h2 className="wt-era-name" id={`chapter-title-${era.id}`}>{era.label}</h2>
        <div className="wt-era-meta-row">
          <div className="wt-era-meta">{era.beats.length} moments · {era.year}</div>
          <GrooveWave mini />
        </div>
      </div>
    </div>
  );
}

function BeatMediaCluster({ items, onOpen }) {
  if (!items?.length) return null;
  return (
    <div className="wt-beat-gallery wt-reveal" data-count={items.length} aria-label={`${items.length} related media items`}>
      {items.map((item, index) => (
        <button
          className="wt-beat-media"
          type="button"
          data-tone={item.tone}
          data-size={item.size || "wide"}
          onClick={(event) => onOpen(items.map((media) => ({ ...media, kind: "Story media" })), index, event.currentTarget)}
          aria-label={`Open ${item.label || item.title} media`}
          key={item.id || `${item.title}-${index}`}
        >
          <span className="wt-beat-tag">{item.label || item.title}</span>
          {items.length > 1 && <span className="wt-beat-count">{index + 1}/{items.length}</span>}
          <span className="wt-beat-mark" aria-hidden="true">{item.mark || item.title}</span>
          <span className="wt-media-open" aria-hidden="true">Open</span>
        </button>
      ))}
    </div>
  );
}

function MediaLightbox({ mediaGroup, mediaProvenance, onClose, onStep }) {
  if (!mediaGroup?.items?.length) return null;
  const total = mediaGroup.items.length;
  const index = Math.max(0, Math.min(mediaGroup.index || 0, total - 1));
  const media = mediaGroup.items[index];
  const hasMultiple = total > 1;
  return (
    <div className="wt-lightbox" role="dialog" aria-modal="true" aria-labelledby="wt-media-title" onClick={onClose}>
      <div className="wt-lightbox-card" onClick={(event) => event.stopPropagation()}>
        <div className="wt-lightbox-art" data-tone={media.tone}>
          <button className="wt-lightbox-close" type="button" onClick={onClose} aria-label="Close media viewer" autoFocus>
            <X size={18} />
          </button>
          <div className="wt-lightbox-label">{media.label || media.kind || "Media"}</div>
          <div className="wt-lightbox-counter">{index + 1} / {total}</div>
          {hasMultiple && (
            <>
              <button className="wt-lightbox-nav prev" type="button" onClick={() => onStep(-1)} aria-label="Previous media">
                <ChevronLeft size={20} />
              </button>
              <button className="wt-lightbox-nav next" type="button" onClick={() => onStep(1)} aria-label="Next media">
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <div className="wt-lightbox-mark" aria-hidden="true">{media.mark || media.title || media.label}</div>
        </div>
        <div className="wt-lightbox-body">
          <div>
            <div className="wt-lightbox-kicker">{media.kind || "Media"}</div>
            <div className="wt-lightbox-title" id="wt-media-title">{media.title || media.label}</div>
          </div>
          <div>
            <div className="wt-lightbox-copy">{media.caption}</div>
            <div className="wt-lightbox-provenance">{mediaProvenance}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustPanel({ trust }) {
  return (
    <div className="wt-prov-pop">
      <div className="wt-trust-grid">
        <div className="wt-trust-item">
          <span className="wt-trust-k">Consent</span>
          <span className="wt-trust-v">{trust.consent}</span>
        </div>
        <div className="wt-trust-item">
          <span className="wt-trust-k">Source scope</span>
          <span className="wt-trust-v">{trust.sourceScope}</span>
        </div>
        <div className="wt-trust-item">
          <span className="wt-trust-k">Limit</span>
          <span className="wt-trust-v">{trust.limit}</span>
        </div>
        <div className="wt-trust-item">
          <span className="wt-trust-k">Voice & AI</span>
          <span className="wt-trust-v">{trust.simulation}</span>
        </div>
      </div>
    </div>
  );
}

function AIStatusLine({ status, statusCopy }) {
  const tone = status === "failed" ? " error"
    : status === "stopped" || status === "uncertain" ? " warn"
    : status === "idle" || status === "complete" ? ""
    : " active";
  return (
    <div className={"wt-status" + tone} role="status" aria-live="polite" aria-atomic="true">
      <span className="dot" aria-hidden="true" />
      {statusCopy[status] ?? statusCopy.idle}
    </div>
  );
}

function VoiceStatusPill({ voiceState }) {
  if (!voiceState || voiceState === "idle") return null;
  const label = voiceState === "listening"
    ? "Listening. Ask naturally."
    : voiceState === "thinking"
      ? "Checking verified records."
      : voiceState === "speaking"
        ? "Speaking response."
        : null;
  if (!label) return null;
  return (
    <div className={"wt-voice-pill is-" + voiceState} role="status" aria-live="polite" aria-atomic="true">
      <span className="wt-voice-pill-dot" aria-hidden="true" />
      {label}
    </div>
  );
}

function LiveVoiceChip({ displayName, speaking }) {
  const label = speaking ? `${displayName} is speaking` : "Live twin voice";
  return (
    <span
      className={"wt-voice wt-voice-status" + (speaking ? " is-speaking" : "")}
      title={label}
      aria-hidden="true"
    >
      {speaking ? <Pause size={13} /> : <Play size={13} />}
      <span className={"wt-vbars" + (speaking ? " playing" : "")}>{[0, 1, 2, 3, 4].map((i) => <span key={i} />)}</span>
      {speaking ? "Speaking" : "Live voice"}
    </span>
  );
}

function resolveSourceBeats(pack, sourceBeatIds) {
  const ids = Array.isArray(sourceBeatIds) ? sourceBeatIds.filter(Boolean) : [];
  if (!ids.length) {
    const fallbackEra = pack.eras?.[0];
    const fallbackBeat = fallbackEra?.beats?.[0];
    return fallbackBeat
      ? [{ eraId: fallbackEra.id, beatId: fallbackBeat.id, chapterNo: fallbackEra.chapterNo, title: fallbackBeat.title }]
      : [];
  }
  const links = [];
  for (const beatId of ids) {
    for (const era of pack.eras || []) {
      const beat = (era.beats || []).find((item) => item.id === beatId);
      if (beat) {
        links.push({ eraId: era.id, beatId: beat.id, chapterNo: era.chapterNo, title: beat.title });
        break;
      }
    }
  }
  return links;
}

function mapEngineMessages(messages) {
  return messages.map((msg, index) => {
    if (msg.role === "user") {
      return { id: msg.id || `u-${index}`, role: "user", text: msg.content };
    }
    const failed = Boolean(msg.error);
    const stopped = Boolean(msg.stopped);
    let status = "complete";
    if (failed) status = "failed";
    else if (stopped) status = "stopped";
    else if (msg.streaming && !msg.content) status = "preparing";
    else if (msg.streaming) status = "streaming";
    const kind = msg.kind === "uncertain" ? "uncertain" : "grounded";
    const content = msg.content || "";
    const shown = content
      || (failed ? (msg.errorMessage || "") : "")
      || (status === "stopped" ? "Response stopped before an answer was ready." : "")
      || (status === "complete" && !failed ? "Verified twin response delivered by voice." : "");
    const isPartial = Boolean(msg.isPartial) || (stopped && Boolean(content.trim()));
    return {
      id: msg.id || `t-${index}`,
      role: "twin",
      kind,
      chapter: msg.chapter || (kind === "uncertain" ? "Outside verified archive" : "Verified archive"),
      sourceLabel: msg.sourceLabel || "Verified twin archive",
      sourceBeatIds: Array.isArray(msg.sourceBeatIds) ? msg.sourceBeatIds : [],
      prompt: msg.prompt || "",
      full: content,
      shown,
      status,
      isPartial,
      errorMessage: failed ? (content || "Could not complete response") : undefined,
      contextLabel: msg.contextLabel,
      voiceError: Boolean(msg.voiceError),
      followUps: Array.isArray(msg.followUps) ? msg.followUps : [],
    };
  });
}

function TwinMessage({ msg, pack, displayName, initial, outsideCue, speaking, onRetry, onAskDifferently, onFollowUp, onCopy, onJumpToBeat }) {
  const [showSrc, setShowSrc] = useState(false);
  const uncertain = msg.kind === "uncertain";
  const failed = msg.status === "failed";
  const stopped = msg.status === "stopped";
  const waiting = msg.status === "submitted" || msg.status === "preparing";
  const streaming = msg.status === "streaming";
  const sourceBeats = resolveSourceBeats(pack, msg.sourceBeatIds);
  const followUps = (msg.followUps?.length
    ? msg.followUps
    : uncertain
      ? (pack.chat?.recovery || [])
        .map((item) => ({
          label: item.label,
          question: pack.chat?.questions?.[item.questionKey],
        }))
        .filter((item) => item.question)
      : []);
  return (
    <div
      className={"wt-msg wt-twin-wrap" + (uncertain ? " wt-uncertain" : "") + (failed ? " wt-failed" : "")}
      aria-busy={waiting || streaming ? "true" : undefined}
    >
      <div className="wt-twin">
        <div className="wt-twin-av" aria-hidden="true"><span className="ini">{initial}</span></div>
        <div className="wt-twin-body">
          {msg.contextLabel ? <div className="wt-context-chip">Asked from {msg.contextLabel}</div> : null}
          {msg.isPartial ? <div className="wt-partial-chip">Partial response</div> : null}
          {uncertain && <div className="wt-uncertain-cue"><span className="ring" /> {outsideCue}</div>}
          {waiting ? (
            <div className="wt-think" aria-hidden="true"><span /><span /><span /></div>
          ) : (
            <div className="wt-twin-text">
              {msg.shown || msg.errorMessage}
              {streaming && <span className="wt-cursor" aria-hidden="true" />}
            </div>
          )}
          {failed && (
            <div className="wt-error-note">
              <AlertTriangle size={14} />
              Your prompt is still here. Retry, or ask from an in-scope chapter.
            </div>
          )}
          {stopped && !failed && (
            <div className="wt-error-note">
              <AlertTriangle size={14} />
              Generation stopped. Partial text is preserved — retry anytime.
            </div>
          )}
          {!failed && !stopped && msg.voiceError && (
            <div className="wt-error-note">
              <AlertTriangle size={14} />
              Voice playback unavailable. The written reply is still here.
            </div>
          )}
          {(msg.status === "complete" || msg.status === "failed" || msg.status === "stopped") && (
            <div className="wt-mfoot">
              {msg.status === "complete" && !uncertain && (
                <LiveVoiceChip displayName={displayName} speaking={speaking} />
              )}
              <button type="button" className="wt-src" onClick={() => setShowSrc((s) => !s)} aria-expanded={showSrc}>
                <Info size={12} /> Source
              </button>
              <button type="button" className="wt-action" onClick={() => onCopy(msg)}>
                <Copy size={12} /> {msg.copied ? "Copied" : "Copy"}
              </button>
              {msg.prompt ? (
                <button type="button" className="wt-action" onClick={() => onRetry(msg.prompt)}>
                  <RotateCcw size={12} /> Retry
                </button>
              ) : null}
              {msg.prompt ? (
                <button type="button" className="wt-action" onClick={() => onAskDifferently(msg.prompt)}>
                  <MessageCircle size={12} /> Ask differently
                </button>
              ) : null}
              {msg.status === "complete" && !uncertain && (
                <span className="wt-ground"><span className="seal" /> Grounded</span>
              )}
            </div>
          )}
          {followUps.length > 0 && (msg.status === "complete" || msg.status === "stopped" || uncertain) && (
            <div className="wt-followups" aria-label="Suggested follow-ups">
              {followUps.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="wt-followup"
                  onClick={() => onFollowUp(item.question)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {showSrc && (
            <div className="wt-srcpop">
              From <b>{msg.sourceLabel}</b> · {msg.chapter}.
              {uncertain
                ? " This reply is outside verified archive scope."
                : " Live twin response grounded in verified archive material."}
              {sourceBeats.length > 0 && (
                <div className="wt-src-beats" aria-label="Linked story moments">
                  {sourceBeats.map((beat) => (
                    <button
                      key={`${beat.eraId}-${beat.beatId}`}
                      type="button"
                      className="wt-src-beat"
                      onClick={() => onJumpToBeat(beat.eraId, beat.beatId)}
                    >
                      Ch {beat.chapterNo} · {beat.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Ricon storyline shell hosted inside TwinModal, driven by live twin engine.
 */
export default function TwinStoryShell({
  pack,
  mode,
  engine,
  onModeChange,
  pageScroll = false,
}) {
  const eras = pack.eras;
  const prefersReducedMotion = useReducedMotion();
  const uiMode = mode === "qa" ? "ask" : "narrator";
  const narratorBeatCount = engine.narratorBeatCount || 3;

  const [storyMode, setStoryMode] = useState(prefersReducedMotion ? "reduced-motion" : "idle");
  const [storyHasStarted, setStoryHasStarted] = useState(false);
  const [hasUserPausedStory, setHasUserPausedStory] = useState(false);
  const [showProv, setShowProv] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [activeChapter, setActiveChapter] = useState(eras[0]?.id ?? "");
  const [selectedMediaGroup, setSelectedMediaGroup] = useState(null);
  const [copiedIds, setCopiedIds] = useState(() => new Set());

  const threadRef = useRef(null);
  const taRef = useRef(null);
  const chatRef = useRef(null);
  const stickRef = useRef(true);
  const mediaReturnFocusRef = useRef(null);
  const activeChapterLinkRef = useRef(null);
  const scrollRootRef = useRef(null);

  const shellMessages = useMemo(
    () => mapEngineMessages(engine.messages).map((msg) => (
      msg.role === "twin" ? { ...msg, copied: copiedIds.has(msg.id) } : msg
    )),
    [engine.messages, copiedIds],
  );

  const aiStatus = useMemo(() => {
    if (engine.voiceState === "listening") return "submitted";
    if (engine.voiceState === "thinking" || engine.loading) return "preparing";
    if (engine.voiceState === "speaking") return "streaming";
    const last = [...shellMessages].reverse().find((m) => m.role === "twin");
    if (!last) return "idle";
    if (last.status === "failed") return "failed";
    if (last.status === "stopped") return "stopped";
    if (last.status === "streaming" || last.status === "preparing") return last.status;
    if (last.kind === "uncertain") return "uncertain";
    return "complete";
  }, [engine.voiceState, engine.loading, shellMessages]);

  useEffect(() => {
    setActiveChapter(eras[0]?.id ?? "");
  }, [pack.id, eras]);

  useEffect(() => {
    if (stickRef.current && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [shellMessages, engine.loading]);

  const openMediaGroup = useCallback((items, index = 0, opener) => {
    const normalizedItems = [].concat(items || []).filter(Boolean);
    if (!normalizedItems.length) return;
    mediaReturnFocusRef.current = opener || document.activeElement;
    setSelectedMediaGroup({
      items: normalizedItems,
      index: Math.max(0, Math.min(index, normalizedItems.length - 1)),
    });
  }, []);

  const closeMediaGroup = useCallback(() => {
    setSelectedMediaGroup(null);
    requestAnimationFrame(() => mediaReturnFocusRef.current?.focus?.());
  }, []);

  const stepMediaGroup = useCallback((delta) => {
    setSelectedMediaGroup((group) => {
      if (!group?.items?.length) return group;
      const total = group.items.length;
      return { ...group, index: ((group.index || 0) + delta + total) % total };
    });
  }, []);

  const scrollToChapter = useCallback((eraId, behavior = "smooth") => {
    const el = document.getElementById(`chapter-${eraId}`);
    el?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : behavior, block: "start" });
  }, [prefersReducedMotion]);

  const stickyStoryOffset = useCallback(() => {
    const modeBar = document.querySelector(".wt-twin-switch");
    const chapters = document.querySelector(".wt-chapters");
    const modeH = modeBar ? Math.ceil(modeBar.getBoundingClientRect().height) : 56;
    const chaptersH = chapters ? Math.ceil(chapters.getBoundingClientRect().height) : 0;
    return modeH + chaptersH + 12;
  }, []);

  const scrollToMoment = useCallback((eraId, beatId, behavior = "smooth") => {
    const run = (forceAuto = false) => {
      const target = (beatId && document.getElementById(`beat-${beatId}`))
        || (eraId && document.getElementById(`chapter-${eraId}`));
      if (!target) return;

      const scrollBehavior = forceAuto || prefersReducedMotion ? "auto" : behavior;
      const offset = stickyStoryOffset();
      const scroller = pageScroll ? null : scrollRootRef.current;

      if (scroller) {
        const scrollerRect = scroller.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const nextTop = scroller.scrollTop + (targetRect.top - scrollerRect.top) - offset;
        scroller.scrollTo({ top: Math.max(0, nextTop), behavior: scrollBehavior });
        return;
      }

      const nextTop = window.scrollY + target.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(0, nextTop), behavior: scrollBehavior });
    };

    // First pass after paint; snap-correct after sticky chapter rail settles.
    requestAnimationFrame(() => {
      run(false);
      window.setTimeout(() => run(true), prefersReducedMotion ? 40 : 300);
    });
  }, [pageScroll, prefersReducedMotion, stickyStoryOffset]);

  const jumpToBeat = useCallback((eraId, beatId) => {
    onModeChange("narrator");
    const eraIndex = eras.findIndex((era) => era.id === eraId);
    if (eraIndex >= 0) setActiveChapter(eraId);
    scrollToMoment(eraId, beatId);
  }, [eras, onModeChange, scrollToMoment]);

  const startStory = useCallback(() => {
    onModeChange("narrator");
    setStoryHasStarted(true);
    setHasUserPausedStory(false);
    setStoryMode(prefersReducedMotion ? "reduced-motion" : "playing");
    engine.selectNarratorBeat(0);
    const firstEra = eras[0];
    const firstBeat = firstEra?.beats?.[0];
    if (firstEra) {
      setActiveChapter(firstEra.id);
      scrollToMoment(firstEra.id, firstBeat?.id);
    }
  }, [engine, eras, onModeChange, prefersReducedMotion, scrollToMoment]);

  const pauseStory = useCallback(() => {
    // Soft-stop audio only — keep media session so Resume/Next/Prev still work.
    engine.stopVoicePlayback();
    setHasUserPausedStory(true);
    setStoryMode("paused");
  }, [engine]);

  const resumeStory = useCallback(() => {
    onModeChange("narrator");
    setStoryHasStarted(true);
    setHasUserPausedStory(false);
    setStoryMode(prefersReducedMotion ? "reduced-motion" : "playing");
    engine.selectNarratorBeat(engine.activeBeat);
  }, [engine, onModeChange, prefersReducedMotion]);

  const stopStory = useCallback(() => {
    engine.hardStopMedia();
    setStoryHasStarted(false);
    setStoryMode("idle");
    setHasUserPausedStory(false);
  }, [engine]);

  const previousStoryChapter = useCallback(() => {
    const next = Math.max(0, engine.activeBeat - 1);
    setStoryHasStarted(true);
    setHasUserPausedStory(false);
    setStoryMode(prefersReducedMotion ? "reduced-motion" : "playing");
    engine.selectNarratorBeat(next);
  }, [engine, prefersReducedMotion]);

  const nextStoryChapter = useCallback(() => {
    setStoryHasStarted(true);
    setHasUserPausedStory(false);
    if (engine.activeBeat >= narratorBeatCount - 1) {
      engine.hardStopMedia();
      setStoryMode("complete");
      return;
    }
    setStoryMode(prefersReducedMotion ? "reduced-motion" : "playing");
    engine.continueNarrator();
  }, [engine, narratorBeatCount, prefersReducedMotion]);

  const exploreManually = useCallback((event) => {
    event?.preventDefault();
    onModeChange("narrator");
    engine.hardStopMedia();
    setStoryHasStarted(false);
    setStoryMode("idle");
    setHasUserPausedStory(false);
    if (eras[0]) scrollToChapter(eras[0].id);
  }, [engine, eras, onModeChange, scrollToChapter]);

  useEffect(() => {
    if (!storyHasStarted) return;
    if (hasUserPausedStory) return;
    if (engine.voiceState === "speaking") {
      setStoryMode("playing");
      return;
    }
    if (engine.voiceState === "idle" && storyMode === "playing") {
      if (engine.activeBeat >= narratorBeatCount - 1) {
        setStoryMode("complete");
      } else {
        setStoryMode("paused");
      }
    }
  }, [engine.voiceState, engine.activeBeat, narratorBeatCount, storyHasStarted, storyMode, hasUserPausedStory]);

  useEffect(() => {
    if (!engine.shouldCloseOnEscapeRef) return undefined;
    engine.shouldCloseOnEscapeRef.current = () => !selectedMediaGroup;
    return () => {
      if (engine.shouldCloseOnEscapeRef) {
        engine.shouldCloseOnEscapeRef.current = () => true;
      }
    };
  }, [engine, selectedMediaGroup]);

  useEffect(() => {
    if (!selectedMediaGroup) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMediaGroup();
      }
      if (event.key === "ArrowLeft") stepMediaGroup(-1);
      if (event.key === "ArrowRight") stepMediaGroup(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMediaGroup, selectedMediaGroup, stepMediaGroup]);

  useEffect(() => {
    const chapters = eras.map((era) => document.getElementById(`chapter-${era.id}`)).filter(Boolean);
    if (!chapters.length) return undefined;
    const root = pageScroll ? null : (scrollRootRef.current || null);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveChapter(visible.target.id.replace("chapter-", ""));
    }, { root, rootMargin: "-32% 0px -58% 0px", threshold: [0, 0.2, 0.45, 0.7] });
    chapters.forEach((chapter) => observer.observe(chapter));
    return () => observer.disconnect();
  }, [eras, uiMode, pageScroll]);

  useEffect(() => {
    // Scroll only the horizontal chapter strip — never the page.
    // scrollIntoView on sticky/nav links fights document scroll while reading.
    const link = activeChapterLinkRef.current;
    const nav = link?.closest(".wt-chapter-nav");
    if (!link || !nav) return;
    const linkRect = link.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const delta = (linkRect.left + linkRect.width / 2) - (navRect.left + navRect.width / 2);
    if (Math.abs(delta) < 2) return;
    nav.scrollBy({
      left: delta,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [activeChapter, prefersReducedMotion]);

  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll(".modal-root .wt-reveal"));
    if (!revealNodes.length) return undefined;
    if (prefersReducedMotion) {
      revealNodes.forEach((node) => node.classList.add("in-view"));
      return undefined;
    }
    const root = pageScroll ? null : scrollRootRef.current;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in-view");
      });
    }, { root, rootMargin: "0px 0px -14% 0px", threshold: 0.18 });
    revealNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [prefersReducedMotion, eras, uiMode, pageScroll]);

  const askFromRail = (askKey, contextLabel) => {
    const question = pack.chat.questions[askKey];
    if (!question) return;
    onModeChange("qa");
    window.setTimeout(
      () => engine.sendQA(question, { contextLabel }),
      prefersReducedMotion ? 80 : 320,
    );
  };

  const handleModeChange = (nextUiMode) => {
    onModeChange(nextUiMode === "ask" ? "qa" : "narrator");
    if (nextUiMode !== "ask") {
      // Defer until after narrator panel is shown again.
      requestAnimationFrame(() => {
        document.getElementById(`chapter-${activeChapter || eras[0]?.id}`)?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  };

  // Focus composer only after Ask panel is actually mounted/visible (not still hidden).
  useEffect(() => {
    if (uiMode !== "ask") return undefined;
    const timer = window.setTimeout(() => {
      const field = taRef.current;
      if (!field || field.closest("[hidden]")) return;
      chatRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
      field.focus({ preventScroll: false });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [uiMode, prefersReducedMotion]);

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      engine.sendQA();
    }
  };
  const onInput = (e) => {
    engine.setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const onThreadScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    stickRef.current = atBottom;
    setShowJump(!atBottom && (engine.loading || engine.voiceIsActive));
  };

  const copyMessage = async (msg) => {
    const text = msg.shown || msg.full || msg.errorMessage || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIds((prev) => {
        const next = new Set(prev);
        next.add(msg.id);
        return next;
      });
      window.setTimeout(() => {
        setCopiedIds((prev) => {
          const next = new Set(prev);
          next.delete(msg.id);
          return next;
        });
      }, 2000);
    } catch {
      // ignore
    }
  };

  const activeEraIndexRaw = eras.findIndex((era) => era.id === activeChapter);
  const activeEraIndex = activeEraIndexRaw >= 0 ? activeEraIndexRaw : 0;
  const activeEra = eras[activeEraIndex] ?? eras[0];
  const activeProgressLabel = eras.length ? `${activeEraIndex + 1} of ${eras.length} chapters` : "0 chapters";
  const firstChapterId = eras[0]?.id || "start";
  const hookQuoteText = (pack.hook.quoteParts || []).map((part) => part.text).join("").trim();
  const hookSubcopy = (pack.hook.subcopy || "").trim();
  const showHookSub = Boolean(hookSubcopy) && hookSubcopy !== hookQuoteText;
  const guidedIndex = Math.min(engine.activeBeat, narratorBeatCount - 1);
  const guidedLabel = engine.messages[guidedIndex]?.moment?.era
    || engine.messages[guidedIndex]?.moment?.title
    || `Chapter ${guidedIndex + 1}`;

  return (
    <div
      ref={scrollRootRef}
      className={`wt-root wt-modal-shell story-${storyMode} wt-mode-${uiMode}${prefersReducedMotion ? " reduced-motion" : ""}`}
    >
      <StoryProgress
        storyMode={storyMode}
        storyHasStarted={storyHasStarted}
        activeStoryIndex={guidedIndex}
        totalChapters={narratorBeatCount}
        chapterLabel={guidedLabel}
        hasUserPausedStory={hasUserPausedStory}
        onPrevious={previousStoryChapter}
        onNext={nextStoryChapter}
        onPause={pauseStory}
        onResume={resumeStory}
        onStop={stopStory}
        onReplay={startStory}
      />
      <MediaLightbox
        mediaGroup={selectedMediaGroup}
        mediaProvenance={pack.copy.mediaProvenance}
        onClose={closeMediaGroup}
        onStep={stepMediaGroup}
      />

      <DigitalTwinModeBar talent={pack} mode={uiMode} onModeChange={handleModeChange} />

      <section className="wt-story-entry" aria-label="Twin story entry">
        {uiMode === "narrator" ? (
          <header className="wt-hook">
            <div className="wt-hook-grad" />
            {pack.portraitSrc ? (
              <div className="wt-hook-media" aria-hidden="true">
                <img className="wt-hook-portrait" src={pack.portraitSrc} alt="" draggable="false" />
              </div>
            ) : null}
            <div className="wt-wrap wt-hook-inner">
              <h1 className="wt-talent-name">{pack.displayName}</h1>
              <div className="wt-kicker"><span className="dot" /><span className="wt-eyebrow">Guided storytelling</span></div>
              <GrooveWave />
              <h2 className="wt-hook-quote">
                {(pack.hook.quoteParts || []).map((part, index) => (
                  <span className="wt-quote-part" key={index}>
                    {part.accent ? <span className="accent">{part.text}</span> : part.text}
                  </span>
                ))}
              </h2>
              <div className="wt-attrib"><span className="bar" /> {pack.hook.attribution}</div>
              {showHookSub ? <p className="wt-hook-sub">{hookSubcopy}</p> : null}
              <StoryStartControls
                storyMode={storyMode}
                storyHasStarted={storyHasStarted}
                firstChapterId={firstChapterId}
                onPlay={startStory}
                onExplore={exploreManually}
              />
            </div>
            <div className="wt-scrollcue"><ArrowDown size={13} /> Play or explore the timeline</div>
          </header>
        ) : (
          <div className="wt-ask-entry">
            <div className="wt-wrap wt-ask-entry-inner">
              <h1 className="wt-talent-name">{pack.displayName}</h1>
              <p className="wt-ask-entry-cue">
                Ask {pack.displayName} directly from verified timeline material.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="wt-rail wt-narrator-panel" aria-label={pack.copy.timelineAriaLabel} hidden={uiMode === "ask"}>
        <p className="wt-timeline-kicker">
          Career timeline · {pack.totalMoments} verified moment{pack.totalMoments === 1 ? "" : "s"}
        </p>
        <div className="wt-chapters" aria-label="Timeline chapters">
          <div className="wt-chapters-inner">
            <div className="wt-chapters-status" aria-label="Current timeline position">
              <div className="wt-chapters-current">
                <span className="wt-chapters-kicker"><MapPinned size={13} /> Now in Chapter {activeEra?.chapterNo}</span>
                <strong className="wt-chapters-title">{activeEra?.label}</strong>
                <span className="wt-chapters-meta">{activeEra?.beats.length} moments · {activeEra?.year}</span>
              </div>
              <div className="wt-chapters-progress" aria-label={activeProgressLabel}>
                <span className="wt-chapters-count">{activeProgressLabel}</span>
                <div className="wt-chapter-track" aria-hidden="true">
                  {eras.map((era, index) => (
                    <span
                      className={"wt-chapter-segment" + (index < activeEraIndex ? " complete" : index === activeEraIndex ? " active" : "")}
                      key={`track-${era.id}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <nav className="wt-chapter-nav" aria-label="Timeline chapters">
              {eras.map((era) => {
                const isActive = activeChapter === era.id;
                return (
                  <a
                    className={"wt-chapter-link" + (isActive ? " active" : "")}
                    href={`#chapter-${era.id}`}
                    key={era.id}
                    ref={isActive ? activeChapterLinkRef : null}
                    aria-current={isActive ? "location" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveChapter(era.id);
                      scrollToChapter(era.id);
                    }}
                  >
                    <span className="no">{era.chapterNo}</span>
                    <span className="label">{era.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="wt-wrap" style={{ paddingBottom: 48 }}>
          {eras.map((era) => (
            <section className="wt-chapter" id={`chapter-${era.id}`} key={era.id} aria-labelledby={`chapter-title-${era.id}`}>
              <div className="wt-era">
                <ChapterMediaPlate media={era.media} era={era} />
              </div>
              {era.beats.map((b) => (
                <article className="wt-beat wt-reveal" id={`beat-${b.id}`} key={b.id}>
                  <header className="wt-beat-head">
                    <span className="wt-beat-no">Moment {b.no}</span>
                    <h3 className="wt-beat-title">{b.title}</h3>
                  </header>
                  <p className="wt-setup">{b.setup}</p>
                  <BeatMediaCluster items={b.mediaItems} onOpen={openMediaGroup} />
                  <div className="wt-tape">
                    <div className="wt-tape-label">{pack.copy.tapeLabel}</div>
                    <p className="wt-tape-q">&ldquo;{b.tape}&rdquo;</p>
                  </div>
                  <p className="wt-narr">{b.narr}</p>
                  {b.askKey && pack.chat.questions[b.askKey] && (
                    <button type="button" className="wt-ask" onClick={() => askFromRail(b.askKey, `Chapter ${era.chapterNo}: ${era.label}`)}>
                      <span className="pulse" /> Ask the twin: {pack.chat.questions[b.askKey]}
                    </button>
                  )}
                </article>
              ))}
            </section>
          ))}
        </div>
      </section>

      <section className="wt-chatsec wt-ask-panel" ref={chatRef} aria-label={`Ask ${pack.displayName}`} hidden={uiMode === "narrator"}>
        <div className="wt-wrap">
          <div className="wt-chat-head">
            <span className="wt-eyebrow">{pack.copy.chatEyebrow}</span>
            <h2 className="wt-chat-h2" style={{ marginTop: 10 }}>
              Ask <span className="who">{pack.displayName}</span>
            </h2>
          </div>

          {engine.voiceIsActive ? (
            <div className="wt-voice-pill-wrap">
              <VoiceStatusPill
                voiceState={engine.voiceState === "idle" ? "listening" : engine.voiceState}
              />
            </div>
          ) : null}

          <div className="wt-chat" style={{ position: "relative" }}>
            <div className="wt-persona">
              <div className="wt-avatar" aria-hidden="true"><span className="ring" /><span className="ini">{pack.initial}</span></div>
              <div className="wt-persona-meta">
                <div className="wt-persona-name">{pack.displayName}<span className="wt-verified"><ShieldCheck size={11} /> {pack.copy.verifiedBadge}</span></div>
                <button type="button" className="wt-prov-btn" onClick={() => setShowProv((p) => !p)} aria-expanded={showProv}>
                  <Sparkles size={11} /> Trust, sources, and limits
                </button>
              </div>
            </div>
            {showProv && <TrustPanel trust={pack.trust} />}
            <AIStatusLine status={aiStatus} statusCopy={pack.statusCopy} />
            <div
              className="wt-thread"
              ref={threadRef}
              onScroll={onThreadScroll}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={engine.loading ? "true" : undefined}
              aria-label={`${pack.displayName} conversation`}
            >
              {shellMessages.length === 0 ? (
                <div className="wt-empty">
                  <p className="wt-empty-line">{pack.copy.empty}</p>
                </div>
              ) : (
                shellMessages.map((m) =>
                  m.role === "user" ? (
                    <div className="wt-msg wt-user" key={m.id}><div className="wt-row"><div className="wt-bubble-u">{m.text}</div></div></div>
                  ) : (
                    <TwinMessage
                      key={m.id}
                      msg={m}
                      pack={pack}
                      displayName={pack.displayName}
                      initial={pack.initial}
                      outsideCue={pack.copy.outsideCue}
                      speaking={engine.voiceState === "speaking"}
                      onRetry={(prompt) => engine.sendQA(prompt)}
                      onAskDifferently={(prompt) => {
                        engine.setInput(prompt ? `${prompt} ` : "");
                        requestAnimationFrame(() => taRef.current?.focus());
                      }}
                      onFollowUp={(question) => engine.sendQA(question)}
                      onCopy={copyMessage}
                      onJumpToBeat={jumpToBeat}
                    />
                  )
                )
              )}
            </div>

            {showJump && (
              <button
                type="button"
                className="wt-jump"
                onClick={() => { stickRef.current = true; if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; setShowJump(false); }}
                aria-label="Jump to latest"
              >
                <ArrowDown size={16} />
              </button>
            )}

            <div className="wt-sugg" aria-label="Suggested questions">
              {(pack.chat.suggested || []).map((s) => (
                <div className="wt-sugg-group" key={s.id}>
                  <div className="wt-sugg-label">{s.label}</div>
                  <button type="button" className="wt-chip" onClick={() => engine.sendSuggestedPrompt(s.q)} disabled={engine.loading}>
                    {s.q}
                  </button>
                </div>
              ))}
            </div>

            <div className="wt-disclose">
              <span className="ai">AI twin</span>
              {pack.copy.disclose}
            </div>

            <div className="wt-composer">
              <textarea
                ref={(node) => {
                  taRef.current = node;
                  if (typeof engine.inputRef === "object" && engine.inputRef) engine.inputRef.current = node;
                }}
                className="wt-ta"
                rows={1}
                value={engine.input}
                onChange={onInput}
                onKeyDown={onKey}
                placeholder={pack.copy.composerPlaceholder}
                aria-label={pack.copy.composerAriaLabel}
                disabled={engine.voiceState === "listening"}
              />
              <button
                type="button"
                className={
                  "wt-voice-mic"
                  + (engine.voiceState === "listening" ? " is-listening" : "")
                  + (engine.voiceState === "thinking" ? " is-thinking" : "")
                  + (engine.voiceState === "speaking" ? " is-speaking" : "")
                }
                onClick={engine.startVoiceInteraction}
                disabled={engine.loading && engine.voiceState !== "speaking" && engine.voiceState !== "listening"}
                aria-label={
                  engine.voiceState === "listening"
                    ? "Stop listening"
                    : engine.voiceState === "speaking"
                      ? "Stop speaking and listen"
                      : engine.voiceState === "thinking"
                        ? "Voice busy"
                        : "Start listening"
                }
                aria-pressed={engine.voiceState === "listening"}
                title="Voice chat"
              >
                <Mic size={18} />
              </button>
              {engine.loading || engine.voiceIsActive ? (
                <button
                  type="button"
                  className="wt-cbtn stop"
                  onClick={() => {
                    if (engine.loading && typeof engine.stopGeneration === "function") {
                      engine.stopGeneration();
                      return;
                    }
                    engine.stopVoiceInteraction();
                  }}
                  aria-label={engine.loading ? "Stop generating response" : "Stop voice chat"}
                >
                  <Square size={16} />
                </button>
              ) : (
                <button type="button" className="wt-cbtn send" onClick={() => engine.sendQA()} disabled={!engine.input.trim() || engine.loading} aria-label="Send message">
                  <Send size={18} />
                </button>
              )}
            </div>          </div>

          <p className="wt-foot" style={{ whiteSpace: "pre-line" }}>
            {pack.copy.footer}
          </p>
        </div>
      </section>
    </div>
  );
}
