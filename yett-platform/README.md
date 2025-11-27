opportunities, mentorship requests, and matches. The server requires
# YETT Platform

A compact full-stack learning and mentorship web application.

## Overview

YETT provides learners with curated digital-literacy modules, quizzes, progress tracking, and mentor connections. The stack is:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL

This README shows how to run the project locally, how to seed Postgres, and important deployment notes.

## Project layout

yett-platform/

- `backend/` — Node.js API and migration scripts
- `frontend/` — React app (Vite)
- `scripts/` — helper scripts (smoke tests, etc.)

## Prerequisites

- Node.js 16+ (or compatible)
- npm
- Docker (only required if you want a local Postgres container)

## Quick local setup

### Backend (API)

1. Open a terminal, go to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set required environment variables (example `.env`):

```env
# example values for local development
PORT=5000
DATABASE_URL=postgresql://postgres:pass@127.0.0.1:5432/yett
JWT_SECRET=jwt-secret-goes-here
# For local Postgres container set PGSSLMODE=disable
```

4. Start the backend:

```bash
node server.js
# or with nodemon for dev: npx nodemon server.js
```

The API serves under `/api` (eg. `http://localhost:5000/api`).

### Frontend (Vite)

1. Open another terminal and go to the frontend folder:

```bash
cd frontend
```

2. Install dependencies and run dev server:

```bash
npm install
npm run dev
```

3. Example env for local dev (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

Note: Vite reads `VITE_` prefixed variables at build time. For a deployed frontend, set `VITE_API_URL` in the hosting environment and rebuild.

## Database (Postgres)

The project uses PostgreSQL for persistence. A legacy `data.json` seed file is retained for migrations, but the app no longer reads from that file at runtime.

Run a local Postgres container (optional):

```bash
docker run -d --name yett-postgres \
	-e POSTGRES_PASSWORD=pass \
	-e POSTGRES_DB=yett \
	-p 5432:5432 \
	postgres:15
```

Seed and migrate the database (from project root):

```bash
export DATABASE_URL="postgresql://postgres:pass@127.0.0.1:5432/yett"
cd backend
npm install
npm run migrate:pg
```

Notes about hosted Postgres (Render, etc.):

- Hosted providers typically require SSL. Use `?sslmode=require` on the connection string and set `PGSSLMODE=require` before running the migration or starting the server.
- Example (hosted):

```bash
export DATABASE_URL="postgresql://user:password@host:5432/yett?sslmode=require"
export PGSSLMODE=require
npm run migrate:pg
```

## Seeding and temporary scripts

- `backend/migrate_to_postgres.js` reads `backend/data.json` and inserts/updates rows. It is unaltered for most resources, but module field updates were occasionally run via small utility scripts (e.g. `update_modules.js`)

## Environment variables reference

- Backend
	- `DATABASE_URL` — full Postgres connection string (required)
	- `JWT_SECRET` — secret for signing JWT tokens (required)
	- `PORT` — optional server port (default: 5000)

- Frontend
	- `VITE_API_URL` — base API URL (example: `https://your-backend-host.com/api`)

## Security notes

- Passwords are hashed with `bcrypt` and JWTs are used for sessions.
- The seeded admin account is for development/testing only — rotate or remove it before production use.
- For production, enable HTTPS, rate limiting, email verification, and monitoring.

## Troubleshooting

- If the backend won't start, verify `DATABASE_URL` and required env vars.
- If you see SSL/TLS errors when connecting to Postgres, set `PGSSLMODE=require` for hosted DBs, and `PGSSLMODE=disable` for local containers.
- If the frontend fails to connect, check `VITE_API_URL` and that the backend exposes CORS for the frontend origin.

## Deployment notes

- Backend: hosted on a platform that support Node (Render). Ensured that `DATABASE_URL` and `JWT_SECRET` are configured in the host.
- Frontend: the built frontend is static files hosted via Render. Made sure `VITE_API_URL` points to my backend and rebuild the frontend when that value changes.

## Cleaning up

- Rotate or remove the seeded admin password in any remote DB.
- Confirm `backend/data.json` only contains intended seed data (no secrets).