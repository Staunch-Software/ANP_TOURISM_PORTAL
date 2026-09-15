from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.ticket import Ticket
from app.api.v1.auth import get_current_user
from app.services.crypto_service import verify_ticket_offline, get_public_key_hex
from app.schemas.ticket import TicketPassResponse, OfflineVerificationResponse

router = APIRouter(prefix="/tickets", tags=["Digital Pass Wallet & Offline Verification"])


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
        "description": "Bake this public key into Android scanners & turnstiles for 100% offline verification",
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

    return OfflineVerificationResponse(
        ticket_ref=ticket.ticket_ref,
        passenger_name=ticket.passenger_name,
        is_signature_valid=is_valid,
        verification_mode="100% OFFLINE MATHEMATICAL PROOF (Ed25519)",
        gate_decision="GREEN LIGHT - ENTRY GRANTED" if is_valid else "RED LIGHT - INVALID SIGNATURE",
    )
