"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Athlete, Collectible, Moment, TimestampEvent } from "@/data/types";
import { useStoryAudio } from "@/hooks/useStoryAudio";
import { cn } from "@/lib/utils";

const STORY_DURATION = 16;

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.min(STORY_DURATION, Math.floor(seconds)));
  return `0:${safeSeconds.toString().padStart(2, "0")}`;
}

function useDataOverlays({
  timestampEvents,
  currentTime,
}: {
  timestampEvents: TimestampEvent[];
  currentTime: number;
}) {
  const activeOverlays = useMemo(
    () =>
      timestampEvents.filter(
        (event) => currentTime >= event.time && currentTime < event.time + 4,
      ),
    [currentTime, timestampEvents],
  );

  return { activeOverlays };
}

function getActivePanel(currentTime: number) {
  if (currentTime < 4) {
    return 0;
  }

  if (currentTime < 9) {
    return 1;
  }

  return 2;
}

export function StoryClient({
  athlete,
  moment,
  collectible,
}: Readonly<{
  athlete: Athlete;
  moment: Moment;
  collectible?: Collectible;
}>) {
  const router = useRouter();
  const { isPlaying, currentTime, duration, toggle, seek } = useStoryAudio(
    moment.audioUrl,
  );
  const { activeOverlays } = useDataOverlays({
    timestampEvents: moment.timestampEvents,
    currentTime,
  });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [collectibleVisible, setCollectibleVisible] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasEnded = currentTime >= duration;
  const activePanel = getActivePanel(currentTime);
  const relatedMoments = athlete.moments
    .filter((item) => item.id !== moment.id)
    .slice(0, 3);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);

    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }

    controlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    wakeControls();

    return () => {
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
    };
  }, [wakeControls]);

  return (
    <main
      className="relative h-svh min-h-[620px] overflow-hidden bg-ink text-paper"
      onPointerDown={wakeControls}
    >
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        aria-hidden="true"
      />

      <motion.button
        type="button"
        onClick={() => router.push(`/athlete/${athlete.slug}`)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.35 }}
        className="absolute left-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/10 font-body text-lg text-white/60 backdrop-blur-sm active:scale-95"
        aria-label="Close story"
      >
        ×
      </motion.button>

      <motion.section
        className={cn(
          "relative h-[55svh] min-h-[340px] overflow-hidden bg-[#080808]",
          hasEnded && "brightness-[0.28]",
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="absolute left-0 top-0 z-20 h-0.5 w-full bg-white/10">
          <motion.div
            className="h-full bg-cyan shadow-[0_0_18px_rgba(0,180,216,0.75)]"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {activePanel === 0 ? <PanelOne /> : null}
            {activePanel === 1 ? <PanelTwo /> : null}
            {activePanel === 2 ? <PanelThree /> : null}
          </motion.div>
        </AnimatePresence>

        <DataOverlayLayer activeOverlays={activeOverlays} />
      </motion.section>

      <AnimatePresence>
        {controlsVisible ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+18px)] z-30 px-5"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 font-mono text-[11px] text-paper/45">
                {formatTime(currentTime)}
              </span>
              <input
                aria-label="Story progress"
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTime}
                onChange={(event) => seek(Number(event.target.value))}
                className="ricon-story-range"
                style={{
                  background: `linear-gradient(to right, #00B4D8 ${
                    (currentTime / duration) * 100
                  }%, rgba(255,255,255,0.2) ${
                    (currentTime / duration) * 100
                  }%)`,
                }}
              />
              <span className="w-9 text-right font-mono text-[11px] text-paper/45">
                {formatTime(duration)}
              </span>
            </div>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggle();
                  wakeControls();
                }}
                className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-[18px] font-bold text-ink shadow-[0_16px_44px_rgba(255,255,255,0.18)] transition-transform active:scale-95"
                aria-label={isPlaying ? "Pause story" : "Play story"}
              >
                {isPlaying ? "Ⅱ" : "▶"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {hasEnded && collectible && collectibleVisible ? (
          <CollectiblePanel
            collectible={collectible}
            onDismiss={() => setCollectibleVisible(false)}
          />
        ) : null}
      </AnimatePresence>

      <RelatedMomentsRail
        athleteSlug={athlete.slug}
        moments={relatedMoments}
        lifted={hasEnded && collectibleVisible}
      />
    </main>
  );
}

function PanelOne() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(255,107,53,0.18),transparent_34%),linear-gradient(135deg,#080808,#141111_58%,#070707)]">
      <div className="absolute right-3 top-14 font-display text-[140px] font-bold leading-none text-white">
        34
      </div>
      <div className="absolute right-12 top-[190px] font-mono text-[11px] uppercase tracking-[0.28em] text-cyan">
        POINTS
      </div>
      <div className="absolute bottom-16 left-5 h-px w-[40%] bg-orange" />
      <p className="absolute bottom-8 left-5 font-body text-[13px] text-paper/45">
        Xavier vs. Villanova
      </p>
    </div>
  );
}

function PanelTwo() {
  return (
    <div className="absolute inset-0 bg-[#090909]">
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]" />
      <h2 className="absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 text-center font-display text-[38px] italic leading-tight text-white">
        Feb 14, 1993
      </h2>
      <p className="absolute bottom-8 right-5 font-mono text-[22px] font-semibold text-orange">
        89–81
      </p>
    </div>
  );
}

function PanelThree() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#070707,#111_55%,#080808)]">
      <div className="absolute left-5 top-5 font-display text-[96px] leading-none text-cyan/30">
        &quot;
      </div>
      <p className="absolute left-1/2 top-1/2 w-[310px] -translate-x-1/2 -translate-y-1/2 text-center font-display text-[22px] italic leading-[1.4] text-white">
        I felt like everything slowed down in the second half.
      </p>
      <p className="absolute bottom-8 right-5 font-body text-xs text-paper/50">
        David, post-game interview
      </p>
    </div>
  );
}

function DataOverlayLayer({
  activeOverlays,
}: Readonly<{ activeOverlays: TimestampEvent[] }>) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <AnimatePresence>
        {activeOverlays.map((event) => {
          if (event.action === "show_stat") {
            return <StatCard key={`${event.time}-${event.action}`} event={event} />;
          }

          if (event.action === "show_label") {
            return (
              <ContextLabel key={`${event.time}-${event.action}`} event={event} />
            );
          }

          if (event.action === "show_quote") {
            return (
              <QuoteOverlay key={`${event.time}-${event.action}`} event={event} />
            );
          }

          return (
            <ContextBanner key={`${event.time}-${event.action}`} event={event} />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ event }: Readonly<{ event: TimestampEvent }>) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 340, damping: 24, duration: 0.3 }}
      className="absolute bottom-5 left-5 rounded-2xl bg-black/70 px-4 py-3 shadow-2xl backdrop-blur-sm"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
        {String(event.payload.label ?? "")}
      </p>
      <p className="mt-1 font-display text-[32px] font-bold leading-none text-white">
        {String(event.payload.value ?? "")}
      </p>
    </motion.div>
  );
}

function ContextLabel({ event }: Readonly<{ event: TimestampEvent }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -18, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -10, x: "-50%" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="absolute left-1/2 top-5 rounded-full bg-black/60 px-4 py-2 font-body text-xs text-white backdrop-blur-sm"
    >
      {String(event.payload.text ?? "")}
    </motion.div>
  );
}

function QuoteOverlay({ event }: Readonly<{ event: TimestampEvent }>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute left-0 top-1/2 w-full -translate-y-1/2 px-7 text-center"
    >
      <p className="font-display text-[17px] italic leading-7 text-paper/90">
        {String(event.payload.text ?? "")}
      </p>
      <p className="mt-2 font-body text-xs text-paper/45">
        {String(event.payload.attribution ?? "")}
      </p>
    </motion.div>
  );
}

function ContextBanner({ event }: Readonly<{ event: TimestampEvent }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute inset-x-0 bottom-0 border-l-[3px] border-orange bg-ink/85 p-3 font-body text-[13px] leading-5 text-white"
    >
      {String(event.payload.text ?? "")}
    </motion.div>
  );
}

function CollectiblePanel({
  collectible,
  onDismiss,
}: Readonly<{
  collectible: Collectible;
  onDismiss: () => void;
}>) {
  return (
    <motion.section
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] bg-[#111111] px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-5 shadow-[0_-30px_80px_rgba(0,0,0,0.58)]"
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full font-body text-lg text-paper/50"
        aria-label="Dismiss collectible panel"
      >
        ×
      </button>

      <div className="flex gap-4 pr-9">
        <div className="h-20 w-20 shrink-0 rounded-lg border border-orange bg-[radial-gradient(circle_at_50%_35%,rgba(255,107,53,0.24),transparent_62%),#0B0B0B]" />
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-6 text-white">
            {collectible.title}
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan">
            Edition of {collectible.editionSize}
          </p>
          <p className="mt-2 font-body text-[22px] font-semibold leading-none text-white">
            ${collectible.price}
          </p>
        </div>
      </div>
      <p className="mt-4 font-body text-[11px] leading-4 text-paper/45">
        {collectible.provenance}
      </p>
      <button className="ricon-shimmer mt-5 h-[52px] w-full overflow-hidden rounded-xl bg-orange font-body text-[15px] font-semibold text-white active:scale-[0.98]">
        Own This Moment
      </button>
    </motion.section>
  );
}

function RelatedMomentsRail({
  athleteSlug,
  moments,
  lifted,
}: Readonly<{
  athleteSlug: string;
  moments: Moment[];
  lifted: boolean;
}>) {
  return (
    <section
      className={cn(
        "absolute inset-x-0 z-20 px-5 transition-[bottom] duration-300",
        lifted
          ? "bottom-[calc(env(safe-area-inset-bottom)+276px)]"
          : "bottom-[calc(env(safe-area-inset-bottom)+104px)]",
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
        MORE STORIES
      </p>
      <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto pb-1">
        {moments.map((relatedMoment) => (
          <Link
            key={relatedMoment.id}
            href={`/athlete/${athleteSlug}/story/${relatedMoment.id}`}
            className="flex h-[100px] w-40 shrink-0 items-end rounded-2xl bg-gray-ricon p-3 ring-1 ring-white/[0.06] active:scale-[0.98]"
          >
            <h3 className="line-clamp-2 font-display text-base font-bold leading-5 text-white">
              {relatedMoment.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
