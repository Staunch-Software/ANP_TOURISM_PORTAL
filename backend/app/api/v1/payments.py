import random
import os
import hmac
import hashlib
import razorpay
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.attraction import AttractionSlot
from app.models.ferry import FerrySeat
from app.models.ticket import Ticket
from app.models.admin_alert import AdminAlert
from app.api.v1.auth import get_current_user
from app.services.crypto_service import sign_ticket_payload
from app.services.email_service import send_ticket_confirmation
from app.schemas.payment import (
    PaymentConfirmRequest, PaymentConfirmResponse, 
    RazorpayOrderRequest, RazorpayOrderResponse, RefundRequest
)

router = APIRouter(prefix="/payments", tags=["Payment & Ticket Issuance"])
from app.core.config import settings

# Initialize Razorpay client
# In production, these should be securely loaded from env variables
razorpay_client = razorpay.Client(
    auth=(
        settings.RAZORPAY_KEY_ID, 
        settings.RAZORPAY_KEY_SECRET
    )
)

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


@router.post("/create-order", response_model=RazorpayOrderResponse)
async def create_razorpay_order(
    req: RazorpayOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Order).where(Order.order_ref == req.order_ref, Order.user_id == current_user.id)
    )
    order = res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order reference not found")
        
    if order.status == "CONFIRMED":
        raise HTTPException(status_code=400, detail="Order has already been paid")

    try:
        # Create Razorpay Order
        rzp_order = razorpay_client.order.create({
            "amount": int(order.net_payable * 100), # amount in paise
            "currency": "INR",
            "receipt": order.order_ref,
            "notes": {
                "user_id": str(current_user.id)
            }
        })
        
        return RazorpayOrderResponse(
            success=True,
            order_id=rzp_order["id"],
            amount=float(order.net_payable),
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")


@router.post("/confirm", response_model=PaymentConfirmResponse)
async def confirm_payment_and_issue_tickets(
    req: PaymentConfirmRequest,
    background_tasks: BackgroundTasks,
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

    # Verify Razorpay signature
    try:
        msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
        secret = settings.RAZORPAY_KEY_SECRET
        expected_signature = hmac.new(
            secret.encode(), 
            msg.encode(), 
            hashlib.sha256
        ).hexdigest()

        if expected_signature != req.razorpay_signature:
            order.status = "FAILED"
            await db.commit()
            raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

    items_res = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id).order_by(OrderItem.position)
    )
    order_items = items_res.scalars().all()

    for item in order_items:
        await _check_repeat_booking_fraud(db, item)

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

    # Compress items for QR payload to avoid huge QR codes for group bookings.
    # The LPU's scan.py adopts these offline using the `qty` field.
    from collections import OrderedDict
    payload_items_dict = OrderedDict()
    for item in order_items:
        key = (item.item_type, item.title, item.slot_or_seat_info)
        if key not in payload_items_dict:
            payload_items_dict[key] = {"typ": item.item_type, "ttl": item.title, "sub": item.slot_or_seat_info, "qty": 0}
        payload_items_dict[key]["qty"] += 1

    payload_dict = {
        "ref": booking_ref,
        "items": list(payload_items_dict.values()),
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
    order.razorpay_payment_id = req.razorpay_payment_id
    db.add_all(tickets_to_create)
    await db.commit()
    
    # Send email in background
    background_tasks.add_task(
        send_ticket_confirmation,
        current_user.email,
        order.order_ref,
        tickets_to_create
    )

    await r.delete(f"cart:{str(current_user.id)}")

    return PaymentConfirmResponse(
        order_ref=order.order_ref,
        order_status=order.status,
        tickets_issued_count=len(tickets_to_create),
        total_paid=float(order.net_payable),
        message="Payment verified successfully. A single Unified QR boarding pass has been generated for this order!",
    )


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        body = await request.body()
        signature = request.headers.get("X-Razorpay-Signature")
        
        expected_signature = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(), 
            body, 
            hashlib.sha256
        ).hexdigest()

        if expected_signature != signature:
            raise HTTPException(status_code=400, detail="Invalid Webhook Signature")

        event = await request.json()

        if event.get("event") == "payment.captured":
            payment_entity = event["payload"]["payment"]["entity"]
            order_ref = payment_entity["notes"].get("receipt")
            
            # Additional fallback logic could go here to mark orders as PAID 
            # if the user disconnected before reaching the `/confirm` endpoint.
            print(f"Webhook received: Payment captured for {order_ref}")

        elif event.get("event") == "payment.failed":
            payment_entity = event["payload"]["payment"]["entity"]
            print(f"Webhook received: Payment failed for {payment_entity.get('order_id')}")

        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-refund")
async def process_refund(
    req: RefundRequest,
    current_user: User = Depends(get_current_user),
):
    # Security: Ensure only authorized admins/system can trigger refunds
    if current_user.role not in ["ADMIN", "AGENCY_SUPPORT"]:
        raise HTTPException(status_code=403, detail="Not authorized to process refunds")

    try:
        refund = razorpay_client.payment.refund(req.payment_id, {
            "amount": int(req.amount * 100),
            "speed": "normal",
            "notes": {
                "reason": req.reason
            }
        })
        return {"success": True, "refund": refund}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process refund: {str(e)}")

