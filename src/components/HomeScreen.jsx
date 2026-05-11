import { useEffect, useMemo, useState } from "react";
import { FEATURED_HERO, FEATURED_PICKS, FILTERS, LEGENDS } from "../data/athletes";
import AthleteCard from "./AthleteCard";

function FeaturedStoryCard({ legend, delay, onClick }) {
  const label = legend.cat === "music" ? legend.genreLabel : legend.leagueLabel;

  return (
    <button className="featured-card" onClick={onClick} style={{ animation: `fadeUp 0.6s ease ${delay}ms both` }}>
      <div className="featured-card-top">
        <span className={`eyebrow-pill ${legend.cat === "music" ? "eyebrow-music" : "eyebrow-sports"}`}>
          {label}
        </span>
        <span className="featured-enter">ENTER →</span>
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroVisible(false);
      window.setTimeout(() => {
        setHeroIndex((current) => (current + 1) % FEATURED_HERO.length);
        setHeroVisible(true);
      }, 320);
    }, 3800);

    return () => window.clearInterval(interval);
  }, []);

  const activeFilter = FILTERS.find((item) => item.id === filter) || FILTERS[0];
  const hero = FEATURED_HERO[heroIndex];
  const filteredLegends = useMemo(() => LEGENDS.filter(activeFilter.match), [activeFilter]);
  const sportsFilters = FILTERS.filter((item) => item.type === "sports");
  const musicFilters = FILTERS.filter((item) => item.type === "music");

  return (
    <div className="animate-page-enter">
      <nav className="app-nav">
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Storyline</span>
        <div className="nav-spacer" />
        <div className="status-pill">POC - Investor Demo 2026</div>
      </nav>

      <div className={`hero landing-hero ${hero.isSports ? "landing-hero-sports" : "landing-hero-music"}`}>
        <div className="hero-kicker">
          Every legend has a story. Every story has a truth.
        </div>
        <div className="hero-rotator-label">
          {hero.label}
        </div>
        <div className={`hero-title hero-rotator-title ${heroVisible ? "is-visible" : "is-hidden"}`}>
          {hero.name}
        </div>
        <div className="hero-copy">
          Choose a category. Begin the journey.
        </div>
        <div className="hero-actions">
          <button className="primary-button premium-button cta-glow" onClick={() => setFilter("nba")}>
            ◉ EXPLORE SPORTS
          </button>
          <button className="secondary-button music-action" onClick={() => setFilter("hiphop")}>
            ♪ EXPLORE MUSIC
          </button>
        </div>
      </div>

      <div className="category-nav" aria-label="Story categories">
        <div className="category-nav-inner">
          <button
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <div className="filter-group">
            <span className="filter-group-label">Sports</span>
            {sportsFilters.map((item) => (
              <button
                key={item.id}
                className={`filter-tab filter-sports ${filter === item.id ? "active" : ""}`}
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
                className={`filter-tab filter-music ${filter === item.id ? "active" : ""}`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filter === "all" && (
        <section className="featured-section">
          <div className="section-kicker">FEATURED STORIES</div>
          <div className="featured-grid">
            {FEATURED_PICKS.map((legend, i) => (
              <FeaturedStoryCard key={legend.id} legend={legend} delay={i * 80} onClick={() => onSelect(legend)} />
            ))}
          </div>
        </section>
      )}

      <section className="browse-section">
        <div className="browse-heading">
          <div className="section-kicker">
            {filter === "all" ? "ALL LEGENDS" : `${activeFilter.label} LEGENDS`}
          </div>
          <div className="browse-count">
            {filteredLegends.length} verified legacies
          </div>
        </div>
        <div className="athlete-grid">
          {filteredLegends.map((a, i) => <AthleteCard key={a.id} athlete={a} delay={i * 50} onClick={() => onSelect(a)} />)}
        </div>
      </section>

      <div className="app-footer">
        <span>NBA · NFL · MLB · Hip-Hop · Rock · R&B / Soul · Jazz</span>
        <span>Collect the truth. Relive the legacy.</span>
      </div>
    </div>
  );
}
