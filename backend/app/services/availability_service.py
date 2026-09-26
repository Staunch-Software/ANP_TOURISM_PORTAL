"""
Keeps a rolling window of bookable attraction slots and ferry sailings
always available, so nobody -- a tourist, a demo, an admin testing a
reschedule -- ever hits "no slots found" just because the calendar moved
past whatever fixed range a one-time seed script last covered.

Previously, seed_catalog.py/seed_ferries.py generated a fixed N-day
window from whenever they were manually run; once "today" moved past
that window, availability silently ran out until someone remembered to
re-run them. ensure_rolling_availability() does the same idempotent
insert-if-missing work, but computed fresh from today's date every time
it runs -- see main.py's lifespan (runs once at startup) and the
APScheduler job (runs daily) for where it's actually invoked.
"""
import logging
from datetime import date, timedelta

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.attraction import Attraction, AttractionSlot
from app.models.ferry import Vessel, FerrySchedule, FerrySeat
from app.data.catalog_templates import (
    REAL_ATTRACTIONS,
    VESSELS_DATA,
    ROUTE_TEMPLATES,
    FERRY_CABIN_TEMPLATE,
    FERRY_SEAT_COLUMNS,
)

logger = logging.getLogger("anp.availability")

ROLLING_WINDOW_DAYS = 14


async def _ensure_attraction_slots(db: AsyncSession, days_ahead: int) -> int:
    today = date.today()
    date_strings = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days_ahead)]
    created = 0

    for item in REAL_ATTRACTIONS:
        res = await db.execute(select(Attraction).where(Attraction.title == item["title"]))
        attraction = res.scalars().first()
        if not attraction:
            # This service only extends availability for attractions that
            # already exist -- seed_catalog.py is still what creates the
            # catalog itself the first time.
            continue

        for d_str in date_strings:
            for start_t, end_t, cap in item["slots"]:
                slot_res = await db.execute(
                    select(AttractionSlot).where(
                        AttractionSlot.attraction_id == attraction.id,
                        AttractionSlot.slot_date == d_str,
                        AttractionSlot.start_time == start_t,
                    )
                )
                if slot_res.scalars().first():
                    continue
                db.add(
                    AttractionSlot(
                        attraction_id=attraction.id,
                        slot_date=d_str,
                        start_time=start_t,
                        end_time=end_t,
                        total_capacity=cap,
                        booked_count=0,
                        premium_capacity=max(1, int(cap * 0.2)),
                        premium_booked_count=0,
                    )
                )
                created += 1

    await db.commit()
    return created


async def _ensure_ferry_schedules(db: AsyncSession, days_ahead: int) -> int:
    today = date.today()
    dates = [today + timedelta(days=i) for i in range(days_ahead)]
    created = 0

    vessel_map = {}
    for v_data in VESSELS_DATA:
        res = await db.execute(select(Vessel).where(Vessel.name == v_data["name"]))
        vessel = res.scalars().first()
        if vessel:
            vessel_map[vessel.name] = vessel

    for d in dates:
        for rt in ROUTE_TEMPLATES:
            vessel = vessel_map.get(rt["vessel"])
            if not vessel:
                # Same rule as attractions: this service extends the
                # calendar, seed_ferries.py still creates the vessels.
                continue

            res = await db.execute(
                select(FerrySchedule).where(
                    FerrySchedule.vessel_id == vessel.id,
                    FerrySchedule.source_port == rt["src"],
                    FerrySchedule.destination_port == rt["dst"],
                    FerrySchedule.departure_date == d,
                    FerrySchedule.departure_time == rt["dep_time"],
                )
            )
            if res.scalars().first():
                continue

            sched = FerrySchedule(
                vessel_id=vessel.id,
                source_port=rt["src"],
                destination_port=rt["dst"],
                departure_date=d,
                departure_time=rt["dep_time"],
                status="SCHEDULED",
            )
            db.add(sched)
            await db.flush()

            seats_to_add = []
            for prefix, cabin_class, row_count, price in FERRY_CABIN_TEMPLATE:
                for row in range(1, row_count + 1):
                    for col in FERRY_SEAT_COLUMNS:
                        seats_to_add.append(
                            FerrySeat(
                                schedule_id=sched.id,
                                seat_number=f"{prefix}{row}{col}",
                                cabin_class=cabin_class,
                                price_inr=price,
                                is_booked=False,
                            )
                        )
            db.add_all(seats_to_add)
            created += 1

    await db.commit()
    return created


async def ensure_rolling_availability(days_ahead: int = ROLLING_WINDOW_DAYS) -> None:
    async with AsyncSessionLocal() as db:
        slots_created = await _ensure_attraction_slots(db, days_ahead)
        schedules_created = await _ensure_ferry_schedules(db, days_ahead)
        logger.info(
            f"Rolling availability check: +{slots_created} attraction slots, "
            f"+{schedules_created} ferry schedules (window: {days_ahead} days from today)."
        )
