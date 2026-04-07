# Kastenliste OIL — Project Summary

## Concept

Track attendance for recurring meetings. Members check in via a unique meeting link after the meeting, optionally answer a question, or submit an excuse beforehand. Missed meetings without excuse accumulate as infractions. Admin gets full oversight and CSV export.

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

| Column                    | Type              | Notes                                             |
|---------------------------|-------------------|---------------------------------------------------|
| `id`                      | UUID              |                                                   |
| `date`                    | timestamptz       |                                                   |
| `link_token`              | string unique     | random hex string                                 |
| `question`                | string nullable   |                                                   |
| `answer`                  | string nullable   | compared server-side, never returned to non-admin |
| `check_answer`            | boolean nullable  | if false, any submitted answer is accepted        |
| `max_retries`             | int nullable      | only relevant if `check_answer` is true           |
| `excuse_deadline_minutes` | int               | minutes before start that excuses lock            |
| `checkin_deadline`        | timestamptz       | absolute timestamp when check-in closes           |

### `user_meetings`

| Column              | Type               | Notes                                                      |
|---------------------|--------------------|------------------------------------------------------------|
| `id`                | UUID               |                                                            |
| `user_id`           | UUID FK            |                                                            |
| `meeting_id`        | UUID FK            |                                                            |
| `excused_at`        | timestamptz null   | when excuse was submitted; null if none                    |
| `excuse_type`       | enum nullable      | `late` = excusing for being late, `absent` = excusing absence |
| `checked_in_at`     | timestamptz null   | when user checked in; null if not checked in               |
| `is_late`           | boolean nullable   | set manually by admin                                      |
| `attendance_type`   | string nullable    | `in_person` or `remote`                                    |
| `answer_correct`    | boolean nullable   | null if no question or not checked in                      |
| `infraction`        | enum               | cached: `none` / `late` / `absent` / `pending`             |

---

## Infraction Logic

| Excuse | Checked in | Is late | Infraction |
|--------|------------|---------|------------|
| ✓      | any        | any     | `none`     |
| ✗      | ✓          | ✗       | `none`     |
| ✗      | ✓          | ✓       | `late`     |
| ✗      | ✗          | —       | `absent`   |

Records are resolved lazily on read: no record before deadline → `pending` (not written); no record after deadline → `absent` written to DB.

---

## User Flow

1. User enters RZ ID → lookup or create account → store rz_id
2. **Excuse flow:** User visits excuse page → app calls `GET /api/meetings/next` → user submits excuse with `excuseType` (`"late"` or `"absent"`) before the excuse deadline
3. **Check-in flow:** Admin shares meeting link after meeting
   - User opens link, enters RZ ID
   - Selects attendance type
   - Optionally answers question

## Admin Flow

1. Admin gets prompted for password if no valid auth cookie and accessing a protected route
2. Admin creates meeting and gets a link for users to check in
3. Admin marks users `late` manually via the attendance override endpoint
4. Users without a record are automatically resolved to `absent` after the checkin deadline on next read

---

## Notes

- `answer` is accepted on write but never returned to non-admin routes (TODO: strip via interceptor once auth is implemented)
- `checkAnswer: false` means any submitted answer is accepted — `answerCorrect` is always `true`, `maxRetries` is irrelevant
- `infraction` is a cached field — recomputed on every state change (check-in, excuse, admin override) and on lazy resolution at read time
- In development: Vite dev server proxies `/api/*` to NestJS on port 3000
- In production: NestJS serves `frontend/dist` via `ServeStaticModule`, all unmatched routes return `index.html` for React Router
- `GET /api/meetings/next` must be declared before `GET /api/meetings/:id` in the controller to avoid routing conflict
- The API self-documents via OpenAPI; frontend API clients are autogenerated from that spec
