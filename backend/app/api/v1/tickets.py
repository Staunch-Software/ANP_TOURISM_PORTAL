import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.order_pass import OrderPass
from app.models.attraction import AttractionSlot
from app.models.ferry import FerrySeat, FerrySchedule
from app.api.v1.auth import get_current_user
from app.api.v1.admin import verify_staff_role
from app.services.crypto_service import verify_ticket_offline, get_public_key_hex
from app.schemas.ticket import (
    OrderPassResponse,
    EntitlementResponse,
    OfflineVerificationResponse,
    StaffCheckInRequest,
    StaffCheckInResponse,
)

router = APIRouter(prefix="/tickets", tags=["Digital Pass Wallet & Offline Verification"])

# RFP Clause 7.2.1-9 (Page 29): "QR codes on the tickets must be
# time-sensitive to prevent validation outside the designated slot or
# time of bookings." A grace window around the booked slot/departure
# avoids rejecting a tourist who arrives a few minutes early or late.
ENTRY_GRACE_BEFORE_MINUTES = 30
ENTRY_GRACE_AFTER_MINUTES = 15


def _format_12h(t) -> str:
    return t.strftime("%I:%M %p").lstrip("0")


def _entitlement_to_response(item: OrderItem) -> EntitlementResponse:
    return EntitlementResponse(
        order_item_id=str(item.id),
        item_type=item.item_type,
        title=item.title,
        slot_or_seat_info=item.slot_or_seat_info,
        passenger_name=item.passenger_name,
        id_type=item.id_type,
        id_number=item.id_number,
        check_in_status=item.check_in_status,
    )


async def _get_entry_window(db: AsyncSession, item: OrderItem) -> Optional[Tuple[datetime, datetime, str, str]]:
    """Returns (window_start, window_end, slot_start_label, slot_end_label)
    for this entitlement's booked slot/departure, or None if it can't be
    determined (fails open rather than blocking a valid entry)."""
    if item.attraction_slot_id:
        slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == item.attraction_slot_id))
        slot = slot_res.scalars().first()
        if not slot:
            return None
        slot_date = datetime.strptime(slot.slot_date, "%Y-%m-%d").date()
        start_time = datetime.strptime(slot.start_time, "%H:%M").time()
        end_time = datetime.strptime(slot.end_time, "%H:%M").time()
        slot_start = datetime.combine(slot_date, start_time)
        slot_end = datetime.combine(slot_date, end_time)
        return (
            slot_start - timedelta(minutes=ENTRY_GRACE_BEFORE_MINUTES),
            slot_end + timedelta(minutes=ENTRY_GRACE_AFTER_MINUTES),
            _format_12h(start_time),
            _format_12h(end_time),
        )

    if item.ferry_seat_id:
        seat_res = await db.execute(select(FerrySeat).where(FerrySeat.id == item.ferry_seat_id))
        seat = seat_res.scalars().first()
        if not seat:
            return None
        sched_res = await db.execute(select(FerrySchedule).where(FerrySchedule.id == seat.schedule_id))
        sched = sched_res.scalars().first()
        if not sched:
            return None
        slot_start = datetime.combine(sched.departure_date, sched.departure_time)
        return (
            slot_start - timedelta(minutes=ENTRY_GRACE_BEFORE_MINUTES),
            slot_start + timedelta(minutes=ENTRY_GRACE_AFTER_MINUTES),
            _format_12h(sched.departure_time),
            _format_12h(sched.departure_time),
        )

    return None


# 1. Tourist Wallet: View All My Unified QR Passes
@router.get("/my-passes", response_model=List[OrderPassResponse])
async def get_my_passes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(OrderPass, Order)
        .join(Order, OrderPass.order_id == Order.id)
        .where(OrderPass.user_id == current_user.id)
        .order_by(OrderPass.created_at.desc())
    )
    rows = res.all()

    passes = []
    for order_pass, order in rows:
        items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        items = items_res.scalars().all()
        qr_combined = f"{order_pass.qr_payload_json}|SIG:{order_pass.qr_signature_b64}"
        passes.append(
            OrderPassResponse(
                pass_ref=order_pass.pass_ref,
                order_ref=order.order_ref,
                lead_passenger_name=order_pass.lead_passenger_name,
                qr_token=qr_combined,
                entitlements=[_entitlement_to_response(i) for i in items],
            )
        )
    return passes


# 2. Public Key Endpoint (Used by Gate Turnstiles to pre-download the public key)
@router.get("/public-key")
async def get_offline_scanner_public_key():
    return {
        "algorithm": "Ed25519",
        "public_key_hex": get_public_key_hex(),
        "description": "Bake this public key into Android scanners & turnstiles for 100% offline verification",
    }


# 3. The Offline Gate Proof Endpoint (Simulates what happens at the turnstile) —
# read-only: verifies the pass signature and reports each entitlement's live
# status, without changing anything. The actual admit/deny state change
# happens at /staff/check-in.
@router.get("/{pass_ref}/verify-offline", response_model=OfflineVerificationResponse)
async def simulate_offline_gate_scan(
    pass_ref: str,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(OrderPass).where(OrderPass.pass_ref == pass_ref))
    order_pass = res.scalars().first()
    if not order_pass:
        raise HTTPException(status_code=404, detail="Pass reference not found")

    is_valid = verify_ticket_offline(order_pass.qr_payload_json, order_pass.qr_signature_b64)

    items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order_pass.order_id))
    items = items_res.scalars().all()

    return OfflineVerificationResponse(
        pass_ref=order_pass.pass_ref,
        lead_passenger_name=order_pass.lead_passenger_name,
        is_signature_valid=is_valid,
        verification_mode="100% OFFLINE MATHEMATICAL PROOF (Ed25519)",
        entitlements=[_entitlement_to_response(i) for i in items],
    )


# 4. Staff Gate/Turnstile Check-In (Ferry Operator, Vendor, or Admin) —
# consumes exactly ONE entitlement within the Unified QR pass, leaving the
# rest of the pass valid for the other gates/attractions in the same order.
@router.post("/staff/check-in", response_model=StaffCheckInResponse)
async def staff_check_in_ticket(
    payload: StaffCheckInRequest,
    staff_user: User = Depends(verify_staff_role),
    db: AsyncSession = Depends(get_db),
):
    """
    RFP Page 28-29 & 49: Ground-staff entry validation against the
    Unified QR pass. Cryptographically verifies the Ed25519 signature over
    the whole pass, then transitions just the named entitlement (OrderItem)
    from ISSUED to CHECKED_IN — this per-entitlement state is what prevents
    passback fraud on that specific attraction/seat, while every other
    entitlement in the same pass stays untouched.
    """
    res = await db.execute(select(OrderPass).where(OrderPass.pass_ref == payload.pass_ref))
    order_pass = res.scalars().first()
    if not order_pass:
        raise HTTPException(status_code=404, detail="Pass reference not found")

    if not verify_ticket_offline(order_pass.qr_payload_json, order_pass.qr_signature_b64):
        raise HTTPException(status_code=400, detail="INVALID SIGNATURE: This QR code failed cryptographic verification.")

    try:
        item_uuid = uuid.UUID(payload.order_item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid entitlement (order_item_id) reference.")

    item_res = await db.execute(
        select(OrderItem).where(OrderItem.id == item_uuid, OrderItem.order_id == order_pass.order_id)
    )
    item = item_res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="This entitlement does not belong to the scanned pass.")

    if item.check_in_status == "CHECKED_IN":
        raise HTTPException(
            status_code=400,
            detail=f"PASSBACK ERROR: This entitlement was already checked in at {item.checked_in_at}.",
        )

    if item.check_in_status == "CANCELLED":
        raise HTTPException(status_code=400, detail="INVALID PASS: This entitlement was cancelled and refunded.")

    entry_window = await _get_entry_window(db, item)
    if entry_window:
        window_start, window_end, start_label, end_label = entry_window
        now = datetime.utcnow()
        if now < window_start:
            raise HTTPException(
                status_code=400,
                detail=f"TOO EARLY: This entitlement's slot begins at {start_label} (entry allowed from {_format_12h(window_start.time())}).",
            )
        if now > window_end:
            raise HTTPException(
                status_code=400,
                detail=f"EXPIRED: This entitlement's slot ended at {end_label}. No longer valid.",
            )

    item.check_in_status = "CHECKED_IN"
    item.checked_in_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)

    siblings_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order_pass.order_id))
    siblings = siblings_res.scalars().all()

    return StaffCheckInResponse(
        check_in_status=item.check_in_status,
        pass_ref=order_pass.pass_ref,
        order_item_id=str(item.id),
        passenger_name=item.passenger_name,
        item_type=item.item_type,
        title=item.title,
        slot_or_seat_info=item.slot_or_seat_info,
        message="Valid entitlement verified. Entry granted.",
        remaining_entitlements=[_entitlement_to_response(i) for i in siblings],
    )
