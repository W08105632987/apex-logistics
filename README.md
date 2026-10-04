# Apex Global Logistics: full-stack edition

React front end (unchanged design) + a dependency-free Node backend with a real SQLite database.

## What's in the box
| Area | Details |
|---|---|
| Database | SQLite (WAL mode) via Node's built-in `node:sqlite`. Versioned migrations, foreign keys, indexes. Tables: users, sessions, shipments, checkpoints, subscribers, emails, quote_requests, contact_messages, audit_log |
| Auth | scrypt password hashes, httpOnly SameSite cookie sessions (stored hashed), 5-strike account lockout, forced password change for admin-created accounts, roles: admin / staff / customs |
| Public API | tracking lookup (contact details masked), email subscribe, server-side rate calculator, booking requests, contact form, all validated and rate-limited |
| Staff API | shipments CRUD, status advance, checkpoints, email log, customer inbox, user management, audit log |
| Email | Outbox table + Resend delivery with automatic retry. Without an API key emails are logged only, and the UI says so |
| Ops | `/api/health`, scheduled DB backups, graceful shutdown, CLI (`create-user`, `reset-password`, `backup`...), Dockerfile, integration tests |
| New pages | Contact, Conditions of Carriage, Privacy Policy, Security Compliance, booking-request dialog, staff Customer Inbox, change-password |

## Requirements
Node **22.5 or newer** (22 LTS recommended). Nothing else: no external database server.

## Run locally
```bash
npm install
cp .env.example .env        # for local dev you can leave most blank
npm run dev                 # API on :3000, web on :5173
```
In development with no `ADMIN_PASSWORD` set, the first start prints a one-time random `admin` password in the console.
Add `SEED_DEMO_DATA=true` to load the 4 original sample shipments.

## Deploy (any host that runs Node or Docker)
1. Set env vars from `.env.example` (at minimum `NODE_ENV=production`, `APP_URL=https://...`, `TRUST_PROXY=true`, `ADMIN_USERNAME/PASSWORD/EMAIL`, `RESEND_API_KEY`, `EMAIL_FROM`).
2. **Mount a persistent volume** and point `DATABASE_PATH` at it (Docker image uses `/data`). Without this the database is lost on every redeploy.
3. `npm install && npm run build && npm start`  (or `docker build -t apex . && docker run -p 3000:3000 -v apex-data:/data --env-file .env apex`).
4. Put HTTPS in front (Render/Railway/Fly do this automatically; otherwise Caddy or nginx).
5. After first boot, delete `ADMIN_PASSWORD` from the environment. Create further staff in the portal or via `npm run create-user`.
6. Email: verify your sending domain at resend.com and use that address in `EMAIL_FROM`.

Backups are written to `BACKUP_DIR` every `BACKUP_EVERY_HOURS` (default 24h, last 14 kept). **Copy them off the server** (object storage / another host) for real disaster recovery.

## Test
`npm test` boots the server against a temp database and runs 10 integration tests (auth, roles, lockout, CSRF, masking, validation, email escaping, audit).

## Limits you should know about
- SQLite + in-process rate limiter = **one app instance**. That comfortably serves thousands of daily users, but if you need multiple servers, move to Postgres and Redis.
- Legal pages are starter text; have a lawyer review them.
- Quote prices are the original demo formula, now computed server-side. Replace with your real tariff in `calculateQuotes` (`server/domain.mjs`).
- There is no payment processing or customer login; customers track by tracking number, and book through staff-handled requests.
