import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FEATURED_HERO, FEATURED_PICKS, FILTERS, LEGENDS } from "../data/athletes";
import { getFanExperienceSnapshot } from "../lib/fanExperience";
import AthleteCard from "./AthleteCard";
import FanNotificationBell from "./notifications/FanNotificationBell";

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
  const snapshot = getFanExperienceSnapshot();
  const isSubscriber = snapshot.isSubscriber;
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const [filter, setFilter] = useState("all");
  const [allLegends, setAllLegends] = useState(LEGENDS);

  // Hero rotation
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

  // Merge remote twins from MongoDB:
  // - Local athlete exists in MongoDB → keep local handcrafted content
  //   (timeline moments, photo, tagline, voice, position, career span) and only
  //   override individual stat values from Wikipedia (_wiki) or BDL (_bdl) where available
  // - Athlete only hardcoded → kept as-is (fallback)
  // - Athlete only in MongoDB → added with whatever data came back (Studio onboarding)
  useEffect(() => {
    fetchRemoteLegends().then(remote => {
      if (remote.length === 0) return;
      const remoteByName = new Map(remote.map(r => [r.name.toLowerCase(), r]));
      const merged = LEGENDS.map(l => {
        const r = remoteByName.get(l.name.toLowerCase());
        if (!r) return l;
        return {
          ...l,
          ...r,
          headshot: l.headshot,   // always use standardized local photo
          stats: l.stats.map(s => {
            const bdl  = r._bdl;
            const wiki = r._wiki;
            if (s.l === "PPG") {
              const v = wiki?.PPG || bdl?.recent_season?.ppg;
              return v ? { ...s, v: String(v) } : s;
            }
            if (s.l === "RPG") {
              const v = wiki?.RPG || bdl?.recent_season?.rpg;
              return v ? { ...s, v: String(v) } : s;
            }
            if (s.l === "APG") {
              const v = wiki?.APG || bdl?.recent_season?.apg;
              return v ? { ...s, v: String(v) } : s;
            }
            if (s.l === "Championships") {
              const v = wiki?.Championships;
              return v ? { ...s, v: String(v) } : s;
            }
            if (s.l === "All-Stars") {
              const v = wiki?.["All-Stars"];
              return v ? { ...s, v: String(v) } : s;
            }
            return s;
          }),
          tagline:  l.tagline,
          voice:    l.voice,
          moments:  l.moments,   // keep handcrafted timeline; Studio's demo-seed moments only apply to brand-new athletes
          position: l.position,  // keep handcrafted position; BDL can return an empty string and would blank it out
          years:    l.years,     // keep handcrafted career span; Studio's demo timeline mis-derives the range
        };
      });
      const localNames = new Set(LEGENDS.map(l => l.name.toLowerCase()));
      const newOnes = remote.filter(r => !localNames.has(r.name.toLowerCase()));
      setAllLegends([...merged, ...newOnes]);
    });
  }, []);

  const activeFilter   = FILTERS.find((item) => item.id === filter) || FILTERS[0];
  const hero           = FEATURED_HERO[heroIndex];
  const filteredLegends = useMemo(() => allLegends.filter(activeFilter.match), [activeFilter, allLegends]);
  const sportsFilters  = FILTERS.filter((item) => item.type === "sports");
  const musicFilters   = FILTERS.filter((item) => item.type === "music");

  return (
    <div className="animate-page-enter">
      <nav className="app-nav" aria-label="Primary">
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Storyline</span>
        <div className="nav-spacer" />
        <FanNotificationBell />
        {isSubscriber ? (
          <Link to="/fan/home" className="primary-button premium-button">
            <span aria-hidden="true">◉ </span>
            Your Home
          </Link>
        ) : (
          <Link to="/feed" className="ghost-button">Content Drops</Link>
        )}
        <div className="status-pill">POC - Investor Demo 2026</div>
      </nav>

      <main>
        <section className={`hero landing-hero ${hero.isSports ? "landing-hero-sports" : "landing-hero-music"}`} aria-labelledby="home-title">
        <div className="hero-kicker">
          Every legend has a story. Every story has a truth.
        </div>
        <div className="hero-rotator-label">
          {hero.label}
        </div>
        <h1 id="home-title" className={`hero-title hero-rotator-title ${heroVisible ? "is-visible" : "is-hidden"}`}>
          {hero.name}
        </h1>
        <div className="hero-copy">
          Choose a category. Begin the journey.
        </div>
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
            <button type="button" className={`filter-tab ${filter === "all" ? "active" : ""}`} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              All
            </button>
            <div className="filter-group">
              <span className="filter-group-label">Sports</span>
              {sportsFilters.map((item) => (
                <button key={item.id} type="button" className={`filter-tab filter-sports ${filter === item.id ? "active" : ""}`} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="filter-group">
              <span className="filter-group-label">Music</span>
              {musicFilters.map((item) => (
                <button key={item.id} type="button" className={`filter-tab filter-music ${filter === item.id ? "active" : ""}`} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
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

        <section className="browse-section" aria-labelledby="browse-stories-title">
        <div className="browse-heading">
          <h2 id="browse-stories-title" className="section-kicker">
            {filter === "all" ? "ALL LEGENDS" : `${activeFilter.label} LEGENDS`}
          </h2>
          <div className="browse-count">
            {filteredLegends.length} verified legacies
          </div>
        </div>
        <div className="athlete-grid">
          {filteredLegends.map((a, i) => <AthleteCard key={a.id} athlete={a} delay={i * 50} onClick={() => onSelect(a)} />)}
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
