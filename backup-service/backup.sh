#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_PATH}/kastenliste_${TIMESTAMP}.sql.gz"

pg_dump -h "${DB_HOST}" -U "${DB_USER}" "${DB_NAME}" | gzip > "${FILE}"

echo "Backup written: ${FILE}"

ls -t "${BACKUP_PATH}"/*.sql.gz 2>/dev/null | tail -n +"$((BACKUP_RETAIN + 1))" | xargs -r rm -v
