function categoryLabel(category) {
  return category === "music" ? "Music" : "Sports";
}

export default function TwinSelectCard({ twin, selected, onSelect }) {
  return (
    <button
      type="button"
      className={selected ? "select-twin-card is-selected" : "select-twin-card"}
      onClick={() => onSelect(twin.id)}
      aria-pressed={selected}
      aria-label={`Select ${twin.name}`}
    >
      {selected && (
        <span className="select-twin-selected-badge" aria-hidden="true">
          ✓ Selected
        </span>
      )}

      {twin.image ? (
        <div className="select-twin-avatar-wrap">
          <img className="select-twin-avatar" src={twin.image} alt="" />
        </div>
      ) : (
        <div className="select-twin-avatar-wrap select-twin-avatar-fallback" aria-hidden="true">
          {twin.name.slice(0, 1)}
        </div>
      )}

      <div className="select-twin-tags">
        <span className={`eyebrow-pill ${twin.category === "music" ? "eyebrow-music" : "eyebrow-sports"}`}>
          {categoryLabel(twin.category)}
        </span>
        <span className="select-twin-industry">{twin.sportOrIndustry}</span>
      </div>

      <div className="select-twin-name">{twin.name}</div>
      <div className="select-twin-years">{twin.yearsActive}</div>
      <div className="select-twin-copy">{twin.shortDescription}</div>

      <span className="select-twin-cta">{selected ? "Selected" : "Select Twin"} →</span>
    </button>
  );
}
