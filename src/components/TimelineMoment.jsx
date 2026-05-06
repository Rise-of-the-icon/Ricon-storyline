import { useState, useEffect, useRef } from "react";
import { TYPE_CONFIG } from "../data/athletes";

export default function TimelineMoment({ moment, index, total }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="moment-item" style={{ transitionDelay: `${index * 80}ms` }} data-visible={visible ? "true" : ""}>
      <style>{`.moment-item[data-visible="true"]{opacity:1;transform:translateY(0);}.moment-item[data-visible="false"],.moment-item:not([data-visible]){opacity:0;transform:translateY(20px);}`}</style>
      <div style={{ display: "flex", marginBottom: 54 }}>
        <div style={{ width: 96, flexShrink: 0, paddingTop: 3 }}>
          <div className="mono" style={{ fontSize: 12, color: "#C9A84C", letterSpacing: 1 }}>{moment.y}</div>
          <div className="mono" style={{ fontSize: 8, color: "#3a3a3a", letterSpacing: 1, marginTop: 5, lineHeight: 1.5 }}>{moment.era}</div>
        </div>
        <div style={{ width: 36, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 10px ${cfg.color}80`, marginTop: 4, flexShrink: 0 }} />
        </div>
        <div style={{ flex: 1, paddingLeft: 18, paddingBottom: 20, borderBottom: index < total - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "3px 10px", border: `1px solid ${cfg.color}40`, borderRadius: 2 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: 2, color: cfg.color }}>{cfg.icon} {cfg.label}</span>
          </div>
          <div className="bebas" style={{ fontSize: 24, letterSpacing: 2, color: "#F0EBE3", lineHeight: 1.2, marginBottom: 12 }}>{moment.title}</div>
          <div className="cormorant" style={{ fontStyle: "italic", fontSize: 17, color: "rgba(240,235,227,0.62)", lineHeight: 1.75, marginBottom: 14, maxWidth: 660 }}>{moment.body}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 1, background: "#333" }} />
            <div className="mono" style={{ fontSize: 9, color: "#383838", letterSpacing: 1 }}>✓ {moment.src}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
