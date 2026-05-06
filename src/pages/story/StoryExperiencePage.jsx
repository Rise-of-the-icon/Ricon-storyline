import { useEffect, useMemo, useRef, useState } from "react";
import { formatRuntime, getChapterByMomentId, getStoryBySlug, getStoryMoments, getSuggestedPromptsForMoment, getVerificationBadges } from "../../utils/storyUtils";
import AIStoryGuide from "../../components/ai/AIStoryGuide.jsx";
import MediaPlayerShell from "../../components/media/MediaPlayerShell.jsx";
import "./StoryExperiencePage.css";

const timelineCategories = ["All", "Career", "Game", "Culture", "Music", "Stats", "Legacy"];
const categoryForMoment = (moment) => {
  const kind = moment?.kind || "";
  if (["draft", "return", "retirement"].includes(kind)) return "Career";
  if (["championship", "iconic"].includes(kind)) return "Game";
  if (["record"].includes(kind)) return "Stats";
  if (["release", "performance", "collaboration"].includes(kind)) return "Music";
  if (["cultural"].includes(kind)) return "Culture";
  return "Legacy";
};

function StoryHeader({ story }) {
  const talent = story.talent?.[0]?.name || "Featured Story";
  return (
    <header className="story-header">
      <div className="story-header-inner">
        <div className="story-header-meta">
          <span className="story-header-badge">{story.vertical}</span>
          <span className="story-header-badge">{story.verification?.level?.replace(/-/g, " ") || "verified"}</span>
          <span className="story-header-badge">{story.year}</span>
        </div>
        <h1 className="story-header-title">{talent}</h1>
        <p className="story-header-subtitle">{story.subtitle || story.summary}</p>
      </div>
    </header>
  );
}

function ChapterMarker({ chapter, active, completed, onSelect }) {
  return (
    <button
      type="button"
      className={`story-chapter-button ${active ? "story-chapter-button-active" : ""} ${completed ? "story-chapter-button-completed" : ""}`}
      onClick={onSelect}
      aria-current={active ? "step" : undefined}
    >
      <span className="story-chapter-number">
        {completed ? "Completed" : `Chapter ${String(chapter.number).padStart(2, "0")}`}
      </span>
      <span className="story-chapter-title">{chapter.title}</span>
    </button>
  );
}

function ChapterProgress({ chapters = [], activeChapterIndex = 0 }) {
  const safeCount = chapters.length || 1;
  const progress = Math.round(((activeChapterIndex + 1) / safeCount) * 100);
  return (
    <div className="chapter-progress" aria-label={`Chapter progress ${activeChapterIndex + 1} of ${safeCount}`}>
      <div className="chapter-progress-meta">
        <span>Chapter {Math.min(activeChapterIndex + 1, safeCount)}/{safeCount}</span>
        <span>{progress}%</span>
      </div>
      <div className="chapter-progress-track">
        <div className="chapter-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function ChapterNav({ story, activeMomentId, onSelectMoment }) {
  const chapters = story?.chapters || [];
  const activeChapterIndex = Math.max(0, chapters.findIndex((chapter) => (
    (chapter.moments || []).some((moment) => moment.id === activeMomentId)
  )));
  return (
    <aside className="story-chapter-list" aria-label="Story chapters">
      <div className="story-panel-label">Chapters</div>
      <ChapterProgress chapters={chapters} activeChapterIndex={activeChapterIndex} />
      {chapters.map((chapter, chapterIndex) => {
        const firstMoment = chapter.moments[0];
        const active = chapterIndex === activeChapterIndex;
        const completed = chapterIndex < activeChapterIndex;
        return (
          <ChapterMarker
            key={chapter.id}
            chapter={chapter}
            active={active}
            completed={completed}
            onSelect={() => firstMoment && onSelectMoment(firstMoment.id)}
          />
        );
      })}
    </aside>
  );
}

function ContinueButton({ hasNext, onContinue }) {
  return (
    <button type="button" className="story-moment-action story-continue-button" onClick={onContinue} disabled={!hasNext}>
      Continue
    </button>
  );
}

function MobileChapterNav({ story, activeMomentId, onSelectMoment }) {
  const chapters = story?.chapters || [];
  const activeChapterIndex = Math.max(0, chapters.findIndex((chapter) => (
    (chapter.moments || []).some((moment) => moment.id === activeMomentId)
  )));
  const activeChapter = chapters[activeChapterIndex];
  return (
    <details className="mobile-chapter-nav">
      <summary>
        <span>Chapters</span>
        <strong>{activeChapter ? `Chapter ${activeChapter.number}: ${activeChapter.title}` : "No chapters"}</strong>
      </summary>
      <div className="mobile-chapter-nav-panel">
        <ChapterProgress chapters={chapters} activeChapterIndex={activeChapterIndex} />
        {chapters.map((chapter, chapterIndex) => {
          const firstMoment = chapter.moments?.[0];
          return (
            <ChapterMarker
              key={chapter.id}
              chapter={chapter}
              active={chapterIndex === activeChapterIndex}
              completed={chapterIndex < activeChapterIndex}
              onSelect={() => firstMoment && onSelectMoment(firstMoment.id)}
            />
          );
        })}
      </div>
    </details>
  );
}

function TimelineMomentCard({ story, moment, active, completed, density, onSelect, onAsk }) {
  const media = story.media.find((item) => moment.mediaIds?.includes(item.id));
  const category = categoryForMoment(moment);
  return (
    <article className={`timeline-explorer-card timeline-explorer-card-${density} ${active ? "timeline-explorer-card-active" : ""} ${completed ? "timeline-explorer-card-completed" : ""}`}>
      <div className="timeline-explorer-card-date">{moment.year || moment.date || "TBD"}</div>
      <h3 className="timeline-explorer-card-title">{moment.title}</h3>
      <p className="timeline-explorer-card-summary">{moment.summary}</p>
      <div className="timeline-explorer-card-meta">
        <span>{category}</span>
        <span>{media?.kind || "story"} layer</span>
      </div>
      <div className="timeline-explorer-card-actions">
        <button type="button" onClick={onSelect}>Play Moment</button>
        <button type="button" onClick={onAsk}>Ask About This</button>
      </div>
    </article>
  );
}

function TimelineMomentDrawer({ story, moment, triggerRef, onClose, onPlay, onAsk }) {
  const closeRef = useRef(null);
  const media = moment ? story.media.find((item) => moment.mediaIds?.includes(item.id)) : null;
  const prompts = moment ? getSuggestedPromptsForMoment(story, moment.id).slice(0, 3) : [];
  const badges = moment ? (getVerificationBadges(moment).length ? getVerificationBadges(moment) : getVerificationBadges(story)) : [];

  useEffect(() => {
    closeRef.current?.focus?.();
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const closeDrawer = () => {
    onClose();
    window.setTimeout(() => triggerRef?.current?.focus?.(), 0);
  };

  return (
    <aside className="timeline-moment-drawer" role="dialog" aria-modal="false" aria-label={moment ? `Moment details for ${moment.title}` : "Moment details"}>
      <div className="timeline-moment-drawer-header">
        <div className="story-panel-label">Selected Moment</div>
        <button ref={closeRef} type="button" className="timeline-moment-drawer-close" onClick={closeDrawer} aria-label="Close moment details">
          Close
        </button>
      </div>

      {!moment ? (
        <div className="timeline-explorer-empty" role="status">Select a moment to view details.</div>
      ) : (
        <>
          <div className="timeline-moment-drawer-media" aria-hidden="true">
            <span>{story.talent?.[0]?.initials || "RS"}</span>
          </div>
          <div className="timeline-moment-drawer-meta">
            <span>{moment.year || moment.date || "TBD"}</span>
            <span>{categoryForMoment(moment)}</span>
            <span>{media?.kind || "story"} layer</span>
          </div>
          <h3>{moment.title}</h3>
          <p>{moment.body || moment.summary}</p>
          {story.stats?.length > 0 && (
            <div className="timeline-moment-drawer-stats" aria-label="Story stats">
              {story.stats.slice(0, 3).map((stat) => (
                <div key={stat.id}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="timeline-moment-drawer-badges" aria-label="Verification badges">
            {badges.map((badge) => <span key={badge}>{badge}</span>)}
          </div>
          {prompts.length > 0 && (
            <div className="timeline-moment-drawer-prompts" aria-label="Suggested prompts">
              {prompts.map((prompt) => <button key={prompt.id} type="button" onClick={() => onAsk(prompt)}>{prompt.label}</button>)}
            </div>
          )}
          <div className="timeline-moment-drawer-actions">
            <button type="button" onClick={onPlay}>Play Moment</button>
            <button type="button" onClick={() => onAsk({ prompt: `Tell me why "${moment.title}" matters in this story.` })}>Ask AI Guide</button>
          </div>
        </>
      )}
    </aside>
  );
}

function TimelineExplorer({ story, moments, activeMomentId, onSelectMoment, onPromptSelect }) {
  const [category, setCategory] = useState("All");
  const [density, setDensity] = useState("standard");
  const [drawerMomentId, setDrawerMomentId] = useState(activeMomentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTriggerRef = useRef(null);
  const itemRefs = useRef({});
  const activeIndex = Math.max(0, moments.findIndex((moment) => moment.id === activeMomentId));
  const visibleMoments = useMemo(() => (
    category === "All" ? moments : moments.filter((moment) => categoryForMoment(moment) === category)
  ), [category, moments]);
  const drawerMoment = moments.find((moment) => moment.id === drawerMomentId) || moments.find((moment) => moment.id === activeMomentId) || visibleMoments[0];

  useEffect(() => {
    setDrawerMomentId(activeMomentId);
    const activeNode = itemRefs.current[activeMomentId];
    activeNode?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeMomentId, category, density]);

  const selectMoment = (moment) => {
    setDrawerMomentId(moment.id);
    onSelectMoment(moment.id);
  };
  const openDrawerForMoment = (moment, triggerNode) => {
    drawerTriggerRef.current = triggerNode || itemRefs.current[moment.id] || null;
    setDrawerMomentId(moment.id);
    setDrawerOpen(true);
  };

  const handleCardKeyDown = (event, moment, index) => {
    if (!["Enter", " ", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      selectMoment(moment);
      return;
    }
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? visibleMoments.length - 1
        : Math.min(Math.max(index + (event.key === "ArrowRight" ? 1 : -1), 0), visibleMoments.length - 1);
    const next = visibleMoments[nextIndex];
    if (next) selectMoment(next);
  };

  return (
    <section className="timeline-explorer" aria-labelledby="timeline-explorer-title">
      <div className="timeline-explorer-header">
        <div>
          <div className="story-panel-label">Timeline Explorer</div>
          <h2 id="timeline-explorer-title" className="timeline-explorer-title">All moments</h2>
        </div>
        <div className="timeline-explorer-controls">
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {timelineCategories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Density</span>
            <select value={density} onChange={(event) => setDensity(event.target.value)}>
              <option value="compact">Compact</option>
              <option value="standard">Standard</option>
              <option value="expanded">Expanded</option>
            </select>
          </label>
        </div>
      </div>

      {visibleMoments.length ? (
        <div className={`timeline-explorer-track timeline-explorer-track-${density}`} role="list" aria-label="Story timeline moments">
          {visibleMoments.map((moment, index) => {
            const absoluteIndex = moments.findIndex((item) => item.id === moment.id);
            return (
              <div
                key={moment.id}
                ref={(node) => {
                  if (node) itemRefs.current[moment.id] = node;
                  else delete itemRefs.current[moment.id];
                }}
                className="timeline-explorer-item"
                role="listitem"
                tabIndex={0}
                onClick={() => selectMoment(moment)}
                onFocus={() => setDrawerMomentId(moment.id)}
                onMouseEnter={() => setDrawerMomentId(moment.id)}
                onKeyDown={(event) => handleCardKeyDown(event, moment, index)}
                aria-current={moment.id === activeMomentId ? "step" : undefined}
              >
                <TimelineMomentCard
                  story={story}
                  moment={moment}
                  active={moment.id === activeMomentId}
                  completed={absoluteIndex < activeIndex}
                  density={density}
                  onSelect={(event) => {
                    event?.stopPropagation?.();
                    selectMoment(moment);
                    openDrawerForMoment(moment, itemRefs.current[moment.id]);
                  }}
                  onAsk={(event) => {
                    event?.stopPropagation?.();
                    onPromptSelect({ prompt: `Tell me why "${moment.title}" matters in this story.` });
                    selectMoment(moment);
                    openDrawerForMoment(moment, itemRefs.current[moment.id]);
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="timeline-explorer-empty" role="status">
          No moments match this category yet. Try another filter.
        </div>
      )}

      {drawerOpen && (
        <TimelineMomentDrawer
          story={story}
          moment={drawerMoment}
          triggerRef={drawerTriggerRef}
          onClose={() => setDrawerOpen(false)}
          onPlay={() => drawerMoment && selectMoment(drawerMoment)}
          onAsk={(prompt) => onPromptSelect(prompt)}
        />
      )}
    </section>
  );
}

function StoryStatGrid({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <div className="story-stat-grid" aria-label="Story statistics">
      {stats.slice(0, 3).map((stat) => (
        <div className="story-stat-block" key={stat.id}>
          <div className="story-stat-block-value">{stat.value}</div>
          <div className="story-stat-block-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function StoryProgress({ current, total }) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="story-progress" aria-label={`Chapter progress ${current} of ${total}`}>
      <div className="story-progress-meta">
        <span>Moment {current}/{total}</span>
        <span>{progress}%</span>
      </div>
      <div className="story-progress-track">
        <div className="story-progress-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StoryMomentPanel({
  story,
  moment,
  activeIndex,
  totalMoments,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onMomentChange,
  onAskAboutMoment,
}) {
  const chapter = getChapterByMomentId(story, moment.id);
  const media = story.media.find((item) => moment.mediaIds?.includes(item.id)) || story.media[0];
  const badges = getVerificationBadges(moment).length ? getVerificationBadges(moment) : getVerificationBadges(story);
  return (
    <section className="story-moment-panel" aria-labelledby="story-moment-title">
      <MediaPlayerShell
        media={media}
        chapters={story.chapters || []}
        activeMoment={moment}
        onMomentChange={onMomentChange}
        onAskAboutMoment={onAskAboutMoment}
      />
      <div className="story-moment-content">
        <StoryProgress current={activeIndex + 1} total={totalMoments} />
        <div className="story-header-meta">
          <span className="story-header-badge">{chapter ? `Chapter ${chapter.number}: ${chapter.title}` : "Story moment"}</span>
          <span className="story-header-badge">{moment.year || moment.date}</span>
          {media?.kind && <span className="story-header-badge">{media.kind} layer</span>}
          {Number.isFinite(media?.durationSeconds) && <span className="story-header-badge">{formatRuntime(media.durationSeconds)}</span>}
        </div>
        <p className="story-moment-expanded-copy">{moment.body || moment.summary}</p>
        <StoryStatGrid stats={story.stats || []} />
        <div className="story-verification-strip" aria-label="Verification metadata">
          {badges.map((badge) => <span key={badge}>{badge}</span>)}
        </div>
        <div className="story-moment-actions">
          <button type="button" className="story-moment-action" onClick={onPrevious} disabled={!hasPrevious}>Previous</button>
          <button type="button" className="story-moment-action" onClick={onNext} disabled={!hasNext}>Next Moment</button>
          <ContinueButton hasNext={hasNext} onContinue={onNext} />
        </div>
      </div>
    </section>
  );
}

function StoryContextRail({ story, moment, onPromptSelect }) {
  const prompts = getSuggestedPromptsForMoment(story, moment.id).slice(0, 3);
  return (
    <aside className="story-context-rail" aria-label="Story context and AI guide">
      <div className="story-panel-label">AI Guide / Context</div>
      <div className="story-context-card">
        <h3 className="story-context-card-title">Verified Layer</h3>
        <p className="story-context-card-copy">{moment.verification?.badges?.join(" · ") || story.verification.badges.join(" · ")}</p>
      </div>
      <div className="story-context-card">
        <h3 className="story-context-card-title">Source Count</h3>
        <p className="story-context-card-copy">{(moment.sourceIds || story.verification.sourceIds || []).length} source references connected to this moment.</p>
      </div>
      <div className="story-context-card">
        <h3 className="story-context-card-title">Suggested Prompts</h3>
        {prompts.length ? (
          <div className="story-prompt-list">
            {prompts.map((prompt) => (
              <button key={prompt.id} type="button" className="story-prompt-button" onClick={() => onPromptSelect(prompt)}>
                {prompt.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="story-context-card-copy">Prompt guidance coming soon.</p>
        )}
      </div>
    </aside>
  );
}

function StoryViewer({ story }) {
  const moments = useMemo(() => getStoryMoments(story), [story]);
  const [selectedMomentId, setSelectedMomentId] = useState(moments[0]?.id || "");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const index = Math.max(0, moments.findIndex((moment) => moment.id === selectedMomentId));
  const moment = moments[index] || moments[0];
  const activePrompts = useMemo(() => getSuggestedPromptsForMoment(story, moment?.id), [story, moment?.id]);

  if (!moment) return null;

  return (
    <>
      <div className="story-viewer">
        <ChapterNav story={story} activeMomentId={moment.id} onSelectMoment={(id) => { setSelectedMomentId(id); setSelectedPrompt(null); }} />
        <StoryMomentPanel
          story={story}
          moment={moment}
          activeIndex={index}
          totalMoments={moments.length}
          hasPrevious={index > 0}
          hasNext={index < moments.length - 1}
          onPrevious={() => { setSelectedMomentId(moments[Math.max(index - 1, 0)].id); setSelectedPrompt(null); }}
          onNext={() => { setSelectedMomentId(moments[Math.min(index + 1, moments.length - 1)].id); setSelectedPrompt(null); }}
          onMomentChange={(id) => {
            if (moments.some((item) => item.id === id)) {
              setSelectedMomentId(id);
              setSelectedPrompt(null);
            }
          }}
          onAskAboutMoment={(targetMoment) => setSelectedPrompt({
            prompt: `Tell me why "${targetMoment?.title || moment.title}" matters in this story.`,
          })}
        />
        <StoryContextRail story={story} moment={moment} onPromptSelect={setSelectedPrompt} />
      </div>
      <TimelineExplorer
        story={story}
        moments={moments}
        activeMomentId={moment.id}
        onSelectMoment={(id) => { setSelectedMomentId(id); setSelectedPrompt(null); }}
        onPromptSelect={setSelectedPrompt}
      />
      <MobileChapterNav story={story} activeMomentId={moment.id} onSelectMoment={(id) => { setSelectedMomentId(id); setSelectedPrompt(null); }} />
      {selectedPrompt && (
        <div className="story-selected-prompt" role="status" aria-live="polite">
          AI Guide prompt selected: {selectedPrompt.prompt}
        </div>
      )}
      <AIStoryGuide
        story={story}
        activeMoment={moment}
        suggestedPrompts={activePrompts}
        onJumpToMoment={(momentId) => {
          if (moments.some((item) => item.id === momentId)) {
            setSelectedMomentId(momentId);
            setSelectedPrompt(null);
          }
        }}
      />
      <div className="story-mobile-sheets" aria-label="Mobile story sheets">
        <button type="button" className="story-mobile-sheet-button">Chapters</button>
        <button type="button" className="story-mobile-sheet-button">Timeline</button>
        <button type="button" className="story-mobile-sheet-button">AI Guide</button>
      </div>
    </>
  );
}

export default function StoryExperiencePage({ slug, onHome }) {
  const story = getStoryBySlug(slug);

  if (!story) {
    return (
      <div className="story-experience-page">
        <div className="story-experience-error">
          <div className="story-experience-error-card" role="alert">
            <div className="story-panel-label">Story unavailable</div>
            <h1 className="story-header-title" style={{ fontSize: "clamp(3rem,8vw,6rem)", marginBottom: 16 }}>Chapter Not Found</h1>
            <p className="story-header-subtitle">This story slug is not in the verified RICON story library yet.</p>
            <button type="button" className="story-moment-action" style={{ marginTop: 24 }} onClick={onHome}>Return Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="story-experience-page">
      <StoryHeader story={story} />
      <StoryViewer story={story} />
    </div>
  );
}
