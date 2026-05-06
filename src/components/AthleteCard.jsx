export default function AthleteCard({ athlete, delay, onClick }) {
  return (
    <div className="card-root" onClick={onClick}
      style={{ padding: "32px 28px 28px", background: "#0c0c0c", minHeight: 230, display: "flex", flexDirection: "column", justifyContent: "flex-end", animation: `fadeUp 0.6s ease ${delay}ms both` }}>
      <div className="bebas card-initials" style={{ position: "absolute", top: -8, right: -6, fontSize: 130, letterSpacing: 4, color: "rgba(201,168,76,0.04)", lineHeight: 1, userSelect: "none", transition: "opacity 0.3s" }}>
        {athlete.initials}
      </div>
      <div style={{ marginBottom: "auto" }}>
        <div className="mono" style={{ display: "inline-block", padding: "4px 10px", fontSize: 9, letterSpacing: 2, color: "#C9A84C", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 2 }}>
          {athlete.position} · {athlete.years}
        </div>
      </div>
      <div className="bebas" style={{ fontSize: "clamp(26px,3.5vw,36px)", letterSpacing: 3, color: "#F0EBE3", lineHeight: 1.1, marginTop: 44, marginBottom: 8 }}>
        {athlete.name}
      </div>
      <div className="cormorant card-tagline" style={{ fontStyle: "italic", fontSize: 13, color: "rgba(240,235,227,0.32)", lineHeight: 1.55, marginBottom: 14, transition: "color 0.3s" }}>
        {athlete.tagline}
      </div>
      <div className="mono card-explore" style={{ fontSize: 9, letterSpacing: 3, color: "#C9A84C", opacity: 0, transform: "translateY(8px)", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 8 }}>
        EXPLORE STORY <span style={{ fontSize: 13 }}>→</span>
      </div>
    </div>
  );
}
