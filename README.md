## Concept

Track attendance for recurring meetings. Members check in via a unique meeting link after the meeting, optionally answer a question, or submit an excuse beforehand. Missed meetings without excuse accumulate as beer debt. Admin gets full oversight and CSV export.

---

## Stack

- **Backend:** NestJS + TypeScript
- **Frontend:** React + Vite + TypeScript
- **Database:** PostgreSQL via TypeORM
- **Auth:** Hardcoded admin password via env var, hashed in memory, signed cookie
- **Deployment:** Single Docker container — NestJS serves frontend static files from `frontend/dist`
- **Structure:** Monorepo with `frontend/` and `backend/` under one root

---

## Project Structure

```
project/
├── frontend/              ← Vite + React + TS
├── backend/               ← NestJS + TS
├── package.json           ← root scripts only
└── docker-compose.yml
```