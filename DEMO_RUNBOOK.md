# RICON Demo Reset Runbook

1. In `Storyline-Studio`, open `?seedCoreTwins=1` once, then remove the query param.
2. Confirm live API has exactly 3 twins: `David West`, `Tom Hoover`, `Walt Liquor`.
3. Verify each twin is `draftStatus: saved` and timeline events are `visibility: Public` + `approvalStatus: Reviewed`.
4. Open `Ricon-storyline` and hard refresh the browser to clear stale client state.
5. Check Home/Legend list shows each core twin once (no duplicate Walt, no extra David profile).
6. In each twin modal, verify Narrator autoplays and Q&A voice stops when modal closes.
7. In Studio voice preview, generate once per tone/person and rely on 7-day local cache (no re-gen during demo day).
8. Before external demos, confirm both apps build and deploy from tagged commits.
