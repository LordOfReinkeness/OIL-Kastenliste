# Kastenliste OIL — Backend Documentation

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Framework  | NestJS + TypeScript                                 |
| Database   | PostgreSQL via TypeORM                              |
| Auth       | JWT signed with env var secret, stored in httpOnly cookie |
| Validation | class-validator + class-transformer                 |
| Static     | @nestjs/serve-static — serves `frontend/dist`       |

---

## Admin Auth

- Password set via env var / Docker Compose file
- On startup: hashed with bcrypt and stored in memory
- `POST /api/admin/login` verifies password, signs a JWT with an env var secret, sets it as an `httpOnly`, `SameSite=strict`, `Secure` cookie — never in the response body
- The admin guard extracts and verifies the JWT from the cookie on every protected request, not from an `Authorization` header
- The frontend never reads or attaches the token — the browser handles it transparently
- `POST /api/admin/logout` clears the cookie
- Changing the password means updating the env var and restarting the container

---

## API Overview

Routes marked **Admin** require a valid JWT in the `admin_session` httpOnly cookie.

### Auth

| Method | Route               | Auth  | Description                      |
|--------|---------------------|-------|----------------------------------|
| POST   | [`/api/admin/login`](#post-apiadminlogin)  | —     | Verify password, set JWT cookie  |
| POST   | [`/api/admin/logout`](#post-apiadminlogout) | Admin | Clear JWT cookie                 |

### Stats

| Method | Route                     | Auth  | Description                                  |
|--------|---------------------------|-------|----------------------------------------------|
| GET    | [`/api/admin/stats`](#get-apiadminstats)        | Admin | Full overview of all users, meetings, scores |
| GET    | [`/api/admin/stats/export`](#get-apiadminstatsexport) | Admin | Download stats as CSV                        |

### Users

| Method | Route                     | Auth  | Description                      |
|--------|---------------------------|-------|----------------------------------|
| POST   | [`/api/users`](#post-apiusers)              | —     | Create a new user                |
| GET    | [`/api/users`](#get-apiusers)              | Admin | List all users                   |
| GET    | [`/api/users/lookup/:rzId`](#get-apiuserslookuprzid) | —     | Look up user UUID by RZ ID       |
| GET    | [`/api/users/:id`](#get-apiusersid)          | —     | Get a user by UUID               |
| PATCH  | [`/api/users/:id`](#patch-apiusersid)          | Admin | Update a user                    |
| DELETE | [`/api/users/:id`](#delete-apiusersid)          | Admin | Delete a user                    |

### Meetings

| Method | Route                                     | Auth  | Description                                |
|--------|-------------------------------------------|-------|--------------------------------------------|
| POST   | [`/api/meetings`](#post-apimeetings)                           | Admin | Create a new meeting                       |
| GET    | [`/api/meetings`](#get-apimeetings)                           | Admin | List all meetings                          |
| GET    | [`/api/meetings/next`](#get-apimeetingsnext)                      | —     | Get next upcoming meeting + excuse deadline |
| GET    | [`/api/meetings/:id`](#get-apimeetingsid)                       | Admin | Get meeting info by UUID                   |
| PATCH  | [`/api/meetings/:id`](#patch-apimeetingsid)                       | Admin | Update a meeting                           |
| DELETE | [`/api/meetings/:id`](#delete-apimeetingsid)                       | Admin | Delete a meeting                           |
| GET    | [`/api/meetings/:id/attendance`](#get-apimeetingsidattendance)            | Admin | Get all attendance records for a meeting   |
| PATCH  | [`/api/meetings/:id/attendance/:userId`](#patch-apimeetingsidattendanceuserid)    | Admin | Override a user's attendance status        |
| GET    | [`/api/meetings/t/:token`](#get-apimeetingsttoken)                  | —     | Get meeting info by check-in token         |
| POST   | [`/api/meetings/t/:token/checkin`](#post-apimeetingsttokencheckin)          | —     | Check in to a meeting                      |
| POST   | [`/api/meetings/t/:token/excuse`](#post-apimeetingsttokenexcuse)           | —     | Submit an excuse before the deadline       |

---

## API Reference

### Auth

#### `POST /api/admin/login`

Request
```json
{
  "password": "secret"
}
```

200 — sets `admin_session` httpOnly cookie
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

200 — clears `admin_session` cookie
```json
{
  "message": "ok"
}
```

---

### Stats

#### `GET /api/admin/stats`

200
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "rzId": "lu451rei",
    "firstName": "Lukas",
    "lastName": "Reinke",
    "stats": {
      "totalMeetings": 10,
      "present": 7,
      "excused": 2,
      "absent": 1,
      "beerScore": 1
    },
    "meetings": [
      {
        "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
        "linkToken": "abc123",
        "date": "2026-04-10T18:00:00Z",
        "status": "present"
      }
    ]
  }
]
```

Meetings without a `user_meetings` row are included with `status: "absent"` so the full history is always present and `stats` counts always add up to `totalMeetings`.

---

#### `GET /api/admin/stats/export`

Returns a CSV file download. No JSON body.

```
Content-Type: text/csv
Content-Disposition: attachment; filename="kastenliste-oil-export.csv"
```

---

### Users

#### `POST /api/users`

Request
```json
{
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Reinke"
}
```

201 — created
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Reinke"
}
```

409 — RZ ID already exists
```json
{
  "message": "user already exists"
}
```

---

#### `GET /api/users`

200
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "rzId": "lu451rei",
    "firstName": "Lukas",
    "lastName": "Reinke"
  }
]
```

---

#### `GET /api/users/lookup/:rzId`

200 — returns the UUID for use in subsequent requests
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rzId": "lu451rei"
}
```

404
```json
{
  "message": "user not found"
}
```

---

#### `GET /api/users/:id`

200
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Reinke"
}
```

404
```json
{
  "message": "user not found"
}
```

---

#### `PATCH /api/users/:id`

Request — all fields optional
```json
{
  "firstName": "Lukas"
}
```

200
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Reinke"
}
```

404
```json
{
  "message": "user not found"
}
```

---

#### `DELETE /api/users/:id`

200
```json
{
  "message": "deleted"
}
```

404
```json
{
  "message": "user not found"
}
```

---

### Meetings

#### `POST /api/meetings`

Request
```json
{
  "date": "2026-04-10T18:00:00Z",
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "questionRequired": true,
  "checkAnswer": false,
  "maxRetries": 3,
  "excuseDeadlineMinutes": 60,
  "checkinDeadlineMinutes": 120
}
```

201 — created, answer included because request is admin-authenticated
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "questionRequired": true,
  "checkAnswer": false,
  "maxRetries": 3,
  "excuseDeadlineMinutes": 60,
  "checkinDeadlineMinutes": 120
}
```

---

#### `GET /api/meetings`

200
```json
[
  {
    "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
    "linkToken": "abc123",
    "date": "2026-04-10T18:00:00Z",
    "question": "What was the main topic?",
    "questionRequired": true,
    "checkAnswer": false,
    "maxRetries": 3,
    "excuseDeadlineMinutes": 60,
    "checkinDeadlineMinutes": 120,
    "answer": "deployment pipeline"
  }
]
```

---

#### `GET /api/meetings/next`

200
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadline": "2026-04-10T17:00:00Z",
  "checkinDeadline": "2026-04-10T20:00:00Z"
}
```

404
```json
{
  "message": "no upcoming meeting"
}
```

---

#### `GET /api/meetings/:id`

200
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "questionRequired": true,
  "checkAnswer": false,
  "maxRetries": 3,
  "excuseDeadlineMinutes": 60,
  "checkinDeadlineMinutes": 120
}
```

404
```json
{
  "message": "meeting not found"
}
```

---

#### `PATCH /api/meetings/:id`

Request — all fields optional
```json
{
  "question": "Updated question?",
  "checkAnswer": true
}
```

200 — answer included because request is admin-authenticated
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "question": "Updated question?",
  "answer": "deployment pipeline",
  "questionRequired": true,
  "checkAnswer": true,
  "maxRetries": 3,
  "excuseDeadlineMinutes": 60,
  "checkinDeadlineMinutes": 120
}
```

404
```json
{
  "message": "meeting not found"
}
```

---

#### `DELETE /api/meetings/:id`

200
```json
{
  "message": "deleted"
}
```

404
```json
{
  "message": "meeting not found"
}
```

---

#### `GET /api/meetings/:id/attendance`

200
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "attendance": [
    {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "rzId": "lu451rei",
      "firstName": "Lukas",
      "lastName": "Reinke",
      "status": "present",
      "attendanceType": "in_person",
      "checkedInAt": "2026-04-10T18:42:00Z",
      "answerCorrect": true,
      "excuseSubmittedAt": null
    },
    {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
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

404
```json
{
  "message": "meeting not found"
}
```

---

#### `PATCH /api/meetings/:id/attendance/:userId`

Request
```json
{
  "status": "excused"
}
```

200 — updated attendance record
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Reinke",
  "status": "excused",
  "attendanceType": null,
  "checkedInAt": null,
  "answerCorrect": null,
  "excuseSubmittedAt": null
}
```

404
```json
{
  "message": "meeting or user not found"
}
```

---

#### `GET /api/meetings/t/:token`

200
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "date": "2026-04-10T18:00:00Z",
  "hasQuestion": true,
  "questionRequired": true,
  "checkAnswer": false,
  "question": "What was the main topic?",
  "maxRetries": 3,
  "checkinDeadline": "2026-04-10T20:00:00Z"
}
```

404
```json
{
  "message": "meeting not found"
}
```

---

#### `POST /api/meetings/t/:token/checkin`

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

404 — user or meeting not found
```json
{
  "message": "user not found"
}
```

---

#### `POST /api/meetings/t/:token/excuse`

Request
```json
{
  "rzId": "lu451rei"
}
```

200
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