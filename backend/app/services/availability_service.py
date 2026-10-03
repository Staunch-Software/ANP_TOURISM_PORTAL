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
from app.models.attraction import Attraction, AttractionSlot, AttractionSlotTemplate
from app.services.slot_service import closure_covers, closures_for
from app.models.ferry import Vessel, FerrySchedule, FerrySeat
from app.data.catalog_templates import (
    arrival_for,
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

    # 1. The five seeded attractions: backfill detail fields and their slot
    #    pattern into the database (only where still missing, so an admin's
    #    later edit is never overwritten). After this the database is the
    #    source of truth; catalog_templates.py is just the initial seed.
    for item in REAL_ATTRACTIONS:
        res = await db.execute(select(Attraction).where(Attraction.title == item["title"]))
        attraction = res.scalars().first()
        if not attraction:
            # seed_catalog.py is still what creates the catalog the first time.
            continue

        for field in ("description", "opening_time", "closing_time", "estimated_exploration_minutes", "image_url"):
            if getattr(attraction, field) is None:
                setattr(attraction, field, item[field])

        has_template = (await db.execute(
            select(AttractionSlotTemplate.id).where(AttractionSlotTemplate.attraction_id == attraction.id).limit(1)
        )).first()
        if not has_template:
            for start_t, end_t, cap in item["slots"]:
                db.add(AttractionSlotTemplate(
                    attraction_id=attraction.id, start_time=start_t, end_time=end_t, capacity=cap,
                ))
    await db.flush()

    # 2. Every ACTIVE attraction (seeded or admin-created): generate the
    #    rolling window of dated slots from its templates. Slots that fall
    #    inside an admin closure are created already closed.
    attractions = (await db.execute(select(Attraction).where(Attraction.is_active == True))).scalars().all()
    for attraction in attractions:
        templates = (await db.execute(
            select(AttractionSlotTemplate).where(AttractionSlotTemplate.attraction_id == attraction.id)
        )).scalars().all()
        if not templates:
            continue

        closures = await closures_for(db, attraction.id)
        existing = {
            (row.slot_date, row.start_time)
            for row in (await db.execute(
                select(AttractionSlot.slot_date, AttractionSlot.start_time).where(
                    AttractionSlot.attraction_id == attraction.id,
                    AttractionSlot.slot_date.in_(date_strings),
                )
            )).all()
        }

        for d_str in date_strings:
            for t in templates:
                if (d_str, t.start_time) in existing:
                    continue
                closed = any(closure_covers(c, d_str, t.start_time, t.end_time) for c in closures)
                db.add(
                    AttractionSlot(
                        attraction_id=attraction.id,
                        slot_date=d_str,
                        start_time=t.start_time,
                        end_time=t.end_time,
                        total_capacity=t.capacity,
                        booked_count=0,
                        premium_capacity=max(1, int(t.capacity * 0.2)),
                        premium_booked_count=0,
                        is_active=not closed,
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
            # Catch existing vessels up with the photo and amenity details.
            if not vessel.image_url and v_data.get("image_url"):
                vessel.image_url = v_data["image_url"]
            if not vessel.amenities and v_data.get("amenities"):
                vessel.amenities = v_data["amenities"]

    # Backfill the arrival time on sailings created before the column existed.
    missing = await db.execute(select(FerrySchedule).where(FerrySchedule.arrival_time.is_(None)))
    for old in missing.scalars().all():
        old.arrival_time = arrival_for(old.source_port, old.destination_port, old.departure_time)

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
                arrival_time=arrival_for(rt["src"], rt["dst"], rt["dep_time"]),
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
