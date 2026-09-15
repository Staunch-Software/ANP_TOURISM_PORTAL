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

    items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    order_items = items_res.scalars().all()

    tickets_to_create = []

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

        ticket_ref = f"AN-2026-TKT-{random.randint(100000, 999999)}"

        payload_dict = {
            "ref": ticket_ref,
            "typ": item.item_type,
            "ttl": item.title,
            "sub": item.slot_or_seat_info,
            "pax": item.passenger_name,
            "doc": f"{item.id_type}:{item.id_number[-4:]}",
            "iss": "ANIIDCO_GOVT_AN",
            "iat": int(datetime.utcnow().timestamp()),
        }

        compact_json, signature_b64 = sign_ticket_payload(payload_dict)

        ticket = Ticket(
            ticket_ref=ticket_ref,
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
