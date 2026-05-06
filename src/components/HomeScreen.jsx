import { ATHLETES } from "../data/athletes";
import AthleteCard from "./AthleteCard";

export default function HomeScreen({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", animation: "fadeIn 0.6s ease" }}>
      <nav style={{ padding: "26px 40px", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="bebas" style={{ fontSize: 20, letterSpacing: 5, color: "#C9A84C" }}>RICON</span>
        <div style={{ width: 1, height: 20, background: "#2a2a2a" }} />
        <span className="bebas" style={{ fontSize: 20, letterSpacing: 5, color: "rgba(240,235,227,0.45)" }}>STORYLINE</span>
        <div style={{ flex: 1 }} />
        <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#C9A84C", padding: "6px 12px", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 2 }}>
          POC — INVESTOR DEMO 2026
        </div>
      </nav>

      <div style={{ padding: "80px 40px 56px", textAlign: "center" }}>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 16, color: "#7BC8E8", letterSpacing: 4, marginBottom: 26, animation: "fadeIn 1s ease" }}>
          Verified Stories. Immersive Legacies.
        </div>
        <div className="bebas gold-text gold-shimmer" style={{ fontSize: "clamp(72px,13vw,130px)", letterSpacing: 10, lineHeight: 0.88, marginBottom: 24, display: "block" }}>
          STORYLINE
        </div>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 18, color: "rgba(240,235,227,0.28)", letterSpacing: 1 }}>
          Choose a legend. Begin the journey.
        </div>
      </div>

      <div style={{ margin: "0 40px 40px", height: 1, background: "linear-gradient(to right,transparent,rgba(201,168,76,0.3),transparent)" }} />

      <div style={{ padding: "0 32px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 2 }}>
        {ATHLETES.map((a, i) => <AthleteCard key={a.id} athlete={a} delay={i * 70} onClick={() => onSelect(a)} />)}
      </div>

      <div style={{ padding: "28px 40px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
        <span className="mono" style={{ fontSize: 9, color: "#333", letterSpacing: 2 }}>BASKETBALL · SEASON 2026</span>
        <span className="mono" style={{ fontSize: 9, color: "#333", letterSpacing: 2 }}>COLLECT THE TRUTH. RELIVE THE LEGACY.</span>
      </div>
    </div>
  );
}
