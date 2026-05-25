import { formatDropType, formatPublishedDate } from "../../lib/contentDropFeed";

export default function ContentDropCard({ drop, twinName, highlighted = false, onOpen }) {
  return (
    <article className={highlighted ? "feed-card feed-card-active" : "feed-card"}>
      <div className="feed-card-top">
        <span className="feed-type-pill">{formatDropType(drop.type)}</span>
        <span className="feed-card-date">{formatPublishedDate(drop.publishedAt)}</span>
      </div>

      <div className="feed-card-twin">{twinName}</div>
      <h3 className="feed-card-title">{drop.title}</h3>
      <p className="feed-card-copy">{drop.summary}</p>

      <div className="feed-card-source">
        <span className="feed-verified-mark" aria-hidden="true">✓</span>
        <span>{drop.source.label}</span>
      </div>

      <button type="button" className="feed-card-open-button" onClick={() => onOpen(drop)}>
        Open Drop
        <span aria-hidden="true"> →</span>
      </button>
    </article>
  );
}
