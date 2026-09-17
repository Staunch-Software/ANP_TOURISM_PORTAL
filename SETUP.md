# ANIIDCO Tourism Portal — Setup Guide

This project needs three things running: **PostgreSQL**, **Redis**, the **backend** (FastAPI), and the **frontend** (React/Vite).

Pick **Option A (Docker)** unless you have a specific reason not to — it's the fastest and avoids Windows/WSL networking issues.

---

## 0. Clone the repo

```bash
git clone https://github.com/Staunch-Software/ANP_TOURISM_PORTAL.git
cd ANP_TOURISM_PORTAL
```

---

## Option A: Docker (Recommended)

**Prerequisite:** install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and make sure it's running.

1. Start Postgres + Redis with one command, from the repo root:

   ```bash
   docker compose up -d
   ```

   This starts Postgres on `localhost:5432` (user `postgres`, password `postgres`, database `aniidco_portal`) and Redis on `localhost:6379`. No installation, no WSL, no manual service setup.

2. Set up the backend `.env`:

   ```bash
   cd backend
   cp .env.example .env
   ```

   Open `.env` and set:
   ```
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/aniidco_portal
   REDIS_URL=redis://localhost:6379/0
   SECRET_KEY=<any random string>
   ED25519_PRIVATE_KEY_HEX=<generate with the command below>
   ```

   Generate the Ed25519 key:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

3. Continue from **Step 2 (Backend)** below.

To stop the services later: `docker compose down` (add `-v` to also wipe the database).

---

## Option B: Native install (no Docker)

If you can't use Docker:

- **PostgreSQL**: install from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) — runs as a Windows service automatically.
- **Redis**: install **[Memurai](https://www.memurai.com/get-memurai)** (Developer Edition, pick **LTS** not RC) — a native Windows, Redis-compatible service. Runs automatically on `127.0.0.1:6379`.
  - *(We tried WSL2 + Redis first — it has an unreliable localhost-forwarding bug that causes random connection failures. Memurai avoids that entirely. Don't use WSL for Redis on this project.)*

Then set up `backend/.env` same as Option A, but with your own Postgres password instead of `postgres`.

---

## 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Seed the database with real Andaman attractions and ferry schedules
python seed_catalog.py
python seed_ferries.py

uvicorn app.main:app --reload --port 8000
```

Check it's working: open `http://localhost:8000/docs` — you should see the Swagger API docs.

> **Re-run the seed scripts** whenever the 5-day booking window has expired (they're idempotent — safe to run repeatedly, they only add what's missing).

---

## 3. Frontend (React + Vite)

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## 4. Log in

- Phone: any 10-digit number
- OTP: `123456` (hardcoded for demo/dev — no real SMS is sent)
- To get **Admin** access, promote a user manually after their first login:

  ```bash
  # Docker:
  docker exec -it aniidco_postgres psql -U postgres -d aniidco_portal -c "UPDATE users SET user_type='ADMIN' WHERE phone_number='<their number>';"

  # Native Postgres:
  psql -U postgres -d aniidco_portal -c "UPDATE users SET user_type='ADMIN' WHERE phone_number='<their number>';"
  ```

---

## Troubleshooting

- **"Authentication failed" on login / random 500 errors**: Redis isn't reachable. Docker: `docker compose ps` to check it's running. Native: check the Memurai service is running in `services.msc`.
- **Empty attraction/ferry lists**: the 5-day seed window has expired — re-run `python seed_catalog.py` and `python seed_ferries.py`.
- **Port 8000 or 5173 already in use**: something else is already running there — stop it or use a different `--port`.
