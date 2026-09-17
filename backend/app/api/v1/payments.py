import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.attraction import AttractionSlot
from app.models.ferry import FerrySeat
from app.models.ticket import Ticket
from app.api.v1.auth import get_current_user
from app.services.crypto_service import sign_ticket_payload
from app.schemas.payment import PaymentConfirmRequest, PaymentConfirmResponse

router = APIRouter(prefix="/payments", tags=["Payment & Ticket Issuance"])


@router.post("/confirm", response_model=PaymentConfirmResponse)
async def confirm_payment_and_issue_tickets(
    req: PaymentConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    res = await db.execute(
        select(Order).where(Order.order_ref == req.order_ref, Order.user_id == current_user.id)
    )
    order = res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order reference not found")

    if order.status == "CONFIRMED":
        raise HTTPException(status_code=400, detail="Order has already been paid and tickets are issued")

    if not req.mock_success:
        order.status = "FAILED"
        await db.commit()
        raise HTTPException(status_code=400, detail="Payment declined by bank")

    items_res = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.position)
    )
    order_items = items_res.scalars().all()

    for item in order_items:
        if item.item_type == "FERRY" and item.ferry_seat_id:
            seat_res = await db.execute(select(FerrySeat).where(FerrySeat.id == item.ferry_seat_id))
            seat = seat_res.scalars().first()
            if seat:
                seat.is_booked = True
                await r.delete(f"ferry:hold:{str(seat.schedule_id)}:{seat.seat_number}")

        elif item.item_type == "ATTRACTION" and item.attraction_slot_id:
            slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == item.attraction_slot_id))
            slot = slot_res.scalars().first()
            if slot:
                slot.booked_count += 1
                slot_hold_key = f"slot_hold_count:{str(slot.id)}"
                cur = int(await r.get(slot_hold_key) or 0)
                if cur > 0:
                    await r.decr(slot_hold_key)

    # One booking -> one signed QR covering every attraction in the order
    # (RFP p.28: "A Unified QR code can be utilized for a single booking
    # transaction across multiple attractions"), instead of a separate QR
    # per attraction. All passengers in a multi-item booking share one QR
    # scanned once per attraction, so the payload is keyed on the FIRST
    # passenger for "pax"/"doc" -- individual passenger details per leg
    # still live on each Ticket row for the wallet/admin views.
    booking_ref = order.order_ref
    head_item = order_items[0]

    payload_dict = {
        "ref": booking_ref,
        "items": [
            {"typ": item.item_type, "ttl": item.title, "sub": item.slot_or_seat_info}
            for item in order_items
        ],
        "pax": head_item.passenger_name,
        "doc": f"{head_item.id_type}:{head_item.id_number[-4:]}",
        "iss": "ANIIDCO_GOVT_AN",
        "iat": int(datetime.utcnow().timestamp()),
    }
    compact_json, signature_b64 = sign_ticket_payload(payload_dict)

    tickets_to_create = []
    for item_index, item in enumerate(order_items):
        ticket_ref = f"AN-2026-TKT-{random.randint(100000, 999999)}"
        ticket = Ticket(
            ticket_ref=ticket_ref,
            booking_ref=booking_ref,
            item_index=item_index,
            order_id=order.id,
            order_item_id=item.id,
            user_id=current_user.id,
            item_type=item.item_type,
            title=item.title,
            slot_or_seat_info=item.slot_or_seat_info,
            passenger_name=item.passenger_name,
            passenger_age=item.passenger_age,
            passenger_gender=item.passenger_gender,
            id_type=item.id_type,
            id_number=item.id_number,
            qr_payload_json=compact_json,
            qr_signature_b64=signature_b64,
            check_in_status="ISSUED",
            issued_by="CLOUD",
        )
        tickets_to_create.append(ticket)

    order.status = "CONFIRMED"
    db.add_all(tickets_to_create)
    await db.commit()

    await r.delete(f"cart:{str(current_user.id)}")

    return PaymentConfirmResponse(
        order_ref=order.order_ref,
        order_status=order.status,
        tickets_issued_count=len(tickets_to_create),
        total_paid=float(order.net_payable),
        message="Payment verified successfully. Boarding passes and QR tickets generated!",
    )
