import "./FeaturedStoryHero.css";

const getTalentName = (story) => story?.talent?.[0]?.name || "Featured Talent";
const getTalentInitials = (story) => story?.talent?.[0]?.initials || "RS";
const getHeroMedia = (story) => (
  story?.media?.find((media) => media.role === "hero") ||
  story?.media?.find((media) => media.role === "poster") ||
  story?.media?.[0]
);

export function VerifiedStoryBadge({ verification }) {
  const label = verification?.level ? verification.level.replace(/-/g, " ") : "verified";
  return (
    <div className="verified-story-badge" aria-label={`Verified story badge: ${label}`}>
      <span aria-hidden="true">✓</span>
      <span>Verified Story · {label}</span>
    </div>
  );
}

export function StoryCTAGroup({ onWatch, onTimeline, onAskAI, storyTitle }) {
  return (
    <div className="story-cta-group" aria-label="Featured story actions">
      <button type="button" className="story-cta story-cta-primary" onClick={onWatch} aria-label={`Watch story: ${storyTitle}`}>
        <span aria-hidden="true">▶</span>
        Watch Story
      </button>
      <button type="button" className="story-cta story-cta-secondary" onClick={onTimeline} aria-label={`Explore timeline for ${storyTitle}`}>
        Explore Timeline
      </button>
      <button type="button" className="story-cta story-cta-tertiary" onClick={onAskAI} aria-label={`Ask AI Guide about ${storyTitle}`}>
        Ask AI Guide
      </button>
    </div>
  );
}

export function StoryStatStrip({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <div className="story-stat-strip" aria-label="Featured story statistics">
      {stats.slice(0, 3).map((stat) => (
        <div className="story-stat-item" key={stat.id}>
          <div className="story-stat-value">{stat.value}</div>
          <div className="story-stat-label">{stat.label}</div>
          {stat.context && <div className="story-stat-context">{stat.context}</div>}
        </div>
      ))}
    </div>
  );
}

export function HeroStory({ story, onWatch, onTimeline, onAskAI }) {
  const talentName = getTalentName(story);
  const heroMedia = getHeroMedia(story);
  const chips = [story?.vertical, ...(story?.tags || []).slice(0, 4)].filter(Boolean);
  const posterUrl = heroMedia?.posterUrl || heroMedia?.url || "";

  return (
    <section
      className="featured-story-hero"
      aria-labelledby="featured-story-title"
      style={posterUrl ? { "--hero-poster": `url("${posterUrl}")` } : undefined}
    >
      <div className="featured-story-hero-media" aria-hidden="true">
        <div className="featured-story-hero-poster" />
        <div className="featured-story-hero-orbital">{getTalentInitials(story)}</div>
        <div className="featured-story-hero-scrim" />
      </div>

      <div className="featured-story-hero-inner">
        <div className="featured-story-hero-content">
          <div className="featured-story-label-row">
            <div className="featured-story-logo-label">RICON Storyline</div>
            <VerifiedStoryBadge verification={story?.verification} />
          </div>

          <h1 className="featured-story-talent">{talentName}</h1>
          <h2 id="featured-story-title" className="featured-story-title">{story?.title}</h2>
          <p className="featured-story-description">{story?.summary}</p>

          <div className="featured-story-chips" aria-label="Story categories">
            {chips.map((chip) => (
              <span className="featured-story-chip" key={chip}>{String(chip).replace(/-/g, " ")}</span>
            ))}
          </div>

          <StoryCTAGroup
            onWatch={onWatch}
            onTimeline={onTimeline}
            onAskAI={onAskAI}
            storyTitle={story?.title || talentName}
          />
        </div>

        <StoryStatStrip stats={story?.stats || []} />
      </div>
    </section>
  );
}

export default function FeaturedStoryHero(props) {
  return <HeroStory {...props} />;
}
