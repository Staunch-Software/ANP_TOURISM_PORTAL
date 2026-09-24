# Cloud-side counterpart the LPU fleet talks to. Every LPU at every gate/
# counter authenticates with the shared SYNC_API_KEY (not a per-user JWT --
# these are unattended site devices, not tourists).
#
#   GET  /sync/tickets/changes  -- LPU PULLs new/updated/cancelled bookings
#                                   since its last successful pull.
#   POST /sync/checkins         -- LPU PUSHes a gate scan (one leg of a
#                                   booking consumed).
#   POST /sync/counter-tickets  -- LPU PUSHes a ticket it issued offline at
#                                   a physical counter while disconnected.
#   POST /sync/heartbeat        -- LPU liveness ping, feeds the Authority
#                                   dashboard's real-time LPU uptime view.
import json
import logging
import random
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import select, text

logger = logging.getLogger("anp.sync")
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.models.lpu_heartbeat import LPUHeartbeat
from app.models.gate import Gate, GateService
from app.models.gate_staff import GateStaff
from app.schemas.sync import (
    TicketChangeItem,
    TicketChangeLeg,
    TicketChangesResponse,
    CheckinRequest,
    CheckinResponse,
    CounterTicketRequest,
    CounterTicketResponse,
    HeartbeatRequest,
    HeartbeatResponse,
)
from app.schemas.gate_staff import StaffSyncEntry, StaffChangesResponse

router = APIRouter(prefix="/sync", tags=["LPU Fleet Sync"])


def verify_sync_api_key(x_sync_api_key: str = Header(...)):
    if x_sync_api_key != settings.SYNC_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid LPU sync credentials")


async def require_provisioned_gate(db: AsyncSession, site_id: str) -> Gate:
    """
    Nothing syncs for a site the Directorate hasn't provisioned -- same
    shape as Aepms-backend's VesselInfo check in receive_heartbeat
    ("Vessel not provisioned for AEPMS"). An admin creates the Gate (and
    assigns its GateService titles) via /admin/gates before that LPU's
    SITE_ID can push or pull anything.
    """
    res = await db.execute(
        select(Gate)
        .where(Gate.site_id == site_id, Gate.is_active == True)  # noqa: E712
        .options(selectinload(Gate.services))
    )
    gate = res.scalars().first()
    if not gate:
        raise HTTPException(
            status_code=403,
            detail=f"Site '{site_id}' is not provisioned -- ask an admin to create it via POST /admin/gates",
        )
    return gate


# -------------------------------------------------------------
# 1. PULL: bookings issued/cancelled/updated since an LPU's last sync
# -------------------------------------------------------------
@router.get("/tickets/changes", response_model=TicketChangesResponse, dependencies=[Depends(verify_sync_api_key)])
async def get_ticket_changes(
    since: datetime = Query(..., description="ISO timestamp of the LPU's last successful pull"),
    site_id: str = Query(..., description="Requesting LPU's site id -- scopes results to that gate's assigned services"),
    db: AsyncSession = Depends(get_db),
):
    if since.tzinfo is not None:
        since = since.replace(tzinfo=None)

    gate = await require_provisioned_gate(db, site_id)
    allowed_titles = [s.title for s in gate.services]
    if not allowed_titles:
        # Provisioned but no services assigned yet -- fail closed (nothing
        # relevant configured) rather than silently sending the whole
        # fleet's tickets, which is exactly the bug this scoping exists
        # to fix.
        return TicketChangesResponse(tickets=[], server_time=datetime.now(timezone.utc))

    # Every row in a multi-attraction booking shares booking_ref. A
    # booking is relevant to this gate if ANY of its legs matches one of
    # the gate's assigned titles -- once relevant, the WHOLE booking (all
    # legs, in their original item_index order) is sent, not just the
    # matching leg(s). This has to be booking-level, not leg-level:
    # item_index is a fixed position in the signed QR's own items[] array,
    # shared identically across every site that ever sees this booking, so
    # omitting a non-matching leg would desync those positions instead of
    # just trimming irrelevant data. The tradeoff is a gate occasionally
    # holding one "spillover" leg from a booking that's mostly for another
    # site -- far short of the old behavior (every site got every ticket
    # fleet-wide), and the LPU's own SITE_ALLOWED_TITLES / wrong-gate check
    # already refuses to validate that spillover leg at the actual scan.
    changed_refs = (await db.execute(
        select(Ticket.booking_ref)
        .where(Ticket.updated_at > since)
        .where(Ticket.title.in_(allowed_titles))
        .distinct()
        .limit(1000)
    )).scalars().all()
    if not changed_refs:
        return TicketChangesResponse(tickets=[], server_time=datetime.now(timezone.utc))

    res = await db.execute(
        select(Ticket).where(Ticket.booking_ref.in_(changed_refs)).order_by(Ticket.booking_ref, Ticket.item_index)
    )
    rows = res.scalars().all()

    bookings: dict[str, list[Ticket]] = {}
    for t in rows:
        bookings.setdefault(t.booking_ref, []).append(t)

    tickets = []
    for booking_ref, legs in bookings.items():
        head = legs[0]  # booking-level fields (signature, payload) are identical across a booking's rows --
        # but passenger identity is NOT: a Group Booking's legs are
        # different PEOPLE on the same attraction, not different
        # attractions for one person, so each leg below carries its own
        # ticket_ref/passenger_name/id_type/id_number rather than
        # inheriting head's. TicketChangeItem's own passenger_name/
        # id_type/id_number (below) stay as a booking-level "lead
        # contact" fallback for older LPU builds -- the per-leg fields
        # are what an updated LPU actually uses.
        tickets.append(TicketChangeItem(
            ticket_ref=booking_ref,
            items=[
                TicketChangeLeg(
                    ticket_ref=leg.ticket_ref,
                    item_type=leg.item_type,
                    title=leg.title,
                    slot_or_seat_info=leg.slot_or_seat_info,
                    check_in_status=leg.check_in_status,
                    checked_in_at=leg.checked_in_at,
                    version=leg.version,
                    passenger_name=leg.passenger_name,
                    passenger_age=leg.passenger_age,
                    passenger_gender=leg.passenger_gender,
                    id_type=leg.id_type,
                    id_number=leg.id_number,
                )
                for leg in legs
            ],
            passenger_name=head.passenger_name,
            passenger_age=head.passenger_age,
            passenger_gender=head.passenger_gender,
            id_type=head.id_type,
            id_number=head.id_number,
            qr_payload_json=head.qr_payload_json,
            qr_signature_b64=head.qr_signature_b64,
            issued_by=head.issued_by or "CLOUD",
            updated_at=max(leg.updated_at for leg in legs),
        ))

    return TicketChangesResponse(tickets=tickets, server_time=datetime.now(timezone.utc))


# -------------------------------------------------------------
# 2. PUSH: a gate scan/check-in that happened at an LPU (possibly while offline)
# -------------------------------------------------------------
@router.post("/checkins", response_model=CheckinResponse, dependencies=[Depends(verify_sync_api_key)])
async def push_checkin(req: CheckinRequest, db: AsyncSession = Depends(get_db)):
    await require_provisioned_gate(db, req.site_id)

    # Locked read: two check-ins for the same leg can genuinely race here
    # (a retry racing the original push, or -- the case worth catching --
    # two DIFFERENT LPUs pushing a check-in for the same physical QR at
    # roughly the same time). Without the lock, both could read
    # check_in_status != CHECKED_IN before either commits, and whichever
    # commits last would silently overwrite the other's site_id with no
    # record anything was ever amiss.
    res = await db.execute(
        select(Ticket)
        .where(Ticket.booking_ref == req.ticket_ref)
        .where(Ticket.item_index == req.item_index)
        .with_for_update()
    )
    ticket = res.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Booking/leg not known to cloud")

    if ticket.check_in_status == "CANCELLED":
        return CheckinResponse(
            status="REJECTED",
            ticket_ref=req.ticket_ref,
            message="Ticket was cancelled after being scanned offline -- flagged for manual review",
        )

    if ticket.check_in_status != "CHECKED_IN":
        # Fresh check-in -- this server is the authority for this leg's
        # version, so it bumps its own counter rather than trusting
        # req.version (which is only logged below for cross-checking).
        ticket.check_in_status = "CHECKED_IN"
        ticket.checked_in_at = req.checked_in_at.replace(tzinfo=None) if req.checked_in_at.tzinfo else req.checked_in_at
        ticket.site_id = req.site_id
        ticket.version += 1
        await db.commit()
        return CheckinResponse(status="OK", ticket_ref=req.ticket_ref, message="Check-in recorded")

    # Already CHECKED_IN. Same site pushing again is just its own retry --
    # harmless, idempotent no-op. A DIFFERENT site claiming a leg already
    # consumed elsewhere is not a retry -- it's either a duplicated/forged
    # QR or a misconfigured gate, and silently returning "OK" would hide
    # that from anyone who could investigate it.
    if ticket.site_id and ticket.site_id != req.site_id:
        logger.warning(
            f"SUSPECTED DOUBLE-USE: booking={req.ticket_ref} leg={req.item_index} "
            f"already checked in at site={ticket.site_id}, now also claimed by site={req.site_id} "
            f"(incoming LPU version={req.version})"
        )
        return CheckinResponse(
            status="REJECTED",
            ticket_ref=req.ticket_ref,
            message=f"Already checked in at a different site ({ticket.site_id}) -- possible duplicate/forged QR, flagged for review",
        )

    return CheckinResponse(status="OK", ticket_ref=req.ticket_ref, message="Check-in recorded")


# -------------------------------------------------------------
# 3. PUSH: a ticket an LPU issued offline at a physical counter
# -------------------------------------------------------------
@router.post("/counter-tickets", response_model=CounterTicketResponse, dependencies=[Depends(verify_sync_api_key)])
async def push_counter_ticket(req: CounterTicketRequest, db: AsyncSession = Depends(get_db)):
    await require_provisioned_gate(db, req.site_id)

    existing = await db.execute(select(Ticket).where(Ticket.ticket_ref == req.ticket_ref))
    if existing.scalars().first():
        # Already synced in a previous (retried) attempt -- no-op.
        return CounterTicketResponse(status="OK", ticket_ref=req.ticket_ref, message="Already synced")

    # Look up or create the tourist's account using the provided phone number.
    # This fulfills RFP p.28 Point 8: capturing real contact info for counter 
    # sales so digital tickets can be sent via SMS/Email/WhatsApp.
    user_res = await db.execute(select(User).where(User.phone_number == req.contact_phone))
    tourist_user = user_res.scalars().first()
    if not tourist_user:
        tourist_user = User(
            phone_number=req.contact_phone,
            email=req.contact_email,
            full_name=req.passenger_name or f"Counter Guest ({req.site_id})",
            user_type="TOURIST",
        )
        db.add(tourist_user)
        await db.flush()

    order = Order(
        order_ref=f"AN-2026-CTR-{random.randint(100000, 999999)}",
        user_id=tourist_user.id,
        channel="POS_COUNTER",
        gross_amount=req.price_inr,
        tax_amount=0.0,
        net_payable=req.price_inr,
        status="CONFIRMED",
    )
    db.add(order)
    await db.flush()

    order_item = OrderItem(
        order_id=order.id,
        item_type=req.item_type,
        title=req.title,
        slot_or_seat_info=req.slot_or_seat_info,
        unit_price=req.price_inr,
        quantity=1,
        subtotal=req.price_inr,
        passenger_name=req.passenger_name,
        passenger_age=req.passenger_age,
        passenger_gender=req.passenger_gender,
        id_type=req.id_type,
        id_number=req.id_number,
    )
    db.add(order_item)
    await db.flush()

    ticket = Ticket(
        ticket_ref=req.ticket_ref,
        booking_ref=req.ticket_ref,  # counter sales are always single-item, see LPU's counter.py
        item_index=0,
        order_id=order.id,
        order_item_id=order_item.id,
        user_id=tourist_user.id,
        item_type=req.item_type,
        title=req.title,
        slot_or_seat_info=req.slot_or_seat_info,
        passenger_name=req.passenger_name,
        passenger_age=req.passenger_age,
        passenger_gender=req.passenger_gender,
        id_type=req.id_type,
        id_number=req.id_number,
        qr_payload_json=req.qr_payload_json,
        qr_signature_b64=req.qr_signature_b64,
        check_in_status="ISSUED",
        issued_by="COUNTER",
        site_id=req.site_id,
        created_at=req.issued_at.replace(tzinfo=None) if req.issued_at.tzinfo else req.issued_at,
    )
    db.add(ticket)
    await db.commit()

    return CounterTicketResponse(status="OK", ticket_ref=req.ticket_ref, message="Counter ticket adopted by cloud")


# -------------------------------------------------------------
# 4. PUSH: LPU liveness ping -- feeds the Authority dashboard's real-time
# uptime view for "Local Processing Units at gates" (SLA 8.4, RFP p.38).
# Upserted, not appended -- one row per site is all the dashboard needs.
# -------------------------------------------------------------
@router.post("/heartbeat", response_model=HeartbeatResponse, dependencies=[Depends(verify_sync_api_key)])
async def push_heartbeat(req: HeartbeatRequest, db: AsyncSession = Depends(get_db)):
    await require_provisioned_gate(db, req.site_id)

    res = await db.execute(select(LPUHeartbeat).where(LPUHeartbeat.site_id == req.site_id))
    row = res.scalars().first()

    reported_at = req.reported_at.replace(tzinfo=None) if req.reported_at.tzinfo else req.reported_at
    if not row:
        db.add(LPUHeartbeat(
            site_id=req.site_id,
            last_heartbeat_at=reported_at,
            local_ticket_count=req.local_ticket_count,
            pending_sync_items=req.pending_sync_items,
        ))
    else:
        row.last_heartbeat_at = reported_at
        row.local_ticket_count = req.local_ticket_count
        row.pending_sync_items = req.pending_sync_items
    await db.commit()

    return HeartbeatResponse(status="OK", site_id=req.site_id)


# -------------------------------------------------------------
# 5. PULL: staff (COUNTER/GATEKEEPER) accounts for this site, created/
# edited/removed by an admin via /admin/gates/{site_id}/staff. Same
# "since" shape as the ticket pull; a deleted GateStaff row shows up here
# as is_deleted=True (never actually removed from this table) so the LPU
# knows to delete its own local copy instead of that account silently
# staying valid forever on a device that already pulled it once.
# -------------------------------------------------------------
@router.get("/staff", response_model=StaffChangesResponse, dependencies=[Depends(verify_sync_api_key)])
async def get_staff_changes(
    since: datetime = Query(..., description="ISO timestamp of the LPU's last successful staff pull"),
    site_id: str = Query(..., description="Requesting LPU's site id"),
    db: AsyncSession = Depends(get_db),
):
    await require_provisioned_gate(db, site_id)

    if since.tzinfo is not None:
        since = since.replace(tzinfo=None)

    res = await db.execute(
        select(GateStaff).where(GateStaff.site_id == site_id, GateStaff.updated_at > since)
    )
    rows = res.scalars().all()
    
    services_res = await db.execute(
        select(GateService).where(GateService.site_id == site_id)
    )
    allowed_titles = [s.title for s in services_res.scalars().all()]

    from datetime import date, timedelta
    today_str = date.today().isoformat()
    end_str = (date.today() + timedelta(days=7)).isoformat()
    
    allowed_slots = {}
    if allowed_titles:
        slots_res = await db.execute(
            text("""
                SELECT a.title, s.slot_date, s.start_time, s.end_time 
                FROM attraction_slots s
                JOIN attractions a ON a.id = s.attraction_id
                WHERE a.title = ANY(:titles) AND s.slot_date >= :today AND s.slot_date <= :end_date
            """),
            {"titles": allowed_titles, "today": today_str, "end_date": end_str}
        )
        for row in slots_res:
            title, sdate, stime, etime = row
            if title not in allowed_slots:
                allowed_slots[title] = []
            allowed_slots[title].append({"date": sdate, "start": stime, "end": etime})

    return StaffChangesResponse(
        staff=[
            StaffSyncEntry(
                username=s.username,
                password_hash=s.password_hash,
                full_name=s.full_name,
                role=s.role,
                is_active=s.is_active,
                is_deleted=s.is_deleted,
                updated_at=s.updated_at,
            )
            for s in rows
        ],
        allowed_titles=allowed_titles,
        allowed_slots=allowed_slots,
        server_time=datetime.now(timezone.utc),
    )
# Trigger reload
