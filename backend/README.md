# Kastenliste OIL — Backend Documentation

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Framework  | NestJS + TypeScript                           |
| Database   | PostgreSQL via TypeORM                        |
| Auth       | Bcrypt-hashed env var password, signed cookie |
| Validation | class-validator + class-transformer           |
| Static     | @nestjs/serve-static — serves `frontend/dist` |

---

## Admin Auth

- Password set via env var / Docker Compose file
- On startup: hashed with bcrypt and stored in memory
- `POST /api/admin/login` verifies password, sets signed cookie
- Guard on all `/api/admin/*` routes validates cookie
- Changing the password means updating the env var and restarting the container

---

## API Overview

### Public — Users

| Method | Route              | Description                |
|--------|--------------------|----------------------------|
| GET    | `/api/users/:rzId` | Look up a user by RZ ID    |
| POST   | `/api/users`       | Create a new user          |

### Public — Meetings

| Method | Route                          | Description                                      |
|--------|--------------------------------|--------------------------------------------------|
| GET    | `/api/meetings/next`           | Get next upcoming meeting info + excuse deadline |
| GET    | `/api/meetings/:token`         | Get meeting info by token link                   |
| POST   | `/api/meetings/:token/checkin` | Check in to a meeting, optionally submit answer  |
| POST   | `/api/meetings/:token/excuse`  | Submit an excuse before the deadline             |

### Admin — Auth

| Method | Route               | Description                         |
|--------|---------------------|-------------------------------------|
| POST   | `/api/admin/login`  | Verify password, set session cookie |
| POST   | `/api/admin/logout` | Clear session cookie                |

### Admin — Meetings

| Method | Route                     | Description          |
|--------|---------------------------|----------------------|
| GET    | `/api/admin/meetings`     | List all meetings    |
| POST   | `/api/admin/meetings`     | Create a new meeting |
| GET    | `/api/admin/meetings/:id` | Get a single meeting |
| PATCH  | `/api/admin/meetings/:id` | Update a meeting     |
| DELETE | `/api/admin/meetings/:id` | Delete a meeting     |

### Admin — Users

| Method | Route                  | Description                            |
|--------|------------------------|----------------------------------------|
| GET    | `/api/admin/users`     | List all users                         |
| POST   | `/api/admin/users`     | Create a new user                      |
| GET    | `/api/admin/users/:id` | Get a single user with meeting history |
| PATCH  | `/api/admin/users/:id` | Update a user                          |
| DELETE | `/api/admin/users/:id` | Delete a user                          |

### Admin — Attendance

| Method | Route                                          | Description                          |
|--------|------------------------------------------------|--------------------------------------|
| GET    | `/api/admin/meetings/:id/attendance`           | Get all attendance records           |
| POST   | `/api/admin/meetings/:id/checkin`              | Manually check in a user             |
| PATCH  | `/api/admin/meetings/:id/attendance/:userId`   | Override a user's attendance status  |

### Admin — Stats

| Method | Route                       | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| GET    | `/api/admin/stats`          | Full overview of all users, meetings, scores |
| GET    | `/api/admin/stats/export`   | Download stats as CSV                        |

---

## API Reference

### Public — Users

#### `GET /api/users/:rzId`

200 — user found
```json
{
  "id": 1,
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei"
}
```

404 — user not found
```json
{
  "message": "user not found"
}
```

---

#### `POST /api/users`

Request
```json
{
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei"
}
```

201 — created
```json
{
  "id": 1,
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei"
}
```

409 — RZ ID already exists
```json
{
  "message": "user already exists"
}
```

---

### Public — Meetings

#### `GET /api/meetings/next`

200 — next meeting found
```json
{
  "id": 1,
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadline": "2026-04-10T17:00:00Z",
  "linkToken": "abc123"
}
```

404 — no upcoming meeting scheduled
```json
{
  "message": "no upcoming meeting"
}
```

---

#### `GET /api/meetings/:token`

200 — meeting found
```json
{
  "id": 1,
  "date": "2026-04-10T18:00:00Z",
  "hasQuestion": true,
  "questionRequired": true,
  "checkAnswer": false,
  "question": "What was the main topic?",
  "maxRetries": 3
}
```

404 — token not found
```json
{
  "message": "meeting not found"
}
```

---

#### `POST /api/meetings/:token/checkin`

Request
```json
{
  "rzId": "lu451rei",
  "attendanceType": "in_person",
  "answer": "deployment pipeline"
}
```

200 — checked in, answer correct or no question
```json
{
  "message": "checked in",
  "answerCorrect": true
}
```

200 — wrong answer, retries remaining
```json
{
  "message": "wrong answer",
  "answerCorrect": false,
  "attemptsRemaining": 2
}
```

403 — retries exhausted
```json
{
  "message": "max retries reached",
  "answerCorrect": false,
  "attemptsRemaining": 0
}
```

409 — already checked in
```json
{
  "message": "already checked in"
}
```

404 — user not found
```json
{
  "message": "user not found"
}
```

---

#### `POST /api/meetings/:token/excuse`

Request
```json
{
  "rzId": "lu451rei"
}
```

200 — excuse submitted
```json
{
  "message": "excuse submitted"
}
```

409 — already excused or already checked in
```json
{
  "message": "already submitted"
}
```

403 — past the excuse deadline
```json
{
  "message": "excuse deadline passed"
}
```

404 — user or meeting not found
```json
{
  "message": "user not found"
}
```

---

### Admin — Auth

#### `POST /api/admin/login`

Request
```json
{
  "password": "secret"
}
```

200 — sets cookie
```json
{
  "message": "ok"
}
```

401 — wrong password
```json
{
  "message": "invalid password"
}
```

---

#### `POST /api/admin/logout`

200 — clears cookie
```json
{
  "message": "ok"
}
```

---

### Admin — Meetings

#### `GET /api/admin/meetings`

200 — list of all meetings
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

---

#### `POST /api/admin/meetings`

Request
```json
{
  "date": "2026-04-10T18:00:00Z",
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "questionRequired": true,
  "checkAnswer": false,
  "maxRetries": 3,
  "excuseDeadlineMinutes": 60
}
```

201 — created, answer field omitted in response
```json
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
```

---

#### `PATCH /api/admin/meetings/:id`

Request — all fields optional
```json
{
  "question": "Updated question?",
  "checkAnswer": true
}
```

200 — updated meeting, answer field omitted
```json
{
  "id": 1,
  "date": "2026-04-10T18:00:00Z",
  "linkToken": "abc123",
  "questionRequired": true,
  "checkAnswer": true,
  "maxRetries": 3,
  "excuseDeadlineMinutes": 60,
  "question": "Updated question?"
}
```

---

#### `DELETE /api/admin/meetings/:id`

200
```json
{
  "message": "deleted"
}
```

---

### Admin — Users

#### `GET /api/admin/users`

200
```json
[
  {
    "id": 1,
    "rzId": "lu451rei",
    "firstName": "Lukas",
    "lastName": "Rei"
  }
]
```

---

#### `POST /api/admin/users`

Request
```json
{
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei"
}
```

201
```json
{
  "id": 1,
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei"
}
```

---

#### `PATCH /api/admin/users/:id`

Request — all fields optional
```json
{
  "firstName": "Lukas"
}
```

200
```json
{
  "id": 1,
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei"
}
```

---

#### `GET /api/admin/users/:id`

200 — user with full meeting history
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

---

#### `DELETE /api/admin/users/:id`

200
```json
{
  "message": "deleted"
}
```

---

### Admin — Attendance

#### `GET /api/admin/meetings/:id/attendance`

200
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

---

#### `POST /api/admin/meetings/:id/checkin`

Request
```json
{
  "rzId": "lu451rei",
  "attendanceType": "in_person",
  "answerCorrect": true
}
```

200
```json
{
  "message": "checked in"
}
```

---

#### `PATCH /api/admin/meetings/:id/attendance/:userId`

Request
```json
{
  "status": "excused"
}
```

200 — updated attendance record
```json
{
  "userId": 1,
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Rei",
  "status": "excused",
  "attendanceType": null,
  "checkedInAt": null,
  "answerCorrect": null,
  "excuseSubmittedAt": null
}
```

---

### Admin — Stats

#### `GET /api/admin/stats`

200
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

---

#### `GET /api/admin/stats/export`

Returns a CSV file download. No JSON body.

```
Content-Type: text/csv
Content-Disposition: attachment; filename="kastenliste-oil-export.csv"
```