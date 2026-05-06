export default function AthleteCard({ athlete, delay, onClick }) {
  return (
    <div className="card-root" onClick={onClick}
      style={{ animation: `fadeUp 0.6s ease ${delay}ms both` }}>
      <div className="card-initials">
        {athlete.initials}
      </div>
      <div className="card-top">
        <div className="eyebrow-pill">
          {athlete.position} · {athlete.years}
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
