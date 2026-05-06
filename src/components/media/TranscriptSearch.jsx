export default function TranscriptSearch({ value, onChange }) {
  return (
    <label className="transcript-search">
      <span>Search transcript</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Search coming soon"
        aria-label="Search transcript placeholder"
      />
    </label>
  );
}
