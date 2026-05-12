import { useState, useEffect, useRef } from "react";
import { TYPE_CONFIG } from "../data/athletes";

let revealBatch = [];
let revealFrame = null;

const queueReveal = (callback) => {
  revealBatch.push(callback);

  if (revealFrame) return;

  revealFrame = window.requestAnimationFrame(() => {
    const batch = revealBatch;
    revealBatch = [];
    revealFrame = null;
    batch.forEach((reveal, batchIndex) => reveal(batchIndex));
  });
};

export default function TimelineMoment({ moment, index, total }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [delay, setDelay] = useState(0);
  const cfg = TYPE_CONFIG[moment.type] || TYPE_CONFIG.iconic;

  useEffect(() => {
    let cancelled = false;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return () => {
        cancelled = true;
      };
    }

    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        queueReveal((batchIndex) => {
          if (cancelled) return;
          setDelay(batchIndex * 80);
          setVisible(true);
        });
        obs.disconnect();
      }
    }, { threshold: 0.15 });

    if (ref.current) obs.observe(ref.current);
    return () => {
      cancelled = true;
      obs.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="moment-item" style={{ transitionDelay: `${delay}ms`, "--moment-color": cfg.color }} data-visible={visible ? "true" : ""}>
      <div className="moment-row">
        <div className="moment-date">
          <div className="moment-year">{moment.y}</div>
          <div className="moment-era">{moment.era}</div>
        </div>
        <div className="moment-marker-col">
          <div className="moment-marker" aria-hidden="true" />
        </div>
        <div className={index < total - 1 ? "moment-body" : "moment-body last"}>
          <div className="moment-title-row">
            <div className="moment-title">{moment.title}</div>
            <div className="type-pill">
              <span>{cfg.icon} {cfg.label}</span>
            </div>
          </div>
          <div className="moment-copy">{moment.body}</div>
          <div className="source-row">
            Source: {moment.source}
          </div>
          {moment.media?.length > 0 && (
            <div className="timeline-media-row">
              {moment.media.map((item, mediaIndex) => (
                <button key={mediaIndex} type="button" className="video-card" aria-label={`Play ${item.title}`}>
                  <span className="video-play" aria-hidden="true">▶</span>
                  <span className="video-copy">
                    <span>{item.title}</span>
                    <small>{item.meta}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
