"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import { useRef, useState } from "react";

import { PageTransition } from "@/components/ui/PageTransition";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import type { Athlete } from "@/data/types";

const entranceContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const entranceItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: "easeOut" },
  },
};

const rosterAthletes = [
  {
    name: "Maya Chen",
    accent: "from-cyan/35",
  },
  {
    name: "Jordan Vale",
    accent: "from-orange/35",
  },
  {
    name: "Ari Knox",
    accent: "from-violet/40",
  },
];

export function AthleteHomeClient({ athlete }: Readonly<{ athlete: Athlete }>) {
  const heroRef = useRef<HTMLElement>(null);
  const [showSources, setShowSources] = useState(false);
  const featuredMoment = athlete.moments.find(
    (moment) => moment.id === "xavier-villanova-1993",
  );

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  if (!featuredMoment) {
    return null;
  }

  return (
    <PageTransition className="min-h-dvh overflow-x-hidden bg-ink text-paper">
      <section
        ref={heroRef}
        className="relative h-svh min-h-[640px] w-full overflow-hidden bg-ink"
      >
        <motion.div className="absolute inset-0 h-[112%]" style={{ y: portraitY }}>
          <Image
            src={athlete.portraitUrl}
            alt={`${athlete.name} portrait`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>

        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(13,13,13,0)_0%,rgba(13,13,13,0)_60%,#0D0D0D_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(0,180,216,0.14),transparent_32%),linear-gradient(to_right,rgba(13,13,13,0.5),transparent_42%,rgba(13,13,13,0.36))]" />

        <motion.div
          variants={entranceContainer}
          initial="hidden"
          animate="show"
          className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(env(safe-area-inset-bottom)+68px)]"
        >
          <motion.p
            variants={entranceItem}
            className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-cyan"
          >
            RICON VERIFIED
          </motion.p>
          <motion.h1
            variants={entranceItem}
            className="mt-3 max-w-[350px] font-display text-[52px] font-bold leading-none text-white"
          >
            {athlete.name}
          </motion.h1>
          <motion.p
            variants={entranceItem}
            className="mt-4 max-w-[330px] font-body text-base leading-6 text-paper/70"
          >
            {athlete.tagline}
          </motion.p>
          <motion.p
            variants={entranceItem}
            className="mt-3 font-mono text-[13px] leading-5 text-paper/50"
          >
            {athlete.careerYears}
          </motion.p>

          <motion.div variants={entranceItem} className="relative mt-5">
            <VerifiedBadge onTap={() => setShowSources((value) => !value)} />
            {showSources ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute left-0 top-14 w-[250px] rounded-2xl border border-paper/10 bg-gray-ricon/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
                  Source Count
                </p>
                <p className="mt-1 font-body text-sm leading-5 text-paper/75">
                  {featuredMoment.sources.length} primary sources connected to
                  the featured storyline.
                </p>
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-[calc(env(safe-area-inset-bottom)+18px)] left-1/2 z-10 h-8 w-px -translate-x-1/2 overflow-hidden bg-paper/15"
          aria-hidden="true"
        >
          <motion.div
            className="h-full w-full bg-paper/70"
            animate={{ opacity: [0, 1, 0], y: [-32, 0, 32] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      <motion.main
        variants={entranceContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="relative z-20 -mt-1 bg-ink pb-[calc(env(safe-area-inset-bottom)+40px)]"
      >
        <section className="px-5 pt-8">
          <motion.p
            variants={entranceItem}
            className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-cyan"
          >
            FEATURED STORY
          </motion.p>

          <motion.article
            variants={entranceItem}
            className="mt-4 w-full rounded-2xl bg-gray-ricon p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]"
          >
            <p className="font-body text-xs font-medium uppercase tracking-[0.08em] text-orange">
              {featuredMoment.era}
            </p>
            <h2 className="mt-2 font-display text-[22px] font-bold leading-7 text-white">
              {featuredMoment.title}
            </h2>
            <p className="mt-3 line-clamp-2 font-body text-sm leading-6 text-paper/55">
              {featuredMoment.summary}
            </p>
            <Link
              href={`/athlete/${athlete.slug}/story/${featuredMoment.id}`}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-orange px-5 font-body text-[15px] font-semibold text-white shadow-[0_14px_36px_rgba(255,107,53,0.18)] transition-transform active:scale-95"
            >
              Play Story →
            </Link>
          </motion.article>
        </section>

        <section className="pt-10">
          <motion.p
            variants={entranceItem}
            className="px-5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-paper/40"
          >
            OTHER ATHLETES
          </motion.p>
          <motion.div
            variants={entranceItem}
            className="scrollbar-hide mt-4 flex w-full gap-3 overflow-x-auto px-5 pb-2"
          >
            {rosterAthletes.map((rosterAthlete) => (
              <article
                key={rosterAthlete.name}
                className="relative h-40 w-[120px] shrink-0 overflow-hidden rounded-2xl bg-gray-ricon ring-1 ring-white/[0.06]"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${rosterAthlete.accent} via-transparent to-black/80`}
                />
                <div className="absolute left-2 top-2 rounded-full border border-paper/10 bg-black/45 px-2 py-1 backdrop-blur-md">
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-paper/65">
                    Coming Soon
                  </span>
                </div>
                <h3 className="absolute inset-x-3 bottom-3 font-body text-sm font-semibold leading-4 text-white">
                  {rosterAthlete.name}
                </h3>
              </article>
            ))}
          </motion.div>
        </section>
      </motion.main>
    </PageTransition>
  );
}
