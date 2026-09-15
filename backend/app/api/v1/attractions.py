import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.attraction import Attraction, AttractionSlot
from app.schemas.attraction import AttractionResponse, SlotResponse

router = APIRouter(prefix="/attractions", tags=["Attractions & Activities"])


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
