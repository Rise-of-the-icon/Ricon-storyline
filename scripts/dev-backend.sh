#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PYTHON="python3"
if command -v python3.11 >/dev/null 2>&1; then
  PYTHON="python3.11"
fi

if [[ ! -x .venv/bin/python ]]; then
  echo "Creating backend/.venv…"
  "$PYTHON" -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi

PYTHON=".venv/bin/python"
PORT="${PORT:-8000}"
echo "Starting twin API on http://127.0.0.1:${PORT}"
echo "Health: http://127.0.0.1:${PORT}/health"
exec "$PYTHON" -m uvicorn main:app --reload --host 0.0.0.0 --port "$PORT"
