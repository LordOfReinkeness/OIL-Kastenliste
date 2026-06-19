#!/bin/sh
set -e

echo "${BACKUP_CRON} /backup.sh" > /tmp/crontab

exec supercronic /tmp/crontab
