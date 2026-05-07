import TimelineMoment from "./TimelineMoment";

export default function AthleteScreen({ athlete, onBack, onTwin }) {
  return (
    <div className="animate-page-enter">
      <nav className="app-nav sticky">
        <button className="ghost-button" onClick={onBack}>
          ← ROSTER
        </button>
        <div className="nav-divider" />
        <span className="brand-submark">RICON Storyline</span>
        <div className="nav-spacer" />
        <button className="primary-button premium-button cta-glow" onClick={() => onTwin("narrator")}>
          ◉ ACTIVATE DIGITAL TWIN
        </button>
      </nav>

      <div className="athlete-hero">
        <div className="athlete-watermark">
          {athlete.initials}
        </div>
        {(athlete.heroImage || athlete.headshot) && (
          <div className={athlete.heroImage ? "athlete-portrait-wrap" : "athlete-portrait-wrap headshot-fallback"} aria-hidden="true">
            <img className="athlete-portrait" src={athlete.heroImage || athlete.headshot} alt="" />
          </div>
        )}
        <div className="athlete-meta">
          {athlete.position} · {athlete.teams}
        </div>
        <h1 className="athlete-name">
          {athlete.name}
        </h1>
        <div className="athlete-tagline">
          "{athlete.tagline}"
        </div>

        <div className="stats-grid">
          {athlete.stats.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{s.v}</div>
              <div className="stat-label">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="twin-banner">
        <div>
          <div className="twin-banner-title">DIGITAL TWIN AVAILABLE</div>
          <div className="twin-banner-copy">
            Interact with {athlete.name.split(" ")[0]}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.
          </div>
        </div>
        <div className="button-row">
          <button className="primary-button" onClick={() => onTwin("narrator")}>▶ NARRATOR</button>
          <button className="secondary-button" onClick={() => onTwin("qa")}>✦ ASK ME ANYTHING</button>
        </div>
      </div>

      <div className="timeline-section">
        <div className="section-kicker" style={{ marginBottom: 56 }}>
          CAREER TIMELINE · {athlete.moments.length} VERIFIED MOMENTS
        </div>
        <div className="timeline-wrap">
          <div className="timeline-line" />
          {athlete.moments.map((m, i) => <TimelineMoment key={i} moment={m} index={i} total={athlete.moments.length} />)}
        </div>
      </div>

      <div className="closing-cta">
        <div className="closing-copy">The story doesn't end here.</div>
        <button className="secondary-button" onClick={() => onTwin("qa")}>
          ASK THE DIGITAL TWIN →
        </button>
      </div>
    </div>
  );
}
