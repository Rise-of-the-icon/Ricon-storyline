# RICON Site Audit

Date: 2026-05-06

## 1. Current Architecture Summary

RICON Storyline is a compact Vite + React single-page application. The browser entry point is `src/main.jsx`, which mounts `RICONStoryline` from the repo-root `ricon-storyline.jsx`.

The app currently uses manual client-side screen state instead of a routing library. `RICONStoryline` tracks `screen` as `home`, `athlete`, or `story`, and uses `window.history.pushState`, `window.location.hash`, `hashchange`, and `popstate` to support chapter and scene URLs such as `#chapter-7/scene-1`. Only `/` and `/index.html` are considered valid app paths by `isKnownAppPath`; Netlify redirects all routes to `index.html`, so unsupported paths render the in-app not-found screen.

Most production UI, data normalization, mock data, video behavior, chat wiring, route behavior, and CSS live inside `ricon-storyline.jsx`. The AI companion is actively lazy-loaded from `src/TwinModal.jsx` through `LazyTwinModal`, while a second legacy `TwinModal` implementation still remains at the bottom of `ricon-storyline.jsx` and is no longer referenced by the rendered app.

Development API behavior is implemented as a Vite middleware in `vite.config.js`. Production-style server behavior is mirrored in `netlify/functions/twin.js` and `netlify/functions/twin-health.js`, with Netlify redirects mapping `/api/twin` and `/api/twin/health` to those functions. The companion currently has a clean degraded mode: if `ANTHROPIC_API_KEY` is absent or invalid, it streams local fallback text rather than failing the entire experience.

## 2. Existing Components

Active app components in `ricon-storyline.jsx`:

- `RICONStoryline`: app shell, screen state, modal state, progress persistence, haptics setup, and route decisions.
- `NotFoundScreen`: in-app not-found state for unsupported paths.
- `HomeScreen`: landing/home roster, featured story hero, saved progress CTAs, athlete grid.
- `AthleteCard`: clickable athlete tile.
- `AthleteScreen`: athlete hero, timeline page, Twin activation banners, chapter scroll tracking.
- `TimelineMoment`: timeline chapter item with source/status badges, preview video, keyboard interaction.
- `SafeStoryVideo`: core video/poster player abstraction with lazy loading, captions, fullscreen, chapter markers, hotspots, mobile controls, reduced-motion handling, loading, and error states.
- `TimelineVideoPreview`: timeline-level poster/video preview wrapper.
- `StoryVideoPlayer`: interactive story video module with transcript search, chapter markers, hotspot toggle, and story/Twin actions.
- `StoryView`: scene-by-scene story reader/player flow with progress persistence, bottom mobile toolbar, collectible preview, and scene stepper.
- `SafeMarkdown` and `SuggestionChips`: markdown rendering and prompt chips used by older embedded chat code.
- `VoiceSynthesisPanel`: voice visualization component duplicated with `src/TwinModal.jsx`.

Active shared components:

- `src/TwinModal.jsx`: active AI companion modal used through `React.lazy`.
- `src/ui/StateStates.jsx`: reusable `LoadingState`, `EmptyState`, `ErrorState`, and `RetryAction`.
- `src/ui/ErrorBoundary.jsx`: reusable error boundary that wraps the app shell, timeline, story scene, story detail actions, and companion.
- `src/haptics.js`: local haptic preference and throttled vibration utility.

Legacy or duplicated components:

- `TwinModal` inside `ricon-storyline.jsx` is dead code because the app renders `LazyTwinModal` from `src/TwinModal.jsx`.
- `SafeMarkdown`, `renderInlineMarkdown`, `isSafeUrl`, `SuggestionChips`, and `VoiceSynthesisPanel` exist in both `ricon-storyline.jsx` and `src/TwinModal.jsx`.
- `fallbackTwinReply`, environment normalization, health payload logic, and streaming adapter logic are duplicated between `vite.config.js` and `netlify/functions/twin*.js`.

## 3. Styling System Summary

Styling is currently a hybrid of:

- A large injected `CSS` template string in `ricon-storyline.jsx`.
- Heavy inline style objects inside every major component.
- A few shared CSS class hooks such as `ricon-root`, `story-panel`, `interactive-video`, `timeline-video`, `story-bottom-action-bar`, `twin-*`, `assistant-markdown`, and state card classes.
- CSS custom properties for safe-area insets, text colors, focus ring, and error text.

The current visual direction is dark, cinematic, gold/cyan-accented, and premium. There are strong brand tokens already present, but the system is not yet componentized. The same button treatments, metadata labels, panel styles, timeline badges, and modal controls are repeatedly defined inline.

Responsive behavior is mostly handled through global media queries in the CSS string, with significant overrides below `768px`, `760px`, `480px`, and `360px`. There is useful safe-area handling and reduced-motion handling, but because layout rules are split between inline styles and global overrides, the cascade is fragile.

## 4. Current UX Issues

- The homepage first viewport is functional, but the right-side story engine card is more abstract than product-revealing. The brand promise is clear, yet the actual timeline/chat/video product is mostly implied until the user clicks deeper.
- Athlete cards are rendered as clickable `div`s. The timeline cards have keyboard handling, but the home roster cards do not expose native button semantics.
- The story flow has several competing action patterns: scene controls, video controls, story detail actions, AI entry points, restart, and a mobile bottom toolbar. The feature set is strong, but hierarchy needs tightening.
- Timeline items include a clickable parent region plus nested buttons. This can create confusing focus and activation behavior because the same story open action is available at multiple nested levels.
- The Digital Twin product direction is split between “verified Digital Twin of the athlete” in `buildSystemPrompt` and “The Archivist” persona passed into `src/TwinModal.jsx`. This creates a product-model mismatch: the UI says Archivist, while the system prompt says the model is the athlete in first person.
- The video UI is ambitious and useful, but most current media is generated poster imagery. Actual video source fields are supported but generally absent from mock data, so many controls appear around poster-only experiences.
- Saved progress is useful but globally stores one story only. It does not validate all fields against current athlete/moment data beyond athlete/chapter lookup.

## 5. Current Technical Issues

- `ricon-storyline.jsx` is doing too much. It contains the data model, route helpers, CSS, home, timeline, story view, video player, markdown renderer, chat helpers, and dead chat modal code.
- The active data/content model is hardcoded in `ATHLETES`. Normalization helpers (`normalizeStoryData`, `chaptersFor`, `storyPanelsFor`, etc.) are valuable and should be preserved, but moved into a dedicated mock data/domain layer.
- There is no test setup, lint script, TypeScript, Storybook, or component-level visual regression harness.
- Routing is manual and hash-based. Deep links are supported for chapters/scenes, but there is no explicit URL structure for athletes or stories.
- `chaptersFor(athlete)` recomputes normalized moments frequently and can produce new object identities. This is manageable in the current small dataset, but will become noisy as content grows.
- `sourceDetailsFor` has demo-only values such as `accessed: "May 2026"` and `url: "Private demo source packet"`. This is acceptable for mock data but should be separated from real source abstraction before production.
- `videoPosterFor` generates encoded SVG data URLs at runtime. It works for mock posters, but repeated dynamic SVG generation can add overhead and makes cache behavior less straightforward.
- Chat streaming and health logic is implemented in both Vite middleware and Netlify functions. This is practical for local/prod parity, but the shared behavior should eventually move into a common adapter module.
- `src/TwinModal.jsx` contains a custom markdown parser. It is safer than rendering raw HTML, but it is duplicated and limited. It should become a shared renderer or be replaced with a vetted markdown pipeline if richer responses are needed.
- Google Fonts are imported inside the injected CSS string. This can delay font loading and makes performance tuning harder than declaring font preconnect/imports in `index.html` or bundling a font strategy.

## 6. Accessibility Concerns

- Positive: focus-visible styling exists, state components use `role="status"`/`role="alert"`, the active modal has `role="dialog"` and a focus trap, video controls have labels, reduced motion is respected, and the story bottom toolbar has a toolbar label.
- `AthleteCard` should be a native `button` or anchor, not a clickable `div`, so keyboard and screen reader users can activate roster cards naturally.
- Timeline cards use `role="button"` on a container with nested buttons inside. This should be simplified to avoid nested interactive controls.
- Several small text elements use low-contrast `#333`, `#444`, and `#555`, which conflicts with `docs/accessibility-color-contrast.md` guidance for tiny metadata.
- Some icon-only or symbol-heavy labels (`▶`, `✦`, `◉`, `F`, `⋮`) have accessible labels in key places, but the visible affordance is not always self-explanatory.
- The video player keyboard shortcut handler is attached to the player group. It intentionally ignores button targets, but it does not ignore inputs beyond its own component context in all cases. Keep this scoped carefully during refactor.
- Streaming chat updates may be too quiet for screen readers. The message list itself does not expose a dedicated live region around final assistant responses.
- The transcript search label is visible but not linked with `htmlFor`; this should be made an explicit label/input pair.

## 7. Mobile UX Concerns

- The app has substantial mobile-specific CSS and safe-area handling. The story layout reorders into a logical single column, the Twin modal becomes full-screen, and bottom action bars appear for story flow.
- The mobile bottom action bar can compete with sticky Twin input, video controls, and browser safe-area insets. It is hidden when `twinOpen`, which is good, but all story/video states need device QA.
- At `480px`, the story bottom action bar becomes a two-column grid. This improves fit but changes muscle memory from the four-action toolbar.
- The Twin modal header wraps heavily on small screens and includes mode toggle, copy thread, share chapter, and close controls. This is functional but dense.
- Timeline cards become simpler on mobile, but the preview video, tags, title, body, and CTA stack can still become tall and repetitive.
- Mobile video controls include center play, tap zones, secondary menu, and scrubber. This is feature-complete but needs visual verification against overlapping hotspots/transcript panels.

## 8. Recommended Rebuild Order

1. Preserve current behavior with a baseline: run `npm run build`, capture current desktop/mobile screenshots, and document the key home → timeline → story → Twin flow.
2. Extract the content/domain layer: move `ATHLETES`, `TYPE_CONFIG`, `FEATURED`, source helpers, story normalization, chapter helpers, video asset helpers, transcript helpers, and suggestion helpers out of `ricon-storyline.jsx`.
3. Extract route/progress utilities: isolate hash parsing, scene hash creation, known-path checks, and localStorage progress helpers.
4. Remove dead `TwinModal` only after confirming `LazyTwinModal` covers all active companion behavior. Keep `src/TwinModal.jsx` as the source of truth.
5. Extract shared primitives: buttons, badges, panels, metadata labels, action rows, state cards, and prompt chips. Use these before redesigning pages.
6. Refactor `SafeStoryVideo` into a reusable media module with smaller subcomponents for poster, controls, chapter markers, hotspots, error/loading overlay, and mobile menu.
7. Refactor the timeline: use native buttons/links for primary activation, remove nested interactive regions, and reduce repeated inline styles.
8. Refactor the story reader: separate story scene copy, scene stepper, bottom mobile toolbar, collectible card, and story media module.
9. Align the AI companion product model: decide whether the assistant is the athlete’s first-person Twin or the RICON Archivist, then update prompt, UI labels, and fallback copy consistently.
10. Move styling into a maintainable system: either CSS modules/plain CSS files with design tokens or a small component style layer. Keep the current premium palette but reduce inline style duplication.
11. Add verification harness: build script already exists; add targeted component/unit tests for data normalization and route helpers, then browser QA for home/timeline/story/Twin mobile flows.

## 9. Files That Should Be Preserved

- `src/main.jsx`: simple and correct app mount.
- `src/TwinModal.jsx`: active companion implementation; preserve while refactoring into smaller modules.
- `src/ui/StateStates.jsx`: useful shared loading/empty/error/retry primitives.
- `src/ui/ErrorBoundary.jsx`: useful reusable recovery boundary.
- `src/haptics.js`: small focused utility with local preference and throttling.
- `netlify/functions/twin.js`: production companion endpoint behavior.
- `netlify/functions/twin-health.js`: production health endpoint behavior.
- `vite.config.js`: local API middleware is useful for development parity, though it should share logic with Netlify functions later.
- `netlify.toml`: correct build/publish and API redirects for current deployment shape.
- `index.html`: metadata, icons, and app root are clear.
- `public/*`: favicon, app manifest, apple touch icon, OG artwork, and static 404 are relevant app shell assets.
- Existing docs in `docs/`: the QA checklist, contrast guide, and Netlify environment notes are useful and should be kept.

## 10. Files That Should Be Refactored

- `ricon-storyline.jsx`: primary refactor target. Split into app shell, route utilities, mock content, home, athlete timeline, story view, media player, and shared UI pieces.
- `src/TwinModal.jsx`: split into modal shell, chat state hook, streaming service adapter, markdown renderer, voice input hook, suggestions, and message components.
- `vite.config.js`: keep Vite config focused; move duplicated companion fallback/streaming logic into a shared server utility if the build/deploy setup allows it.
- `netlify/functions/twin.js` and `netlify/functions/twin-health.js`: after shared server utilities exist, reduce duplication with Vite middleware.
- `src/ui/StateStates.jsx`: keep the API, but eventually replace inline style objects with shared tokens/classes.

## 11. Files That Should Be Deleted Only If Safe

- The legacy `TwinModal` function inside `ricon-storyline.jsx`: safe to delete only after confirming no imports, references, or desired behavior exist only in that version.
- Duplicated `SafeMarkdown`, `renderInlineMarkdown`, `isSafeUrl`, `SuggestionChips`, and `VoiceSynthesisPanel` in `ricon-storyline.jsx`: delete only after moving active usage to shared modules and confirming `src/TwinModal.jsx` imports those shared versions.
- Any unused generated build artifacts under `dist/`, if present in a future workspace state. No `dist/` files are currently listed by `rg --files`.
- `.claude/`: currently untracked and outside the app source. Delete only if the owner confirms it is not needed for local workflow.

## Practical Implementation Path

The safest path is not a visual rewrite first. Start by extracting the data and UI primitives while preserving rendered behavior. Once `ricon-storyline.jsx` is smaller and the duplicate modal code is removed, redesign the homepage/timeline/story surfaces with reusable components and browser QA after each step.

The highest-leverage first production change should be: extract the content/domain helpers and remove the dead embedded `TwinModal`. That lowers risk for every later UX change without changing the user-facing product.
