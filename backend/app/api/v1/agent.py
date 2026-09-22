import random
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.attraction import Attraction, AttractionSlot
from app.models.ferry import FerrySchedule, FerrySeat, Vessel
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.services.crypto_service import sign_ticket_payload
from app.schemas.agent import (
    AgentBookingRequest,
    AgentBookingResponse,
    AgentBookingSummary,
    AgentFerryBookingRequest,
)

router = APIRouter(prefix="/agent", tags=["Ticket Aggregator / Agent Sync API"])

# RFP Page 27, "Booking by Ticket Aggregators": "Create a secure API that
# can be shared with approved Agents wishing to develop their own website
# or application for ticket bookings." An approved agent's own backend
# authenticates with this static key (X-API-Key header) instead of a
# user-facing JWT -- there's no browser session to log into on their side.


async def get_agent_by_api_key(
    x_api_key: str = Header(..., description="The API key issued when your Ticket Aggregator application was approved"),
    db: AsyncSession = Depends(get_db),
) -> User:
    res = await db.execute(select(User).where(User.api_key == x_api_key))
    agent = res.scalars().first()
    if not agent or agent.user_type != "AGENT" or agent.approval_status != "APPROVED":
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    if not agent.is_active:
        raise HTTPException(status_code=403, detail="This agent account has been suspended.")
    return agent


@router.post("/api/book-attraction", response_model=AgentBookingResponse)
async def agent_book_attraction(
    req: AgentBookingRequest,
    agent: User = Depends(get_agent_by_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    One-call booking for an agent's own website/app integration --
    no cart/hold step, since the agent's system has already decided to
    book on the traveller's behalf. Issues the same signed, tamper-proof
    QR ticket a direct web booking would get.
    """
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

    available = slot.total_capacity - slot.booked_count
    if available < 1:
        raise HTTPException(status_code=409, detail="This time slot is completely full")

    price = float(attraction.foreign_price_inr if req.nationality.upper() == "FOREIGN" else attraction.base_price_inr)
    slot_or_seat_info = f"{slot.slot_date} ({slot.start_time} - {slot.end_time})"

    order_ref = f"AN-2026-ORD-{random.randint(100000, 999999)}"
    order = Order(
        order_ref=order_ref,
        user_id=agent.id,
        channel="AGENT_API",
        gross_amount=price,
        net_payable=price,
        status="CONFIRMED",
    )
    db.add(order)
    await db.flush()

    item = OrderItem(
        order_id=order.id,
        position=0,
        item_type="ATTRACTION",
        attraction_slot_id=slot.id,
        title=attraction.title,
        slot_or_seat_info=slot_or_seat_info,
        unit_price=price,
        quantity=1,
        subtotal=price,
        passenger_name=req.passenger.name,
        passenger_age=req.passenger.age,
        passenger_gender=req.passenger.gender,
        id_type=req.passenger.id_type,
        id_number=req.passenger.id_number,
    )
    db.add(item)
    slot.booked_count += 1
    await db.flush()

    payload_dict = {
        "ref": order_ref,
        "items": [{"typ": "ATTRACTION", "ttl": attraction.title, "sub": slot_or_seat_info}],
        "pax": req.passenger.name,
        "doc": f"{req.passenger.id_type}:{req.passenger.id_number[-4:]}",
        "iss": "ANIIDCO_GOVT_AN",
        "iat": int(datetime.utcnow().timestamp()),
    }
    compact_json, signature_b64 = sign_ticket_payload(payload_dict)

    ticket_ref = f"AN-2026-TKT-{random.randint(100000, 999999)}"
    ticket = Ticket(
        ticket_ref=ticket_ref,
        booking_ref=order_ref,
        item_index=0,
        order_id=order.id,
        order_item_id=item.id,
        user_id=agent.id,
        item_type="ATTRACTION",
        title=attraction.title,
        slot_or_seat_info=slot_or_seat_info,
        passenger_name=req.passenger.name,
        passenger_age=req.passenger.age,
        passenger_gender=req.passenger.gender,
        id_type=req.passenger.id_type,
        id_number=req.passenger.id_number,
        qr_payload_json=compact_json,
        qr_signature_b64=signature_b64,
        check_in_status="ISSUED",
        issued_by="AGENT_API",
    )
    db.add(ticket)
    await db.commit()

    return AgentBookingResponse(
        booking_ref=order_ref,
        ticket_ref=ticket_ref,
        title=attraction.title,
        slot_or_seat_info=slot_or_seat_info,
        amount_charged_inr=price,
        message="Booking confirmed. Settlement with ANIIDCO follows your agency's agreed billing cycle.",
    )


@router.post("/api/book-ferry-seat", response_model=AgentBookingResponse)
async def agent_book_ferry_seat(
    req: AgentFerryBookingRequest,
    agent: User = Depends(get_agent_by_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    RFP Page 27: the required stakeholder study explicitly names ferry
    operators alongside water sports/tourism service providers as
    services an approved agent must be able to book -- this is that
    ferry-side equivalent of POST /agent/api/book-attraction.
    """
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

    price = float(seat.price_inr)
    title = f"Ferry: {vessel.name} ({schedule.source_port} -> {schedule.destination_port})"
    slot_or_seat_info = f"Seat {seat.seat_number} ({seat.cabin_class}) - {schedule.departure_date} {schedule.departure_time}"

    order_ref = f"AN-2026-ORD-{random.randint(100000, 999999)}"
    order = Order(
        order_ref=order_ref,
        user_id=agent.id,
        channel="AGENT_API",
        gross_amount=price,
        net_payable=price,
        status="CONFIRMED",
    )
    db.add(order)
    await db.flush()

    item = OrderItem(
        order_id=order.id,
        position=0,
        item_type="FERRY",
        ferry_seat_id=seat.id,
        title=title,
        slot_or_seat_info=slot_or_seat_info,
        unit_price=price,
        quantity=1,
        subtotal=price,
        passenger_name=req.passenger.name,
        passenger_age=req.passenger.age,
        passenger_gender=req.passenger.gender,
        id_type=req.passenger.id_type,
        id_number=req.passenger.id_number,
    )
    db.add(item)
    seat.is_booked = True
    await db.flush()

    payload_dict = {
        "ref": order_ref,
        "items": [{"typ": "FERRY", "ttl": title, "sub": slot_or_seat_info}],
        "pax": req.passenger.name,
        "doc": f"{req.passenger.id_type}:{req.passenger.id_number[-4:]}",
        "iss": "ANIIDCO_GOVT_AN",
        "iat": int(datetime.utcnow().timestamp()),
    }
    compact_json, signature_b64 = sign_ticket_payload(payload_dict)

    ticket_ref = f"AN-2026-TKT-{random.randint(100000, 999999)}"
    ticket = Ticket(
        ticket_ref=ticket_ref,
        booking_ref=order_ref,
        item_index=0,
        order_id=order.id,
        order_item_id=item.id,
        user_id=agent.id,
        item_type="FERRY",
        title=title,
        slot_or_seat_info=slot_or_seat_info,
        passenger_name=req.passenger.name,
        passenger_age=req.passenger.age,
        passenger_gender=req.passenger.gender,
        id_type=req.passenger.id_type,
        id_number=req.passenger.id_number,
        qr_payload_json=compact_json,
        qr_signature_b64=signature_b64,
        check_in_status="ISSUED",
        issued_by="AGENT_API",
    )
    db.add(ticket)
    await db.commit()

    return AgentBookingResponse(
        booking_ref=order_ref,
        ticket_ref=ticket_ref,
        title=title,
        slot_or_seat_info=slot_or_seat_info,
        amount_charged_inr=price,
        message="Ferry booking confirmed. Settlement with ANIIDCO follows your agency's agreed billing cycle.",
    )


@router.get("/api/bookings", response_model=list[AgentBookingSummary])
async def agent_booking_history(
    agent: User = Depends(get_agent_by_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Every booking this agent's key has created — for their own
    reconciliation against ANIIDCO's periodic settlement."""
    res = await db.execute(
        select(Order, OrderItem, Ticket)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .join(Ticket, Ticket.order_item_id == OrderItem.id)
        .where(Order.user_id == agent.id, Order.channel == "AGENT_API")
        .order_by(Order.created_at.desc())
    )
    rows = res.all()

    return [
        AgentBookingSummary(
            order_ref=order.order_ref,
            title=item.title,
            slot_or_seat_info=item.slot_or_seat_info,
            passenger_name=item.passenger_name,
            amount_inr=float(item.subtotal),
            check_in_status=ticket.check_in_status,
            created_at=str(order.created_at),
        )
        for order, item, ticket in rows
    ]
