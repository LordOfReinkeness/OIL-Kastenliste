# Plan: Dense Admin Overview Table with Rich Per-Cell State

## Context
The current admin overview table shows only a single StatusBadge (✓/!/✗/—) per meeting × user cell. This hides important detail — whether the user had a live check-in, post check-in, was late, had an excuse, etc. The goal is a dense, information-rich table where each cell shows multiple state badges at a glance, and the per-user summary columns are cleaned up. The edit popup stays, but needs to expose all editable fields of a UserMeeting record.

---

## Step 1 — Backend: Extend `getStats()` response

**File:** `backend/src/admin/stats/admin-stats.service.ts`

Change the per-meeting entry shape from:
```ts
{ id, date, infractions }
```
to:
```ts
{
  id: meeting.id,
  date: meeting.date,
  liveCheckedIn: boolean | null,
  postCheckedIn: boolean | null,
  isLate: boolean | null,
  excuseType: 'late' | 'absent' | null,
  infractions: number | null,
}
```

- For **existing records**: map all fields from the `UserMeeting` entity
- For **auto-created absent records** (past deadline, no record): all null except `infractions`
- For **pending records** (future): all null

---

## Step 2 — Frontend: Update `MeetingStat` interface

**File:** `frontend/src/pages/admin/Overview.tsx`

Replace the current `MeetingStat` interface with:
```ts
interface MeetingStat {
  id: string;
  date: string;
  liveCheckedIn: boolean | null;
  postCheckedIn: boolean | null;
  isLate: boolean | null;
  excuseType: 'late' | 'absent' | null;
  infractions: number | null;
}
```

Also pass the full `MeetingStat` object (not just the id) to the edit popup so the popup knows current state.

---

## Step 3 — Frontend: Create `MeetingCell` component

**New file:** `frontend/src/components/ui/MeetingCell.tsx` + `MeetingCell.module.css`

Dense cell layout (badges row + infraction pill):

```
[Badge 1?] [Badge 2?] [Badge 3?]
           [pill]
```

**Badge 1 — Excuse / Late** (omitted entirely if no excuse and not late):
| State | Content | Color |
|---|---|---|
| `excuseType === 'absent'` | `E: absent` | Teal |
| `excuseType === 'late'` | `E: verspätet` | Light blue |
| `isLate && !excuseType` | `! verspätet` | Red/dark |
| none | *(hidden)* | — |

**Badge 2 — Live check-in** (hidden if `excuseType === 'absent'`):
| State | Content | Color |
|---|---|---|
| `liveCheckedIn === true` | `L ✓` | Green |
| `liveCheckedIn === false` | `L ✗` | Black |
| `liveCheckedIn === null` | `L —` | Muted |

**Badge 3 — Post check-in** (only shown if `liveCheckedIn !== true`):
| State | Content | Color |
|---|---|---|
| `postCheckedIn === true` | `P ✓` | Green |
| `postCheckedIn === false` | `P ✗` | Black |
| `postCheckedIn === null` | `P —` | Muted |

**Infraction pill** (always shown):
- `n > 0` → red background
- `0` → green background
- `null` (pending) → muted, shows `—`

---

## Step 4 — Frontend: Redesign `EditAttendancePopup`

**File:** `frontend/src/components/popup/EditAttendancePopup.tsx` + `.module.css`

The popup receives the current `MeetingStat` as a prop (so it can show existing state). Add a new prop `current: MeetingStat`.

Controls to expose (all map to `UpdateAttendanceDto` fields):
- **Live check-in**: 3-way toggle — Pending / Present / Absent (`liveCheckedInAt`: timestamp / null)
- **Attendance type**: In person / Remote — shown only when live check-in = Present (`attendanceType`)
- **Late**: toggle — No / Yes (`isLate`)
- **Excuse**: None / Late excuse / Absent excuse (`excuseType` + `excusedAt`)
- **Post check-in**: toggle — No / Yes (`postCheckedInAt`: timestamp / null)
- **Answer**: Not attempted / Correct / Wrong (`answerCorrect`)
- **Infractions** (read-only): computed, shown for reference

Use segmented button groups (matching the ExcusePopup.tsx pattern).
On save: PATCH via `AttendanceService.attendanceControllerPatchAttendance(meetingId, userId, dto)`.

---

## Step 5 — Frontend: Update summary columns in Overview.tsx

Remove: **Meetings** (same value for all users — redundant)

Keep / add:
| Column | Source |
|---|---|
| Abwesend | `stats.absent` |
| Verspätet | `stats.late` |
| Entschuldigt | derive from meetings array: count where `excuseType === 'absent'` |
| **Kasten** | `stats.infractions` — bold, highlighted |

---

## Verification
1. Start backend + frontend dev servers
2. Open admin overview — cells should show `[L] [P] [!] [E]` badges + infraction pill
3. Cells with `infractions > 0` should show red pill
4. Click a cell → popup opens pre-filled with current state
5. Toggle a field, save → table refreshes, cell reflects new state
6. Curl `/api/admin/stats` → confirm new fields (`liveCheckedIn`, `postCheckedIn`, etc.) are present in response
