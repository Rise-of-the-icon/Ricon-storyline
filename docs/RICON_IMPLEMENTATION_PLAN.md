# RICON Implementation Plan

Date: 2026-05-06

This roadmap updates RICON Storyline incrementally from the current Vite + React structure. It assumes no production behavior changes until each phase is implemented, built, and QA-checked.

## 1. Design System Foundation

### Goal

Create a reusable visual foundation so future page work does not continue adding one-off inline styles to `ricon-storyline.jsx`.

### Files Likely Affected

- `ricon-storyline.jsx`
- `src/ui/StateStates.jsx`
- New: `src/styles/tokens.css`
- New: `src/styles/base.css`
- New: `src/ui/Button.jsx`
- New: `src/ui/Badge.jsx`
- New: `src/ui/Panel.jsx`
- New: `src/ui/MetaLabel.jsx`

### Components to Create or Refactor

- Create shared primitives for buttons, badges, panels, metadata labels, action rows, and section headers.
- Move global tokens from the injected `CSS` string into a real CSS file.
- Keep existing `LoadingState`, `EmptyState`, `ErrorState`, and `RetryAction`, but restyle them through shared tokens/classes instead of isolated inline style objects.
- Preserve current class names during the transition where possible: `story-panel`, `proof-btn`, `story-card-btn`, `twin-btn`, `mono`, `bebas`, `cormorant`.

### Risks

- Styling regressions because current styles are split between inline styles and global CSS.
- Visual drift from the premium cinematic brand if tokens are too generic.
- CSS cascade conflicts while both injected CSS and external CSS coexist.

### Acceptance Criteria

- Shared primitives exist and can replace repeated button/badge/panel patterns.
- Existing app screens still render with the same visual hierarchy after each extraction.
- `npm run build` passes.
- No user-facing routes or interactions change during this phase.

## 2. App Shell and Navigation

### Goal

Separate app state, routing helpers, progress persistence, and shell-level navigation from the large root file.

### Files Likely Affected

- `ricon-storyline.jsx`
- `src/main.jsx`
- New: `src/app/RICONStoryline.jsx`
- New: `src/app/routes.js`
- New: `src/app/storyProgress.js`
- New: `src/app/AppShell.jsx`
- New: `src/app/NotFoundScreen.jsx`

### Components to Create or Refactor

- Move `RICONStoryline` into `src/app/RICONStoryline.jsx`.
- Move `chapterNumberFromHash`, `sceneNumberFromHash`, `chapterSceneHash`, and `isKnownAppPath` into `src/app/routes.js`.
- Move `STORY_PROGRESS_KEY`, `loadStoryProgress`, and `saveStoryProgress` into `src/app/storyProgress.js`.
- Extract shared nav/header surfaces used by home, athlete timeline, and story screens.
- Keep the current manual `screen` state and hash routing until a later routing decision is explicit.

### Risks

- Breaking deep links such as `#chapter-7/scene-1`.
- Losing saved progress behavior in `localStorage`.
- Breaking focus return when closing the AI companion modal.

### Acceptance Criteria

- Home, athlete timeline, story view, and not-found still render from the same URLs.
- Existing chapter and scene hash behavior is unchanged.
- Saved progress continues to load, continue, and restart.
- `npm run build` passes.

## 3. Homepage Rebuild

### Goal

Rebuild the homepage with reusable components while keeping current demo content and preserving the key CTAs: start story, open timeline, continue saved story, restart saved story.

### Files Likely Affected

- `ricon-storyline.jsx`
- New or refactored: `src/screens/HomeScreen.jsx`
- New: `src/components/home/HomeHero.jsx`
- New: `src/components/home/AthleteCard.jsx`
- New: `src/components/home/AthleteGrid.jsx`
- New: `src/components/home/FeaturedStoryPanel.jsx`

### Components to Create or Refactor

- Convert `AthleteCard` from clickable `div` to native `button` or link-like button.
- Extract `HomeHero`, `FeaturedStoryPanel`, and `AthleteGrid`.
- Keep `getFeaturedAthlete`, `getFeaturedMoment`, and `sourceDetailsFor` behavior initially unchanged.
- Replace repeated inline button styles with design system primitives.

### Risks

- Changing visual hierarchy too early instead of preserving the current investor demo flow.
- Breaking saved-progress CTAs.
- Introducing mobile overflow in the hero grid.

### Acceptance Criteria

- Homepage supports the same primary actions as today.
- Athlete cards are keyboard-focusable and activate with Enter/Space through native semantics.
- Mobile homepage has no horizontal scroll at 360px, 390px, and 768px widths.
- Loading state for the featured story remains present.
- `npm run build` passes.

## 4. Story Data Model

### Goal

Move hardcoded athlete/story data and normalization logic into a dedicated mock content/domain layer that can later be swapped for real APIs.

### Files Likely Affected

- `ricon-storyline.jsx`
- New: `src/data/athletes.js`
- New: `src/data/storyConfig.js`
- New: `src/domain/storyModel.js`
- New: `src/domain/storySources.js`
- New: `src/domain/storySuggestions.js`
- New: `src/domain/mediaAssets.js`

### Components to Create or Refactor

- Move `ATHLETES`, `TYPE_CONFIG`, `FEATURED`, and `VERIFICATION_LEVELS`.
- Move helpers: `getFeaturedAthlete`, `getFeaturedMoment`, `sourceTypeFor`, `verificationFor`, `sourceDetailsFor`, `collectibleFor`, `videoPosterFor`, `videoAssetsFor`, `transcriptDataFor`, `timeToSeconds`, `chapterMarkersFor`, `hotspotDataFor`, `slugify`, `estimateReadTimeFor`, `normalizeScene`, `normalizeStoryData`, `storyPanelsFor`, `chaptersFor`, `chapterForContext`, `suggestionConfigFor`, and `suggestionsFor`.
- Keep data mock-only and avoid adding real API clients.

### Risks

- Circular imports between domain helpers and UI screens.
- Subtle object identity changes affecting memoized timeline behavior.
- Breaking the AI companion prompt because it receives `athlete`, `moment`, `chapterForContext`, and `suggestionsFor`.

### Acceptance Criteria

- All existing athlete, story, timeline, source, collectible, poster, transcript, chapter marker, hotspot, and suggestion content renders unchanged.
- No production API is introduced.
- Domain helpers are importable without React.
- `npm run build` passes.

## 5. Story Experience

### Goal

Refactor the scene-by-scene story reader into smaller components with clearer action hierarchy and preserved behavior.

### Files Likely Affected

- `ricon-storyline.jsx`
- New or refactored: `src/screens/StoryView.jsx`
- New: `src/components/story/StoryScene.jsx`
- New: `src/components/story/StorySceneControls.jsx`
- New: `src/components/story/SceneStepper.jsx`
- New: `src/components/story/StoryQuickActions.jsx`
- New: `src/components/story/CollectiblePreview.jsx`
- Existing or new: `src/components/media/StoryVideoPlayer.jsx`

### Components to Create or Refactor

- Extract story copy block from `StoryView`.
- Extract previous/next/restart/ask controls.
- Extract mobile bottom toolbar currently using `story-bottom-action-bar`.
- Extract collectible preview.
- Keep `StoryDetailActions` if it exists in the remaining source, or formalize the currently embedded media/detail action region.

### Risks

- Breaking scene hash sync when navigating next/previous scenes.
- Breaking progress persistence with `onPersistProgress`.
- Duplicating AI entry points instead of clarifying them.

### Acceptance Criteria

- `#chapter-X/scene-Y` still updates when scenes change.
- Browser back/forward still syncs the scene.
- Progress persistence still records chapter, scene, and video time.
- Missing-content fallback still appears when story content is incomplete.
- Desktop and mobile story flows retain all current actions.
- `npm run build` passes.

## 6. Timeline Explorer

### Goal

Refactor the athlete timeline into a reusable explorer with accessible chapter cards and stable deep-link behavior.

### Files Likely Affected

- `ricon-storyline.jsx`
- New or refactored: `src/screens/AthleteScreen.jsx`
- New: `src/components/timeline/TimelineExplorer.jsx`
- New: `src/components/timeline/TimelineMoment.jsx`
- New: `src/components/timeline/TimelineStatusBadges.jsx`
- New: `src/components/timeline/TimelineVideoPreview.jsx`

### Components to Create or Refactor

- Move `AthleteScreen`, `TimelineMoment`, and `TimelineVideoPreview`.
- Replace nested interactive card/button structure with one primary native action and separate secondary actions where needed.
- Preserve IntersectionObserver active chapter sync.
- Preserve return-to-timeline position behavior after visiting a story.

### Risks

- Scroll restoration and active chapter detection are easy to regress.
- Removing nested controls may alter perceived click areas.
- Timeline preview currently wraps a background `SafeStoryVideo`; media extraction must not break preview rendering.

### Acceptance Criteria

- Reloading on `#chapter-X` scrolls to the expected chapter.
- Manual scrolling updates active chapter without jitter.
- Opening a story from timeline and returning restores the previous timeline context.
- Timeline cards are keyboard-friendly without nested interactive role conflicts.
- Loading and empty/error states remain present.
- `npm run build` passes.

## 7. AI Story Guide

### Goal

Make the active companion implementation the single source of truth, align the product persona, and isolate chat/service concerns from modal presentation.

### Files Likely Affected

- `src/TwinModal.jsx`
- `ricon-storyline.jsx`
- `vite.config.js`
- `netlify/functions/twin.js`
- `netlify/functions/twin-health.js`
- New: `src/components/ai/AiStoryGuideModal.jsx`
- New: `src/components/ai/AiMessages.jsx`
- New: `src/components/ai/AiComposer.jsx`
- New: `src/components/ai/AiResponse.jsx`
- New: `src/components/ai/SuggestionChips.jsx`
- New: `src/components/ai/SafeMarkdown.jsx`
- New: `src/hooks/useTwinChat.js`
- New: `src/hooks/useVoiceInput.js`
- Optional new: `netlify/functions/_twin-shared.js`

### Components to Create or Refactor

- Rename or wrap `src/TwinModal.jsx` as the active AI Story Guide surface.
- Delete the embedded legacy `TwinModal` in `ricon-storyline.jsx` only after behavior parity is confirmed.
- Extract `SafeMarkdown`, `AIResponse`, `SuggestionChips`, `VoiceSynthesisPanel`, composer, message list, and modal shell.
- Decide and align persona: athlete first-person Twin versus RICON Archivist. Update UI labels, `buildSystemPrompt`, fallback response copy, and empty states consistently.
- Keep degraded local fallback behavior.

### Risks

- The current active `src/TwinModal.jsx` is more robust than the dead embedded version; deleting the wrong logic would regress health checks, focus trap, copy/share, draft persistence, and retry behavior.
- Prompt/persona changes can alter demo output significantly.
- Streaming state has many edge cases: stop, retry, timeout, unavailable, mode switch, and scroll-to-latest.

### Acceptance Criteria

- Opening and closing the guide restores focus to the trigger.
- Narrator and Q&A modes still work.
- Health checking, degraded fallback, stop, retry, copy thread, copy response, share chapter, draft persistence, and voice-input fallback remain intact.
- Only one active Twin/AI modal implementation remains after cleanup.
- `npm run build` passes.

## 8. Media Player

### Goal

Turn `SafeStoryVideo` and `StoryVideoPlayer` into a maintainable media system with clear loading, poster-only, error, captions, transcript, hotspot, and mobile states.

### Files Likely Affected

- `ricon-storyline.jsx`
- New: `src/components/media/SafeStoryVideo.jsx`
- New: `src/components/media/VideoControls.jsx`
- New: `src/components/media/VideoProgressBar.jsx`
- New: `src/components/media/VideoHotspots.jsx`
- New: `src/components/media/VideoTranscript.jsx`
- New: `src/components/media/StoryVideoPlayer.jsx`
- New: `src/hooks/useMediaQuery.js`
- New: `src/hooks/useVideoController.js`

### Components to Create or Refactor

- Extract `SafeStoryVideo` into focused subcomponents.
- Extract transcript search and chapter markers from `StoryVideoPlayer`.
- Move `useMediaQuery` out of `ricon-storyline.jsx`.
- Keep poster-only behavior for mobile background previews and reduced motion.
- Keep generated poster support from `videoPosterFor` until real media assets exist.

### Risks

- Fullscreen, captions, and mobile media controls differ across browsers.
- Poster loading and video loading states can flicker if split incorrectly.
- Hotspot panels can overlap controls on mobile.

### Acceptance Criteria

- Poster-only moments still render without media sources.
- Existing play, pause, mute, captions, seek, fullscreen, scrub, chapter marker, hotspot, retry, and transcript interactions still work where applicable.
- Reduced-motion mode suppresses motion-heavy media as currently intended.
- Timeline preview and story player both use the shared media system.
- `npm run build` passes.

## 9. Mobile UX

### Goal

Stabilize the full mobile journey across home, timeline, story, media, and AI guide without horizontal overflow or hidden controls.

### Files Likely Affected

- `src/styles/base.css`
- `src/styles/tokens.css`
- `src/screens/HomeScreen.jsx`
- `src/screens/AthleteScreen.jsx`
- `src/screens/StoryView.jsx`
- `src/components/ai/*`
- `src/components/media/*`
- Existing CSS migrated from `ricon-storyline.jsx`

### Components to Create or Refactor

- Refine mobile layout primitives: stacked sections, sticky bars, safe-area spacing, dense action rows.
- Simplify Twin/AI guide header on small screens.
- Verify story bottom toolbar behavior around `twinOpen`.
- Verify media control overlay and hotspot panel placement.

### Risks

- Sticky bottom controls can conflict with browser UI and safe-area insets.
- The AI guide header has many actions and can become too dense below 390px.
- Fixing one viewport can regress tablet layout.

### Acceptance Criteria

- No horizontal scroll at 360px, 390px, 480px, 768px, and common desktop widths.
- Primary actions remain reachable with touch targets of at least 44px on coarse pointers.
- Story bottom toolbar does not cover required story content.
- AI guide composer remains usable with the virtual keyboard.
- `npm run build` passes.

## 10. Accessibility

### Goal

Resolve known semantic, focus, contrast, and announcement issues while preserving the cinematic presentation.

### Files Likely Affected

- `src/ui/*`
- `src/components/home/AthleteCard.jsx`
- `src/components/timeline/TimelineMoment.jsx`
- `src/components/story/*`
- `src/components/media/*`
- `src/components/ai/*`
- `src/styles/tokens.css`
- `docs/accessibility-color-contrast.md`

### Components to Create or Refactor

- Convert clickable non-buttons to native buttons or links.
- Remove nested interactive regions in timeline cards.
- Link all labels to controls, including transcript search.
- Add or tune live regions for AI streaming completion and status changes.
- Audit small text colors against the existing contrast guide.
- Preserve visible focus rings using `--focus-ring`.

### Risks

- Native button resets can alter visual styling.
- Too many live announcements can overwhelm screen reader users during streaming.
- Contrast fixes can shift the premium muted aesthetic if applied without hierarchy.

### Acceptance Criteria

- Keyboard-only navigation works through home, timeline, story, media controls, and AI guide.
- Modal traps focus while open and restores focus when closed.
- No nested interactive controls remain in major cards.
- Small metadata uses approved contrast pairings or documented exceptions.
- Manual screen reader smoke test passes for main flow.
- `npm run build` passes.

## 11. Performance

### Goal

Reduce initial payload and runtime cost without removing core demo functionality.

### Files Likely Affected

- `ricon-storyline.jsx`
- `src/styles/*`
- `src/data/*`
- `src/domain/*`
- `src/components/media/*`
- `src/TwinModal.jsx` or `src/components/ai/*`
- `index.html`

### Components to Create or Refactor

- Keep AI guide lazy-loaded.
- Consider lazy-loading story/media-heavy modules after route extraction.
- Move Google Fonts strategy out of injected CSS and into a controlled document or asset strategy.
- Avoid regenerating poster SVGs unnecessarily; memoize or precompute mock poster metadata.
- Reduce repeated `chaptersFor` normalization calls where possible.

### Risks

- Over-optimizing before component extraction may add complexity.
- Lazy loading can introduce loading flashes if Suspense boundaries are not designed.
- Font changes can cause visible layout shift.

### Acceptance Criteria

- Initial home load remains visually stable.
- AI guide still loads with a clear loading state.
- Timeline scroll remains smooth with current mock dataset.
- No major console errors in normal home → timeline → story → AI guide flow.
- `npm run build` passes.

## 12. QA and Launch

### Goal

Create a repeatable release path using the existing QA checklist plus build, browser, mobile, accessibility, and API fallback checks.

### Files Likely Affected

- `docs/qa-storyline-checklist.md`
- `docs/netlify-environment.md`
- `docs/RICON_SITE_AUDIT.md`
- `docs/RICON_IMPLEMENTATION_PLAN.md`
- Optional new: `docs/release-checklist.md`
- Optional new: package scripts in `package.json` if tests/linting are added later

### Components to Create or Refactor

- Update QA docs after component extraction changes the flow or labels.
- Add test scripts when a test harness exists.
- Add manual QA notes for degraded AI fallback, mobile safe areas, reduced motion, and route hash behavior.

### Risks

- Manual QA can drift from the actual app if not updated with each phase.
- No automated tests means route/data regressions may be missed.
- Netlify and Vite companion behavior can diverge if duplicated server logic remains.

### Acceptance Criteria

- `npm run build` passes before launch.
- Main flow passes manually: home → athlete timeline → story scene navigation → video controls/poster fallback → AI guide narrator/Q&A → close/return focus.
- Mobile flow passes at 360px and 390px.
- Reduced-motion behavior is verified.
- AI companion works in configured mode and degraded fallback mode.
- Docs reflect the final component and deployment structure.
