# Testing Guide

## Setup

### Backend
No installation required. Jest, ts-jest, `@nestjs/testing`, and supertest are already in `backend/package.json`.

Run tests with:
```bash
cd backend
npm test           # run all unit tests
npm run test:cov   # with coverage
npm run test:e2e   # e2e suite (requires test DB — see below)
```

### Frontend
No test tooling exists yet. Install:
```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add to `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./vitest.setup.ts'],
},
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom';
```

Add to `frontend/package.json` scripts:
```json
"test": "vitest",
"test:cov": "vitest --coverage"
```

### E2E / Integration (test database)
Create `compose.test.yml` with a separate Postgres container. Before running the e2e suite, run migrations against it and point the app at it via env vars (`DB_HOST`, `DB_PORT`, `DB_NAME`, etc.). The skeleton already exists at `backend/test/app.e2e-spec.ts`.

---

## Backend Unit Tests

Test files live next to their source files as `*.spec.ts`. All services use mocked repositories — no real DB connection needed.

---

### `src/user-meetings/compute-infractions.spec.ts`

**Function:** `computeInfractions(record, capInfractions)`

Pure function, no dependencies. Test every branch:

| Scenario | Expected |
|---|---|
| On time, live checked in | 0 |
| Late, no excuse | 1 |
| Late, `LATE` excuse | 0 |
| Live window open, not checked in yet | 0 |
| Live window closed, no check-in, no excuse | 1 |
| Live window closed, no check-in, `ABSENT` excuse | 0 |
| Post window closed, no live or post check-in | +1 (stacks) |
| Multiple rules fire, `capInfractions = true` | capped at 1 |
| Multiple rules fire, `capInfractions = false` | full count |

---

### `src/auth/auth.service.spec.ts`

**Function:** `AuthService.validatePassword(password)`

Mock `ConfigService.getOrThrow` to return a known password.

| Scenario | Expected |
|---|---|
| Correct password | `true` |
| Wrong password | `false` |

---

### `src/users/rz-id.spec.ts`

**Export:** `RZ_ID_REGEX`, `RZ_ID_EXCEPTIONS`

| Scenario | Expected |
|---|---|
| `'ab123cde'` | matches |
| `'terb'` (exception) | matches |
| Too short / wrong pattern | no match |
| Unlisted short string | no match |

---

### `src/users/users.service.spec.ts`

Mock: `Repository<User>`, `Repository<Meeting>`, `UserMeetingsService`

**`validateRzId(rzId)`**
- Valid pattern → `{ valid: true }`
- Invalid → `{ valid: false }`
- Exception value `'terb'` → `{ valid: true }`

**`create(dto)`**
- `repo.findOneBy` returns existing user → throws `ConflictException`
- `repo.findOneBy` returns null → calls `repo.save`, returns entity

**`findOne(id)`**
- `repo.findOneBy` returns null → throws `NotFoundException`
- Found → returns entity

**`findByRzId(rzId)`**
- Null → throws `NotFoundException`
- Found → returns only `{ id, rzId }` (other fields stripped)

**`update(id, dto)`**
- Propagates `NotFoundException` from `findOne`
- Calls `Object.assign` then `repo.save`

**`remove(id)`**
- Propagates `NotFoundException` from `findOne`
- Calls `repo.remove`

**`getUserStats(id)`**
- User not found → `NotFoundException`
- Delegates to `userMeetingsService.computeUserStats`
- Calls `userMeetingsService.saveAll` only when `toSave.length > 0`
- Response shape contains `id`, `rzId`, `firstName`, `lastName`, `totalInfractions`, `meetings[]`

---

### `src/meetings/meetings.service.spec.ts`

Mock: `Repository<Meeting>`

**`create(dto)`**
- `linkToken` is a 12-character hex string
- Calls `repo.save` with token included

**`findAll()`**
- Delegates to `repo.find({ order: { date: 'ASC' } })`

**`findNext()`**
- No result → `NotFoundException`
- Found → returns first meeting

**`findOne(id)`**
- Null → `NotFoundException`
- Found → returns entity

**`findByToken(token)`**
- Null → `NotFoundException`
- Found → returns entity

**`update(id, dto)`**
- Propagates `NotFoundException`; applies `Object.assign` then `save`

**`remove(id)`**
- Propagates `NotFoundException`; calls `repo.remove`

---

### `src/user-meetings/user-meetings.service.spec.ts`

Mock: `Repository<UserMeeting>`

**`init(userId, meetingId, defaults)`**
- Returns entity with `{ user: { id: userId }, meeting: { id: meetingId } }`
- Defaults are merged into the result

**`syncInfractions(record, meeting, userId)`**
- No record, post window not yet closed → returns `{ infractions: null, record: null }`, no `repo.save`
- No record, post window closed → calls `repo.save` with new absent record, returns `{ infractions, record }`
- Existing record → updates `record.infractions`, calls `repo.save`

**`computeUserStats(user, meetings, recordMap, now)`** — no DB calls, fully pure given inputs:
- Meeting window open, no record → `pending++`; entry has all-null fields
- Meeting window closed, no record → `absent++`; synthetic absent entry in `toSave`
- Live checked in → `totalCheckins++`
- Late without excuse → `late++`
- Late with `LATE` excuse → not counted in `late`
- No live check-in, no `ABSENT` excuse → `absent++`
- Stored infractions differ from recomputed → record added to `toSave`
- Stored infractions match → record not added to `toSave`
- `totalInfractions` accumulates across all meetings

---

### `src/meetings/token/token.service.spec.ts`

Mock: `MeetingsService`, `UsersService`, `UserMeetingsService`

**`liveCheckIn(token, dto)`**
- Meeting not found → `NotFoundException`
- User not found → `NotFoundException`
- `meeting.liveCheckinOpen = false` → `ForbiddenException`
- Record exists with `liveCheckedInAt` set → `ConflictException`
- No existing record → calls `init()`, sets `liveCheckedInAt`, calls `syncInfractions`
- Existing record without prior check-in → reuses record, sets `liveCheckedInAt`, calls `syncInfractions`

**`postCheckIn(token, dto)`**
- `now >= checkinDeadline` → `ForbiddenException`
- Already live-checked-in → `ConflictException`
- Already post-checked-in → `ConflictException`
- No question on meeting → accepted, `answerCorrect = null`
- Question exists, `checkAnswer = false` → accepted, `answerCorrect = true`
- Question exists, `checkAnswer = true`, blank answer → `BadRequestException`
- Correct answer → checked in, `answerCorrect = true`
- Wrong answer, attempts remaining → returns `{ answerCorrect: false, attemptsRemaining }`
- Wrong answer, `maxRetries` reached → `ForbiddenException` with `attemptsRemaining: 0`

**`submitExcuseForMeeting(meeting, dto)`**
- User not found → `NotFoundException`
- `now >= excuseDeadline` → `ForbiddenException`
- Already excused or already live-checked-in → `ConflictException`
- `ABSENT` excuse → saves `statusLastWeek`, `statusNextWeek`, `statusProblems`
- `LATE` excuse → status fields not written

**`submitExcuse(token, dto)`**
- Resolves meeting by token and delegates to `submitExcuseForMeeting`

---

### `src/meetings/attendance/attendance.service.spec.ts`

Mock: `MeetingsService`, `UsersService`, `UserMeetingsService`

**`getAttendance(meetingId)`**
- Meeting not found → `NotFoundException`
- User has a record, `syncInfractions` returns non-null → entry mapped via `toRecord`
- User has no record, `syncInfractions` returns `{ infractions: null }` → entry mapped via `pendingRecord`
- Returns meeting fields merged with `attendance[]`

**`patchAttendance(meetingId, userId, dto)`**
- Meeting or user not found → `NotFoundException`
- No existing record → `init()` called first
- Existing record → `Object.assign(record, dto)` applied
- Delegates `syncInfractions`, returns shaped `AttendanceRecord`

---

### `src/admin/stats/admin-stats.service.spec.ts`

Mock: `MeetingsService`, `UsersService`, `UserMeetingsService`

**`getStats()`**
- Builds `recordMap` (user → meeting → record) correctly
- Delegates per-user computation to `computeUserStats`
- Calls `saveAll` only when dirty records exist
- Test with 2 users × 2 meetings in different states (checked in, absent, pending)

**`getCsv()`**
- Header row: `rzId,firstName,lastName,...meetingDates,total_checkins,pending,late,excused_absent,infractions`
- Per-meeting columns contain infraction count or `'pending'`
- `excused_absent` counts only `ExcuseType.ABSENT`, not `LATE`
- Rows separated by `\n`

**`formatDate(meeting)`** (private — tested via CSV output)
- Returns `YYYY-MM-DD` string

> `getXlsx()` is not unit-tested due to ExcelJS complexity. Cover via e2e if needed.

---

## Frontend Unit Tests

Test files live next to their source as `*.test.tsx` / `*.test.ts`.

---

### `src/utils/date.test.ts`

> Pin timezone in test env to avoid locale-dependent failures: set `TZ=Europe/Berlin` in the vitest config or test script.

**`toUTC(date, time)`**
- `'2026-05-13', '13:15'` → ISO string representing that local moment

**`formatDateTime(d)`**
- Produces German short weekday, date in `DD.MM.YYYY`, time, and `' Uhr'` suffix

**`formatDateTimeLong(d)`**
- Produces full German weekday and long month name

**`formatDateShort(d)`**
- `2026-05-13T...` → `'13.05.'`

**`formatDateMedium(d)`**
- `2026-05-13T...` → `'13. Mai 2026'`

---

## E2E Tests

File: `backend/test/app.e2e-spec.ts` (skeleton already exists)

Requires a running test Postgres with migrations applied.

**Flows to cover:**

| Flow | Steps |
|---|---|
| Full live check-in | Create user + meeting → `POST /meetings/:token/checkin/live` → verify `user_meetings` row exists |
| Post check-in retry | Wrong answer N times → `attemptsRemaining` decrements → locked at `maxRetries` |
| Excuse before deadline | `POST /meetings/:token/excuse` before `excuseDeadlineMinutes` → `201` |
| Excuse after deadline | Same endpoint after deadline → `403` |
| Admin stats accuracy | Check in 1 of 2 users → `GET /admin/stats` → correct per-user infraction counts |
