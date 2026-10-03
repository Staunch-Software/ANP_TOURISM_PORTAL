import uuid
import json
import random
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User
from app.models.attraction import Attraction, AttractionSlot
from app.services.slot_service import ensure_slot_bookable
from app.models.ferry import FerrySchedule, FerrySeat, Vessel
from app.models.order import Order, OrderItem
from app.api.v1.auth import get_current_user
from app.schemas.cart import (
    AddAttractionToCartRequest,
    AddAttractionsBatchRequest,
    SavedVisitor,
    AddFerryToCartRequest,
    CartItemResponse,
    CartSummaryResponse,
    CheckoutResponse,
)

router = APIRouter(prefix="/cart", tags=["Unified Shopping Cart & Checkout"])


def get_cart_key(user_id: uuid.UUID) -> str:
    return f"cart:{str(user_id)}"


# RFP p.25 "Individual Bookings: Up to 6 adult members and 12 children" --
# the cap is on the whole booking (cart), not per attraction/ferry item,
# so this counts every passenger already in the cart across every item
# type before allowing one more.
MAX_ADULTS_PER_BOOKING = 6
MAX_CHILDREN_PER_BOOKING = 12
ADULT_AGE_THRESHOLD = 18


async def _check_headcount_cap(r, cart_key: str, new_passenger_age: int) -> None:
    raw_items = await r.lrange(cart_key, 0, -1)
    adults = 0
    children = 0
    for raw in raw_items:
        item = json.loads(raw)
        age = item.get("passenger", {}).get("age")
        if age is not None and age < ADULT_AGE_THRESHOLD:
            children += 1
        else:
            adults += 1

    is_child = new_passenger_age is not None and new_passenger_age < ADULT_AGE_THRESHOLD
    if is_child and children + 1 > MAX_CHILDREN_PER_BOOKING:
        raise HTTPException(
            status_code=400,
            detail=f"A single booking can include at most {MAX_CHILDREN_PER_BOOKING} children. Please start a new booking for additional visitors.",
        )
    if not is_child and adults + 1 > MAX_ADULTS_PER_BOOKING:
        raise HTTPException(
            status_code=400,
            detail=f"A single booking can include at most {MAX_ADULTS_PER_BOOKING} adults. Please start a new booking for additional visitors.",
        )


async def _check_headcount_batch(r, cart_key: str, new_ages: list) -> None:
    """Same 6-adult / 12-child limit as _check_headcount_cap, but for several
    visitors added at once: the cart's current headcount plus ALL of them."""
    adults = children = 0
    for raw in await r.lrange(cart_key, 0, -1):
        age = json.loads(raw).get("passenger", {}).get("age")
        if age is not None and age < ADULT_AGE_THRESHOLD:
            children += 1
        else:
            adults += 1
    for age in new_ages:
        if age is not None and age < ADULT_AGE_THRESHOLD:
            children += 1
        else:
            adults += 1
    if children > MAX_CHILDREN_PER_BOOKING:
        raise HTTPException(
            status_code=400,
            detail=f"A single booking can include at most {MAX_CHILDREN_PER_BOOKING} children. Please start a new booking for additional visitors.",
        )
    if adults > MAX_ADULTS_PER_BOOKING:
        raise HTTPException(
            status_code=400,
            detail=f"A single booking can include at most {MAX_ADULTS_PER_BOOKING} adults. Please start a new booking for additional visitors.",
        )


async def _check_not_already_in_cart(r, cart_key: str, slot_id: str, id_numbers: list) -> None:
    """One person cannot hold two tickets for the same slot."""
    in_cart = {
        (item["passenger"]["id_number"] or "").strip().upper()
        for item in (json.loads(raw) for raw in await r.lrange(cart_key, 0, -1))
        if item.get("slot_id") == slot_id
    }
    seen = set()
    for number in id_numbers:
        key = (number or "").strip().upper()
        if key in in_cart:
            raise HTTPException(status_code=409, detail=f"The visitor with ID ending {key[-4:]} is already in your cart for this slot.")
        if key in seen:
            raise HTTPException(status_code=409, detail=f"The same ID (ending {key[-4:]}) was given for more than one visitor.")
        seen.add(key)


# -------------------------------------------------------------
# 1. Add Monument / Water Sport Attraction to Cart
# -------------------------------------------------------------
@router.post("/add-attraction", response_model=CartSummaryResponse)
async def add_attraction_to_cart(
    req: AddAttractionToCartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        slot_uuid = uuid.UUID(req.slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Slot UUID")

    res = await db.execute(
        select(AttractionSlot, Attraction)
        .join(Attraction, AttractionSlot.attraction_id == Attraction.id)
        .where(AttractionSlot.id == slot_uuid)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Attraction slot not found")

    slot, attraction = row
    ensure_slot_bookable(slot, attraction)

    hold_key = f"slot_hold_count:{str(slot.id)}"
    current_held = int(await r.get(hold_key) or 0)
    available = slot.total_capacity - slot.booked_count - current_held

    if available < 1:
        raise HTTPException(status_code=409, detail="This time slot is completely full")

    price = float(attraction.foreign_price_inr if req.nationality.upper() == "FOREIGN" else attraction.base_price_inr)

    cart_key = get_cart_key(current_user.id)
    await _check_not_already_in_cart(r, cart_key, str(slot.id), [req.passenger.id_number])
    await _check_headcount_cap(r, cart_key, req.passenger.age)

    await r.incr(hold_key)
    await r.expire(hold_key, 600)

    cart_item = {
        "cart_item_id": str(uuid.uuid4()),
        "item_type": "ATTRACTION",
        "slot_id": str(slot.id),
        "title": attraction.title,
        "slot_or_seat": f"{slot.slot_date} ({slot.start_time} - {slot.end_time})",
        "price": price,
        "passenger": req.passenger.model_dump(),
        "nationality": req.nationality.upper(),
    }

    await r.rpush(cart_key, json.dumps(cart_item))
    await r.expire(cart_key, 600)

    return await get_cart_summary(current_user.id, r)


# -------------------------------------------------------------
# 2. Add Ferry Seat to Cart (Locks Seat in Redis)
# -------------------------------------------------------------
@router.post("/add-ferry", response_model=CartSummaryResponse)
async def add_ferry_to_cart(
    req: AddFerryToCartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        schedule_uuid = uuid.UUID(req.schedule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Schedule UUID")

    res = await db.execute(
        select(FerrySeat, FerrySchedule, Vessel)
        .join(FerrySchedule, FerrySeat.schedule_id == FerrySchedule.id)
        .join(Vessel, FerrySchedule.vessel_id == Vessel.id)
        .where(
            FerrySeat.schedule_id == schedule_uuid,
            FerrySeat.seat_number == req.seat_number.upper(),
        )
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Seat {req.seat_number} not found on this voyage")

    seat, schedule, vessel = row

    if schedule.status != "SCHEDULED":
        raise HTTPException(status_code=400, detail=f"This voyage is no longer accepting bookings (status: {schedule.status})")

    if seat.is_booked:
        raise HTTPException(status_code=409, detail=f"Seat {req.seat_number} is already booked")

    cart_key = get_cart_key(current_user.id)
    await _check_headcount_cap(r, cart_key, req.passenger.age)

    seat_hold_key = f"ferry:hold:{str(schedule.id)}:{seat.seat_number}"
    acquired = await r.set(seat_hold_key, current_user.phone_number, nx=True, ex=600)

    if not acquired:
        current_holder = await r.get(seat_hold_key)
        if current_holder != current_user.phone_number:
            raise HTTPException(
                status_code=409,
                detail=f"Seat {req.seat_number} is currently locked by another customer",
            )

    cart_item = {
        "cart_item_id": str(uuid.uuid4()),
        "item_type": "FERRY",
        "seat_id": str(seat.id),
        "schedule_id": str(schedule.id),
        "seat_number": seat.seat_number,
        "title": f"Ferry: {vessel.name} ({schedule.source_port} -> {schedule.destination_port})",
        "slot_or_seat": f"Seat {seat.seat_number} ({seat.cabin_class}) - {schedule.departure_date} at {schedule.departure_time.strftime('%H:%M')}",
        "price": float(seat.price_inr),
        "passenger": req.passenger.model_dump(),
        # Ferry booking has no explicit nationality field (fare doesn't
        # vary by it, unlike attractions) -- inferred from ID type so
        # reports can still filter/segment by it.
        "nationality": "FOREIGN" if req.passenger.id_type.upper() == "PASSPORT" else "INDIAN",
    }

    await r.rpush(cart_key, json.dumps(cart_item))
    await r.expire(cart_key, 600)

    return await get_cart_summary(current_user.id, r)


# -------------------------------------------------------------
# 2b. Add SEVERAL visitors to one attraction slot in one step.
#     All-or-nothing: seats, headcount limit and duplicates are checked
#     for the whole group before anything is added, so a family is never
#     left half-added because the slot filled up midway.
# -------------------------------------------------------------
@router.post("/add-attractions", response_model=CartSummaryResponse)
async def add_attractions_batch(
    req: AddAttractionsBatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    if not req.passengers:
        raise HTTPException(status_code=400, detail="Choose at least one visitor")
    if len(req.passengers) > MAX_ADULTS_PER_BOOKING + MAX_CHILDREN_PER_BOOKING:
        raise HTTPException(status_code=400, detail="Too many visitors in one request")
    for p in req.passengers:
        if p.age is None or p.age < 0 or p.age > 120:
            raise HTTPException(status_code=400, detail=f"Enter a valid age (0-120) for {p.name}")
        if not p.name.strip() or not p.id_number.strip():
            raise HTTPException(status_code=400, detail="Every visitor needs a name and an ID number")

    try:
        slot_uuid = uuid.UUID(req.slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Slot UUID")

    row = (await db.execute(
        select(AttractionSlot, Attraction)
        .join(Attraction, AttractionSlot.attraction_id == Attraction.id)
        .where(AttractionSlot.id == slot_uuid)
    )).first()
    if not row:
        raise HTTPException(status_code=404, detail="Attraction slot not found")
    slot, attraction = row
    ensure_slot_bookable(slot, attraction)

    hold_key = f"slot_hold_count:{str(slot.id)}"
    current_held = int(await r.get(hold_key) or 0)
    available = slot.total_capacity - slot.booked_count - current_held
    if available < len(req.passengers):
        raise HTTPException(
            status_code=409,
            detail=("This time slot is completely full" if available <= 0
                    else f"Only {available} seat(s) are left in this slot, but you chose {len(req.passengers)} visitors"),
        )

    cart_key = get_cart_key(current_user.id)
    await _check_not_already_in_cart(r, cart_key, str(slot.id), [p.id_number for p in req.passengers])
    await _check_headcount_batch(r, cart_key, [p.age for p in req.passengers])

    for p in req.passengers:
        nationality = p.nationality.upper()
        price = float(attraction.foreign_price_inr if nationality == "FOREIGN" else attraction.base_price_inr)
        cart_item = {
            "cart_item_id": str(uuid.uuid4()),
            "item_type": "ATTRACTION",
            "slot_id": str(slot.id),
            "title": attraction.title,
            "slot_or_seat": f"{slot.slot_date} ({slot.start_time} - {slot.end_time})",
            "price": price,
            "passenger": p.model_dump(exclude={"nationality"}),
            "nationality": nationality,
        }
        await r.rpush(cart_key, json.dumps(cart_item))
    await r.incrby(hold_key, len(req.passengers))
    await r.expire(hold_key, 600)
    await r.expire(cart_key, 600)

    return await get_cart_summary(current_user.id, r)


# -------------------------------------------------------------
# 2c. Visitors from this tourist's earlier bookings (RFP p.25: the list of
#     visitor names is automatically filled with details of the booking
#     history, so nobody re-types a family every trip).
# -------------------------------------------------------------
@router.get("/saved-visitors", response_model=List[SavedVisitor])
async def saved_visitors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(OrderItem, Order.created_at)
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.user_id == current_user.id, Order.status.in_(["CONFIRMED", "CANCELLED", "PENDING_PAYMENT"]))
        .order_by(Order.created_at.desc())
    )).all()

    seen = set()
    visitors = []
    for item, created_at in rows:
        key = ((item.id_type or "").upper(), (item.id_number or "").strip().upper())
        if key in seen or not key[1]:
            continue
        seen.add(key)
        visitors.append(SavedVisitor(
            name=item.passenger_name,
            age=item.passenger_age,
            gender=item.passenger_gender,
            id_type=item.id_type,
            id_number=item.id_number,
            nationality=item.nationality or ("FOREIGN" if (item.id_type or "").upper() == "PASSPORT" else "INDIAN"),
            last_used=created_at.isoformat() if created_at else "",
        ))
        if len(visitors) >= 30:
            break
    return visitors


# -------------------------------------------------------------
# 3. View Current Cart
# -------------------------------------------------------------
@router.get("", response_model=CartSummaryResponse)
async def view_cart(
    current_user: User = Depends(get_current_user),
    r=Depends(get_redis),
):
    return await get_cart_summary(current_user.id, r)


# -------------------------------------------------------------
# 3b. Remove ONE ticket from the cart and release just its hold
# -------------------------------------------------------------
@router.delete("/items/{cart_item_id}", response_model=CartSummaryResponse)
async def remove_cart_item(
    cart_item_id: str,
    current_user: User = Depends(get_current_user),
    r=Depends(get_redis),
):
    cart_key = get_cart_key(current_user.id)
    target_raw, target = None, None
    for raw in await r.lrange(cart_key, 0, -1):
        item = json.loads(raw)
        if item.get("cart_item_id") == cart_item_id:
            target_raw, target = raw, item
            break
    if target is None:
        raise HTTPException(status_code=404, detail="That ticket is no longer in your cart")

    await r.lrem(cart_key, 1, target_raw)

    if target["item_type"] == "ATTRACTION":
        hold_key = f"slot_hold_count:{target['slot_id']}"
        if int(await r.get(hold_key) or 0) > 0:
            await r.decr(hold_key)
    elif target["item_type"] == "FERRY":
        seat_key = f"ferry:hold:{target['schedule_id']}:{target['seat_number']}"
        if await r.get(seat_key) == current_user.phone_number:
            await r.delete(seat_key)

    return await get_cart_summary(current_user.id, r)


# -------------------------------------------------------------
# 4. Clear Entire Cart & Release All Holds
# -------------------------------------------------------------
@router.delete("/clear")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    r=Depends(get_redis),
):
    cart_key = get_cart_key(current_user.id)
    raw_items = await r.lrange(cart_key, 0, -1)

    for item_str in raw_items:
        item = json.loads(item_str)
        if item["item_type"] == "FERRY":
            await r.delete(f"ferry:hold:{item['schedule_id']}:{item['seat_number']}")
        elif item["item_type"] == "ATTRACTION":
            slot_hold_key = f"slot_hold_count:{item['slot_id']}"
            cur = int(await r.get(slot_hold_key) or 0)
            if cur > 0:
                await r.decr(slot_hold_key)

    await r.delete(cart_key)
    return {"status": "CLEARED", "message": "Cart emptied and all inventory holds released"}


# -------------------------------------------------------------
# 5. Checkout: Create PostgreSQL Order with All Items
# -------------------------------------------------------------
@router.post("/checkout", response_model=CheckoutResponse)
async def checkout_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    cart_key = get_cart_key(current_user.id)
    raw_items = await r.lrange(cart_key, 0, -1)

    if not raw_items:
        raise HTTPException(status_code=400, detail="Your cart is empty or has expired (10-minute timeout)")

    gross_total = 0.0
    order_items_to_create = []

    order_ref = f"AN-2026-ORD-{random.randint(10000, 99999)}"

    order = Order(
        order_ref=order_ref,
        user_id=current_user.id,
        channel="WEB",
        gross_amount=0.0,
        tax_amount=0.0,
        net_payable=0.0,
        status="PENDING_PAYMENT",
    )
    db.add(order)
    await db.flush()

    for position, item_str in enumerate(raw_items):
        item = json.loads(item_str)
        item_price = float(item["price"])
        gross_total += item_price
        p_info = item["passenger"]

        oi = OrderItem(
            order_id=order.id,
            position=position,
            item_type=item["item_type"],
            attraction_slot_id=uuid.UUID(item["slot_id"]) if item["item_type"] == "ATTRACTION" else None,
            ferry_seat_id=uuid.UUID(item["seat_id"]) if item["item_type"] == "FERRY" else None,
            title=item["title"],
            slot_or_seat_info=item["slot_or_seat"],
            unit_price=item_price,
            quantity=1,
            subtotal=item_price,
            passenger_name=p_info["name"],
            passenger_age=p_info.get("age"),
            passenger_gender=p_info.get("gender"),
            id_type=p_info["id_type"],
            id_number=p_info["id_number"],
            nationality=item.get("nationality"),
        )
        order_items_to_create.append(oi)

    tax_total = round(gross_total * 0.05, 2)
    net_total = round(gross_total + tax_total, 2)

    order.gross_amount = gross_total
    order.tax_amount = tax_total
    order.net_payable = net_total

    db.add_all(order_items_to_create)
    await db.commit()

    # Cart is now converted into an order — clear it so it can't be checked out
    # again. Inventory holds (slot_hold_count / ferry:hold) are left in place
    # since this order's items are still reserved pending payment.
    await r.delete(cart_key)

    return CheckoutResponse(
        order_id=str(order.id),
        order_ref=order.order_ref,
        status=order.status,
        gross_amount=float(order.gross_amount),
        tax_amount=float(order.tax_amount),
        net_payable=float(order.net_payable),
        items_count=len(order_items_to_create),
        message="Order created successfully. Proceed to payment gateway.",
    )


async def get_cart_summary(user_id: uuid.UUID, r) -> CartSummaryResponse:
    cart_key = get_cart_key(user_id)
    raw_items = await r.lrange(cart_key, 0, -1)
    ttl = await r.ttl(cart_key)

    items = []
    gross = 0.0

    for item_str in raw_items:
        d = json.loads(item_str)
        p = float(d["price"])
        gross += p
        items.append(
            CartItemResponse(
                cart_item_id=d["cart_item_id"],
                item_type=d["item_type"],
                title=d["title"],
                slot_or_seat=d["slot_or_seat"],
                price=p,
                passenger_name=d["passenger"]["name"],
                id_type=d["passenger"]["id_type"],
                id_number=d["passenger"]["id_number"],
                slot_id=d.get("slot_id") if d["item_type"] == "ATTRACTION" else None,
            )
        )

    gst = round(gross * 0.05, 2)
    net = round(gross + gst, 2)

    return CartSummaryResponse(
        items=items,
        gross_amount=gross,
        gst_tax_amount=gst,
        net_payable=net,
        expires_in_seconds=max(0, ttl),
    )
