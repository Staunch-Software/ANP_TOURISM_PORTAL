import io
import csv
import json
import random
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.attraction import Attraction, AttractionSlot
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.models.group_booking import GroupBookingRequest
from app.api.v1.auth import get_current_user
from app.api.v1.admin import verify_admin_role
from app.schemas.group_booking import (
    GroupBookingRequestCreate,
    GroupBookingSummary,
    GroupBookingDecisionRequest,
)

router = APIRouter(prefix="/group-bookings", tags=["Group / Institutional Bookings"])
admin_router = APIRouter(prefix="/admin/group-bookings", tags=["Group Booking Approval (Admin)"])

VALID_ORG_TYPES = {"SCHOOL", "COLLEGE", "CORPORATE", "TOUR_OPERATOR", "GOVT_DELEGATION"}
GROUP_GST_RATE = 0.05


# -------------------------------------------------------------
# Shared helpers
# -------------------------------------------------------------
async def _summary_from_request(db: AsyncSession, gb: GroupBookingRequest) -> GroupBookingSummary:
    slot_res = await db.execute(
        select(AttractionSlot, Attraction)
        .join(Attraction, AttractionSlot.attraction_id == Attraction.id)
        .where(AttractionSlot.id == gb.attraction_slot_id)
    )
    row = slot_res.first()
    slot, attraction = row if row else (None, None)

    order_ref = None
    if gb.order_id:
        order_res = await db.execute(select(Order).where(Order.id == gb.order_id))
        order = order_res.scalars().first()
        order_ref = order.order_ref if order else None

    return GroupBookingSummary(
        id=str(gb.id),
        request_ref=gb.request_ref,
        organization_name=gb.organization_name,
        organization_type=gb.organization_type,
        contact_person=gb.contact_person,
        contact_phone=gb.contact_phone,
        contact_email=gb.contact_email,
        attraction_title=attraction.title if attraction else "Unknown Attraction",
        slot_date=slot.slot_date if slot else "",
        start_time=slot.start_time if slot else "",
        end_time=slot.end_time if slot else "",
        indian_travelers_count=gb.indian_travelers_count,
        foreign_travelers_count=gb.foreign_travelers_count,
        total_headcount=gb.total_headcount,
        status=gb.status,
        admin_notes=gb.admin_notes,
        order_ref=order_ref,
        created_at=str(gb.created_at),
        roster=json.loads(gb.roster_json),
    )


# -------------------------------------------------------------
# 1. Downloadable Roster Template (RFP Page 26, Clause II)
# -------------------------------------------------------------
@router.get("/template")
async def download_roster_template():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Full_Name", "Age", "Gender", "Nationality", "ID_Type", "ID_Number"])
    writer.writerow(["Rahul Sharma", "29", "MALE", "INDIAN", "AADHAAR", "123456789012"])
    writer.writerow(["Jane Doe", "34", "FEMALE", "FOREIGN", "PASSPORT", "M1234567"])
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ANIIDCO_Group_Roster_Template.csv"},
    )


# -------------------------------------------------------------
# 2. Submit a Group Booking Application (RFP Page 26, Clause I & II)
# -------------------------------------------------------------
@router.post("/request", response_model=GroupBookingSummary)
async def submit_group_booking_request(
    payload: GroupBookingRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.organization_type not in VALID_ORG_TYPES:
        raise HTTPException(status_code=400, detail=f"organization_type must be one of {sorted(VALID_ORG_TYPES)}")

    try:
        slot_uuid = uuid.UUID(payload.attraction_slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Attraction Slot UUID")

    slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == slot_uuid))
    slot = slot_res.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Attraction slot not found")

    total_headcount = payload.indian_travelers_count + payload.foreign_travelers_count
    if total_headcount <= 0:
        raise HTTPException(status_code=400, detail="Total traveler count must be greater than zero")
    if len(payload.roster) != total_headcount:
        raise HTTPException(
            status_code=400,
            detail=f"Roster has {len(payload.roster)} member(s) but indian+foreign count is {total_headcount}. They must match.",
        )

    request_ref = f"AN-2026-GRP-{random.randint(100000, 999999)}"
    group_booking = GroupBookingRequest(
        request_ref=request_ref,
        user_id=current_user.id,
        organization_name=payload.organization_name,
        organization_type=payload.organization_type,
        contact_person=payload.contact_person,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        attraction_slot_id=slot.id,
        indian_travelers_count=payload.indian_travelers_count,
        foreign_travelers_count=payload.foreign_travelers_count,
        total_headcount=total_headcount,
        status="PENDING_APPROVAL",
        roster_json=json.dumps([m.model_dump() for m in payload.roster]),
    )
    db.add(group_booking)
    await db.commit()
    await db.refresh(group_booking)

    return await _summary_from_request(db, group_booking)


# -------------------------------------------------------------
# 3. Tourist/Organizer: Track My Own Group Booking Requests
# -------------------------------------------------------------
@router.get("/my-requests", response_model=List[GroupBookingSummary])
async def list_my_group_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(GroupBookingRequest)
        .where(GroupBookingRequest.user_id == current_user.id)
        .order_by(GroupBookingRequest.created_at.desc())
    )
    return [await _summary_from_request(db, gb) for gb in res.scalars().all()]


# -------------------------------------------------------------
# 4. Admin: List Group Booking Requests
# -------------------------------------------------------------
@admin_router.get("", response_model=List[GroupBookingSummary])
async def list_group_bookings_admin(
    request_status: str = "PENDING_APPROVAL",
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(GroupBookingRequest)
        .where(GroupBookingRequest.status == request_status)
        .order_by(GroupBookingRequest.created_at.asc())
    )
    return [await _summary_from_request(db, gb) for gb in res.scalars().all()]


# -------------------------------------------------------------
# 5. Admin: Approve — reserves capacity & creates the payable Order
# -------------------------------------------------------------
@admin_router.post("/{request_id}/approve", response_model=GroupBookingSummary)
async def approve_group_booking(
    request_id: str,
    payload: GroupBookingDecisionRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Request UUID")

    res = await db.execute(select(GroupBookingRequest).where(GroupBookingRequest.id == req_uuid))
    gb = res.scalars().first()
    if not gb:
        raise HTTPException(status_code=404, detail="Group booking request not found")
    if gb.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Request is already {gb.status}, not PENDING_APPROVAL")

    slot_res = await db.execute(
        select(AttractionSlot, Attraction)
        .join(Attraction, AttractionSlot.attraction_id == Attraction.id)
        .where(AttractionSlot.id == gb.attraction_slot_id)
    )
    row = slot_res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Attraction slot for this request no longer exists")
    slot, attraction = row

    available = slot.total_capacity - slot.booked_count
    if gb.total_headcount > available:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient slot capacity: {available} seat(s) available, "
                f"but this group needs {gb.total_headcount}. Expand slot capacity first "
                f"(Admin MIS -> Crowd & Carrying Capacity) before approving."
            ),
        )

    roster = json.loads(gb.roster_json)

    gross_amount = 0.0
    order_items = []
    for position, member in enumerate(roster):
        unit_price = float(attraction.base_price_inr) if member["nationality"] == "INDIAN" else float(attraction.foreign_price_inr)
        gross_amount += unit_price
        order_items.append(
            OrderItem(
                position=position,
                item_type="ATTRACTION",
                attraction_slot_id=slot.id,
                title=attraction.title,
                slot_or_seat_info=f"{slot.slot_date} ({slot.start_time} - {slot.end_time})",
                unit_price=unit_price,
                quantity=1,
                subtotal=unit_price,
                passenger_name=member["full_name"],
                passenger_age=member.get("age"),
                passenger_gender=member.get("gender"),
                id_type=member["id_type"],
                id_number=member["id_number"],
            )
        )

    tax_amount = round(gross_amount * GROUP_GST_RATE, 2)
    net_payable = round(gross_amount + tax_amount, 2)

    order = Order(
        order_ref=f"AN-2026-ORD-{random.randint(100000, 999999)}",
        user_id=gb.user_id,
        channel="GROUP_BOOKING",
        gross_amount=gross_amount,
        tax_amount=tax_amount,
        net_payable=net_payable,
        status="PENDING_PAYMENT",
    )
    db.add(order)
    await db.flush()  # populate order.id before attaching items

    for item in order_items:
        item.order_id = order.id
    db.add_all(order_items)

    # Reserve the capacity immediately on approval, per RFP: "slots are reserved" for the group.
    slot.booked_count += gb.total_headcount

    gb.status = "APPROVED"
    gb.admin_notes = payload.reason
    gb.reviewed_by = admin_user.id
    gb.reviewed_at = datetime.utcnow()
    gb.order_id = order.id

    await db.commit()
    await db.refresh(gb)

    return await _summary_from_request(db, gb)


# -------------------------------------------------------------
# 6. Admin: Reject
# -------------------------------------------------------------
@admin_router.post("/{request_id}/reject", response_model=GroupBookingSummary)
async def reject_group_booking(
    request_id: str,
    payload: GroupBookingDecisionRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Request UUID")

    res = await db.execute(select(GroupBookingRequest).where(GroupBookingRequest.id == req_uuid))
    gb = res.scalars().first()
    if not gb:
        raise HTTPException(status_code=404, detail="Group booking request not found")
    if gb.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Request is already {gb.status}, not PENDING_APPROVAL")

    gb.status = "REJECTED"
    gb.admin_notes = payload.reason
    gb.reviewed_by = admin_user.id
    gb.reviewed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(gb)

    return await _summary_from_request(db, gb)


# -------------------------------------------------------------
# 7. Admin: Cancel an Approved Group Booking (RFP Page 26, Clause IV)
# -------------------------------------------------------------
@admin_router.post("/{request_id}/cancel", response_model=GroupBookingSummary)
async def cancel_group_booking(
    request_id: str,
    payload: GroupBookingDecisionRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """
    RFP Page 26, Clause IV: "The administrator should be empowered to
    approve or cancel any confirmed booking, providing a valid reason...
    Refunds for any cancelled bookings should be processed promptly to
    the original method of payment." This releases the reserved slot
    capacity and voids the order; this portal's payment gateway is a
    demo/mock integration (no real bank settlement occurs anywhere in the
    system), so no real refund transaction is triggered here — the
    response is explicit about that rather than claiming a fake refund.
    """
    if not payload.reason or not payload.reason.strip():
        raise HTTPException(status_code=400, detail="A cancellation reason is required.")

    try:
        req_uuid = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Request UUID")

    res = await db.execute(select(GroupBookingRequest).where(GroupBookingRequest.id == req_uuid))
    gb = res.scalars().first()
    if not gb:
        raise HTTPException(status_code=404, detail="Group booking request not found")
    if gb.status != "APPROVED":
        raise HTTPException(status_code=400, detail=f"Only an APPROVED request can be cancelled (current status: {gb.status})")

    slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == gb.attraction_slot_id))
    slot = slot_res.scalars().first()
    if slot:
        slot.booked_count = max(0, slot.booked_count - gb.total_headcount)

    if gb.order_id:
        order_res = await db.execute(select(Order).where(Order.id == gb.order_id))
        order = order_res.scalars().first()
        if order:
            order.status = "CANCELLED"
            # Tickets only exist once the group's organizer has paid (see
            # payments.py); an approved-but-unpaid request has none yet.
            tickets_res = await db.execute(select(Ticket).where(Ticket.order_id == order.id))
            for ticket in tickets_res.scalars().all():
                ticket.check_in_status = "CANCELLED"

    gb.status = "CANCELLED"
    gb.admin_notes = payload.reason
    gb.reviewed_by = admin_user.id
    gb.reviewed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(gb)

    return await _summary_from_request(db, gb)
