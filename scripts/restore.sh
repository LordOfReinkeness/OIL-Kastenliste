#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup.dump>"
  exit 1
fi

CONTAINER="${CONTAINER:-oil-kastenliste-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-kastenliste}"

docker exec -i "$CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists < "$1"
echo "Restore complete"
