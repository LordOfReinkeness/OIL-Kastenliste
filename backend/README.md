# OIL Kastenlist (backend)

## Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `rz_id` | string unique | e.g. `lu451rei` |
| `first_name` | string | |
| `last_name` | string | |

### `meetings`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `date` | timestamp | |
| `link_token` | string unique | random string |
| `question` | string nullable | |
| `answer` | string nullable | compared server-side, never returned in responses |
| `question_required` | boolean | |
| `check_answer` | boolean | if false, any submitted answer is accepted as correct |
| `max_retries` | int | only relevant if question_required and check_answer |
| `excuse_deadline_minutes` | int | minutes before meeting start that excuses lock |

### `user_meetings`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `user_id` | int FK | |
| `meeting_id` | int FK | |
| `status` | enum | `present`, `absent`, `excused` |
| `attendance_type` | enum nullable | `in_person`, `online` |
| `checked_in_at` | timestamp nullable | |
| `excuse_submitted_at` | timestamp nullable | |
| `answer_attempts` | int | default 0 |
| `answer_correct` | boolean nullable | |

---

## User Flow

1. User enters RZ ID → lookup or create account
2. **Check-in flow:** Admin shares meeting link after meeting → user opens link, enters RZ ID, selects attendance type, optionally answers question
3. **Excuse flow:** User visits excuse page → app calls `GET /api/meetings/next` → user submits excuse before deadline

---

## Admin Auth

- Password set via env var / Docker Compose file
- On startup: hashed and stored in memory
- `POST /api/admin/login` verifies password, sets signed cookie
- Guard on all `/api/admin/*` routes validates cookie
- "Change password" = update env var and restart container

---

## API Overview

### Public — Users
| Method | Route | Description |
|---|---|---|
| GET | `/api/users/:rzId` | Look up a user by RZ ID |
| POST | `/api/users` | Create a new user |

### Public — Meetings
| Method | Route | Description |
|---|---|---|
| GET | `/api/meetings/next` | Get next upcoming meeting info and excuse deadline |
| GET | `/api/meetings/:token` | Get meeting info by token link |
| POST | `/api/meetings/:token/checkin` | Check in to a meeting, optionally submit answer |
| POST | `/api/meetings/:token/excuse` | Submit an excuse before the deadline |

### Admin — Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/admin/login` | Verify password, set session cookie |
| POST | `/api/admin/logout` | Clear session cookie |

### Admin — Meetings
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/meetings` | List all meetings |
| POST | `/api/admin/meetings` | Create a new meeting |
| GET | `/api/admin/meetings/:id` | Get a single meeting |
| PATCH | `/api/admin/meetings/:id` | Update a meeting |
| DELETE | `/api/admin/meetings/:id` | Delete a meeting |

### Admin — Users
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create a new user |
| GET | `/api/admin/users/:id` | Get a single user with full meeting history |
| PATCH | `/api/admin/users/:id` | Update a user |
| DELETE | `/api/admin/users/:id` | Delete a user |

### Admin — Attendance
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/meetings/:id/attendance` | Get all attendance records for a meeting |
| POST | `/api/admin/meetings/:id/checkin` | Manually check in a user after the fact |
| PATCH | `/api/admin/meetings/:id/attendance/:userId` | Override a user's attendance status |

### Admin — Stats
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/stats` | Full overview of all users, meetings and beer scores |
| GET | `/api/admin/stats/export` | Download stats as CSV |

---

## API Reference

### Public — Users

#### `GET /api/users/:rzId`
```json
// 200
{ "id": 1, "rzId": "lu451rei", "firstName": "Lukas", "lastName": "Rei" }

// 404
{ "message": "user not found" }
```

#### `POST /api/users`
```json
// request
{ "rzId": "lu451rei", "firstName": "Lukas", "lastName": "Rei" }

// 201
{ "id": 1, "rzId": "lu451rei", "firstName": "Lukas", "lastName": "Rei" }

// 409
{ "message": "user already exists" }
```

---

### Public — Meetings

#### `GET /api/meetings/next`
```json
// 200
{
  "id": 1,
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadline": "2026-04-10T17:00:00Z",
  "linkToken": "abc123"
}

// 404
{ "message": "no upcoming meeting" }
```

#### `GET /api/meetings/:token`
```json
// 200
{
  "id": 1,
  "date": "2026-04-10T18:00:00Z",
  "hasQuestion": true,
  "questionRequired": true,
  "checkAnswer": false,
  "question": "What was the main topic?",
  "maxRetries": 3
}

// 404
{ "message": "meeting not found" }
```

#### `POST /api/meetings/:token/checkin`
```json
// request
{ "rzId": "lu451rei", "attendanceType": "in_person", "answer": "deployment pipeline" }

// 200 — checked in, answer correct or no question
{ "message": "checked in", "answerCorrect": true }

// 200 — wrong answer, retries remaining
{ "message": "wrong answer", "answerCorrect": false, "attemptsRemaining": 2 }

// 403 — retries exhausted
{ "message": "max retries reached", "answerCorrect": false, "attemptsRemaining": 0 }

// 409 — already checked in
{ "message": "already checked in" }

// 404
{ "message": "user not found" }
```

#### `POST /api/meetings/:token/excuse`
```json
// request
{ "rzId": "lu451rei" }

// 200
{ "message": "excuse submitted" }

// 409 — already excused or already checked in
{ "message": "already submitted" }

// 403 — past deadline
{ "message": "excuse deadline passed" }

// 404
{ "message": "user not found" }
```

---

### Admin — Auth

#### `POST /api/admin/login`
```json
// request
{ "password": "secret" }

// 200 + sets cookie
{ "message": "ok" }

// 401
{ "message": "invalid password" }
```

#### `POST /api/admin/logout`
```json
// 200 + clears cookie
{ "message": "ok" }
```

---

### Admin — Meetings

#### `GET /api/admin/meetings`
```json
[
  {
    "id": 1,
    "date": "2026-04-10T18:00:00Z",
    "linkToken": "abc123",
    "questionRequired": true,
    "checkAnswer": false,
    "maxRetries": 3,
    "excuseDeadlineMinutes": 60,
    "question": "What was the main topic?"
  }
]
```

#### `POST /api/admin/meetings` + `PATCH /api/admin/meetings/:id`
```json
// request
{
  "date": "2026-04-10T18:00:00Z",
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "questionRequired": true,
  "checkAnswer": false,
  "maxRetries": 3,
  "excuseDeadlineMinutes": 60
}

// response — full meeting object, answer omitted
```

#### `GET /api/admin/meetings/:id`
Same shape as single item from list, answer never returned.

#### `DELETE /api/admin/meetings/:id`
```json
{ "message": "deleted" }
```

---

### Admin — Users

#### `GET /api/admin/users`
```json
[
  { "id": 1, "rzId": "lu451rei", "firstName": "Lukas", "lastName": "Rei" }
]
```

#### `POST /api/admin/users` + `PATCH /api/admin/users/:id`
```json
// request
{ "rzId": "lu451rei", "firstName": "Lukas", "lastName": "Rei" }

// response — full user object
```

#### `GET /api/admin/users/:id`
```json
{
  "id": 1,
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei",
  "meetings": [
    {
      "meetingId": 1,
      "date": "2026-04-10T18:00:00Z",
      "status": "present",
      "attendanceType": "in_person",
      "checkedInAt": "2026-04-10T18:42:00Z",
      "answerCorrect": true,
      "excuseSubmittedAt": null
    }
  ]
}
```

#### `DELETE /api/admin/users/:id`
```json
{ "message": "deleted" }
```

---

### Admin — Attendance

#### `GET /api/admin/meetings/:id/attendance`
```json
{
  "meetingId": 1,
  "date": "2026-04-10T18:00:00Z",
  "attendance": [
    {
      "userId": 1,
      "rzId": "lu451rei",
      "firstName": "Lukas",
      "lastName": "Rei",
      "status": "present",
      "attendanceType": "in_person",
      "checkedInAt": "2026-04-10T18:42:00Z",
      "answerCorrect": true,
      "excuseSubmittedAt": null
    },
    {
      "userId": 2,
      "rzId": "ma123mue",
      "firstName": "Max",
      "lastName": "Mue",
      "status": "excused",
      "attendanceType": null,
      "checkedInAt": null,
      "answerCorrect": null,
      "excuseSubmittedAt": "2026-04-10T16:45:00Z"
    }
  ]
}
```

#### `POST /api/admin/meetings/:id/checkin`
```json
// request
{ "rzId": "lu451rei", "attendanceType": "in_person", "answerCorrect": true }

// 200
{ "message": "checked in" }
```

#### `PATCH /api/admin/meetings/:id/attendance/:userId`
```json
// request
{ "status": "excused" }

// response — updated attendance object, same shape as item in attendance list
```

---

### Admin — Stats

#### `GET /api/admin/stats`
```json
{
  "users": [
    {
      "id": 1,
      "rzId": "lu451rei",
      "firstName": "Lukas",
      "lastName": "Rei",
      "totalMeetings": 10,
      "present": 8,
      "excused": 1,
      "absent": 1,
      "beerScore": 1
    }
  ],
  "meetings": [
    {
      "id": 1,
      "date": "2026-04-10T18:00:00Z",
      "presentCount": 8,
      "excusedCount": 1,
      "absentCount": 1
    }
  ]
}
```

#### `GET /api/admin/stats/export`
Returns CSV file download.
```
Content-Type: text/csv
Content-Disposition: attachment; filename="beer-tracker-export.csv"
```

---

## Notes

- `answer` is accepted on write but never returned in any API response
- `checkAnswer: false` means any submitted answer is accepted as correct — the stored answer is ignored, `answerCorrect` is always returned as `true`, and `maxRetries` is irrelevant. However a non-empty answer string is still required in the checkin request when the meeting has a question
- `GET /api/meetings/next` must be declared before `GET /api/meetings/:token` in the NestJS controller to avoid routing conflict
- `beerScore` = count of `absent` rows without excuse per user
- In development: Vite dev server proxies `/api/*` to NestJS on port 3000
- In production: NestJS serves `frontend/dist` via `ServeStaticModule`, all unmatched routes return `index.html` for React Router