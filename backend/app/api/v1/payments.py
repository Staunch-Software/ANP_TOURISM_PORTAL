import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.attraction import AttractionSlot
from app.models.ferry import FerrySeat
from app.models.order_pass import OrderPass
from app.models.admin_alert import AdminAlert
from app.api.v1.auth import get_current_user
from app.services.crypto_service import sign_ticket_payload
from app.schemas.payment import PaymentConfirmRequest, PaymentConfirmResponse

router = APIRouter(prefix="/payments", tags=["Payment & Ticket Issuance"])

# RFP Group Bookings Clause V: "alert and report to ANIIDCO regarding
# multiple bookings from the same ID ... who have reserved the same
# attractions within a timeframe of 1 to 3 months." We use the shorter
# end of that window (60 days) and flag rather than block, since the RFP
# language is "alert and report", not "prevent".
REPEAT_BOOKING_WINDOW_DAYS = 60
REPEAT_BOOKING_THRESHOLD = 3


async def _check_repeat_booking_fraud(db: AsyncSession, item: OrderItem) -> None:
    window_start = datetime.utcnow() - timedelta(days=REPEAT_BOOKING_WINDOW_DAYS)

    count_res = await db.execute(
        select(func.count(OrderItem.id))
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.id_number == item.id_number,
            OrderItem.title == item.title,
            Order.status == "CONFIRMED",
            Order.created_at >= window_start,
        )
    )
    prior_count = int(count_res.scalar() or 0)

    if prior_count >= REPEAT_BOOKING_THRESHOLD:
        item.fraud_flag = "SUSPICIOUS_REPEAT_BOOKING"
        db.add(
            AdminAlert(
                alert_type="SUSPICIOUS_REPEAT_BOOKING",
                message=(
                    f"Govt ID {item.id_type}:{item.id_number[-4:]} has booked "
                    f"'{item.title}' {prior_count + 1} times in the last "
                    f"{REPEAT_BOOKING_WINDOW_DAYS} days (passenger: {item.passenger_name})."
                ),
                related_order_id=item.order_id,
            )
        )


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

    for item in order_items:
        await _check_repeat_booking_fraud(db, item)
        item.check_in_status = "ISSUED"

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

    # RFP Clause 7.2.1-9 / Page 49: one Unified QR pass per order, covering
    # every entitlement (order item) in a single Ed25519 signature. A gate
    # scans this once and checks off only the entitlement relevant to it —
    # see /tickets/staff/check-in — leaving the rest of the pass valid.
    pass_ref = f"AN-2026-PASS-{random.randint(100000, 999999)}"
    lead_passenger_name = order_items[0].passenger_name if order_items else (current_user.full_name or "Valued Tourist")

    payload_dict = {
        "ref": pass_ref,
        "order_ref": order.order_ref,
        "lead_pax": lead_passenger_name,
        "iss": "ANIIDCO_GOVT_AN",
        "iat": int(datetime.utcnow().timestamp()),
        "entitlements": [
            {
                "item_id": str(item.id),
                "typ": item.item_type,
                "ttl": item.title,
                "sub": item.slot_or_seat_info,
                "pax": item.passenger_name,
                "doc": f"{item.id_type}:{item.id_number[-4:]}",
            }
            for item in order_items
        ],
    }
    compact_json, signature_b64 = sign_ticket_payload(payload_dict)

    order_pass = OrderPass(
        pass_ref=pass_ref,
        order_id=order.id,
        user_id=current_user.id,
        lead_passenger_name=lead_passenger_name,
        qr_payload_json=compact_json,
        qr_signature_b64=signature_b64,
    )

    order.status = "CONFIRMED"
    db.add(order_pass)
    await db.commit()

    await r.delete(f"cart:{str(current_user.id)}")

    return PaymentConfirmResponse(
        order_ref=order.order_ref,
        order_status=order.status,
        tickets_issued_count=len(order_items),
        total_paid=float(order.net_payable),
        message="Payment verified successfully. A single Unified QR boarding pass has been generated for this order!",
    )
