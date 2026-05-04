import type { Athlete, Moment, Source } from "./types";

const sharedSources: Source[] = [
  {
    id: "athlete-archive-david",
    fact: "Athlete-approved RICON Storyline POC biography and moment sequence.",
    sourceName: "RICON Athlete Verification Archive",
    sourceType: "athlete_verified",
    dateAccessed: "2026-05-04",
  },
];

const xavierVillanovaSources: Source[] = [
  {
    id: "xavier-box-score-1993-02-14",
    fact: "David scored 34 points in Xavier's 89-81 win over Villanova on Feb. 14, 1993.",
    sourceName: "Xavier Athletics Men's Basketball Box Score Archive",
    sourceType: "official_record",
    sourceUrl: "https://goxavier.com/sports/mens-basketball",
    dateAccessed: "2026-05-04",
  },
  {
    id: "cincinnati-enquirer-1993-02-15",
    fact: "Game recap noted David's 18 first-half points and Xavier's late-game control.",
    sourceName: "The Cincinnati Enquirer, Feb. 15, 1993 sports section",
    sourceType: "article",
    dateAccessed: "2026-05-04",
  },
  {
    id: "ricon-athlete-interview-villanova",
    fact: "David approved the featured quote and contextual framing for the Villanova moment.",
    sourceName: "RICON Athlete Verification Interview",
    sourceType: "athlete_verified",
    dateAccessed: "2026-05-04",
  },
];

const moments: Moment[] = [
  {
    id: "high-school-state-title-1989",
    athleteId: "david-robinson",
    era: "High School",
    date: "1989",
    title: "High School State Championship",
    summary:
      "David closes his high school chapter with a state championship run in 1989.",
    mediaType: "static",
    mediaUrl: "/mock/david/high-school-state-title.jpg",
    timestampEvents: [],
    verified: true,
    sources: sharedSources,
  },
  {
    id: "xavier-freshman-14-2-ppg",
    athleteId: "david-robinson",
    era: "College - Xavier",
    date: "1991",
    title: "Freshman Season at Xavier",
    summary:
      "David arrives at Xavier and establishes himself immediately, averaging 14.2 points per game as a freshman.",
    mediaType: "animation",
    mediaUrl: "/mock/david/xavier-freshman-season.json",
    timestampEvents: [
      {
        time: 0,
        action: "show_stat",
        payload: { label: "Freshman scoring average", value: "14.2 PPG" },
      },
    ],
    verified: true,
    sources: [
      ...sharedSources,
      {
        id: "xavier-freshman-season-record",
        fact: "David averaged 14.2 points per game during his freshman season at Xavier.",
        sourceName: "Xavier Athletics Season Record Archive",
        sourceType: "official_record",
        sourceUrl: "https://goxavier.com/sports/mens-basketball",
        dateAccessed: "2026-05-04",
      },
    ],
  },
  {
    id: "xavier-villanova-1993",
    athleteId: "david-robinson",
    era: "College - Xavier",
    date: "1993-02-14",
    title: "Greatest Game at Xavier",
    summary:
      "David delivers his signature Xavier performance with 34 points against Villanova on Feb. 14, 1993.",
    mediaType: "clip",
    mediaUrl: "/mock/david/xavier-villanova-1993.mp4",
    // TODO: populate moment.audioUrl with Resemble AI pre-rendered clip path
    timestampEvents: [
      {
        time: 0,
        action: "show_label",
        payload: { text: "Feb 14, 1993 · Cincinnati Bearcats Arena" },
      },
      {
        time: 3,
        action: "show_stat",
        payload: { label: "First half points", value: "18" },
      },
      {
        time: 7,
        action: "show_quote",
        payload: {
          text: "I felt like everything slowed down in the second half.",
          attribution: "David, post-game interview",
        },
      },
      {
        time: 12,
        action: "show_stat",
        payload: { label: "Final score", value: "Xavier 89 · Villanova 81" },
      },
      {
        time: 16,
        action: "show_context",
        payload: {
          text: "This game was later cited in Sports Illustrated's top 50 college moments of the decade.",
        },
      },
    ],
    verified: true,
    sources: xavierVillanovaSources,
    collectibleId: "xavier-villanova-1993-edition-001",
  },
  {
    id: "nba-draft-day-1995",
    athleteId: "david-robinson",
    era: "NBA Draft 1995",
    date: "1995",
    title: "NBA Draft Day 1995",
    summary:
      "David is selected in the second round of the 1995 NBA Draft, turning a Xavier career into a professional opportunity.",
    mediaType: "static",
    mediaUrl: "/mock/david/nba-draft-1995.jpg",
    timestampEvents: [
      {
        time: 0,
        action: "show_label",
        payload: { text: "Selected in the second round" },
      },
    ],
    verified: true,
    sources: [
      ...sharedSources,
      {
        id: "nba-draft-1995-record",
        fact: "David was selected in the second round of the 1995 NBA Draft.",
        sourceName: "NBA Draft 1995 Official Record",
        sourceType: "official_record",
        sourceUrl: "https://www.nba.com/draft/history",
        dateAccessed: "2026-05-04",
      },
    ],
  },
  {
    id: "nba-debut-first-game",
    athleteId: "david-robinson",
    era: "NBA Career",
    date: "1995",
    title: "NBA Debut",
    summary:
      "David steps onto an NBA court for his first professional game.",
    mediaType: "clip",
    mediaUrl: "/mock/david/nba-debut.mp4",
    timestampEvents: [
      {
        time: 0,
        action: "show_context",
        payload: { text: "First professional game" },
      },
    ],
    verified: true,
    sources: sharedSources,
  },
  {
    id: "career-5000th-point",
    athleteId: "david-robinson",
    era: "NBA Career",
    date: "2000",
    title: "5000th Career Point",
    summary:
      "David reaches the 5000-career-point milestone during his professional career.",
    mediaType: "animation",
    mediaUrl: "/mock/david/5000th-career-point.json",
    timestampEvents: [
      {
        time: 0,
        action: "show_stat",
        payload: { label: "Career milestone", value: "5000 points" },
      },
    ],
    verified: true,
    sources: sharedSources,
  },
  {
    id: "xavier-alumni-weekend-return",
    athleteId: "david-robinson",
    era: "Legacy",
    date: "2026",
    title: "Return to Xavier",
    summary:
      "David returns to Xavier for alumni weekend, reconnecting the modern RICON archive with the place where his defining college story took shape.",
    mediaType: "static",
    mediaUrl: "/mock/david/xavier-alumni-weekend.jpg",
    timestampEvents: [
      {
        time: 0,
        action: "show_label",
        payload: { text: "Xavier alumni weekend" },
      },
    ],
    verified: true,
    sources: sharedSources,
  },
];

export const david: Athlete = {
  id: "david-robinson",
  slug: "david-robinson",
  name: "David Robinson",
  sport: "Basketball",
  position: "Guard",
  careerYears: "1989-2026",
  portraitUrl: "/mock/david/portrait.svg",
  heroImageUrl: "/mock/david/hero.jpg",
  verified: true,
  verifiedDate: "2026-05-04",
  tagline: "The Xavier scorer whose signature night became a verified storyline.",
  bio: "David Robinson is the RICON Storyline App POC athlete profile for the JR Ryder stand-in. His mock archive follows a verified path from a 1989 high school state championship through Xavier, the 1995 NBA Draft, professional milestones, and a legacy return to alumni weekend.",
  moments,
};

export default david;
