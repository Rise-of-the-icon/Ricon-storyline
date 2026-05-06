import { useMemo, useRef, useState } from "react";
import "./FeaturedTimelinePreview.css";

const titleCase = (value = "") => String(value).replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const getPreviewMoments = (story) => {
  const moments = story?.timeline?.length ? story.timeline : (story?.chapters || []).flatMap((chapter) => chapter.moments || []);
  const seen = new Set();
  return moments.filter((moment) => {
    if (!moment?.id || seen.has(moment.id)) return false;
    seen.add(moment.id);
    return true;
  }).slice(0, 7);
};

export default function FeaturedTimelinePreview({ story, onViewMoment }) {
  const moments = useMemo(() => getPreviewMoments(story), [story]);
  const [selectedId, setSelectedId] = useState(moments[0]?.id || "");
  const itemRefs = useRef([]);

  if (!moments.length) return null;

  const selectMoment = (moment, index, { view = false } = {}) => {
    setSelectedId(moment.id);
    itemRefs.current[index]?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
    if (view) onViewMoment?.(moment);
  };

  const handleKeyDown = (event, index) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      selectMoment(moments[index], index, { view: true });
      return;
    }
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? moments.length - 1
        : Math.min(Math.max(index + (event.key === "ArrowRight" ? 1 : -1), 0), moments.length - 1);
    setSelectedId(moments[nextIndex].id);
    itemRefs.current[nextIndex]?.focus?.();
    itemRefs.current[nextIndex]?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <section className="featured-timeline-preview" aria-labelledby="featured-timeline-title">
      <div className="featured-timeline-inner">
        <div className="featured-timeline-header">
          <div>
            <div className="featured-timeline-eyebrow">Featured Timeline</div>
            <h2 id="featured-timeline-title" className="featured-timeline-title">Key moments in the arc</h2>
          </div>
          <div className="featured-timeline-meta">
            Use arrow keys to move across moments. Select a node or choose View Moment to enter the story.
          </div>
        </div>

        <div
          className="featured-timeline-track"
          style={{ "--timeline-count": moments.length }}
          role="list"
          aria-label={`${story?.title || "Featured story"} timeline preview`}
        >
          {moments.map((moment, index) => {
            const active = selectedId === moment.id;
            return (
              <div
                key={moment.id}
                className={`featured-timeline-item ${active ? "featured-timeline-item-active" : ""}`}
                role="listitem"
              >
                <span className="featured-timeline-node" aria-hidden="true" />
                <button
                  ref={(node) => { itemRefs.current[index] = node; }}
                  type="button"
                  className="featured-timeline-card"
                  onClick={() => selectMoment(moment, index)}
                  onDoubleClick={() => selectMoment(moment, index, { view: true })}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  aria-current={active ? "step" : undefined}
                  aria-label={`${active ? "Selected. " : ""}${moment.year || moment.date || "Moment"}: ${moment.title}. ${moment.summary}`}
                >
                  <span className="featured-timeline-year">{moment.year || moment.date || "TBD"}</span>
                  <h3 className="featured-timeline-moment-title">{moment.title}</h3>
                  <span className="featured-timeline-chip">{titleCase(moment.kind)}</span>
                  <span className="featured-timeline-label">{moment.summary}</span>
                  <span
                    className="featured-timeline-cta"
                    onClick={(event) => {
                      event.stopPropagation();
                      selectMoment(moment, index, { view: true });
                    }}
                  >
                    View Moment
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
