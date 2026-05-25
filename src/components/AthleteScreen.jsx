import TimelineMoment from "./TimelineMoment";

function bannerCopy(access, firstName) {
  if (access.canAccessChat) {
    return {
      title: "YOUR DIGITAL TWIN IS ACTIVE",
      body: `Interact with ${firstName}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.`,
    };
  }

  if (access.reason === "guest") {
    return {
      title: "DIGITAL TWIN · MEMBERS ONLY",
      body: `Create a fan account to unlock interactive chat with ${firstName}. The verified timeline below remains free to explore.`,
    };
  }

  return {
    title: "DIGITAL TWIN AVAILABLE",
    body: `Subscribe to activate ${firstName}'s verified AI twin. Public story content stays open — chat and subscriber experiences require a plan.`,
  };
}

export default function AthleteScreen({ athlete, onBack, onTwin, twinAccess }) {
  const isMusic = athlete.cat === "music";
  const categoryLabel = isMusic ? athlete.genreLabel : athlete.leagueLabel;
  const metaLabel = isMusic
    ? `${athlete.genreLabel} · ${athlete.credits}`
    : `${athlete.position} · ${athlete.teams}`;
  const timelineLabel = isMusic ? "ARTISTIC TIMELINE" : "CAREER TIMELINE";
  const firstName = athlete.name.split(" ")[0].replace(/^The$/, athlete.name.split(" ")[1] || "legend");
  const access = twinAccess ?? { canAccessChat: true, reason: "granted" };
  const banner = bannerCopy(access, firstName);
  const activateLabel = access.canAccessChat
    ? "ACTIVATE DIGITAL TWIN"
    : access.reason === "guest"
      ? "CREATE ACCOUNT"
      : "ACTIVATE DIGITAL TWIN";

  return (
    <div className="animate-page-enter">
      <nav className="app-nav sticky" aria-label={`${athlete.name} story`}>
        <button type="button" className="ghost-button" onClick={onBack}>
          <span aria-hidden="true">← </span>BROWSE
        </button>
        <div className="nav-divider" />
        <span className="brand-submark">RICON Storyline</span>
        {categoryLabel && <span className="nav-context">{categoryLabel}</span>}
        <div className="nav-spacer" />
        <button
          type="button"
          className="primary-button premium-button cta-glow"
          onClick={() => onTwin("narrator")}
        >
          <span aria-hidden="true">◉ </span>
          {activateLabel}
        </button>
      </nav>

      <main>
        <div className="athlete-hero">
        <div className="athlete-watermark" aria-hidden="true">
          {athlete.initials}
        </div>
        {(athlete.heroImage || athlete.headshot) && (
          <div className={athlete.heroImage ? "athlete-portrait-wrap" : "athlete-portrait-wrap headshot-fallback"} aria-hidden="true">
            <img className="athlete-portrait" src={athlete.heroImage || athlete.headshot} alt="" />
          </div>
        )}
        <div className="athlete-meta">
          {metaLabel}
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

      <div className={access.canAccessChat ? "twin-banner" : "twin-banner twin-banner-locked"}>
        <div>
          <div className="twin-banner-title">{banner.title}</div>
          <div className="twin-banner-copy">
            {banner.body}
          </div>
        </div>
        <div className="button-row">
          <button type="button" className="primary-button" onClick={() => onTwin("narrator")}>
            <span aria-hidden="true">{access.canAccessChat ? "▶" : "◉"} </span>
            {access.canAccessChat ? "NARRATOR" : activateLabel}
          </button>
          <button type="button" className="secondary-button" onClick={() => onTwin("qa")}>
            <span aria-hidden="true">✦ </span>
            {access.canAccessChat ? "ASK ME ANYTHING" : "UNLOCK Q&A"}
          </button>
        </div>
      </div>

      <section className="timeline-section" aria-labelledby="timeline-title">
        <h2 id="timeline-title" className="section-kicker" style={{ marginBottom: 56 }}>
          {timelineLabel} · {athlete.moments.length} VERIFIED MOMENTS
        </h2>
        <div className="timeline-wrap">
          <div className="timeline-line" aria-hidden="true" />
          {athlete.moments.map((m, i) => <TimelineMoment key={i} moment={m} index={i} total={athlete.moments.length} />)}
        </div>
      </section>

      <div className="closing-cta">
        <div className="closing-copy">The story doesn&apos;t end here.</div>
        <button type="button" className="secondary-button" onClick={() => onTwin("qa")}>
          {access.canAccessChat ? "ASK THE DIGITAL TWIN" : "UNLOCK THE DIGITAL TWIN"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      </main>
    </div>
  );
}
