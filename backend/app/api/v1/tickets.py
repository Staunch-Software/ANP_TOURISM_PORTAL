import random
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.models.attraction import Attraction, AttractionSlot
from app.models.ferry import FerrySeat, FerrySchedule
from app.models.reschedule import RescheduleRequest
from app.api.v1.auth import get_current_user
from app.api.v1.payments import razorpay_client
from app.models.order import Order
from app.api.v1.admin import verify_staff_role
from app.services.crypto_service import verify_ticket_offline, get_public_key_hex
from app.schemas.ticket import (
    OrderPassResponse,
    EntitlementResponse,
    OfflineVerificationResponse,
    StaffCheckInRequest,
    StaffCheckInResponse,
    UpgradeToExpressResponse,
    RescheduleRequestCreate,
    RescheduleRequestSummary,
)
from app.schemas.attraction import SlotResponse

# RFP p.28: default Express markup when an attraction has no
# express_price_inr configured, so the upgrade feature isn't blocked by
# missing catalog data.
DEFAULT_EXPRESS_MARKUP = 1.5

router = APIRouter(prefix="/tickets", tags=["Digital Pass Wallet & Offline Verification"])

# RFP Clause 7.2.1-9 (Page 29): "QR codes on the tickets must be
# time-sensitive to prevent validation outside the designated slot or
# time of bookings." A grace window around the booked slot/departure
# avoids rejecting a tourist who arrives a few minutes early or late.
ENTRY_GRACE_BEFORE_MINUTES = 30
ENTRY_GRACE_AFTER_MINUTES = 15

# Distinguishes a check-in performed through this web console from one
# an LPU pushed via POST /sync/checkins (which records the LPU's own real
# site_id) — see Ticket.site_id.
WEB_CONSOLE_SITE_ID = "WEB-CONSOLE"


def _format_12h(t) -> str:
    return t.strftime("%I:%M %p").lstrip("0")


def _entitlement_to_response(ticket: Ticket) -> EntitlementResponse:
    return EntitlementResponse(
        ticket_ref=ticket.ticket_ref,
        item_type=ticket.item_type,
        title=ticket.title,
        slot_or_seat_info=ticket.slot_or_seat_info,
        passenger_name=ticket.passenger_name,
        id_type=ticket.id_type,
        id_number=ticket.id_number,
        check_in_status=ticket.check_in_status,
        ticket_tier=ticket.ticket_tier,
    )


async def _get_entry_window(db: AsyncSession, ticket: Ticket) -> Optional[Tuple[datetime, datetime, str, str]]:
    """Returns (window_start, window_end, slot_start_label, slot_end_label)
    for this ticket's booked slot/departure, or None if it can't be
    determined (fails open rather than blocking a valid entry)."""
    item_res = await db.execute(select(OrderItem).where(OrderItem.id == ticket.order_item_id))
    item = item_res.scalars().first()
    if not item:
        return None

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
        select(Ticket)
        .where(Ticket.user_id == current_user.id)
        .order_by(Ticket.created_at.desc(), Ticket.item_index.asc())
    )
    tickets = res.scalars().all()

    bookings: dict[str, list[Ticket]] = {}
    order_refs: dict[str, str] = {}
    for t in tickets:
        key = t.booking_ref or t.ticket_ref
        bookings.setdefault(key, []).append(t)

    passes = []
    for booking_ref, legs in bookings.items():
        head = legs[0]
        qr_combined = f"{head.qr_payload_json}|SIG:{head.qr_signature_b64}"
        passes.append(
            OrderPassResponse(
                booking_ref=booking_ref,
                order_ref=booking_ref,
                lead_passenger_name=head.passenger_name,
                qr_token=qr_combined,
                entitlements=[_entitlement_to_response(t) for t in legs],
            )
        )
    return passes


# 2. Public Key Endpoint (Used by Gate Turnstiles to pre-download the public key)
@router.get("/public-key")
async def get_offline_scanner_public_key():
    return {
        "algorithm": "Ed25519",
        "public_key_hex": get_public_key_hex(),
        "lpu_fleet_public_key_hex": settings.LPU_ED25519_PUBLIC_KEY_HEX or None,
        "description": (
            "Bake public_key_hex into Android scanners & turnstiles for 100% offline "
            "verification of web/app-issued tickets. lpu_fleet_public_key_hex additionally "
            "verifies tickets issued offline at an LPU counter, signed with the LPU fleet's "
            "own key -- both are needed to accept every valid ticket at a gate."
        ),
    }


# 3. The Offline Gate Proof Endpoint (Simulates what happens at the turnstile) —
# read-only: verifies the booking's shared signature and reports each
# entitlement's live status, without changing anything. The actual
# admit/deny state change happens at /staff/check-in.
@router.get("/{booking_ref}/verify-offline", response_model=OfflineVerificationResponse)
async def simulate_offline_gate_scan(
    booking_ref: str,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket).where(Ticket.booking_ref == booking_ref).order_by(Ticket.item_index.asc())
    )
    legs = res.scalars().all()
    if not legs:
        raise HTTPException(status_code=404, detail="Booking reference not found")

    head = legs[0]
    is_valid = verify_ticket_offline(head.qr_payload_json, head.qr_signature_b64)

    return OfflineVerificationResponse(
        booking_ref=booking_ref,
        lead_passenger_name=head.passenger_name,
        is_signature_valid=is_valid,
        verification_mode="100% OFFLINE MATHEMATICAL PROOF (Ed25519)",
        entitlements=[_entitlement_to_response(t) for t in legs],
    )


# 4. Staff Gate/Turnstile Check-In (Ferry Operator, Vendor, or Admin) —
# consumes exactly ONE leg (Ticket row) within the Unified QR booking,
# leaving every other leg in the same booking_ref valid. This is the web
# console's equivalent of an LPU's POST /sync/checkins push -- used when
# staff check someone in directly through the browser rather than a
# physical LPU-connected scanner.
@router.post("/staff/check-in", response_model=StaffCheckInResponse)
async def staff_check_in_ticket(
    payload: StaffCheckInRequest,
    staff_user: User = Depends(verify_staff_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Ticket).where(Ticket.ticket_ref == payload.ticket_ref))
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket reference not found")

    if not verify_ticket_offline(ticket.qr_payload_json, ticket.qr_signature_b64):
        raise HTTPException(status_code=400, detail="INVALID SIGNATURE: This QR code failed cryptographic verification.")

    if ticket.check_in_status == "CHECKED_IN":
        raise HTTPException(
            status_code=400,
            detail=f"PASSBACK ERROR: This entitlement was already checked in at {ticket.checked_in_at}.",
        )

    if ticket.check_in_status == "CANCELLED":
        raise HTTPException(status_code=400, detail="INVALID PASS: This entitlement was cancelled and refunded.")

    entry_window = await _get_entry_window(db, ticket)
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

    ticket.check_in_status = "CHECKED_IN"
    ticket.checked_in_at = datetime.utcnow()
    ticket.site_id = WEB_CONSOLE_SITE_ID
    ticket.version = (ticket.version or 1) + 1
    await db.commit()
    await db.refresh(ticket)

    siblings_res = await db.execute(
        select(Ticket).where(Ticket.booking_ref == ticket.booking_ref).order_by(Ticket.item_index.asc())
    )
    siblings = siblings_res.scalars().all()

    return StaffCheckInResponse(
        check_in_status=ticket.check_in_status,
        booking_ref=ticket.booking_ref,
        ticket_ref=ticket.ticket_ref,
        passenger_name=ticket.passenger_name,
        item_type=ticket.item_type,
        title=ticket.title,
        slot_or_seat_info=ticket.slot_or_seat_info,
        message="Valid entitlement verified. Entry granted.",
        remaining_entitlements=[_entitlement_to_response(t) for t in siblings],
    )


# 5. RFP p.28 "Upgradation/ Re-schedule of Tickets" -- self-service Express
# upgrade. Charges the price difference and flips the ticket to EXPRESS
# in place (no second ticket issued), consuming one seat from the slot's
# earmarked premium allocation. Anti-black-marketing: an already-EXPRESS
# ticket can't be "upgraded" again.
@router.post("/{ticket_ref}/upgrade-to-express", response_model=UpgradeToExpressResponse)
async def upgrade_ticket_to_express(
    ticket_ref: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket).where(Ticket.ticket_ref == ticket_ref, Ticket.user_id == current_user.id)
    )
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket reference not found")

    if ticket.item_type != "ATTRACTION":
        raise HTTPException(status_code=400, detail="Express upgrade is only available for attraction tickets")

    if ticket.check_in_status != "ISSUED":
        raise HTTPException(status_code=400, detail=f"Cannot upgrade a ticket that is {ticket.check_in_status}")

    if ticket.ticket_tier == "EXPRESS":
        raise HTTPException(status_code=400, detail="This ticket is already an Express ticket")

    item_res = await db.execute(select(OrderItem).where(OrderItem.id == ticket.order_item_id))
    item = item_res.scalars().first()
    if not item or not item.attraction_slot_id:
        raise HTTPException(status_code=400, detail="Could not locate the booked slot for this ticket")

    slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == item.attraction_slot_id))
    slot = slot_res.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.premium_booked_count >= slot.premium_capacity:
        raise HTTPException(
            status_code=400,
            detail="No Express/Premium allocation left for this slot. Try requesting a reschedule to a different slot instead.",
        )

    attraction_res = await db.execute(select(Attraction).where(Attraction.id == slot.attraction_id))
    attraction = attraction_res.scalars().first()
    if not attraction:
        raise HTTPException(status_code=404, detail="Attraction not found")

    is_foreign = ticket.id_type == "PASSPORT"
    if is_foreign:
        express_price = float(attraction.express_price_foreign_inr) if attraction.express_price_foreign_inr else float(attraction.foreign_price_inr) * DEFAULT_EXPRESS_MARKUP
    else:
        express_price = float(attraction.express_price_inr) if attraction.express_price_inr else float(attraction.base_price_inr) * DEFAULT_EXPRESS_MARKUP

    price_diff = round(express_price - float(item.unit_price), 2)
    if price_diff < 0:
        price_diff = 0.0

    upgrade_order = Order(
        order_ref=f"AN-2026-UPG-{random.randint(100000, 999999)}",
        user_id=current_user.id,
        channel="WEB",
        gross_amount=price_diff,
        tax_amount=0.00,
        net_payable=price_diff,
        status="CONFIRMED",
    )
    db.add(upgrade_order)
    await db.flush()

    db.add(
        OrderItem(
            order_id=upgrade_order.id,
            position=0,
            item_type="ATTRACTION",
            attraction_slot_id=slot.id,
            title=f"{ticket.title} - Express Upgrade",
            slot_or_seat_info=ticket.slot_or_seat_info,
            unit_price=price_diff,
            quantity=1,
            subtotal=price_diff,
            passenger_name=ticket.passenger_name,
            passenger_age=ticket.passenger_age,
            passenger_gender=ticket.passenger_gender,
            id_type=ticket.id_type,
            id_number=ticket.id_number,
        )
    )

    slot.premium_booked_count = (slot.premium_booked_count or 0) + 1
    ticket.ticket_tier = "EXPRESS"
    ticket.version = (ticket.version or 1) + 1

    await db.commit()

    return UpgradeToExpressResponse(
        ticket_ref=ticket.ticket_ref,
        ticket_tier=ticket.ticket_tier,
        amount_charged_inr=price_diff,
        message=f"Upgraded to Express! ₹{price_diff:.2f} charged for the price difference.",
    )


# 6. Lets the reschedule modal show real available slots for the SAME
# attraction as the ticket being rescheduled, without the frontend needing
# to know the attraction's id up front.
@router.get("/{ticket_ref}/reschedule-options", response_model=List[SlotResponse])
async def get_reschedule_slot_options(
    ticket_ref: str,
    date: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket).where(Ticket.ticket_ref == ticket_ref, Ticket.user_id == current_user.id)
    )
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket reference not found")
    if ticket.item_type != "ATTRACTION":
        raise HTTPException(status_code=400, detail="Reschedule is only available for attraction tickets")

    item_res = await db.execute(select(OrderItem).where(OrderItem.id == ticket.order_item_id))
    item = item_res.scalars().first()
    if not item or not item.attraction_slot_id:
        raise HTTPException(status_code=400, detail="Could not locate the booked slot for this ticket")

    current_slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == item.attraction_slot_id))
    current_slot = current_slot_res.scalars().first()
    if not current_slot:
        raise HTTPException(status_code=404, detail="Current slot not found")

    slots_res = await db.execute(
        select(AttractionSlot)
        .where(AttractionSlot.attraction_id == current_slot.attraction_id, AttractionSlot.slot_date == date)
        .order_by(AttractionSlot.start_time.asc())
    )
    slots = slots_res.scalars().all()

    return [
        SlotResponse(
            slot_id=str(s.id),
            attraction_id=str(s.attraction_id),
            slot_date=s.slot_date,
            start_time=s.start_time,
            end_time=s.end_time,
            total_capacity=s.total_capacity,
            booked_count=s.booked_count,
            available_seats=max(0, s.total_capacity - s.booked_count),
            is_available=(s.id != current_slot.id) and (s.booked_count < s.total_capacity),
        )
        for s in slots
    ]


# 7. RFP p.28: tourist-initiated request to change a purchased ticket's
# time slot. Always needs a staff decision (see admin.py's
# approve/reject-reschedule endpoints) before the ticket itself changes.
@router.post("/{ticket_ref}/reschedule-request", response_model=RescheduleRequestSummary)
async def request_ticket_reschedule(
    ticket_ref: str,
    payload: RescheduleRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket).where(Ticket.ticket_ref == ticket_ref, Ticket.user_id == current_user.id)
    )
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket reference not found")

    if ticket.item_type != "ATTRACTION":
        raise HTTPException(status_code=400, detail="Reschedule requests are only available for attraction tickets")

    if ticket.check_in_status != "ISSUED":
        raise HTTPException(status_code=400, detail=f"Cannot reschedule a ticket that is {ticket.check_in_status}")

    existing_res = await db.execute(
        select(RescheduleRequest).where(
            RescheduleRequest.ticket_id == ticket.id,
            RescheduleRequest.status == "PENDING_APPROVAL",
        )
    )
    if existing_res.scalars().first():
        raise HTTPException(status_code=400, detail="A reschedule request for this ticket is already pending approval")

    new_slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == payload.requested_slot_id))
    new_slot = new_slot_res.scalars().first()
    if not new_slot:
        raise HTTPException(status_code=404, detail="Requested slot not found")

    attraction_res = await db.execute(select(Attraction).where(Attraction.id == new_slot.attraction_id))
    attraction = attraction_res.scalars().first()

    reschedule_req = RescheduleRequest(
        request_ref=f"AN-2026-RSC-{random.randint(100000, 999999)}",
        user_id=current_user.id,
        ticket_id=ticket.id,
        requested_slot_id=new_slot.id,
        reason=payload.reason,
        status="PENDING_APPROVAL",
    )
    db.add(reschedule_req)
    await db.commit()
    await db.refresh(reschedule_req)

    return RescheduleRequestSummary(
        id=str(reschedule_req.id),
        request_ref=reschedule_req.request_ref,
        ticket_ref=ticket.ticket_ref,
        attraction_title=attraction.title if attraction else ticket.title,
        current_slot_info=ticket.slot_or_seat_info,
        requested_slot_info=f"{new_slot.slot_date} ({_format_12h(datetime.strptime(new_slot.start_time, '%H:%M').time())} - {_format_12h(datetime.strptime(new_slot.end_time, '%H:%M').time())})",
        reason=reschedule_req.reason,
        status=reschedule_req.status,
        admin_notes=reschedule_req.admin_notes,
        created_at=reschedule_req.created_at.isoformat(),
    )


# 8. Tourist: view my own reschedule request history/status.
@router.get("/reschedule-requests/my", response_model=List[RescheduleRequestSummary])
async def get_my_reschedule_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(RescheduleRequest)
        .where(RescheduleRequest.user_id == current_user.id)
        .order_by(RescheduleRequest.created_at.desc())
    )
    requests = res.scalars().all()

    summaries = []
    for rr in requests:
        ticket_res = await db.execute(select(Ticket).where(Ticket.id == rr.ticket_id))
        ticket = ticket_res.scalars().first()
        slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == rr.requested_slot_id))
        slot = slot_res.scalars().first()
        attraction = None
        if slot:
            attraction_res = await db.execute(select(Attraction).where(Attraction.id == slot.attraction_id))
            attraction = attraction_res.scalars().first()

        summaries.append(
            RescheduleRequestSummary(
                id=str(rr.id),
                request_ref=rr.request_ref,
                ticket_ref=ticket.ticket_ref if ticket else "UNKNOWN",
                attraction_title=attraction.title if attraction else (ticket.title if ticket else "Unknown"),
                current_slot_info=ticket.slot_or_seat_info if ticket else "",
                requested_slot_info=(
                    f"{slot.slot_date} ({_format_12h(datetime.strptime(slot.start_time, '%H:%M').time())} - {_format_12h(datetime.strptime(slot.end_time, '%H:%M').time())})"
                    if slot
                    else "Unknown"
                ),
                reason=rr.reason,
                status=rr.status,
                admin_notes=rr.admin_notes,
                created_at=rr.created_at.isoformat(),
            )
        )
    return summaries

@router.post("/{booking_ref}/cancel")
async def cancel_booking(
    booking_ref: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find the order
    res = await db.execute(select(Order).where(Order.order_ref == booking_ref, Order.user_id == current_user.id))
    order = res.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if order.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
        
    # Cancel the tickets
    tickets_res = await db.execute(select(Ticket).where(Ticket.order_id == order.id))
    tickets = tickets_res.scalars().all()
    
    for ticket in tickets:
        if ticket.check_in_status == "CHECKED_IN":
            raise HTTPException(status_code=400, detail="Cannot cancel a booking that has already been checked in")

        # Check 24 hour rule
        entry_window = await _get_entry_window(db, ticket)
        if entry_window:
            window_start = entry_window[0]
            from datetime import timedelta
            if datetime.utcnow() > (window_start - timedelta(hours=24)):
                raise HTTPException(status_code=400, detail="Cancellation is only permitted 24 hours prior to the slot.")

        ticket.check_in_status = "CANCELLED"
        ticket.version = (ticket.version or 1) + 1
        
        # Free up capacity
        item_res = await db.execute(select(OrderItem).where(OrderItem.id == ticket.order_item_id))
        order_item = item_res.scalars().first()
        if not order_item: continue

        if ticket.item_type == "ATTRACTION" and order_item.attraction_slot_id:
            slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == order_item.attraction_slot_id))
            slot = slot_res.scalars().first()
            if slot:
                slot.booked_count = max(0, slot.booked_count - 1)
        elif ticket.item_type == "FERRY" and order_item.ferry_seat_id:
            seat_res = await db.execute(select(FerrySeat).where(FerrySeat.id == order_item.ferry_seat_id))
            seat = seat_res.scalars().first()
            if seat:
                seat.is_booked = False
    
    order.status = "CANCELLED"
    
    # Process Refund if applicable
    if order.razorpay_payment_id:
        try:
            # 50% penalty as per RFP Page 27, Clause 6 (simplified here)
            refund_amount = float(order.net_payable) * 0.5
            razorpay_client.payment.refund(order.razorpay_payment_id, {
                "amount": int(refund_amount * 100),
                "speed": "normal",
                "notes": {"reason": "Cancelled by tourist"}
            })
        except Exception as e:
            print(f"Refund API failed: {e}")

    await db.commit()
    return {"success": True, "message": "Booking cancelled and 50% refund initiated successfully."}
