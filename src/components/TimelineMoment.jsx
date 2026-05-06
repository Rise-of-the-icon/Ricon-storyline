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
    <div ref={ref} className="moment-item" style={{ transitionDelay: `${index * 80}ms`, "--moment-color": cfg.color }} data-visible={visible ? "true" : ""}>
      <div className="moment-row">
        <div className="moment-date">
          <div className="moment-year">{moment.y}</div>
          <div className="moment-era">{moment.era}</div>
        </div>
        <div className="moment-marker-col">
          <div className="moment-marker" />
        </div>
        <div className={index < total - 1 ? "moment-body" : "moment-body last"}>
          <div className="type-pill">
            <span>{cfg.icon} {cfg.label}</span>
          </div>
          <div className="moment-title">{moment.title}</div>
          <div className="moment-copy">{moment.body}</div>
          <div className="source-row">
            <div className="source-rule" />
            <div>✓ {moment.src}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
