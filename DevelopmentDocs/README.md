# Kastenliste OIL — Project Summary

Kastenliste

## Concept

Track attendance for recurring meetings. Members excuse themselves beforehand, check in live during the meeting, and do a post-meeting check-in (optionally answering a question) after. Missed meetings without excuse accumulate as infractions. Admin gets full oversight and CSV/XLSX export.

---

## Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Backend     | NestJS + TypeScript                                |
| Frontend    | React + Vite + TypeScript                          |
| Database    | PostgreSQL via TypeORM                             |
| Auth        | Hardcoded admin password, hashed in memory, cookie |
| Deployment  | Single Docker container, NestJS serves frontend    |
| Structure   | Monorepo — `frontend/` and `backend/` under root   |

---

## Project Structure

```
project/
├── frontend/              ← Vite + React + TS
├── backend/               ← NestJS + TS
├── package.json           ← root scripts only
└── docker-compose.yml
```

---

## Data Model

### `users`

| Column       | Type          | Notes           |
|--------------|---------------|-----------------|
| `id`         | UUID          |                 |
| `rz_id`      | string unique | e.g. `lu451rei` |
| `first_name` | string        |                 |
| `last_name`  | string        |                 |

### `meetings`

| Column                    | Type             | Notes                                                              |
|---------------------------|------------------|--------------------------------------------------------------------|
| `id`                      | UUID             |                                                                    |
| `date`                    | timestamptz      | meeting start time                                                 |
| `link_token`              | string unique    | random hex string                                                  |
| `question`                | string nullable  | post-meeting question                                              |
| `answer`                  | string nullable  | compared server-side, never returned to non-admin                  |
| `check_answer`            | boolean          | default true; if false any answer is accepted                      |
| `max_retries`             | int              | default 3; only relevant if `check_answer` is true                 |
| `excuse_deadline_minutes` | int              | minutes before start that excuses lock                             |
| `live_checkin_open`       | boolean          | admin toggles live check-in window; auto-closes lazily             |
| `checkin_window_minutes`  | int              | default 60; minutes after start before live check-in auto-closes   |
| `checkin_deadline`        | timestamptz      | absolute timestamp when post-meeting check-in closes               |
| `cap_infractions`         | boolean          | default false; if true infractions per meeting are capped at 1     |

### `user_meetings`

| Column                | Type               | Notes                                                         |
|-----------------------|--------------------|---------------------------------------------------------------|
| `id`                  | UUID               |                                                               |
| `user_id`             | UUID FK            |                                                               |
| `meeting_id`          | UUID FK            |                                                               |
| `excused_at`          | timestamptz null   | when excuse was submitted; null if none                       |
| `excuse_type`         | enum nullable      | `late` = excusing for being late, `absent` = excusing absence |
| `live_checked_in_at`  | timestamptz null   | when user checked in during the meeting                       |
| `post_checked_in_at`  | timestamptz null   | when user did the post-meeting check-in                       |
| `is_late`             | boolean nullable   | set manually by admin                                         |
| `attendance_type`     | string nullable    | `in_person` or `remote`; set during live check-in             |
| `answer_correct`      | boolean nullable   | null if no question or no post check-in                       |
| `answer_attempts`     | int                | default 0; tracks wrong answer attempts                       |
| `infractions`         | int                | cached count: 0–3; recomputed on every state change           |

---

## Infraction Logic

Up to three infractions per meeting, optionally capped at 1 via `cap_infractions`.

| Condition                                              | +1 Infraction    |
|--------------------------------------------------------|------------------|
| `is_late` and `excuse_type != 'late'`                  | late w/o excuse  |
| no `live_checked_in_at` and `excuse_type != 'absent'`  | absent w/o excuse |
| no `post_checked_in_at` and `excuse_type != 'absent'`  | not checked in post |

Records are resolved lazily on read:
- No record before `checkin_deadline` → `infractions: null` (pending, not written)
- No record after `checkin_deadline` → record written with computed infractions

---

## User Flow

1. User enters RZ ID → lookup or create account → store `rz_id`
2. **Excuse flow:** User visits excuse page → app calls `GET /api/meetings/next` → user submits excuse with `excuseType` (`"late"` or `"absent"`) before the excuse deadline
3. **Live check-in:** Admin opens check-in window during meeting → user opens link, enters RZ ID, selects `in_person` or `remote` → admin closes window (or auto-closes after `checkinWindowMinutes`)
4. **Post check-in:** After meeting, before `checkinDeadline` → user opens link, optionally answers question → users not excused and not checked in live are notified by frontend

## Admin Flow

1. Admin gets prompted for password if no valid auth cookie and accessing a protected route
2. Admin creates meeting and gets a link to share
3. Admin opens live check-in during the meeting via `PATCH /api/meetings/:id` with `liveCheckinOpen: true`
4. Admin closes live check-in after the meeting (or it auto-closes after `checkinWindowMinutes`)
5. Admin marks users `late` manually via the attendance override endpoint
6. Users without a record are automatically resolved after `checkinDeadline` on next read

---

## Notes

- `answer` is accepted on write but never returned to non-admin routes (TODO: strip via interceptor once auth is implemented)
- `checkAnswer: false` means any submitted answer is accepted — `answerCorrect` is always `true`, `maxRetries` is irrelevant
- `infractions` is a cached int field — recomputed on every state change and on lazy resolution at read time
- `live_checkin_open` is resolved lazily: if `now > date + checkinWindowMinutes` it is treated as closed regardless of the stored value
- Post check-in is required even for excused-absent users — they are expected to read meeting notes
- `GET /api/meetings/next` must be declared before `GET /api/meetings/:id` in the controller to avoid routing conflict
- In development: Vite dev server proxies `/api/*` to NestJS on port 3000
- In production: NestJS serves `frontend/dist` via `ServeStaticModule`, all unmatched routes return `index.html` for React Router
- The API self-documents via OpenAPI; frontend API clients are autogenerated from that spec
