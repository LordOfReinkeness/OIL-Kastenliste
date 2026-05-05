#!/usr/bin/env python3
"""Seed the local dev DB with production state from the JSON snapshot files."""
import json, subprocess, sys
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path(__file__).parent.parent
stats    = json.loads((ROOT / "stats_overview_2026-05-05.json").read_text())
meetings = json.loads((ROOT / "meetings_overview_2026-05-05.json").read_text())
meetings_by_id = {m["id"]: m for m in meetings}

def q(v):
    """Quote a string for SQL, or return NULL."""
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"

def ts(iso):
    """Wrap an ISO timestamp string in quotes."""
    return f"'{iso}'"

lines = ["BEGIN;", ""]

# ── Users ─────────────────────────────────────────────────────────────────────
lines.append("-- Users")
for u in stats:
    lines.append(
        f'INSERT INTO users (id, "rzId", "firstName", "lastName") '
        f"VALUES ({q(u['id'])}, {q(u['rzId'])}, {q(u['firstName'])}, {q(u['lastName'])}) "
        f"ON CONFLICT DO NOTHING;"
    )

lines.append("")

# ── Meetings ──────────────────────────────────────────────────────────────────
lines.append("-- Meetings")
for m in meetings:
    lines.append(
        f'INSERT INTO meetings '
        f'(id, "linkToken", date, "excuseDeadlineMinutes", "checkinDeadline", '
        f'"checkinWindowMinutes", "liveCheckinOpen", "capInfractions", '
        f'question, answer, "checkAnswer", "maxRetries") VALUES ('
        f"{q(m['id'])}, {q(m['linkToken'])}, {ts(m['date'])}, "
        f"{m['excuseDeadlineMinutes']}, {ts(m['checkinDeadline'])}, "
        f"{m['checkinWindowMinutes']}, {str(m['liveCheckinOpen']).lower()}, "
        f"{str(m['capInfractions']).lower()}, "
        f"{q(m['question'])}, {q(m['answer'])}, "
        f"{str(m['checkAnswer']).lower()}, {m['maxRetries']}) "
        f"ON CONFLICT DO NOTHING;"
    )

lines.append("")

# ── User-meeting records ──────────────────────────────────────────────────────
lines.append("-- User-meeting records")
for u in stats:
    for rec in u["meetings"]:
        mid     = rec["id"]
        meeting = meetings_by_id[mid]

        # Skip fully pending (no data yet)
        if (rec["liveCheckedIn"] is None and rec["postCheckedIn"] is None
                and rec["excuseType"] is None and rec["infractions"] is None):
            continue

        meeting_date     = datetime.fromisoformat(meeting["date"].replace("Z", "+00:00"))
        checkin_deadline = datetime.fromisoformat(meeting["checkinDeadline"].replace("Z", "+00:00"))

        live_ts = ts((meeting_date + timedelta(minutes=30)).isoformat()) if rec["liveCheckedIn"] else "NULL"
        post_ts = ts((checkin_deadline - timedelta(days=1)).isoformat())  if rec["postCheckedIn"]  else "NULL"
        is_late     = "NULL" if rec["isLate"] is None else str(rec["isLate"]).lower()
        excuse_type = q(rec["excuseType"])
        infractions = 0 if rec["infractions"] is None else rec["infractions"]

        uid = u["id"]
        lines.append(
            f'INSERT INTO user_meetings '
            f'("userId", "meetingId", user_id, meeting_id, '
            f'"liveCheckedInAt", "postCheckedInAt", "isLate", "excuseType", infractions, "answerAttempts") '
            f"VALUES ({q(uid)}, {q(mid)}, {q(uid)}::uuid, {q(mid)}::uuid, "
            f"{live_ts}, {post_ts}, {is_late}, {excuse_type}, {infractions}, 0) "
            f"ON CONFLICT DO NOTHING;"
        )

lines.append("")
lines.append("COMMIT;")

sql = "\n".join(lines)

result = subprocess.run(
    ["docker", "exec", "-i", "oil-kastenliste-db-dev",
     "psql", "-U", "postgres", "-d", "kastenliste", "-v", "ON_ERROR_STOP=1"],
    input=sql.encode(),
    capture_output=True,
)
print(result.stdout.decode())
if result.stderr:
    print("STDERR:", result.stderr.decode(), file=sys.stderr)
if result.returncode != 0:
    sys.exit(result.returncode)
print("=== Seed complete ===")
