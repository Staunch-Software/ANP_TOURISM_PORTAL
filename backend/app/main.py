from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, sync_missing_columns
from app.services.availability_service import ensure_rolling_availability
from app.api.v1 import auth, attractions, ferry, cart, payments, tickets, admin, sync, operator, gates, vendor, group_bookings, agent, grievances

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Creates missing TABLES only -- an existing table that's missing a
        # column a newer model added (e.g. a teammate's older local DB)
        # needs its own step, since create_all() never alters a table that
        # already exists.
        await conn.run_sync(sync_missing_columns)
    print("Database tables verified & initialized.")

    # Attraction slots / ferry sailings were previously seeded for a fixed
    # N-day window from whenever seed_catalog.py/seed_ferries.py were last
    # run by hand -- once "today" moved past that window, bookings and
    # reschedules silently ran out of availability. This keeps a rolling
    # window always topped up: once now (covers a backend that's been off
    # for a while), then once a day.
    await ensure_rolling_availability()
    scheduler.add_job(ensure_rolling_availability, "interval", days=1, id="rolling_availability")
    scheduler.start()

    yield

    scheduler.shutdown()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ANIIDCO Single Window Tourism Portal REST API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(attractions.router, prefix=settings.API_V1_STR)
app.include_router(ferry.router, prefix=settings.API_V1_STR)
app.include_router(cart.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(sync.router, prefix=settings.API_V1_STR)
app.include_router(operator.router, prefix=settings.API_V1_STR)
app.include_router(gates.router, prefix=settings.API_V1_STR)
app.include_router(vendor.router, prefix=settings.API_V1_STR)
app.include_router(group_bookings.router, prefix=settings.API_V1_STR)
app.include_router(group_bookings.admin_router, prefix=settings.API_V1_STR)
app.include_router(agent.router, prefix=settings.API_V1_STR)
app.include_router(grievances.router, prefix=settings.API_V1_STR)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "ANIIDCO FastAPI Backend"}
