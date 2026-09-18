from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.ticket import Ticket
from app.models.order import OrderItem
from app.models.attraction import AttractionSlot
from app.models.ferry import FerrySeat, FerrySchedule
from app.api.v1.auth import get_current_user
from app.core.config import settings
from app.api.v1.admin import verify_staff_role
from app.services.crypto_service import verify_ticket_offline, get_public_key_hex
from app.schemas.ticket import (
    TicketPassResponse,
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


async def _get_ticket_entry_window(db: AsyncSession, ticket: Ticket) -> Optional[Tuple[datetime, datetime, str, str]]:
    """Returns (window_start, window_end, slot_start_label, slot_end_label)
    for the ticket's booked slot/departure, or None if it can't be
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


# 1. Tourist Wallet: View All My Passes
@router.get("/my-passes", response_model=List[TicketPassResponse])
async def get_my_passes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Ticket)
        .where(Ticket.user_id == current_user.id)
        .order_by(Ticket.created_at.desc())
    )
    tickets = res.scalars().all()

    passes = []
    for t in tickets:
        qr_combined = f"{t.qr_payload_json}|SIG:{t.qr_signature_b64}"
        passes.append(
            TicketPassResponse(
                ticket_ref=t.ticket_ref,
                item_type=t.item_type,
                title=t.title,
                slot_or_seat_info=t.slot_or_seat_info,
                passenger_name=t.passenger_name,
                id_type=t.id_type,
                id_number=t.id_number,
                check_in_status=t.check_in_status,
                qr_token=qr_combined,
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


# 3. The Offline Gate Proof Endpoint (Simulates what happens at the turnstile)
@router.get("/{ticket_ref}/verify-offline", response_model=OfflineVerificationResponse)
async def simulate_offline_gate_scan(
    ticket_ref: str,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Ticket).where(Ticket.ticket_ref == ticket_ref))
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket reference not found")

    is_valid = verify_ticket_offline(ticket.qr_payload_json, ticket.qr_signature_b64)

    gate_decision = "GREEN LIGHT - ENTRY GRANTED" if is_valid else "RED LIGHT - INVALID SIGNATURE"
    if is_valid:
        entry_window = await _get_ticket_entry_window(db, ticket)
        if entry_window:
            window_start, window_end, start_label, end_label = entry_window
            now = datetime.utcnow()
            if now < window_start:
                gate_decision = f"RED LIGHT - TOO EARLY (slot begins {start_label})"
            elif now > window_end:
                gate_decision = f"RED LIGHT - EXPIRED (slot ended {end_label})"

    return OfflineVerificationResponse(
        ticket_ref=ticket.ticket_ref,
        passenger_name=ticket.passenger_name,
        is_signature_valid=is_valid,
        verification_mode="100% OFFLINE MATHEMATICAL PROOF (Ed25519)",
        gate_decision=gate_decision,
    )


# 4. Staff Gate/Turnstile Check-In (Ferry Operator, Vendor, or Admin)
@router.post("/staff/check-in", response_model=StaffCheckInResponse)
async def staff_check_in_ticket(
    payload: StaffCheckInRequest,
    staff_user: User = Depends(verify_staff_role),
    db: AsyncSession = Depends(get_db),
):
    """
    RFP Page 28-29: Ground-staff entry validation. Cryptographically
    verifies the Ed25519 signature, then transitions the ticket from
    ISSUED to CHECKED_IN in Postgres — this is the durable state change
    that prevents passback fraud (a ticket cannot be validated twice).
    """
    res = await db.execute(select(Ticket).where(Ticket.ticket_ref == payload.ticket_ref))
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket reference not found")

    if not verify_ticket_offline(ticket.qr_payload_json, ticket.qr_signature_b64):
        raise HTTPException(status_code=400, detail="INVALID SIGNATURE: This QR code failed cryptographic verification.")

    if ticket.check_in_status == "CHECKED_IN":
        raise HTTPException(
            status_code=400,
            detail=f"PASSBACK ERROR: Ticket already checked in at {ticket.checked_in_at}.",
        )

    if ticket.check_in_status == "CANCELLED":
        raise HTTPException(status_code=400, detail="INVALID PASS: This ticket was cancelled and refunded.")

    entry_window = await _get_ticket_entry_window(db, ticket)
    if entry_window:
        window_start, window_end, start_label, end_label = entry_window
        now = datetime.utcnow()
        if now < window_start:
            raise HTTPException(
                status_code=400,
                detail=f"TOO EARLY: Your slot begins at {start_label} (entry allowed from {_format_12h(window_start.time())}).",
            )
        if now > window_end:
            raise HTTPException(
                status_code=400,
                detail=f"EXPIRED: Your slot ended at {end_label}. Ticket no longer valid.",
            )

    ticket.check_in_status = "CHECKED_IN"
    ticket.checked_in_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ticket)

    return StaffCheckInResponse(
        check_in_status=ticket.check_in_status,
        ticket_ref=ticket.ticket_ref,
        passenger_name=ticket.passenger_name,
        item_type=ticket.item_type,
        slot_or_seat_info=ticket.slot_or_seat_info,
        message="Valid ticket verified. Entry granted.",
    )
