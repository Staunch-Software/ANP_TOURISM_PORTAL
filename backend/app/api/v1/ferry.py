import uuid
from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.ferry import Vessel, FerrySchedule, FerrySeat
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.ferry import (
    CabinSummary,
    FerryTripResponse,
    SeatMapItem,
    SeatHoldRequest,
    SeatHoldResponse,
)

router = APIRouter(prefix="/ferry", tags=["Ferry Management"])


# -------------------------------------------------------------
# 1. Search Voyages by Route & Date
# -------------------------------------------------------------
@router.get("/schedules", response_model=List[FerryTripResponse])
async def search_ferries(
    source_port: str = Query(..., description="e.g. PORT_BLAIR, HAVELOCK, NEIL"),
    destination_port: str = Query(..., description="e.g. HAVELOCK, NEIL, PORT_BLAIR"),
    travel_date: date = Query(..., description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    query = (
        select(FerrySchedule, Vessel)
        .join(Vessel, FerrySchedule.vessel_id == Vessel.id)
        .where(
            FerrySchedule.source_port == source_port.upper(),
            FerrySchedule.destination_port == destination_port.upper(),
            FerrySchedule.departure_date == travel_date,
            FerrySchedule.status == "SCHEDULED",
        )
        .order_by(FerrySchedule.departure_time.asc())
    )

    result = await db.execute(query)
    rows = result.all()

    response = []
    for schedule, vessel in rows:
        seats_res = await db.execute(
            select(FerrySeat).where(FerrySeat.schedule_id == schedule.id)
        )
        all_seats = seats_res.scalars().all()

        cabin_data = {}
        for s in all_seats:
            c = s.cabin_class
            if c not in cabin_data:
                cabin_data[c] = {"price": float(s.price_inr), "available": 0}

            is_held = await r.exists(f"ferry:hold:{str(schedule.id)}:{s.seat_number}")
            if not s.is_booked and not is_held:
                cabin_data[c]["available"] += 1

        cabins = [
            CabinSummary(
                cabin_class=cls_name,
                starting_price_inr=data["price"],
                available_seats=data["available"],
            )
            for cls_name, data in cabin_data.items()
        ]

        response.append(
            FerryTripResponse(
                schedule_id=str(schedule.id),
                vessel_name=vessel.name,
                operator_name=vessel.operator_name,
                source_port=schedule.source_port,
                destination_port=schedule.destination_port,
                departure_date=str(schedule.departure_date),
                departure_time=schedule.departure_time.strftime("%H:%M"),
                status=schedule.status,
                cabins=cabins,
            )
        )

    return response


# -------------------------------------------------------------
# 2. Get 2D Aircraft-Style Seat Map for a Voyage
# -------------------------------------------------------------
@router.get("/schedules/{schedule_id}/seat-map", response_model=List[SeatMapItem])
async def get_seat_map(
    schedule_id: str,
    user_phone: Optional[str] = Query(None, description="Optional phone to check if seat is held by current user"),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        schedule_uuid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Schedule UUID")

    res = await db.execute(
        select(FerrySeat)
        .where(FerrySeat.schedule_id == schedule_uuid)
        .order_by(FerrySeat.seat_number.asc())
    )
    seats = res.scalars().all()

    seat_map = []
    for s in seats:
        hold_key = f"ferry:hold:{schedule_id}:{s.seat_number}"
        held_by = await r.get(hold_key)

        is_held = bool(held_by)
        held_by_you = (held_by == user_phone) if (is_held and user_phone) else False
        is_available = (not s.is_booked) and (not is_held or held_by_you)

        is_win = s.seat_number.endswith("1") or s.seat_number.endswith("4") or s.seat_number.startswith("W")
        deck = "UPPER" if s.cabin_class == "ROYAL" else "LOWER"

        seat_map.append(
            SeatMapItem(
                seat_id=str(s.id),
                seat_number=s.seat_number,
                cabin_class=s.cabin_class,
                deck_level=deck,
                is_window=is_win,
                price_inr=float(s.price_inr),
                is_available=is_available,
                is_held_by_you=held_by_you,
            )
        )

    return seat_map


# -------------------------------------------------------------
# 3. 10-Minute Redis Seat Hold Mutex (Anti-Overbooking SLA)
# -------------------------------------------------------------
@router.post("/schedules/{schedule_id}/hold-seat", response_model=SeatHoldResponse)
async def hold_ferry_seat(
    schedule_id: str,
    req: SeatHoldRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        schedule_uuid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Schedule UUID")

    seat_res = await db.execute(
        select(FerrySeat).where(
            FerrySeat.schedule_id == schedule_uuid,
            FerrySeat.seat_number == req.seat_number,
        )
    )
    seat = seat_res.scalars().first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat number not found on this vessel")
    if seat.is_booked:
        raise HTTPException(status_code=409, detail="Seat is already permanently booked")

    hold_key = f"ferry:hold:{schedule_id}:{req.seat_number}"
    user_identifier = current_user.phone_number

    acquired = await r.set(hold_key, user_identifier, nx=True, ex=600)

    if not acquired:
        current_holder = await r.get(hold_key)
        if current_holder != user_identifier:
            raise HTTPException(
                status_code=409,
                detail=f"Seat {req.seat_number} is currently being booked by another passenger. Please choose another seat.",
            )

    return SeatHoldResponse(
        schedule_id=schedule_id,
        seat_number=req.seat_number,
        expires_in_seconds=600,
        message=f"Seat {req.seat_number} locked for 10 minutes. Proceed to passenger checkout.",
    )


# -------------------------------------------------------------
# 4. Release Held Seat (e.g. if tourist unselects seat)
# -------------------------------------------------------------
@router.post("/schedules/{schedule_id}/release-seat")
async def release_ferry_seat(
    schedule_id: str,
    req: SeatHoldRequest,
    current_user: User = Depends(get_current_user),
    r=Depends(get_redis),
):
    hold_key = f"ferry:hold:{schedule_id}:{req.seat_number}"
    current_holder = await r.get(hold_key)

    if current_holder == current_user.phone_number:
        await r.delete(hold_key)
        return {"status": "RELEASED", "seat_number": req.seat_number}

    return {"status": "IGNORED", "message": "You do not hold this seat lock"}
