"""
Shared slot-closure logic (RFP p.30: the administrator can deactivate
attractions on a particular day or within specified time intervals, and
deactivate individual time slots).

A closure is a date range, optionally narrowed to a time-of-day window.
Closing means: AttractionSlot.is_active = False, so no NEW booking can be
made for it. Tickets that were already issued for a slot are left alone --
cancelling and refunding those is a separate, deliberate admin action.
"""
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.attraction import Attraction, AttractionSlot, AttractionClosure


def closure_covers(closure: AttractionClosure, slot_date: str, start_time: str, end_time: str) -> bool:
    """Slot dates/times are zero-padded strings, so plain string comparison
    orders them correctly ("09:00" < "10:00", "2026-10-05" < "2026-10-12")."""
    if not (closure.start_date <= slot_date <= closure.end_date):
        return False
    if closure.start_time is None or closure.end_time is None:
        return True  # whole-day closure
    return start_time < closure.end_time and end_time > closure.start_time


async def closures_for(db: AsyncSession, attraction_id) -> list:
    res = await db.execute(select(AttractionClosure).where(AttractionClosure.attraction_id == attraction_id))
    return list(res.scalars().all())


async def _slots_in_closure_range(db: AsyncSession, closure: AttractionClosure) -> list:
    res = await db.execute(
        select(AttractionSlot).where(
            AttractionSlot.attraction_id == closure.attraction_id,
            AttractionSlot.slot_date >= closure.start_date,
            AttractionSlot.slot_date <= closure.end_date,
        )
    )
    return [s for s in res.scalars().all() if closure_covers(closure, s.slot_date, s.start_time, s.end_time)]


async def apply_closure(db: AsyncSession, closure: AttractionClosure) -> dict:
    """Closes every existing slot the closure covers. Returns how many slots
    were closed and how many confirmed seats are already booked in them, so
    the admin knows existing bookings are NOT touched."""
    slots = await _slots_in_closure_range(db, closure)
    closed = 0
    booked_seats = 0
    for s in slots:
        if s.is_active:
            s.is_active = False
            closed += 1
        booked_seats += s.booked_count or 0
    return {"slots_closed": closed, "booked_seats_in_range": booked_seats}


async def reopen_after_closure_removed(db: AsyncSession, closure: AttractionClosure) -> int:
    """Reopens slots the removed closure covered -- but only those no OTHER
    remaining closure still covers."""
    others = [c for c in await closures_for(db, closure.attraction_id) if c.id != closure.id]
    reopened = 0
    for s in await _slots_in_closure_range(db, closure):
        if s.is_active:
            continue
        if any(closure_covers(o, s.slot_date, s.start_time, s.end_time) for o in others):
            continue
        s.is_active = True
        reopened += 1
    return reopened


def ensure_slot_bookable(slot: AttractionSlot, attraction: Attraction) -> None:
    """Raised before any new booking/reschedule/group request is accepted."""
    if not attraction.is_active:
        raise HTTPException(status_code=409, detail=f"{attraction.title} is currently not available for booking")
    if not slot.is_active:
        raise HTTPException(
            status_code=409,
            detail="This time slot has been closed by the administrator. Please choose another slot.",
        )
