"""
Admin attraction management (RFP p.30, Administrative User): authorize new
attractions into the booking engine (title, description, images, pricing,
time slots, capacities), activate/deactivate an attraction on a particular
day or within time intervals, and deactivate individual time slots.
"""
import re
import uuid
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.attraction import (
    Attraction, AttractionSlot, AttractionSlotTemplate, AttractionClosure,
)
from app.api.v1.admin import verify_admin_role
from app.services.availability_service import _ensure_attraction_slots, ROLLING_WINDOW_DAYS
from app.services.slot_service import (
    apply_closure, reopen_after_closure_removed, closure_covers, closures_for,
)
from app.services.time_service import now_ist
from app.schemas.attraction_admin import (
    AttractionCreateRequest,
    AttractionUpdateRequest,
    SlotTimesReplaceRequest,
    SlotTimeInput,
    ClosureCreateRequest,
    ClosureResponse,
    ClosureCreateResponse,
    SlotStatusUpdateRequest,
    SlotStatusResponse,
    AdminAttractionResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin - Attraction Management"])

VALID_ISLANDS = {"PORT_BLAIR", "HAVELOCK", "NEIL"}
VALID_CATEGORIES = {"MONUMENT", "LIGHT_SOUND", "WATER_SPORT"}
MAX_SLOT_CAPACITY = 100000
HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _check_hhmm(value: str, label: str) -> str:
    if not value or not HHMM.match(value):
        raise HTTPException(status_code=400, detail=f"{label} must be a 24-hour time in HH:MM format (e.g. 09:00)")
    return value


def _check_date(value: str, label: str) -> str:
    try:
        date_type.fromisoformat(value)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail=f"{label} must be a date in YYYY-MM-DD format")
    return value


def _check_slot_times(slot_times: list) -> None:
    if not slot_times:
        raise HTTPException(status_code=400, detail="At least one time slot is required")
    seen = set()
    for st in slot_times:
        _check_hhmm(st.start_time, "Slot start time")
        _check_hhmm(st.end_time, "Slot end time")
        if st.start_time >= st.end_time:
            raise HTTPException(status_code=400, detail=f"Slot {st.start_time}-{st.end_time}: end time must be after start time")
        if not (0 < st.capacity <= MAX_SLOT_CAPACITY):
            raise HTTPException(status_code=400, detail=f"Slot {st.start_time}: capacity must be between 1 and {MAX_SLOT_CAPACITY}")
        if st.start_time in seen:
            raise HTTPException(status_code=400, detail=f"Duplicate slot start time {st.start_time}")
        seen.add(st.start_time)


def _check_choice(value: str, allowed: set, label: str) -> str:
    v = (value or "").strip().upper()
    if v not in allowed:
        raise HTTPException(status_code=400, detail=f"{label} must be one of {sorted(allowed)}")
    return v


def _check_price(value, label: str) -> None:
    if value is not None and value < 0:
        raise HTTPException(status_code=400, detail=f"{label} cannot be negative")


async def _title_taken(db: AsyncSession, title: str, exclude_id=None) -> bool:
    q = select(Attraction.id).where(func.lower(Attraction.title) == title.lower())
    if exclude_id is not None:
        q = q.where(Attraction.id != exclude_id)
    return (await db.execute(q)).first() is not None


def _closure_out(c: AttractionClosure) -> ClosureResponse:
    return ClosureResponse(
        id=str(c.id), attraction_id=str(c.attraction_id),
        start_date=c.start_date, end_date=c.end_date,
        start_time=c.start_time, end_time=c.end_time,
        reason=c.reason, created_at=c.created_at.isoformat() if c.created_at else "",
    )


async def _attraction_out(db: AsyncSession, a: Attraction) -> AdminAttractionResponse:
    templates = (await db.execute(
        select(AttractionSlotTemplate)
        .where(AttractionSlotTemplate.attraction_id == a.id)
        .order_by(AttractionSlotTemplate.start_time.asc())
    )).scalars().all()
    closures = sorted(await closures_for(db, a.id), key=lambda c: (c.start_date, c.start_time or ""))
    return AdminAttractionResponse(
        id=str(a.id), title=a.title, island=a.island, category=a.category,
        base_price_inr=float(a.base_price_inr), foreign_price_inr=float(a.foreign_price_inr),
        express_price_inr=float(a.express_price_inr) if a.express_price_inr is not None else None,
        express_price_foreign_inr=float(a.express_price_foreign_inr) if a.express_price_foreign_inr is not None else None,
        is_active=a.is_active, description=a.description,
        opening_time=a.opening_time, closing_time=a.closing_time,
        estimated_exploration_minutes=a.estimated_exploration_minutes, image_url=a.image_url,
        slot_times=[SlotTimeInput(start_time=t.start_time, end_time=t.end_time, capacity=t.capacity) for t in templates],
        closures=[_closure_out(c) for c in closures],
    )


async def _get_attraction(db: AsyncSession, attraction_id: str) -> Attraction:
    try:
        uid = uuid.UUID(attraction_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid attraction id")
    a = (await db.execute(select(Attraction).where(Attraction.id == uid))).scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Attraction not found")
    return a


@router.get("/attractions", response_model=list[AdminAttractionResponse])
async def list_attractions_admin(
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """Every attraction including deactivated ones (the public list hides those)."""
    items = (await db.execute(select(Attraction).order_by(Attraction.title.asc()))).scalars().all()
    return [await _attraction_out(db, a) for a in items]


@router.post("/attractions", response_model=AdminAttractionResponse)
async def create_attraction(
    req: AttractionCreateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    title = (req.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    island = _check_choice(req.island, VALID_ISLANDS, "Island")
    category = _check_choice(req.category, VALID_CATEGORIES, "Category")
    for value, label in ((req.base_price_inr, "Indian price"), (req.foreign_price_inr, "Foreign price"),
                         (req.express_price_inr, "Express price"), (req.express_price_foreign_inr, "Foreign express price")):
        _check_price(value, label)
    _check_slot_times(req.slot_times)
    if req.estimated_exploration_minutes is not None and req.estimated_exploration_minutes <= 0:
        raise HTTPException(status_code=400, detail="Estimated exploration time must be positive")
    if await _title_taken(db, title):
        raise HTTPException(status_code=409, detail="An attraction with this title already exists")

    opening = _check_hhmm(req.opening_time, "Opening time") if req.opening_time else min(s.start_time for s in req.slot_times)
    closing = _check_hhmm(req.closing_time, "Closing time") if req.closing_time else max(s.end_time for s in req.slot_times)

    attraction = Attraction(
        title=title, island=island, category=category,
        base_price_inr=req.base_price_inr, foreign_price_inr=req.foreign_price_inr,
        express_price_inr=req.express_price_inr, express_price_foreign_inr=req.express_price_foreign_inr,
        description=req.description, opening_time=opening, closing_time=closing,
        estimated_exploration_minutes=req.estimated_exploration_minutes,
        image_url=(req.image_url or None), is_active=True,
    )
    db.add(attraction)
    await db.flush()
    for st in req.slot_times:
        db.add(AttractionSlotTemplate(
            attraction_id=attraction.id, start_time=st.start_time, end_time=st.end_time, capacity=st.capacity,
        ))
    await db.commit()

    # Generate its bookable slots for the rolling window right away rather
    # than waiting for the next daily run.
    await _ensure_attraction_slots(db, ROLLING_WINDOW_DAYS)
    await db.refresh(attraction)
    return await _attraction_out(db, attraction)


@router.patch("/attractions/{attraction_id}", response_model=AdminAttractionResponse)
async def update_attraction(
    attraction_id: str,
    req: AttractionUpdateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    a = await _get_attraction(db, attraction_id)
    data = req.model_dump(exclude_unset=True)

    if "title" in data:
        title = (data["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        if await _title_taken(db, title, exclude_id=a.id):
            raise HTTPException(status_code=409, detail="An attraction with this title already exists")
        a.title = title
    if "island" in data:
        a.island = _check_choice(data["island"], VALID_ISLANDS, "Island")
    if "category" in data:
        a.category = _check_choice(data["category"], VALID_CATEGORIES, "Category")
    for field, label in (("base_price_inr", "Indian price"), ("foreign_price_inr", "Foreign price"),
                         ("express_price_inr", "Express price"), ("express_price_foreign_inr", "Foreign express price")):
        if field in data:
            if field in ("base_price_inr", "foreign_price_inr") and data[field] is None:
                raise HTTPException(status_code=400, detail=f"{label} cannot be empty")
            _check_price(data[field], label)
            setattr(a, field, data[field])
    if "opening_time" in data and data["opening_time"]:
        a.opening_time = _check_hhmm(data["opening_time"], "Opening time")
    if "closing_time" in data and data["closing_time"]:
        a.closing_time = _check_hhmm(data["closing_time"], "Closing time")
    if "estimated_exploration_minutes" in data:
        mins = data["estimated_exploration_minutes"]
        if mins is not None and mins <= 0:
            raise HTTPException(status_code=400, detail="Estimated exploration time must be positive")
        a.estimated_exploration_minutes = mins
    if "description" in data:
        a.description = data["description"]
    if "image_url" in data:
        a.image_url = data["image_url"] or None
    if "is_active" in data and data["is_active"] is not None:
        a.is_active = data["is_active"]

    await db.commit()
    if a.is_active:
        # Reactivated attractions get any missing upcoming slots back.
        await _ensure_attraction_slots(db, ROLLING_WINDOW_DAYS)
    await db.refresh(a)
    return await _attraction_out(db, a)


@router.put("/attractions/{attraction_id}/slot-times", response_model=AdminAttractionResponse)
async def replace_slot_times(
    attraction_id: str,
    req: SlotTimesReplaceRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """
    Replaces the attraction's daily slot pattern. New and changed patterns
    apply to newly generated days; existing dated slots keep their own
    capacity (adjust those individually). A removed pattern stops being
    generated and its upcoming slots with no bookings are closed.
    """
    a = await _get_attraction(db, attraction_id)
    _check_slot_times(req.slot_times)

    existing = {
        t.start_time: t
        for t in (await db.execute(
            select(AttractionSlotTemplate).where(AttractionSlotTemplate.attraction_id == a.id)
        )).scalars().all()
    }
    wanted = {st.start_time: st for st in req.slot_times}

    for start, st in wanted.items():
        if start in existing:
            existing[start].end_time = st.end_time
            existing[start].capacity = st.capacity
        else:
            db.add(AttractionSlotTemplate(
                attraction_id=a.id, start_time=st.start_time, end_time=st.end_time, capacity=st.capacity,
            ))

    today = now_ist().strftime("%Y-%m-%d")
    for start, tmpl in existing.items():
        if start in wanted:
            continue
        upcoming = (await db.execute(
            select(AttractionSlot).where(
                AttractionSlot.attraction_id == a.id,
                AttractionSlot.start_time == start,
                AttractionSlot.slot_date >= today,
                AttractionSlot.booked_count == 0,
            )
        )).scalars().all()
        for slot in upcoming:
            slot.is_active = False
        await db.delete(tmpl)

    await db.commit()
    if a.is_active:
        await _ensure_attraction_slots(db, ROLLING_WINDOW_DAYS)
    return await _attraction_out(db, a)


@router.post("/attractions/{attraction_id}/closures", response_model=ClosureCreateResponse)
async def create_closure(
    attraction_id: str,
    req: ClosureCreateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    a = await _get_attraction(db, attraction_id)
    _check_date(req.start_date, "Start date")
    _check_date(req.end_date, "End date")
    if req.end_date < req.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
    if (req.start_time is None) != (req.end_time is None):
        raise HTTPException(status_code=400, detail="Give both a start and end time for a time-window closure, or neither for a whole-day closure")
    if req.start_time is not None:
        _check_hhmm(req.start_time, "Start time")
        _check_hhmm(req.end_time, "End time")
        if req.start_time >= req.end_time:
            raise HTTPException(status_code=400, detail="End time must be after start time")
    if not (req.reason or "").strip():
        raise HTTPException(status_code=400, detail="A reason is required")

    closure = AttractionClosure(
        attraction_id=a.id, start_date=req.start_date, end_date=req.end_date,
        start_time=req.start_time, end_time=req.end_time,
        reason=req.reason.strip(), created_by=admin_user.id,
    )
    db.add(closure)
    await db.flush()
    result = await apply_closure(db, closure)
    await db.commit()
    await db.refresh(closure)
    return ClosureCreateResponse(closure=_closure_out(closure), **result)


@router.delete("/attractions/{attraction_id}/closures/{closure_id}")
async def remove_closure(
    attraction_id: str,
    closure_id: str,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    a = await _get_attraction(db, attraction_id)
    try:
        cid = uuid.UUID(closure_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid closure id")
    closure = (await db.execute(
        select(AttractionClosure).where(AttractionClosure.id == cid, AttractionClosure.attraction_id == a.id)
    )).scalars().first()
    if not closure:
        raise HTTPException(status_code=404, detail="Closure not found")

    reopened = await reopen_after_closure_removed(db, closure)
    await db.delete(closure)
    await db.commit()
    return {"status": "REMOVED", "slots_reopened": reopened}


@router.patch("/slots/{slot_id}/status", response_model=SlotStatusResponse)
async def set_slot_status(
    slot_id: str,
    req: SlotStatusUpdateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """Close or reopen one specific time slot (e.g. maintenance)."""
    try:
        sid = uuid.UUID(slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid slot id")
    slot = (await db.execute(select(AttractionSlot).where(AttractionSlot.id == sid))).scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if req.is_active:
        covering = [
            c for c in await closures_for(db, slot.attraction_id)
            if closure_covers(c, slot.slot_date, slot.start_time, slot.end_time)
        ]
        if covering:
            raise HTTPException(
                status_code=409,
                detail=f"This slot is covered by a closure ({covering[0].reason}). Remove that closure to reopen it.",
            )

    slot.is_active = req.is_active
    await db.commit()
    return SlotStatusResponse(
        slot_id=str(slot.id), slot_date=slot.slot_date, start_time=slot.start_time,
        end_time=slot.end_time, is_active=slot.is_active, booked_count=slot.booked_count or 0,
    )
