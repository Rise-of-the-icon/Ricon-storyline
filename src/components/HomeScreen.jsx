import { useEffect, useMemo, useRef, useState } from "react";
import { FEATURED_HERO, FEATURED_PICKS, FILTERS, LEGENDS } from "../data/athletes";
import { buildLegendMergeKey, fetchRemoteLegends } from "../data/remoteTwins";
import AthleteCard from "./AthleteCard";
import { prewarmNarratorAudio } from "./TwinModal";

const NARRATOR_PREWARM_KEYS = new Set(["david west", "tom hoover", "walt liquor"]);

function FeaturedStoryCard({ legend, delay, onClick }) {
  const label = legend.cat === "music" ? legend.genreLabel : legend.leagueLabel;
  return (
    <button
      type="button"
      className="featured-card"
      onClick={onClick}
      aria-label={`Explore ${legend.name} story`}
      style={{ animation: `fadeUp 0.6s ease ${delay}ms both` }}
    >
      <div className="featured-card-top">
        <span className={`eyebrow-pill ${legend.cat === "music" ? "eyebrow-music" : "eyebrow-sports"}`}>
          {label}
        </span>
        <span className="featured-enter" aria-hidden="true">ENTER →</span>
      </div>
      <div>
        <div className="featured-title">{legend.name}</div>
        <div className="featured-copy">{legend.tagline}</div>
        <div className="featured-meta">{legend.years}</div>
      </div>
    </button>
  );
}

export default function HomeScreen({ onSelect }) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const [filter, setFilter] = useState("all");
  const [allLegends, setAllLegends] = useState(LEGENDS);
  const narratorPrewarmedKeys = useRef(new Set());

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const interval = window.setInterval(() => {
      setHeroVisible(false);
      window.setTimeout(() => {
        setHeroIndex((current) => (current + 1) % FEATURED_HERO.length);
        setHeroVisible(true);
      }, 320);
    }, 3800);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchRemoteLegends().then((remote) => {
      if (remote.length === 0) return;
      // The hardcoded LEGENDS are the curated source of truth for every profile's
      // name, photo, and story data (already calibrated against Wikipedia + BDL).
      // Curated profiles — including David West, Tom Hoover, and Walt Liquor — are
      // baked into LEGENDS, so they render on first paint and are never overwritten
      // or delayed by this network call. Remote twins only ADD people who aren't
      // already represented locally.
      const localKeys = new Set(LEGENDS.map((l) => buildLegendMergeKey(l.name)));
      const newOnes = remote.filter((r) => !localKeys.has(buildLegendMergeKey(r.name)));
      if (newOnes.length === 0) return;
      setAllLegends([...LEGENDS, ...newOnes]);
    });
  }, []);

  useEffect(() => {
    allLegends.forEach((legend) => {
      const key = buildLegendMergeKey(legend.name);
      if (!NARRATOR_PREWARM_KEYS.has(key) || narratorPrewarmedKeys.current.has(key)) return;
      narratorPrewarmedKeys.current.add(key);
      prewarmNarratorAudio(legend);
    });
  }, [allLegends]);

  const activeFilter = FILTERS.find((item) => item.id === filter) || FILTERS[0];
  const hero = FEATURED_HERO[heroIndex];
  const filteredLegends = useMemo(() => allLegends.filter(activeFilter.match), [activeFilter, allLegends]);
  const sportsFilters = FILTERS.filter((item) => item.type === "sports");
  const musicFilters = FILTERS.filter((item) => item.type === "music");

  return (
    <div>
      <nav className="app-nav" aria-label="Primary">
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Storyline</span>
        <div className="nav-spacer" />
      </nav>

      <main>
        <section
          id="how-it-works"
          className={`hero landing-hero ${hero.isSports ? "landing-hero-sports" : "landing-hero-music"}`}
          aria-labelledby="home-title"
        >
          <div className="hero-kicker">Meet the verified AI twins of the legends who shaped sports and culture.</div>
          <div className="hero-rotator-label">Every legend has a story. Every story has a truth.</div>
          <h1 id="home-title" className={`hero-title hero-rotator-title ${heroVisible ? "is-visible" : "is-hidden"}`}>
            {hero.name}
          </h1>
          <div className="hero-copy">Ask questions. Relive iconic moments. Unlock stories built from verified archives.</div>
          <div className="hero-actions">
            <button type="button" className="primary-button premium-button cta-glow" onClick={() => setFilter("nba")}>
              <span aria-hidden="true">◉ </span>EXPLORE SPORTS
            </button>
            <button type="button" className="secondary-button music-action" onClick={() => setFilter("hiphop")}>
              <span aria-hidden="true">♪ </span>EXPLORE MUSIC
            </button>
          </div>
        </section>

        <nav className="category-nav" aria-label="Story categories">
          <div className="category-nav-inner">
            <button
              type="button"
              className={`filter-tab ${filter === "all" ? "active" : ""}`}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <div className="filter-group">
              <span className="filter-group-label">Sports</span>
              {sportsFilters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`filter-tab filter-sports ${filter === item.id ? "active" : ""}`}
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="filter-group">
              <span className="filter-group-label">Music</span>
              {musicFilters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`filter-tab filter-music ${filter === item.id ? "active" : ""}`}
                  aria-pressed={filter === item.id}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {filter === "all" && (
          <section className="featured-section" aria-labelledby="featured-stories-title">
            <h2 id="featured-stories-title" className="section-kicker">FEATURED STORIES</h2>
            <div className="featured-grid">
              {FEATURED_PICKS.map((legend, i) => (
                <FeaturedStoryCard key={legend.id} legend={legend} delay={i * 80} onClick={() => onSelect(legend)} />
              ))}
            </div>
          </section>
        )}

        <section id="explore" className="browse-section" aria-labelledby="browse-stories-title">
          <div className="browse-heading">
            <h2 id="browse-stories-title" className="section-kicker">
              {filter === "all" ? "ALL LEGENDS" : `${activeFilter.label} LEGENDS`}
            </h2>
            <div className="browse-count">{filteredLegends.length} verified legacies</div>
          </div>
          <div className="athlete-grid">
            {filteredLegends.map((a, i) => (
              <AthleteCard key={a.id} athlete={a} delay={i * 50} onClick={() => onSelect(a)} />
            ))}
          </div>
        </section>
      </main>

      <div className="app-footer">
        <span>NBA · NFL · MLB · Hip-Hop · Rock · R&B / Soul · Jazz</span>
        <span>Collect the truth. Relive the legacy.</span>
      </div>
    </div>
  );
}
