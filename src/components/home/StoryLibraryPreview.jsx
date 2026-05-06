import "./StoryLibraryPreview.css";

const mockStories = [
  {
    id: "nba-legends",
    category: "NBA Legends",
    title: "The Last Shot",
    person: "Michael Jordan · Chicago Bulls",
    runtime: "08:40",
    interaction: "Watch + Ask",
    verification: "Verified",
    accent: "var(--color-gold)",
    thumb: "MJ",
  },
  {
    id: "music-icons",
    category: "Music Icons",
    title: "The Night The Sound Changed",
    person: "Artist Archive · 1990s",
    runtime: "06:15",
    interaction: "Listen + Explore",
    verification: "Source-Cited",
    accent: "var(--color-violet)",
    thumb: "MX",
  },
  {
    id: "cultural-moments",
    category: "Cultural Moments",
    title: "The Commercial That Became Culture",
    person: "Sportswear Era · Global Stage",
    runtime: "05:30",
    interaction: "Explore",
    verification: "In Review",
    accent: "var(--color-teal)",
    thumb: "CX",
  },
  {
    id: "rivalries",
    category: "Rivalries",
    title: "Seven Games Of Pressure",
    person: "NBA Archive · East vs West",
    runtime: "09:05",
    interaction: "Compare",
    verification: "Verified",
    accent: "var(--color-coral)",
    thumb: "RV",
  },
  {
    id: "comebacks",
    category: "Comebacks",
    title: "I'm Back",
    person: "Michael Jordan · 1995",
    runtime: "04:55",
    interaction: "Timeline",
    verification: "Source-Cited",
    accent: "var(--color-gold)",
    thumb: "IB",
  },
  {
    id: "defining-performances",
    category: "Defining Performances",
    title: "Flu Game Mythology",
    person: "Finals Archive · Utah",
    runtime: "07:20",
    interaction: "Watch + Ask",
    verification: "Multi-Source",
    accent: "var(--color-teal)",
    thumb: "FG",
  },
];

export function StoryCard({ story, onSelect }) {
  return (
    <button
      type="button"
      className="story-card"
      style={{ "--story-card-accent": story.accent }}
      onClick={() => onSelect?.(story)}
      aria-label={`${story.title}. ${story.category}. ${story.person}. ${story.runtime}. ${story.interaction}.`}
    >
      <div className="story-card-media" aria-hidden="true">
        <div className="story-card-thumb-label">{story.thumb}</div>
      </div>
      <div className="story-card-body">
        <div className="story-card-topline">
          <span className="story-card-category">{story.category}</span>
          <span className="story-card-verification">{story.verification}</span>
        </div>
        <div>
          <h3 className="story-card-title">{story.title}</h3>
          <p className="story-card-person">{story.person}</p>
        </div>
        <div className="story-card-meta" aria-label="Story metadata">
          <span>{story.runtime}</span>
          <span>{story.interaction}</span>
        </div>
        <span className="story-card-cta">Preview Story</span>
      </div>
    </button>
  );
}

export function StoryCardGrid({ stories = mockStories, onSelect }) {
  return (
    <div className="story-card-grid">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default function StoryLibraryPreview({ stories = mockStories, onSelect }) {
  return (
    <section className="story-library-preview" aria-labelledby="story-library-title">
      <div className="story-library-inner">
        <div className="story-library-header">
          <div>
            <div className="story-library-eyebrow">Story Library</div>
            <h2 id="story-library-title" className="story-library-title">Legacy files ready to open</h2>
          </div>
          <p className="story-library-copy">
            A preview of where RICON goes next: verified sports history, music identity, cultural context, and AI-guided discovery.
          </p>
        </div>
        <StoryCardGrid stories={stories} onSelect={onSelect} />
      </div>
    </section>
  );
}
