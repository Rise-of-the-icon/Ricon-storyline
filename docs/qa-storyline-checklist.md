# RICON Storyline Developer QA Checklist

Purpose: developer-facing manual QA checklist for release validation of the RICON Storyline web app.

Priority legend:
- `P0`: release-blocking
- `P1`: high-value, should pass before release
- `P2`: polish and regression coverage

---

## 1) Landing page

### 1.1 Hero + premium visual integrity
- **Test scenario:** Open `/` on desktop with a cold cache.
- **Expected result:** Hero, dark editorial palette, gold accents, and featured story metadata render without layout shift.
- **Priority:** `P0`
- **Manual QA notes:** Confirm no broken fonts, no missing metadata text, and no visual artifacts over background overlays.

### 1.2 Featured CTAs
- **Test scenario:** Click `START STORY` and `VIEW TIMELINE`.
- **Expected result:** `START STORY` opens the featured chapter flow; `VIEW TIMELINE` opens athlete timeline view.
- **Priority:** `P0`
- **Manual QA notes:** Verify haptic feedback behavior on supported mobile devices and no double-navigation.

### 1.3 Not-found behavior
- **Test scenario:** Navigate to an unsupported path (e.g. `/foo`).
- **Expected result:** App-level not-found experience appears with a working return action.
- **Priority:** `P1`
- **Manual QA notes:** Ensure return action restores a valid app state and not a blank screen.

---

## 2) Story scene navigation

### 2.1 Scene progression
- **Test scenario:** In `StoryView`, use `CONTINUE` and `BACK` through all scene panels.
- **Expected result:** Scene index and progress update correctly; no skipped or duplicated panel states.
- **Priority:** `P0`
- **Manual QA notes:** Validate first/last scene button disabled/label behavior.

### 2.2 Missing-content fallback
- **Test scenario:** Open a chapter with incomplete scene data (or temporarily simulate).
- **Expected result:** Explicit fallback card appears with actions to return to timeline or open AI companion.
- **Priority:** `P1`
- **Manual QA notes:** Confirm no runtime errors and no infinite loading skeleton.

---

## 3) Timeline navigation

### 3.1 Chapter anchors + deep links
- **Test scenario:** Click multiple chapter anchors and reload on `#chapter-X`.
- **Expected result:** View scrolls to correct chapter, active chapter updates, and hash deep-link is preserved.
- **Priority:** `P0`
- **Manual QA notes:** Verify `back/forward` browser buttons preserve chapter context.

### 3.2 Scroll-based active chapter sync
- **Test scenario:** Scroll timeline manually from top to bottom.
- **Expected result:** Active chapter indicator updates without jitter or incorrect jumps.
- **Priority:** `P1`
- **Manual QA notes:** Confirm behavior at intersection boundaries and on low-end devices.

---

## 4) Video playback

### 4.1 Core controls
- **Test scenario:** Play, pause, mute/unmute, seek ±5s, and fullscreen from story and timeline previews.
- **Expected result:** Controls are responsive, states stay in sync with media element, and no console errors.
- **Priority:** `P0`
- **Manual QA notes:** Validate both pointer and keyboard interactions.

### 4.2 Error + retry path
- **Test scenario:** Simulate missing media source / bad network.
- **Expected result:** `MEDIA UNAVAILABLE` state appears with retry action; retry recovers when source is restored.
- **Priority:** `P1`
- **Manual QA notes:** Confirm fallback poster still communicates context and layout remains stable.

### 4.3 Reduced-motion + mobile poster mode
- **Test scenario:** Enable reduced motion and test on mobile viewport.
- **Expected result:** Motion-heavy playback is suppressed where intended; poster-first experience remains readable and usable.
- **Priority:** `P1`
- **Manual QA notes:** Ensure controls are still discoverable and touch targets remain adequate.

---

## 5) Captions/transcripts

### 5.1 Caption toggle behavior
- **Test scenario:** Toggle captions on/off for chapters with valid `.vtt`.
- **Expected result:** Captions appear/disappear immediately and persist correctly while media remains mounted.
- **Priority:** `P0`
- **Manual QA notes:** Confirm caption styling remains legible against dark overlays.

### 5.2 Missing caption fallback
- **Test scenario:** Open chapter without caption file and attempt caption toggle.
- **Expected result:** Control indicates captions unavailable and does not throw errors.
- **Priority:** `P1`
- **Manual QA notes:** Ensure messaging is informative but non-blocking.

---

## 6) AI companion/chat

### 6.1 Open/close + mode switching
- **Test scenario:** Open twin modal from multiple entry points; switch between narrator and Q&A.
- **Expected result:** Mode switch resets/updates chat context predictably with no stale UI state.
- **Priority:** `P0`
- **Manual QA notes:** Confirm modal close always returns to prior app context.

### 6.2 Streaming response lifecycle
- **Test scenario:** Send Q&A prompt and observe streaming; test stop + retry.
- **Expected result:** Incremental stream renders smoothly; stop aborts cleanly; retry repopulates response.
- **Priority:** `P0`
- **Manual QA notes:** Validate no duplicated assistant messages and no stuck loading state.

### 6.3 Service failure handling
- **Test scenario:** Force API errors (401/403/429/5xx or offline).
- **Expected result:** User-facing error copy appears with actionable retry/switch options.
- **Priority:** `P0`
- **Manual QA notes:** Verify recoverability without hard refresh.

---

## 7) Voice input

### 7.1 Voice capture happy path
- **Test scenario:** Start microphone input in Q&A mode and speak a prompt.
- **Expected result:** Transcript is inserted into composer; status labels update correctly.
- **Priority:** `P1`
- **Manual QA notes:** Test browser permission prompts and deny/re-allow flows.

### 7.2 Unsupported browser path
- **Test scenario:** Use a browser without SpeechRecognition support.
- **Expected result:** Voice controls degrade gracefully with clear unavailability message.
- **Priority:** `P1`
- **Manual QA notes:** Verify text input path remains unaffected.

---

## 8) Mobile UX

### 8.1 Core flow on narrow viewports
- **Test scenario:** Run home → athlete → story → twin flow at 360px and 390px widths.
- **Expected result:** No clipped content, no horizontal scrolling, and sticky input/actions remain accessible.
- **Priority:** `P0`
- **Manual QA notes:** Check safe-area insets on iOS devices.

### 8.2 Touch ergonomics
- **Test scenario:** Tap all primary/secondary actions in timeline, player, and twin modal.
- **Expected result:** Minimum touch target quality and predictable response with no accidental overlaps.
- **Priority:** `P1`
- **Manual QA notes:** Confirm no hidden controls under sticky bars.

---

## 9) Keyboard navigation

### 9.1 Focus order and visibility
- **Test scenario:** Navigate app using `Tab` / `Shift+Tab` only.
- **Expected result:** Logical focus order, visible focus ring, and no keyboard trap.
- **Priority:** `P0`
- **Manual QA notes:** Include modal open/close and chapter anchor interactions.

### 9.2 Player keyboard shortcuts
- **Test scenario:** With player focused, use Space, M, C, F, ArrowLeft, ArrowRight.
- **Expected result:** Mapped controls work and do not hijack unrelated controls.
- **Priority:** `P1`
- **Manual QA notes:** Verify shortcut behavior when focus is inside buttons/textareas.

---

## 10) Screen reader checks

### 10.1 Landmark + control labels
- **Test scenario:** Use VoiceOver/NVDA to navigate headings, navs, buttons, and modal controls.
- **Expected result:** Meaningful labels/roles are announced; chapter and player controls are understandable.
- **Priority:** `P0`
- **Manual QA notes:** Confirm no duplicate/conflicting labels.

### 10.2 Streaming announcement behavior
- **Test scenario:** Send chat prompt while screen reader is active.
- **Expected result:** New/streaming assistant content is announced without overwhelming repetition.
- **Priority:** `P1`
- **Manual QA notes:** Check aria-live politeness and final-message readability.

---

## 11) Performance checks

### 11.1 Initial load and interaction
- **Test scenario:** Run Lighthouse (mobile + desktop) on home and athlete pages.
- **Expected result:** No critical regressions in LCP/CLS/INP versus previous baseline.
- **Priority:** `P1`
- **Manual QA notes:** Record baseline metrics in PR notes.

### 11.2 Runtime smoothness
- **Test scenario:** Scroll long timeline and interact with player/chat on mid-range device.
- **Expected result:** No major frame drops, input lag, or memory spikes during normal session.
- **Priority:** `P2`
- **Manual QA notes:** Use Performance panel to spot repeated costly re-renders.

---

## 12) Cross-browser checks

### 12.1 Core compatibility
- **Test scenario:** Validate main flow in latest Chrome, Safari, Firefox, and Edge.
- **Expected result:** Routing, timeline, chat, and media controls function consistently.
- **Priority:** `P0`
- **Manual QA notes:** Pay attention to fullscreen, media autoplay policies, and voice input differences.

### 12.2 Browser-specific fallbacks
- **Test scenario:** Validate reduced capability paths (no speech API, stricter autoplay).
- **Expected result:** Graceful degradation without blocking key storyline flows.
- **Priority:** `P1`
- **Manual QA notes:** Note any browser-specific UX deltas requiring product sign-off.

---

## 13) Netlify deployment checks

### 13.1 Environment variable readiness
- **Test scenario:** Confirm `ANTHROPIC_API_KEY` and optional `ANTHROPIC_MODEL` are set in Netlify environment.
- **Expected result:** Production `/api/twin` returns real streamed responses when key is present; fallback behavior when missing is intentional.
- **Priority:** `P0`
- **Manual QA notes:** Never expose key values in logs/screenshots/PR text.

### 13.2 Redirect/function wiring
- **Test scenario:** Verify `/api/twin` redirects to `/.netlify/functions/twin` and SPA fallback works for deep links.
- **Expected result:** Chat endpoint and client-side routing both work in deployed environment.
- **Priority:** `P0`
- **Manual QA notes:** Test direct URL entry to deep-linked chapter pages post-deploy.

### 13.3 Build/deploy sanity
- **Test scenario:** Run production build and deploy preview.
- **Expected result:** Successful build with no missing assets, and QA flows pass in preview URL.
- **Priority:** `P1`
- **Manual QA notes:** Re-run P0 scenarios after each deployment configuration change.

---

## Suggested QA Sign-off Template

- **Build SHA:**  
- **Environment:** Local / Netlify Preview / Production  
- **Browsers tested:**  
- **Devices tested:**  
- **P0 status:** Pass / Fail  
- **P1 status:** Pass / Fail  
- **Known issues accepted for release:**  
- **QA owner + date:**  
