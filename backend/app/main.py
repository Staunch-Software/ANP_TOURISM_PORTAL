from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, attractions, ferry, cart, payments, tickets, admin, sync, operator, gates, vendor, group_bookings


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables verified & initialized.")
    yield


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


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "ANIIDCO FastAPI Backend"}
