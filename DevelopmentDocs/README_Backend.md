# Kastenliste OIL — Backend Documentation

## Tech Stack

| Layer      | Technology                                                |
|------------|-----------------------------------------------------------|
| Framework  | NestJS + TypeScript                                       |
| Database   | PostgreSQL via TypeORM                                    |
| Auth       | JWT signed with env var secret, stored in httpOnly cookie |
| Validation | class-validator + class-transformer                       |
| Static     | @nestjs/serve-static — serves `frontend/dist`             |

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

## Attendance State Machine

Each user has one `user_meeting` record per meeting. The record is created lazily — on live check-in, post check-in, excuse submission, or on the first read after `checkinDeadline` passes.

### Fields

| Field              | Type      | Description                                                   |
|--------------------|-----------|---------------------------------------------------------------|
| `excusedAt`        | timestamp | When excuse was submitted; null if none                       |
| `excuseType`       | enum      | `late` = excusing for being late, `absent` = excusing absence |
| `liveCheckedInAt`  | timestamp | When user checked in during the meeting; null if not          |
| `postCheckedInAt`  | timestamp | When user did the post-meeting check-in; null if not          |
| `isLate`           | boolean   | Set manually by admin                                         |
| `attendanceType`   | string    | `in_person` or `remote`; set at live check-in                 |
| `answerCorrect`    | boolean   | null if no question or no post check-in                       |
| `answerAttempts`   | int       | Tracks wrong answer attempts; default 0                       |
| `infractions`      | int       | Cached count 0–3; recomputed on every state change            |

### Infraction Logic

Up to three infractions per meeting, optionally capped at 1 via `meeting.capInfractions`.

| Condition                                              | +1 Infraction       |
|--------------------------------------------------------|---------------------|
| `isLate` and `excuseType != 'late'`                    | late without excuse  |
| no `liveCheckedInAt` and `excuseType != 'absent'`      | absent without excuse |
| no `postCheckedInAt` and `excuseType != 'absent'`      | not checked in post  |

### Lazy Resolution

On every read of attendance data, users with no record are resolved:
- Before `checkinDeadline` → returned as `infractions: null` (pending, no DB write)
- After `checkinDeadline` → record written with computed infractions

`infractions` is recomputed and cached whenever state changes (live check-in, post check-in, excuse submission, admin override).

### Live Check-in Window

`meeting.liveCheckinOpen` is resolved lazily on read: if `now > meeting.date + checkinWindowMinutes`, the window is treated as closed regardless of the stored value. Admin can open/close manually via `PATCH /api/meetings/:id`.

---

## API Overview

Routes marked **Admin** require a valid JWT in the `admin_session` httpOnly cookie.

### Auth

| Method | Route                                       | Auth  | Description                     |
|--------|---------------------------------------------|-------|---------------------------------|
| POST   | [`/api/admin/login`](#post-apiadminlogin)   | —     | Verify password, set JWT cookie |
| POST   | [`/api/admin/logout`](#post-apiadminlogout) | Admin | Clear JWT cookie                |

### Stats

| Method | Route                                                 | Auth  | Description                                  |
|--------|-------------------------------------------------------|-------|----------------------------------------------|
| GET    | [`/api/admin/stats`](#get-apiadminstats)              | Admin | Full overview of all users, meetings, scores |
| GET    | [`/api/admin/stats/export`](#get-apiadminstatsexport) | Admin | Download stats as CSV                        |

### Users

| Method | Route                                                | Auth  | Description                      |
|--------|------------------------------------------------------|-------|----------------------------------|
| POST   | [`/api/users`](#post-apiusers)                       | —     | Create a new user                |
| GET    | [`/api/users`](#get-apiusers)                        | Admin | List all users                   |
| GET    | [`/api/users/lookup/:rzId`](#get-apiuserslookuprzid) | —     | Look up user UUID by RZ ID       |
| GET    | [`/api/users/:id`](#get-apiusersid)                  | —     | Get a user by UUID               |
| GET    | [`/api/users/:id/stats`](#get-apiusersidstats)       | —     | Get meeting stats for a user     |
| PATCH  | [`/api/users/:id`](#patch-apiusersid)                | Admin | Update a user                    |
| DELETE | [`/api/users/:id`](#delete-apiusersid)               | Admin | Delete a user                    |

### Meetings

| Method | Route                                                                               | Auth  | Description                                      |
|--------|-------------------------------------------------------------------------------------|-------|--------------------------------------------------|
| POST   | [`/api/meetings`](#post-apimeetings)                                                | Admin | Create a new meeting                             |
| GET    | [`/api/meetings`](#get-apimeetings)                                                 | Admin | List all meetings                                |
| GET    | [`/api/meetings/next`](#get-apimeetingsnext)                                        | —     | Get next upcoming meeting                        |
| GET    | [`/api/meetings/:id`](#get-apimeetingsid)                                           | Admin | Get meeting by UUID                              |
| PATCH  | [`/api/meetings/:id`](#patch-apimeetingsid)                                         | Admin | Update a meeting (incl. `liveCheckinOpen`)       |
| DELETE | [`/api/meetings/:id`](#delete-apimeetingsid)                                        | Admin | Delete a meeting                                 |
| GET    | [`/api/meetings/:id/attendance`](#get-apimeetingsidattendance)                      | Admin | Get attendance for all users                     |
| PATCH  | [`/api/meetings/:id/attendance/:userId`](#patch-apimeetingsidattendanceuserid)      | Admin | Override any check-in detail for a user          |
| GET    | [`/api/meetings/t/:token`](#get-apimeetingsttoken)                                  | —     | Get meeting info by check-in token               |
| POST   | [`/api/meetings/t/:token/live-checkin`](#post-apimeetingsttokenlivecheckin)         | —     | Check in during the meeting                      |
| POST   | [`/api/meetings/t/:token/post-checkin`](#post-apimeetingsttokenpostcheckin)         | —     | Post-meeting check-in before closing deadline    |
| POST   | [`/api/meetings/t/:token/excuse`](#post-apimeetingsttokenexcuse)                   | —     | Submit an excuse before the deadline             |

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
      "totalCheckins": 8,
      "pending": 1,
      "late": 1,
      "absent": 0,
      "infractions": 2
    },
    "meetings": [
      {
        "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
        "date": "2026-04-10T18:00:00Z",
        "infractions": 0
      }
    ]
  }
]
```

Users with no `user_meeting` record are resolved at read time — `infractions: null` (pending) before `checkinDeadline`, record written with computed infractions after.

---

#### `GET /api/admin/stats/export`

Query parameters

| Param | Values | Required | Default |
|---|---|---|---|
| `format` | `csv` \| `xlsx` | no | `csv` |
| `critical_missing` | integer | no | — |

`critical_missing` applies only to `xlsx`. Colors the `infractions` cell per user: yellow if `infractions === critical_missing - 1`, red if `infractions >= critical_missing`. Individual meeting cells are also colored: red for `absent`, yellow for `late`.

CSV response
```
Content-Type: text/csv
Content-Disposition: attachment; filename="kastenliste-oil-export-07-04-2026.csv"
```

XLSX response
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="kastenliste-oil-export-07-04-2026.xlsx"
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

#### `GET /api/users/:id/stats`

200
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Reinke",
  "totalInfractions": 2,
  "meetings": [
    {
      "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
      "date": "2026-04-03T18:00:00Z",
      "excuseType": null,
      "liveCheckedIn": true,
      "postCheckedIn": true,
      "isLate": false,
      "answerCorrect": true,
      "infractions": 0
    },
    {
      "id": "...",
      "date": "2026-04-10T18:00:00Z",
      "excuseType": "absent",
      "liveCheckedIn": false,
      "postCheckedIn": false,
      "isLate": null,
      "answerCorrect": null,
      "infractions": 0
    },
    {
      "id": "...",
      "date": "2026-04-17T18:00:00Z",
      "excuseType": null,
      "liveCheckedIn": false,
      "postCheckedIn": false,
      "isLate": null,
      "answerCorrect": null,
      "infractions": null
    }
  ]
}
```

`infractions: null` means the meeting deadline has not passed yet (pending). `totalInfractions` only sums resolved meetings.

404
```json
{
  "message": "user not found"
}
```

---

### Meetings

#### `POST /api/meetings`

Request — `date`, `excuseDeadlineMinutes`, `checkinDeadline` are required; all other fields are optional
```json
{
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadlineMinutes": 60,
  "checkinDeadline": "2026-04-10T20:00:00Z",
  "checkinWindowMinutes": 60,
  "capInfractions": false,
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "checkAnswer": true,
  "maxRetries": 3
}
```

201 — created, answer included because request is admin-authenticated
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadlineMinutes": 60,
  "checkinDeadline": "2026-04-10T20:00:00Z",
  "checkinWindowMinutes": 60,
  "liveCheckinOpen": false,
  "capInfractions": false,
  "question": null,
  "answer": null,
  "checkAnswer": true,
  "maxRetries": 3
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
    "excuseDeadlineMinutes": 60,
    "checkinDeadline": "2026-04-10T20:00:00Z",
    "question": "What was the main topic?",
    "answer": "deployment pipeline",
    "checkAnswer": false,
    "maxRetries": 3
  }
]
```

---

#### `GET /api/meetings/next`

200 — full meeting object; TODO: strip `answer` on non-admin routes once auth is implemented
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadlineMinutes": 60,
  "checkinDeadline": "2026-04-10T20:00:00Z",
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "checkAnswer": false,
  "maxRetries": 3
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
  "excuseDeadlineMinutes": 60,
  "checkinDeadline": "2026-04-10T20:00:00Z",
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "checkAnswer": false,
  "maxRetries": 3
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
  "excuseDeadlineMinutes": 60,
  "checkinDeadline": "2026-04-10T20:00:00Z",
  "question": "Updated question?",
  "answer": "deployment pipeline",
  "checkAnswer": true,
  "maxRetries": 3
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

200 — full meeting object plus resolved attendance for all users
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadlineMinutes": 60,
  "checkinDeadline": "2026-04-10T20:00:00Z",
  "checkinWindowMinutes": 60,
  "liveCheckinOpen": false,
  "capInfractions": false,
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "checkAnswer": true,
  "maxRetries": 3,
  "attendance": [
    {
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "rzId": "lu451rei",
      "firstName": "Lukas",
      "lastName": "Reinke",
      "excusedAt": null,
      "excuseType": null,
      "liveCheckedInAt": "2026-04-10T18:10:00Z",
      "postCheckedInAt": "2026-04-10T19:05:00Z",
      "isLate": false,
      "attendanceType": "in_person",
      "answerCorrect": true,
      "infractions": 0
    },
    {
      "userId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "rzId": "ma123mue",
      "firstName": "Max",
      "lastName": "Mue",
      "excusedAt": "2026-04-10T16:45:00Z",
      "excuseType": "absent",
      "liveCheckedInAt": null,
      "postCheckedInAt": null,
      "isLate": null,
      "attendanceType": null,
      "answerCorrect": null,
      "infractions": 0
    },
    {
      "userId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "rzId": "to789mue",
      "firstName": "Tom",
      "lastName": "Mue",
      "excusedAt": null,
      "excuseType": null,
      "liveCheckedInAt": null,
      "postCheckedInAt": null,
      "isLate": null,
      "attendanceType": null,
      "answerCorrect": null,
      "infractions": null
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

Admin override of any check-in detail — all fields optional; `infractions` is recomputed after update.

Request
```json
{
  "liveCheckedInAt": "2026-04-10T18:15:00Z",
  "postCheckedInAt": "2026-04-10T19:05:00Z",
  "isLate": true,
  "attendanceType": "in_person",
  "answerCorrect": true,
  "excusedAt": null,
  "excuseType": null
}
```

200 — updated attendance record
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "rzId": "lu451rei",
  "firstName": "Lukas",
  "lastName": "Reinke",
  "excusedAt": null,
  "excuseType": null,
  "liveCheckedInAt": "2026-04-10T18:15:00Z",
  "postCheckedInAt": "2026-04-10T19:05:00Z",
  "isLate": true,
  "attendanceType": "in_person",
  "answerCorrect": true,
  "infractions": 1
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

200 — full meeting object; TODO: strip `answer` on non-admin routes once auth is implemented
```json
{
  "id": "f7e6d5c4-b3a2-1098-fedc-ba9876543210",
  "linkToken": "abc123",
  "date": "2026-04-10T18:00:00Z",
  "excuseDeadlineMinutes": 60,
  "checkinDeadline": "2026-04-10T20:00:00Z",
  "checkinWindowMinutes": 60,
  "liveCheckinOpen": true,
  "capInfractions": false,
  "question": "What was the main topic?",
  "answer": "deployment pipeline",
  "checkAnswer": true,
  "maxRetries": 3
}
```

404
```json
{
  "message": "meeting not found"
}
```

---

#### `POST /api/meetings/t/:token/live-checkin`

Only accepted while `liveCheckinOpen` is true and `now < date + checkinWindowMinutes`.

Request
```json
{
  "rzId": "lu451rei",
  "attendanceType": "in_person"
}
```

200
```json
{
  "message": "checked in"
}
```

403 — live check-in window not open
```json
{
  "message": "live check-in is not open"
}
```

409 — already checked in live
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

#### `POST /api/meetings/t/:token/post-checkin`

Only accepted after `meeting.date` and before `checkinDeadline`. Not accepted if user already did a live check-in.

Request
```json
{
  "rzId": "lu451rei",
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

403 — post check-in deadline passed
```json
{
  "message": "check-in deadline passed"
}
```

409 — already did post check-in
```json
{
  "message": "already checked in"
}
```

409 — already did live check-in, post check-in not required
```json
{
  "message": "already checked in live"
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

Request — `excuseType: "late"` means excusing for being late, `"absent"` means excusing absence
```json
{
  "rzId": "lu451rei",
  "excuseType": "absent"
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

---

## Folder Structure

Domain-separated following NestJS conventions. Each domain owns its controller, service, entity, and DTOs. Shared infrastructure (guards, decorators) lives in `common/`.

```
backend/
├── src/
│   ├── common/
│   │   ├── guards/
│   │   │   └── admin-auth.guard.ts     ← JWT cookie guard, applied per-route via decorator
│   │   └── decorators/
│   │       └── admin.decorator.ts      ← @Admin() shorthand for @UseGuards(AdminAuthGuard)
│   │
│   ├── meetings/
│   │   ├── meetings.module.ts          ← registers all meetings controllers and services
│   │   ├── meetings.controller.ts      ← CRUD routes /api/meetings/*
│   │   ├── meetings.service.ts
│   │   ├── meeting.entity.ts
│   │   ├── dto/
│   │   │   ├── create-meeting.dto.ts
│   │   │   └── update-meeting.dto.ts
│   │   ├── attendance/
│   │   │   ├── attendance.controller.ts  ← GET/PATCH /api/meetings/:id/attendance/*
│   │   │   ├── attendance.service.ts
│   │   │   └── dto/
│   │   │       └── update-attendance.dto.ts
│   │   └── token/
│   │       ├── token.controller.ts       ← GET /api/meetings/t/:token, POST checkin, POST excuse
│   │       └── token.service.ts
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts         ← all /api/users/* routes
│   │   ├── users.service.ts
│   │   ├── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── user-meetings/
│   │   └── user-meeting.entity.ts      ← junction table entity, no controller
│   │
│   ├── admin/
│   │   ├── admin.module.ts             ← imports UsersModule and MeetingsModule
│   │   ├── auth/
│   │   │   ├── admin-auth.controller.ts  ← POST /api/admin/login, /logout
│   │   │   ├── admin-auth.service.ts     ← bcrypt compare, JWT sign
│   │   │   └── dto/
│   │   │       └── login.dto.ts
│   │   └── stats/
│   │       ├── admin-stats.controller.ts ← GET /api/admin/stats, /export
│   │       └── admin-stats.service.ts    ← queries across users + meetings
│   │
│   ├── app.module.ts                   ← registers all modules, TypeORM, ServeStatic, Config
│   └── main.ts                         ← bootstrap, global prefix /api, cookie-parser
│
├── frontend/                           ← Vite build output served from here
│   └── dist/
│
├── .env
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### Module dependency graph

```
AppModule
├── MeetingsModule
│   ├── AttendanceService  ← shared lazy resolver, used by attendance and token controllers
│   └── imports: UsersModule (for User repository)
├── UsersModule
└── AdminModule
    ├── imports: MeetingsModule
    └── imports: UsersModule
```

`AdminModule` does not own any entities — it queries through the services exported by `MeetingsModule` and `UsersModule`. The `AdminAuthGuard` from `common/` is registered globally in `AppModule` and applied with `@Admin()` on protected controller methods.
