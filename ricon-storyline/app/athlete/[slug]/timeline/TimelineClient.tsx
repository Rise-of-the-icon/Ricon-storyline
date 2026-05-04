"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { PageTransition } from "@/components/ui/PageTransition";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";
import type { Athlete, Moment } from "@/data/types";

const FEATURED_MOMENT_ID = "xavier-villanova-1993";

const cardVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.35,
      delay: index * 0.05,
      ease: "easeOut",
    },
  }),
};

function getMomentType(moment: Moment) {
  if (moment.id === FEATURED_MOMENT_ID) {
    return "featured";
  }

  if (moment.verified) {
    return "verified";
  }

  return "default";
}

function getAccentBarClass(moment: Moment) {
  const type = getMomentType(moment);

  if (type === "featured") {
    return "bg-orange";
  }

  if (type === "verified") {
    return "bg-cyan";
  }

  return "bg-paper/25";
}

function getPillClass(moment: Moment) {
  const type = getMomentType(moment);

  if (type === "featured") {
    return "bg-orange/10 text-orange";
  }

  if (type === "verified") {
    return "bg-cyan/10 text-cyan";
  }

  return "bg-white/[0.04] text-paper/40";
}

function groupMomentsByEra(moments: Moment[]) {
  const grouped = new Map<string, Moment[]>();

  for (const moment of moments) {
    const current = grouped.get(moment.era) ?? [];
    current.push(moment);
    grouped.set(moment.era, current);
  }

  return Array.from(grouped.entries()).map(([era, eraMoments]) => ({
    era,
    moments: eraMoments,
  }));
}

export function TimelineClient({ athlete }: Readonly<{ athlete: Athlete }>) {
  const router = useRouter();
  const groups = useMemo(() => groupMomentsByEra(athlete.moments), [athlete]);
  const [activeEra, setActiveEra] = useState(groups[0]?.era ?? "");
  const [visibleLabel, setVisibleLabel] = useState<string | null>(null);
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const nextEra = visibleEntries[0]?.target.getAttribute("data-era");

        if (nextEra) {
          setActiveEra(nextEra);
        }
      },
      {
        root: null,
        rootMargin: "-96px 0px -45% 0px",
        threshold: [0.2, 0.45, 0.7],
      },
    );

    const sections = document.querySelectorAll<HTMLElement>("[data-era]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      if (labelTimer.current) {
        clearTimeout(labelTimer.current);
      }
    };
  }, []);

  function handleEraTap(era: string) {
    document
      .getElementById(`era-${era.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    setActiveEra(era);
    setVisibleLabel(era);

    if (labelTimer.current) {
      clearTimeout(labelTimer.current);
    }

    labelTimer.current = setTimeout(() => {
      setVisibleLabel(null);
    }, 1500);
  }

  return (
    <PageTransition className="min-h-dvh overflow-x-hidden bg-ink text-paper">
      <header className="sticky top-0 z-40 flex h-14 items-center border-b border-white/[0.08] bg-ink/88 px-3 backdrop-blur-md">
        <Link
          href={`/athlete/${athlete.slug}`}
          aria-label="Back to athlete home"
          className="flex h-11 w-11 items-center justify-center rounded-full font-body text-2xl leading-none text-white active:scale-95"
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center font-body text-[15px] font-medium text-white">
          {athlete.name}
        </h1>
        <div className="flex h-11 w-11 items-center justify-end">
          <VerifiedBadge className="min-h-11 w-11 justify-center gap-0 px-0 text-[0px] [&>span:last-child]:sr-only" />
        </div>
      </header>

      <aside
        className="fixed right-3 top-1/2 z-30 h-[320px] w-16 -translate-y-1/2"
        aria-label="Era scrubber"
      >
        <div className="absolute right-3 top-0 h-full w-0.5 rounded-full bg-white/[0.15]" />
        {groups.map((group, index) => {
          const top =
            groups.length === 1 ? 50 : (index / (groups.length - 1)) * 100;
          const isActive = activeEra === group.era;

          return (
            <button
              key={group.era}
              type="button"
              onClick={() => handleEraTap(group.era)}
              className="absolute right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center"
              style={{ top: `${top}%` }}
              aria-label={`Jump to ${group.era}`}
            >
              {visibleLabel === group.era ? (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="pointer-events-none absolute right-10 whitespace-nowrap rounded-full border border-white/[0.08] bg-gray-ricon/95 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-paper/75 shadow-xl backdrop-blur-md"
                >
                  {group.era}
                </motion.span>
              ) : null}
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full border border-white/[0.08] transition-colors duration-200",
                  isActive
                    ? "bg-cyan shadow-[0_0_14px_rgba(0,180,216,0.85)]"
                    : "bg-gray-ricon",
                )}
              />
            </button>
          );
        })}
      </aside>

      <main className="pb-[calc(env(safe-area-inset-bottom)+34px)] pr-12 pt-6">
        {groups.map((group) => (
          <section
            key={group.era}
            id={`era-${group.era.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            data-era={group.era}
            className="scroll-mt-20"
          >
            <div className="flex items-center gap-3 px-5 py-5">
              <div className="h-px flex-1 bg-paper/10" />
              <h2 className="font-display text-lg italic leading-none text-paper/50">
                {group.era}
              </h2>
              <div className="h-px flex-1 bg-paper/10" />
            </div>

            <div className="px-5">
              {group.moments.map((moment, index) => (
                <MomentCard
                  key={moment.id}
                  athleteSlug={athlete.slug}
                  moment={moment}
                  index={index}
                  onNavigate={() =>
                    router.push(`/athlete/${athlete.slug}/story/${moment.id}`)
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </PageTransition>
  );
}

function MomentCard({
  athleteSlug,
  moment,
  index,
  onNavigate,
}: Readonly<{
  athleteSlug: string;
  moment: Moment;
  index: number;
  onNavigate: () => void;
}>) {
  const type = getMomentType(moment);
  const accentBarClass = getAccentBarClass(moment);
  const pillClass = getPillClass(moment);
  const hasStory = moment.id === FEATURED_MOMENT_ID || moment.mediaType === "clip";

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      onClick={onNavigate}
      className={cn(
        "relative mb-3 w-full overflow-hidden rounded-2xl bg-[#111111] p-4 pl-5 transition-transform duration-150 active:scale-[0.98]",
        "shadow-[0_18px_46px_rgba(0,0,0,0.24)]",
        type === "featured" && "shadow-[0_0_0_1px_rgba(255,107,53,0.4)]",
      )}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNavigate();
        }
      }}
    >
      <div
        className={cn("absolute inset-y-0 left-0 w-[3px]", accentBarClass)}
        aria-hidden="true"
      />

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
            pillClass,
          )}
        >
          {type === "featured" ? "Featured" : moment.verified ? "Verified" : "Era"}
        </span>
        <span className="ml-auto font-mono text-[11px] text-paper/42">
          {moment.date}
        </span>
      </div>

      <h3 className="mt-2 font-display text-[19px] font-bold leading-6 text-white">
        {moment.title}
      </h3>
      <p className="mt-2 line-clamp-2 font-body text-[13px] leading-5 text-paper/65">
        {moment.summary}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className="flex h-11 w-11 items-center justify-start"
          aria-label="Verified"
        >
          <span
            className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_12px_rgba(0,180,216,0.75)] motion-safe:animate-verified-pulse"
            aria-hidden="true"
          />
        </span>

        {moment.collectibleId ? (
          <span className="rounded-full bg-orange/12 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-orange">
            ◆ Collect
          </span>
        ) : hasStory ? (
          <Link
            href={`/athlete/${athleteSlug}/story/${moment.id}`}
            onClick={(event) => event.stopPropagation()}
            className="flex h-11 items-center rounded-full px-2 font-body text-xs font-semibold text-orange"
          >
            ▶ Story
          </Link>
        ) : null}
      </div>
    </motion.article>
  );
}
