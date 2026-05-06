# Netlify Environment Variables

RICON Storyline uses a server-side proxy endpoint for the AI companion at `/api/twin` -> `/.netlify/functions/twin`.
It also exposes a lightweight health endpoint at `/api/twin/health` -> `/.netlify/functions/twin-health`.

## Required Variables

- `ANTHROPIC_API_KEY`
  - Server-only secret used by the Netlify function.
  - Must be set in Netlify site environment variables.
  - Never expose this key in client code, logs, or analytics payloads.

## Optional Variables

- `ANTHROPIC_MODEL`
  - Optional override for the default model.
  - If omitted, the app defaults to `claude-sonnet-4-20250514`.

## Behavior by Environment State

- **Valid key configured**
  - `/api/twin` streams live companion responses from Anthropic.
- **Missing or invalid key**
  - Companion uses a safe local fallback response path.
  - In development, the server prints a warning to help setup.
- **Provider temporarily unavailable**
  - Endpoint returns a polished companion-unavailable message (no raw provider error details).

## Health Endpoint Contract

- `GET /api/twin/health`
- Safe response shape (no secrets, no provider stack details):
  - `status`: `available` | `degraded` | `unavailable`
  - `reason`: generic state category
  - `message`: user-safe summary

## Verification Checklist (Netlify)

1. Open Netlify site settings -> Environment variables.
2. Confirm `ANTHROPIC_API_KEY` is present in deploy context(s) used by production/preview.
3. Optionally set `ANTHROPIC_MODEL`.
4. Trigger a fresh deploy after changing env vars.
5. Validate `/api/twin` from the deployed app:
   - Live response when key is valid.
   - Graceful fallback/unavailable messaging when provider is down.
