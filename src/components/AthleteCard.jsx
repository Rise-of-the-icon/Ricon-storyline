export default function AthleteCard({ athlete, delay, onClick }) {
  const isMusic = athlete.cat === "music";
  const label = isMusic
    ? `${athlete.genreLabel} · ${athlete.years}`
    : `${athlete.leagueLabel || "NBA"} · ${athlete.position} · ${athlete.years}`;

  return (
    <div className={`card-root ${isMusic ? "music-card-root" : "sports-card-root"}`} onClick={onClick}
      style={{ animation: `fadeUp 0.6s ease ${delay}ms both` }}>
      <div className="card-initials">
        {athlete.initials}
      </div>
      {athlete.headshot && (
        <div className="card-headshot-wrap" aria-hidden="true">
          <img className="card-headshot" src={athlete.headshot} alt="" />
        </div>
      )}
      <div className="card-top">
        <div className={`eyebrow-pill ${isMusic ? "eyebrow-music" : "eyebrow-sports"}`}>
          {label}
        </div>
      </div>
      <div className="card-title">
        {athlete.name}
      </div>
      <div className="card-tagline">
        {athlete.tagline}
      </div>
      <div className="card-explore">
        EXPLORE STORY <span style={{ fontSize: 13 }}>→</span>
      </div>
    </div>
  );
}
