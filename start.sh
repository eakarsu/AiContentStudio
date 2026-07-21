#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$ROOT/.env" ]] || { echo "Missing .env; copy .env.example." >&2; exit 1; }
frontend_port="${FRONTEND_PORT:-5173}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://127.0.0.1:$frontend_port}"
case "${1:-backend}" in
  backend)
    if [[ "${ALLOW_SCHEMA_MIGRATION:-0}" == "1" || "${MIGRATE_ON_START:-false}" == "true" ]]; then
      command -v psql >/dev/null 2>&1 || { echo "psql is required for the explicitly enabled migration." >&2; exit 1; }
      psql "${DATABASE_URL:?DATABASE_URL is required}" -v ON_ERROR_STOP=1 \
        -f "$ROOT/backend/prisma/migrations/202607180001_authoritative_content/migration.sql"
    fi
    cd "$ROOT/backend"
    exec npm start
    ;;
  frontend)
    cd "$ROOT/frontend"
    exec npm run dev
    ;;
  *) echo "Usage: $0 [backend|frontend]" >&2; exit 64 ;;
esac
