import TimelineMoment from "./TimelineMoment";

export default function AthleteScreen({ athlete, onBack, onTwin }) {
  return (
    <div style={{ minHeight: "100vh", animation: "fadeIn 0.4s ease" }}>
      <nav style={{ padding: "22px 40px", display: "flex", alignItems: "center", gap: 18, borderBottom: "1px solid rgba(255,255,255,0.05)", position: "sticky", top: 0, background: "rgba(8,8,8,0.96)", backdropFilter: "blur(24px)", zIndex: 90 }}>
        <button className="mono back-btn" onClick={onBack}
          style={{ fontSize: 9, letterSpacing: 2, color: "#666", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}>
          ← ROSTER
        </button>
        <div style={{ width: 1, height: 16, background: "#252525" }} />
        <span className="bebas" style={{ fontSize: 15, letterSpacing: 5, color: "rgba(240,235,227,0.3)" }}>RICON STORYLINE</span>
        <div style={{ flex: 1 }} />
        <button className="cta-glow" onClick={() => onTwin("narrator")}
          style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 3, color: "#080808", background: "linear-gradient(135deg,#C9A84C,#FFD87A)", border: "none", padding: "10px 20px", cursor: "pointer", borderRadius: 2 }}>
          ◉ ACTIVATE DIGITAL TWIN
        </button>
      </nav>

      <div style={{ padding: "76px 40px 52px", position: "relative", overflow: "hidden" }}>
        <div className="bebas" style={{ position: "absolute", bottom: -60, right: 10, fontSize: 300, letterSpacing: 8, color: "rgba(201,168,76,0.022)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>
          {athlete.initials}
        </div>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 15, color: "#7BC8E8", letterSpacing: 4, marginBottom: 18 }}>
          {athlete.position} · {athlete.teams}
        </div>
        <h1 className="bebas" style={{ fontSize: "clamp(58px,9vw,108px)", letterSpacing: 6, lineHeight: 0.9, marginBottom: 22, background: "linear-gradient(135deg,#F0EBE3 0%,#C9A84C 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {athlete.name}
        </h1>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 20, color: "rgba(240,235,227,0.38)", maxWidth: 580, lineHeight: 1.65 }}>
          "{athlete.tagline}"
        </div>

        <div style={{ display: "flex", gap: 2, marginTop: 46, flexWrap: "wrap" }}>
          {athlete.stats.map((s, i) => (
            <div key={i} style={{ padding: "18px 26px", background: "#111", flex: "1 1 110px" }}>
              <div className="bebas" style={{ fontSize: 30, letterSpacing: 2, color: "#C9A84C", lineHeight: 1 }}>{s.v}</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: "#4a4a4a", marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 40px", padding: "22px 28px", background: "linear-gradient(135deg,rgba(201,168,76,0.07),rgba(123,200,232,0.04))", border: "1px solid rgba(201,168,76,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div className="bebas" style={{ fontSize: 18, letterSpacing: 4, color: "#C9A84C", marginBottom: 6 }}>DIGITAL TWIN AVAILABLE</div>
          <div style={{ fontSize: 13, color: "rgba(240,235,227,0.45)", maxWidth: 500, lineHeight: 1.6 }}>
            Interact with {athlete.name.split(" ")[0]}'s verified AI twin. Choose Narrator mode to relive the story, or Q&A mode to ask anything directly.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => onTwin("narrator")} style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "11px 20px", background: "#C9A84C", color: "#080808", border: "none", cursor: "pointer", borderRadius: 2 }}>▶ NARRATOR</button>
          <button className="twin-btn" onClick={() => onTwin("qa")} style={{ fontFamily: '"Space Mono"', fontSize: 10, letterSpacing: 2, padding: "11px 20px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.35)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>✦ ASK ME ANYTHING</button>
        </div>
      </div>

      <div style={{ padding: "72px 40px 80px" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 6, color: "#3a3a3a", marginBottom: 56 }}>
          CAREER TIMELINE · {athlete.moments.length} VERIFIED MOMENTS
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 108, top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom,transparent,rgba(201,168,76,0.28) 8%,rgba(201,168,76,0.28) 92%,transparent)" }} />
          {athlete.moments.map((m, i) => <TimelineMoment key={i} moment={m} index={i} total={athlete.moments.length} />)}
        </div>
      </div>

      <div style={{ padding: "52px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
        <div className="cormorant" style={{ fontStyle: "italic", fontSize: 20, color: "rgba(240,235,227,0.3)", marginBottom: 24 }}>The story doesn't end here.</div>
        <button className="twin-btn" onClick={() => onTwin("qa")}
          style={{ fontFamily: '"Bebas Neue"', fontSize: 15, letterSpacing: 4, padding: "14px 38px", background: "transparent", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)", cursor: "pointer", borderRadius: 2, transition: "all 0.25s" }}>
          ASK THE DIGITAL TWIN →
        </button>
      </div>
    </div>
  );
}
