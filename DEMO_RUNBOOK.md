# RICON Demo Reset Runbook

## Twin Ask-a-question (local)

The production Railway host `https://ricon-storyline-production.up.railway.app` is currently gone
(Railway returns `404 Application not found`). Until it is redeployed, run the twin API locally.

1. Copy env templates:
   - `cp backend/.env.example backend/.env` and fill `INWORLD_API_KEY` + `OPENAI_API_KEY`
   - `cp .env.example .env` (sets `VITE_TWIN_API_URL=http://127.0.0.1:8000`)
2. Install backend deps (handled automatically by `npm run dev:backend` via `backend/.venv`):
   - Or manually: `cd backend && python3.11 -m venv .venv && .venv/bin/pip install -r requirements.txt`
3. Start the API: `npm run dev:backend` (health check: `http://127.0.0.1:8000/health`)
4. In a second terminal: `npm run dev` (Vite must see `VITE_TWIN_API_URL` — restart Vite after changing `.env`)
5. Open Tom Hoover, David West, and Walt Liquor → Ask a question
6. Confirm: live first-person answers + voice playback (not the soft “beyond what I can speak to…” template)
7. With the backend stopped, Ask should show: `Twin service is unavailable. Start the backend or check VITE_TWIN_API_URL.`

## Railway / production redeploy

1. Redeploy `backend/` (Procfile: `uvicorn main:app --host 0.0.0.0 --port $PORT`)
2. Set host env: `INWORLD_API_KEY`, `OPENAI_API_KEY`, optional `WALT_VOICE_ID`, `MONGODB_URI`
3. Point the client at the new URL via Netlify `VITE_TWIN_API_URL` (preferred) or update the defaults in
   `src/twin/narratorCore.js` and `src/data/remoteTwins.js`
4. Smoke-test Ask + voice for David West, Tom Hoover, Walt Liquor

## Studio / legend checklist

1. In `Storyline-Studio`, open `?seedCoreTwins=1` once, then remove the query param.
2. Confirm live API has exactly 3 twins: `David West`, `Tom Hoover`, `Walt Liquor`.
3. Verify each twin is `draftStatus: saved` and timeline events are `visibility: Public` + `approvalStatus: Reviewed`.
4. Open `Ricon-storyline` and hard refresh the browser to clear stale client state.
5. Check Home/Legend list shows each core twin once (no duplicate Walt, no extra David profile).
6. In each twin modal, verify Narrator autoplays and Q&A voice stops when modal closes.
7. In Studio voice preview, generate once per tone/person and rely on 7-day local cache (no re-gen during demo day).
8. Before external demos, confirm both apps build and deploy from tagged commits.
