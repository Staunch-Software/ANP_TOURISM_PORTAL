import uuid
from collections import defaultdict
from datetime import date as date_type, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.attraction import Attraction, AttractionSlot
from app.schemas.attraction import AttractionResponse, SlotResponse
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse, ItineraryDay, ItineraryStop

router = APIRouter(prefix="/attractions", tags=["Attractions & Activities"])

# RFP p.24 Visitors Dashboard item (b): "visitors can depend on the website
# or app to propose an itinerary based on available time slots and their
# specified preferences" -- how many non-overlapping stops to suggest per
# day, since a tourist's tolerance for a packed schedule varies.
ITINERARY_STOPS_PER_DAY = {"RELAXED": 2, "STANDARD": 3, "PACKED": 4}
ITINERARY_MAX_SPAN_DAYS = 14


@router.get("", response_model=List[AttractionResponse])
async def list_attractions(
    island: Optional[str] = Query(None, description="Filter by island: PORT_BLAIR, HAVELOCK, NEIL"),
    category: Optional[str] = Query(None, description="Filter by: MONUMENT, LIGHT_SOUND, WATER_SPORT"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Attraction).where(Attraction.is_active == True)
    if island:
        query = query.where(Attraction.island == island.upper())
    if category:
        query = query.where(Attraction.category == category.upper())

    result = await db.execute(query)
    items = result.scalars().all()

    return [
        AttractionResponse(
            id=str(item.id),
            title=item.title,
            island=item.island,
            category=item.category,
            base_price_inr=float(item.base_price_inr),
            foreign_price_inr=float(item.foreign_price_inr),
            is_active=item.is_active,
        )
        for item in items
    ]


@router.get("/{attraction_id}", response_model=AttractionResponse)
async def get_attraction(attraction_id: str, db: AsyncSession = Depends(get_db)):
    try:
        attraction_uuid = uuid.UUID(attraction_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Attraction UUID")

    res = await db.execute(select(Attraction).where(Attraction.id == attraction_uuid))
    attraction = res.scalars().first()
    if not attraction:
        raise HTTPException(status_code=404, detail="Attraction not found")

    return AttractionResponse(
        id=str(attraction.id),
        title=attraction.title,
        island=attraction.island,
        category=attraction.category,
        base_price_inr=float(attraction.base_price_inr),
        foreign_price_inr=float(attraction.foreign_price_inr),
        is_active=attraction.is_active,
    )


@router.get("/{attraction_id}/slots", response_model=List[SlotResponse])
async def get_attraction_slots(
    attraction_id: str,
    target_date: str = Query(..., description="Date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        attraction_uuid = uuid.UUID(attraction_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Attraction UUID")

    query = (
        select(AttractionSlot)
        .where(
            AttractionSlot.attraction_id == attraction_uuid,
            AttractionSlot.slot_date == target_date,
        )
        .order_by(AttractionSlot.start_time.asc())
    )

    res = await db.execute(query)
    slots = res.scalars().all()

    response_slots = []
    for s in slots:
        redis_held = await r.get(f"slot_hold_count:{str(s.id)}")
        held_count = int(redis_held) if redis_held else 0

        available = max(0, s.total_capacity - s.booked_count - held_count)

        response_slots.append(
            SlotResponse(
                slot_id=str(s.id),
                attraction_id=str(s.attraction_id),
                slot_date=s.slot_date,
                start_time=s.start_time,
                end_time=s.end_time,
                total_capacity=s.total_capacity,
                booked_count=s.booked_count + held_count,
                available_seats=available,
                is_available=(available > 0),
            )
        )

    return response_slots


@router.post("/itinerary/suggest", response_model=ItineraryResponse)
async def suggest_itinerary(
    req: ItineraryRequest,
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        start = date_type.fromisoformat(req.start_date)
        end = date_type.fromisoformat(req.end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="start_date/end_date must be in YYYY-MM-DD format")

    if end < start:
        raise HTTPException(status_code=400, detail="end_date cannot be before start_date")
    if (end - start).days + 1 > ITINERARY_MAX_SPAN_DAYS:
        raise HTTPException(status_code=400, detail=f"An itinerary can span at most {ITINERARY_MAX_SPAN_DAYS} days")

    stops_per_day = ITINERARY_STOPS_PER_DAY.get((req.pace or "STANDARD").upper(), ITINERARY_STOPS_PER_DAY["STANDARD"])
    is_foreign = req.nationality.upper() == "FOREIGN"

    query = (
        select(AttractionSlot, Attraction)
        .join(Attraction, AttractionSlot.attraction_id == Attraction.id)
        .where(
            Attraction.is_active == True,
            AttractionSlot.slot_date >= req.start_date,
            AttractionSlot.slot_date <= req.end_date,
        )
    )
    if req.island:
        query = query.where(Attraction.island == req.island.upper())
    if req.categories:
        query = query.where(Attraction.category.in_([c.upper() for c in req.categories]))
    query = query.order_by(AttractionSlot.slot_date.asc(), AttractionSlot.start_time.asc())

    rows = (await db.execute(query)).all()

    # Bucket bookable candidates by date, same available-seats math as
    # get_attraction_slots (total capacity minus confirmed bookings minus
    # anyone currently holding a seat mid-checkout).
    candidates_by_date = defaultdict(list)
    for slot, attraction in rows:
        redis_held = await r.get(f"slot_hold_count:{str(slot.id)}")
        held = int(redis_held) if redis_held else 0
        available = max(0, slot.total_capacity - slot.booked_count - held)
        if available > 0:
            candidates_by_date[slot.slot_date].append((slot, attraction, available))

    def make_stop(slot, attraction, available):
        price = float(attraction.foreign_price_inr if is_foreign else attraction.base_price_inr)
        return ItineraryStop(
            attraction_id=str(attraction.id),
            title=attraction.title,
            island=attraction.island,
            category=attraction.category,
            slot_id=str(slot.id),
            start_time=slot.start_time,
            end_time=slot.end_time,
            price=price,
            available_seats=available,
        )

    used_attraction_ids = set()
    days = []
    unplanned_dates = []

    cur = start
    while cur <= end:
        date_str = cur.isoformat()
        candidates = candidates_by_date.get(date_str, [])

        stops = []
        last_end_time = None
        # First pass: only attractions not already suggested earlier in the
        # trip, so a multi-day itinerary doesn't repeat the same stop.
        for slot, attraction, available in candidates:
            if len(stops) >= stops_per_day:
                break
            if attraction.id in used_attraction_ids:
                continue
            if last_end_time is not None and slot.start_time < last_end_time:
                continue  # overlaps a stop already picked for this day
            stops.append(make_stop(slot, attraction, available))
            used_attraction_ids.add(attraction.id)
            last_end_time = slot.end_time

        # Second pass, only if the first found nothing for this day: allow
        # repeating an attraction used on another day rather than leaving
        # the day empty when the destination just has limited options.
        if not stops:
            for slot, attraction, available in candidates:
                if len(stops) >= stops_per_day:
                    break
                if last_end_time is not None and slot.start_time < last_end_time:
                    continue
                stops.append(make_stop(slot, attraction, available))
                last_end_time = slot.end_time

        if stops:
            days.append(ItineraryDay(date=date_str, stops=stops))
        else:
            unplanned_dates.append(date_str)

        cur += timedelta(days=1)

    return ItineraryResponse(
        start_date=req.start_date,
        end_date=req.end_date,
        days=days,
        unplanned_dates=unplanned_dates,
    )
