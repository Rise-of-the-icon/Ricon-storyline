import { ATHLETES } from "../data/athletes";
import AthleteCard from "./AthleteCard";

export default function HomeScreen({ onSelect }) {
  return (
    <div className="animate-page-enter">
      <nav className="app-nav">
        <span className="brand-mark">RICON</span>
        <div className="nav-divider" />
        <span className="brand-submark">Storyline</span>
        <div className="nav-spacer" />
        <div className="status-pill">POC - Investor Demo 2026</div>
      </nav>

      <div className="hero">
        <div className="hero-kicker">
          Verified Stories. Immersive Legacies.
        </div>
        <div className="hero-title">
          STORYLINE
        </div>
        <div className="hero-copy">
          Choose a legend. Begin the journey.
        </div>
      </div>

      <div className="section-rule" />

      <div className="athlete-grid">
        {ATHLETES.map((a, i) => <AthleteCard key={a.id} athlete={a} delay={i * 70} onClick={() => onSelect(a)} />)}
      </div>

      <div className="app-footer">
        <span>Basketball · Season 2026</span>
        <span>Collect the truth. Relive the legacy.</span>
      </div>
    </div>
  );
}
