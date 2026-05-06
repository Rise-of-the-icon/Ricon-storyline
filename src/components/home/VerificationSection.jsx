import "./VerificationSection.css";

const pillars = [
  {
    icon: "◈",
    label: "Source-backed",
    title: "Receipts before mythology",
    copy: "Every story starts from records, archives, timestamps, and source notes.",
  },
  {
    icon: "✓",
    label: "Editorial review",
    title: "Human judgment stays in frame",
    copy: "RICON separates verified fact, narrative context, and what still needs review.",
  },
  {
    icon: "◎",
    label: "Context aware",
    title: "Built around the person and era",
    copy: "Talent, teams, scenes, music, and culture shape the story layer around each moment.",
  },
  {
    icon: "✦",
    label: "AI assisted",
    title: "Guided, not hallucinated",
    copy: "The AI Story Guide answers from the verified layer instead of inventing the legacy.",
  },
  {
    icon: "▤",
    label: "Verified story layer",
    title: "A trust system for interactive memory",
    copy: "Watch, explore, and ask inside a product model designed to keep culture vivid and accountable.",
    wide: true,
  },
];

export function VerificationBadge({ children }) {
  return (
    <span className="verification-badge">
      <span aria-hidden="true">✓</span>
      {children}
    </span>
  );
}

export function VerificationPillar({ pillar }) {
  return (
    <article className={`verification-pillar ${pillar.wide ? "verification-pillar-wide" : ""}`}>
      <div className="verification-pillar-icon" aria-hidden="true">{pillar.icon}</div>
      <div>
        <div className="verification-pillar-label">{pillar.label}</div>
        <h3 className="verification-pillar-title">{pillar.title}</h3>
        <p className="verification-pillar-copy">{pillar.copy}</p>
      </div>
    </article>
  );
}

export default function VerificationSection() {
  return (
    <section className="verification-section" aria-labelledby="verification-section-title">
      <div className="verification-inner">
        <div>
          <div className="verification-eyebrow">RICON Verification</div>
          <h2 id="verification-section-title" className="verification-title">
            Not just AI storytelling. Verified memory.
          </h2>
          <p className="verification-copy">
            RICON is built for stories people care about enough to question. The product pairs cinematic playback with a verified layer that keeps context, sources, and cultural meaning attached.
          </p>
          <div className="verification-badge-row" aria-label="Verification metadata">
            <VerificationBadge>Source-Cited</VerificationBadge>
            <VerificationBadge>Editorially Reviewed</VerificationBadge>
            <VerificationBadge>AI-Guided</VerificationBadge>
          </div>
        </div>

        <div className="verification-pillars">
          {pillars.map((pillar) => (
            <VerificationPillar key={pillar.label} pillar={pillar} />
          ))}
        </div>
      </div>
    </section>
  );
}
