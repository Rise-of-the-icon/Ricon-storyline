import "./ExperienceModeSection.css";

const defaultModes = [
  {
    id: "watch",
    icon: "▶",
    title: "Watch",
    description: "Cinematic story playback, chapters, narration, video, and cultural context.",
    cta: "Watch Story",
  },
  {
    id: "explore",
    icon: "◇",
    title: "Explore",
    description: "Interactive timeline, stats, moments, artifacts, and story branches.",
    cta: "Explore Timeline",
  },
  {
    id: "ask",
    icon: "✦",
    title: "Ask",
    description: "AI Story Guide for contextual questions, comparisons, and recommendations.",
    cta: "Ask AI Guide",
  },
];

export function ExperienceModeCard({ mode, onAction }) {
  return (
    <article className={`experience-mode-card experience-mode-card-${mode.id}`}>
      <div>
        <div className="experience-mode-card-icon" aria-hidden="true">{mode.icon}</div>
        <h3 className="experience-mode-card-title">{mode.title}</h3>
        <p className="experience-mode-card-copy">{mode.description}</p>
      </div>
      <button
        type="button"
        className="experience-mode-card-cta"
        onClick={onAction}
        aria-label={`${mode.cta}: ${mode.description}`}
      >
        {mode.cta}
      </button>
    </article>
  );
}

export default function ExperienceModeSection({
  onWatch,
  onExplore,
  onAsk,
  modes = defaultModes,
}) {
  const actions = {
    watch: onWatch,
    explore: onExplore,
    ask: onAsk,
  };

  return (
    <section className="experience-mode-section" aria-labelledby="experience-mode-title">
      <div className="experience-mode-inner">
        <div className="experience-mode-heading">
          <div className="experience-mode-eyebrow">Watch / Explore / Ask</div>
          <h2 id="experience-mode-title" className="experience-mode-title">The story moves with you</h2>
          <p className="experience-mode-copy">
            RICON turns verified legacy moments into a living product loop: watch the story, explore the timeline, then ask the guide what matters next.
          </p>
        </div>

        <div className="experience-mode-grid">
          {modes.map((mode) => (
            <ExperienceModeCard key={mode.id} mode={mode} onAction={actions[mode.id]} />
          ))}
        </div>
      </div>
    </section>
  );
}
