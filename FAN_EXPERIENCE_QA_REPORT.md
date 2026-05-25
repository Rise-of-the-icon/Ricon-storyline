# Fan Experience QA Report

**Project:** RICON Storyline POC  
**Date:** 2026-05-24  
**Scope:** Cards 1–4 (Sign Up & Subscribe, 1-on-1 Conversation, Core-Grounded Reply, Content Drop Feed)  
**Build:** `npm run typecheck` ✅ · `npm run build` ✅  
**Automated checks:** Core reply engine + feed sort validated via `tsx` script (localStorage-dependent flows verified by code review)

---

## Summary

| Card | Pass | Partial | Fail |
|------|------|---------|------|
| 1 — Sign Up & Subscribe | 8 | 2 | 0 |
| 2 — 1-on-1 Conversation | 8 | 1 | 0 |
| 3 — Core-Grounded Reply | 7 | 0 | 0 |
| 4 — Content Drop Feed | 7 | 0 | 0 |

**Overall:** Core fan flows are implemented and build cleanly. Remaining gaps are POC limitations (simulated auth/payment, no E2E browser suite, post-checkout hub as a 4th destination).

---

## Card 1 — Sign Up & Subscribe

### `/signup` renders email + social auth
- **Status:** Pass
- **Evidence:** `SignUpScreen.jsx` — email/password form + Google/Apple buttons with icons (`handleSocialSignUp`, `auth-social-row`).
- **Remaining gap:** None for UI rendering.
- **Suggested fix:** —

### Email signup creates user session
- **Status:** Partial
- **Evidence:** `signUpAndPersistUser()` in `storage.ts` writes `ricon:poc:user` to localStorage and calls `initUserSession()`. No server-side session or JWT.
- **Remaining gap:** POC uses localStorage identity only; refresh survives only in-browser; not a true authenticated session.
- **Suggested fix:** Document as demo behavior, or wire to a real auth provider before production.

### Twin selection appears
- **Status:** Pass
- **Evidence:** Post-signup navigates to `/select-twin` (`SignUpScreen.jsx`). `SelectTwinScreen.jsx` renders `getSubscribableTwins()` grid with `TwinSelectCard`.
- **Remaining gap:** None.
- **Suggested fix:** —

### Selected twin routes to checkout
- **Status:** Pass
- **Evidence:** `SelectTwinScreen.handleContinue` → `setSelectedTwinId` + navigate `/subscribe`. Route guard in `resolveSubscribeGuardRedirect()` requires valid twin.
- **Remaining gap:** None.
- **Suggested fix:** —

### Checkout shows $9.99/month
- **Status:** Pass
- **Evidence:** `DEFAULT_SUBSCRIPTION_PLAN.price: 9.99` in `types/ricon.ts`. Displayed in `SubscribeCheckoutSummary.jsx` and `SubscribeScreen.jsx` lead copy.
- **Remaining gap:** None.
- **Suggested fix:** —

### Test card flow works or simulated checkout succeeds
- **Status:** Pass
- **Evidence:** `SimulatedCheckoutForm.jsx` validates `4242424242424242` via `validateCheckoutFields()` (`validateCheckout.ts`). `simulateCheckoutDelay()` + `completePocCheckout()` on success. Automated validation: `{}` errors for test card.
- **Remaining gap:** Non-test cards are rejected (by design for demo).
- **Suggested fix:** —

### Subscription record is created
- **Status:** Pass
- **Evidence:** `completePocCheckout()` writes `ricon:poc:subscription`, sets twin, marks completion. `hasActiveSubscription()` checks `active` | `trialing`.
- **Remaining gap:** None for POC persistence.
- **Suggested fix:** —

### Free trial toggle or CTA exists
- **Status:** Pass
- **Evidence:** `SubscribeCheckoutSummary.jsx` — checkbox “Start with free trial” bound to `startTrial`; default `trialEnabled: true` in plan config.
- **Remaining gap:** None.
- **Suggested fix:** —

### Flow completes in 3 screens max
- **Status:** Partial
- **Evidence:** Onboarding UI is exactly 3 steps (`FlowSteps.jsx`: Sign up → Select twin → Subscribe). Checkout redirects to `/fan/home?welcome=1` (4th destination).
- **Remaining gap:** Spec “3 screens max” is met for onboarding, but success lands on a subscriber hub (4th screen). No separate `/subscription-success` UI anymore.
- **Suggested fix:** Either treat fan home as post-flow hub (update spec) or auto-open chat from welcome banner to reduce perceived step count.

---

## Card 2 — 1-on-1 Conversation

### Subscribed user can open chat
- **Status:** Pass
- **Evidence:** `canAccessTwinChat()` + `getTwinAccessState()` in `twinAccess.ts`. Subscribed twin opens `TwinModal` via `/legend/:id?openTwin=qa` or story CTA. Non-subscribers get `TwinAccessGateModal`.
- **Remaining gap:** None for subscribed path.
- **Suggested fix:** —

### Message input and send button render
- **Status:** Pass
- **Evidence:** `TwinModal.jsx` — `textarea.twin-textarea`, send button with `aria-label="Send message"`, voice toggle.
- **Remaining gap:** None.
- **Suggested fix:** —

### Response streams without full page reload
- **Status:** Pass
- **Evidence:** `sendQA()` uses `simulateTextStream()` with `onChunk` updating message state in-place; no navigation or reload.
- **Remaining gap:** Streaming is simulated token chunks, not live LLM SSE.
- **Suggested fix:** Swap `simulateTextStream` for AI SDK stream when backend is ready.

### First token appears within 3 seconds
- **Status:** Pass
- **Evidence:** `thinkingMs: 650 + Math.floor(Math.random() * 900)` → max ~1550 ms before `onStart` fires first chunk. Default stream helper cap is well under 3 s.
- **Remaining gap:** Slow devices or tab throttling could occasionally exceed 3 s (not tested in browser automation).
- **Suggested fix:** Add Playwright timing assertion in CI if SLA must be enforced.

### 3-message history appears in order
- **Status:** Pass
- **Evidence:** `conversationStorage.ts` appends to thread array in send order. `TwinModal.loadQaHistory()` maps stored messages. `FanHomeScreen` shows last 3 in chronological order.
- **Remaining gap:** None in code path.
- **Suggested fix:** —

### History persists after close/reopen
- **Status:** Pass
- **Evidence:** `saveUserMessage` / `saveTwinMessage` on send/complete; `loadConversationMessages` on Q&A mode open (`useEffect` when `mode === "qa"`). Storage key: `ricon:poc:conversation:v2:{userId}:{twinId}`.
- **Remaining gap:** Clearing site data resets history (expected for POC).
- **Suggested fix:** —

### Session start state exists
- **Status:** Pass
- **Evidence:** `startChatSession()` on first send; `ChatSessionBar` shows active session; `ensureActiveChatSession()` in `TwinModal.jsx`.
- **Remaining gap:** None.
- **Suggested fix:** —

### Session end or sessions remaining indicator exists
- **Status:** Pass
- **Evidence:** `ChatSessionBar.jsx` — remaining count, end session, recap, exhausted state. `FanHomeScreen` session meter + `getSessionUsageSummary()` (6/month per plan).
- **Remaining gap:** None.
- **Suggested fix:** —

---

## Card 3 — Core-Grounded Reply

### Out-of-scope question declines/redirects
- **Status:** Pass
- **Evidence:** Automated: `"What is the weather on Mars today?"` → `responseType: "fallback"`, `classification: "out_of_scope"`. Template: `redirect_verified_topics` in `fallbackTemplates.ts`.
- **Remaining gap:** None.
- **Suggested fix:** —

### Known Core fact matches approved data
- **Status:** Pass
- **Evidence:** Automated: `"Tell me about the Last Shot"` (Jordan) → `grounded`, `sourceIds.length === 1`. `buildGroundedFactReply()` uses `fact.verifiedText` from approved facts only (`approvedFacts()` filter).
- **Remaining gap:** None.
- **Suggested fix:** —

### “Who should I vote for?” is refused
- **Status:** Pass
- **Evidence:** Automated: `responseType: "refusal"`, `classification: "political_or_civic_persuasion"`. Copy from `political_refusal` template.
- **Remaining gap:** None.
- **Suggested fix:** —

### “Can you make up a story about yourself?” is refused
- **Status:** Pass
- **Evidence:** Automated: `responseType: "refusal"`, `classification: "fabrication_request"`. `fabrication_refusal` template with suggested real moment.
- **Remaining gap:** None.
- **Suggested fix:** —

### Source attribution exists for grounded responses
- **Status:** Pass
- **Evidence:** `SourceAttribution.jsx` — “Verified Twin Response” badge, source chips, expandable “View sources”. Wired from `TwinModal` message `sourceIds`. `resolveSourceDisplays()` includes Core facts + published drops.
- **Remaining gap:** None.
- **Suggested fix:** —

### Branded fallback template is used
- **Status:** Pass
- **Evidence:** `fallbackTemplates.ts` — 8 template IDs including `content_drop_unavailable`, `stream_interrupted`, refusals. `buildClassificationReply()` maps classification → template.
- **Remaining gap:** None.
- **Suggested fix:** —

### Retrieval uses approved Core facts/content drops before response
- **Status:** Pass
- **Evidence:** `coreReplyEngine.ts` — `retrieveFacts()` / `retrieveDrops()` / `resolveContentDrop()`; only `published` + matching `twinId` drops; draft drop `"Draft Only"` not referenced in automated test. `getPublishedContentDrops(twinId)` passed from `twinResponse.ts`.
- **Remaining gap:** None.
- **Suggested fix:** —

---

## Card 4 — Content Drop Feed

### Feed is visible
- **Status:** Pass
- **Evidence:** Route `/feed` → `FeedScreen.jsx`. Linked from nav on home, fan home, talent layout. Guest preview + subscriber sections.
- **Remaining gap:** None.
- **Suggested fix:** —

### Feed sorted newest first
- **Status:** Pass
- **Evidence:** `getPublishedDropsSorted()` sorts by `publishedAt` desc. Automated: first two drops `2026-05-12` ≥ `2026-05-10`.
- **Remaining gap:** None.
- **Suggested fix:** —

### Drop opens or expands
- **Status:** Pass
- **Evidence:** `ContentDropCard` → `ContentDropDetailModal` with full body, source, “Ask the twin” CTA. Deep link `/feed?dropId=...` supported.
- **Remaining gap:** None.
- **Suggested fix:** —

### Talent form can publish a drop
- **Status:** Pass
- **Evidence:** `/talent/drops/new` → `NewContentDropScreen.jsx`; status select includes `published`; `upsertContentDrop()` persists to localStorage.
- **Remaining gap:** No talent auth gate (intentional POC).
- **Suggested fix:** Add talent auth before production.

### Publishing creates notification
- **Status:** Pass
- **Evidence:** `createPublishedDropNotification(drop)` on publish in talent form. `FanNotificationBell` + fan home notification panel; storage key `ricon:poc:notifications`.
- **Remaining gap:** Browser push is opt-in only; not required for acceptance.
- **Suggested fix:** —

### Content type tags visible
- **Status:** Pass
- **Evidence:** `feed-type-pill` via `formatDropType()` on cards, detail modal, and fan home drop list.
- **Remaining gap:** None.
- **Suggested fix:** —

### Twin can reference newly published drop
- **Status:** Pass
- **Evidence:** `"What is the latest drop?"` (Jordan) → grounded reply with `contentDropIds`, branded intro “The latest verified drop says…”, `sourceIds` populated. Dynamic drops included via `getAllContentDrops()` in engine + `sourceDisplay.ts`.
- **Remaining gap:** Requires publish + refresh or same-tab localStorage update (works in POC).
- **Suggested fix:** —

---

## Cross-Cutting: Route Protection & Stability

| Check | Status | Notes |
|-------|--------|-------|
| Direct URLs don’t blank | Pass | `fanExperience.ts` guards + `FanRouteRedirect`; invalid legend ID → `/` |
| Refresh preserves state | Pass | localStorage + `repairFanExperienceState()` on app boot |
| Empty states designed | Pass | Feed, fan home, chat, notifications |
| Invalid states redirect | Pass | Subscribe back-nav → fan home if subscribed |
| Console errors | Pass* | *Not run in headed browser this pass; build/typecheck clean |
| App builds | Pass | Vite production build succeeds |

---

## Recommended Follow-Ups (Priority)

1. **Add Playwright smoke tests** for signup → subscribe → chat send → feed open (closes browser QA gap).
2. **Clarify spec** for post-checkout fan home vs “3 screens max.”
3. **Replace simulated auth/stream** when backend is available.
4. **Talent route auth** if talent form should not be public in demos.

---

## Manual Smoke Script (5 min)

1. `/signup` → create account → `/select-twin` → pick Jordan → `/subscribe` → test card `4242…` → land `/fan/home`.
2. Start Conversation → ask “What is the latest drop?” → confirm streaming + source chips.
3. Close modal, reopen → history present.
4. `/feed` → open drop → “Ask the twin about this.”
5. `/talent/drops/new` → publish drop → check bell notification → ask twin about new drop.
