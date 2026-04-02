# Kastenliste OIL — Project Summary

## Concept

Track attendance for recurring meetings. Members check in via a unique meeting link after the meeting, optionally answer a question, or submit an excuse beforehand. Missed meetings without excuse accumulate as beer debt. Admin gets full oversight and CSV export.

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

| Column       | Type          | Notes              |
|--------------|---------------|--------------------|
| `id`         | UUID          |                    |
| `rz_id`      | string unique | e.g. `lu451rei`    |
| `first_name` | string        |                    |
| `last_name`  | string        |                    |

### `meetings`

| Column                    | Type            | Notes                                               |
|---------------------------|-----------------|-----------------------------------------------------|
| `id`                      | UUID            |                                                     |
| `date`                    | timestamp       |                                                     |
| `link_token`              | string unique   | random string                                       |
| `question`                | string nullable |                                                     |
| `answer`                  | string nullable | compared server-side, never returned in responses   |
| `question_required`       | boolean         | wether questions have to be answered correctly      |
| `check_answer`            | boolean         | if false, any submitted answer is accepted          |
| `max_retries`             | int             | only relevant if question_required and check_answer |
| `excuse_deadline_minutes` | int             | minutes before start that excuses lock              |
| `checkin_dealine_minutes` | int             | minutes after meeting when checkin is possible      |

### `user_meetings`

| Column                | Type               | Notes                                  |
|-----------------------|--------------------|----------------------------------------|
| `id`                  | UUID               |                                        |
| `user_id`             | int FK             |                                        |
| `meeting_id`          | int FK             |                                        |
| `status`              | enum               | `present`, `absent`, `excused`, `late` |
| `attendance_type`     | enum nullable      | `in_person`, `online`                  |
| `checked_in_at`       | timestamp nullable |                                        |
| `excuse_submitted_at` | timestamp nullable |                                        |
| `answer_attempts`     | int                | default 0                              |
| `answer_correct`      | boolean nullable   |                                        |

---

## User Flow

1. User enters RZ ID → lookup or create account -> store rz_id 
2. **Check-in flow:** Admin shares meeting link after meeting
  - user (if `excused` and not `absent`) opens link
  - enters RZ ID
  - selects attendance type
  - optionally answers question
3. **Excuse flow:** User visits excuse page → app calls `GET /api/meetings/next` → user submits excuse before deadline

## Admin Flow 

1. Admin gets prompted for a password if no valid auth cookie is set and accessing a protected route
2. Admin creates meeting and gets displayed a link for users to check in 
3. Admin marks users `late` or `absent` (if not excused and not present) during the meeting in the main overview table
4. Users are automatically marked `absent` after deadline has passed

---

## Notes

- `answer` is accepted on write but never returned in any API response to the users
- `checkAnswer: false` means any submitted answer is accepted as correct — the stored answer is ignored, `answerCorrect` is always returned as `true`, and `maxRetries` is irrelevant. A non-empty answer string is still required in the check-in request when the meeting has a question
- `beerScore` = count of `absent` + `late` rows per user, the occurrences of `excused` are also counted
- In development: Vite dev server proxies `/api/*` to NestJS on port 3000
- In production: NestJS serves `frontend/dist` via `ServeStaticModule`, all unmatched routes return `index.html` for React Router
- `GET /api/meetings/next` must be declared before `GET /api/meetings/:token` in the NestJS controller to avoid routing conflict
- The API should auto-document itself (using OpenAPI) the frontend API clients autogenerate itself using that doku