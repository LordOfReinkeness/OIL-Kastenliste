#!/bin/bash
set -euo pipefail

CONTAINER="${CONTAINER:-oil-kastenliste-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-kastenliste}"
OUTPUT_DIR="${OUTPUT_DIR:-~/backups}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="${OUTPUT_DIR}/kastenliste_${TIMESTAMP}.dump"

docker exec "$CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$OUTPUT"
echo "Backup written to $OUTPUT"
