# ANIIDCO Tourism Portal — Backend (Step 1)

Foundation, database models, and RFP 7.1.12 single-active-session auth.

## Local setup (no Docker)

1. **PostgreSQL** — install from https://www.postgresql.org/download/windows/ (runs as a
   Windows service on port 5432 by default). Create the database:
   ```
   createdb -U postgres aniidco_portal
   ```

2. **Redis** — pick one:
   - **Memurai** (recommended for Windows): https://www.memurai.com/ — installs as a native
     Windows service, Redis-compatible, free dev edition, listens on port 6379.
   - **WSL2**: `wsl --install`, then inside the Linux shell:
     ```
     sudo apt update && sudo apt install redis-server
     sudo service redis-server start
     ```

3. **Python env**
   ```
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Adjust `.env` if your Postgres/Redis credentials differ from the defaults.

5. **Run**
   ```
   uvicorn app.main:app --reload
   ```
   Then open http://localhost:8000/docs.

Tables are auto-created on startup via SQLAlchemy metadata (no Alembic migration yet —
that comes later once the schema stabilizes).

## Test auth flow

`POST /api/v1/auth/verify-otp` with `{"phone_number": "9999999999", "otp": "123456"}`
(OTP is hardcoded to `123456` for this step; a real SMS provider is not wired up yet).
