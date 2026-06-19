# Backup & Restore

Both scripts use PostgreSQL's custom dump format (`pg_dump -Fc`) and run against the DB container via `docker exec`.

## Defaults

| Variable     | Default              |
|--------------|----------------------|
| `CONTAINER`  | `oil-kastenliste-db` |
| `DB_USER`    | `postgres`           |
| `DB_NAME`    | `kastenliste`        |
| `OUTPUT_DIR` | `~/backups`          |

---

## Backup

**Server:**

```bash
sudo OUTPUT_DIR=/home/server/backups ./scripts/backup.sh
```

Writes `/home/server/backups/kastenliste_<timestamp>.dump`.

---

## Restore

**Local dev** (different container name):

```bash
CONTAINER=oil-kastenliste-db-dev ./scripts/restore.sh backups/kastenliste_20260512_093247.dump
```

Restore drops and recreates all objects (`--clean --if-exists`) before loading the dump.
