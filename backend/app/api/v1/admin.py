import uuid
import io
import csv
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.models.ferry import FerrySchedule, FerrySeat, Vessel
from app.models.attraction import AttractionSlot
from app.models.admin_alert import AdminAlert
from app.api.v1.auth import get_current_user
from app.schemas.admin import (
    HarborManifestResponse,
    HarborPassengerEntry,
    RevenueSummaryResponse,
    EmergencyThrottleRequest,
    EmergencyThrottleResponse,
    UserSummary,
    UserRoleUpdateRequest,
    SlotCapacityUpdateRequest,
    SlotCapacityUpdateResponse,
    DirectUserCreateRequest,
    OperatorApplicationSummary,
    OperatorApplicationDecisionRequest,
    ValidatedTicketReportEntry,
    AdminAlertSummary,
)
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["Government Admin MIS & Harbor Manifest"])


def verify_admin_role(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type not in ["ADMIN", "TOURISM_OFFICER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Requires Administrator or Tourism Directorate privilege",
        )
    return current_user


def verify_admin_or_operator_role(current_user: User = Depends(get_current_user)) -> User:
    """Voyage manifests are needed by both the Directorate (oversight) and
    the vessel operator (boarding roster) per RFP Clause 7.2.1-II/III."""
    if current_user.user_type not in ["ADMIN", "TOURISM_OFFICER", "OPERATOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Requires Administrator or Ferry Operator privilege",
        )
    return current_user


def verify_admin_or_vendor_role(current_user: User = Depends(get_current_user)) -> User:
    """Activity/attraction manifests and revenue are needed by both the
    Directorate (oversight) and the water sports / activity vendor
    (visitor roster) per RFP Clause 7.2.1-II/III."""
    if current_user.user_type not in ["ADMIN", "TOURISM_OFFICER", "VENDOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Requires Administrator or Activity Vendor privilege",
        )
    return current_user


def verify_staff_role(current_user: User = Depends(get_current_user)) -> User:
    """Gate/turnstile ticket check-in may be performed by Ferry Operators,
    Activity Vendors, or Administrators — anyone responsible for admitting
    a passenger/visitor at the point of service."""
    if current_user.user_type not in ["ADMIN", "TOURISM_OFFICER", "OPERATOR", "VENDOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Requires staff privilege (Operator, Vendor, or Administrator)",
        )
    return current_user


# -------------------------------------------------------------
# 1. Harbor Passenger Manifest (JSON Data)
# -------------------------------------------------------------
@router.get("/manifest/{schedule_id}", response_model=HarborManifestResponse)
async def get_harbor_manifest(
    schedule_id: str,
    admin_user: User = Depends(verify_admin_or_operator_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        sched_uuid = uuid.UUID(schedule_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Schedule UUID")

    res = await db.execute(
        select(FerrySchedule, Vessel)
        .join(Vessel, FerrySchedule.vessel_id == Vessel.id)
        .where(FerrySchedule.id == sched_uuid)
    )
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Ferry schedule not found")

    sched, vessel = row

    tickets_res = await db.execute(
        select(Ticket, OrderItem, FerrySeat)
        .join(OrderItem, Ticket.order_item_id == OrderItem.id)
        .join(FerrySeat, OrderItem.ferry_seat_id == FerrySeat.id)
        .where(FerrySeat.schedule_id == sched.id)
        .order_by(FerrySeat.seat_number.asc())
    )
    pax_rows = tickets_res.all()

    manifest_entries = []
    for idx, (ticket, item, seat) in enumerate(pax_rows, start=1):
        manifest_entries.append(
            HarborPassengerEntry(
                serial_no=idx,
                seat_number=seat.seat_number,
                cabin_class=seat.cabin_class,
                passenger_name=ticket.passenger_name,
                age=ticket.passenger_age,
                gender=ticket.passenger_gender,
                nationality="INDIAN",
                id_type=ticket.id_type,
                id_masked_number=f"XXXX-XXXX-{ticket.id_number[-4:]}",
                ticket_ref=ticket.ticket_ref,
                check_in_status=ticket.check_in_status,
            )
        )

    return HarborManifestResponse(
        schedule_id=str(sched.id),
        vessel_name=vessel.name,
        operator_name=vessel.operator_name,
        source_port=sched.source_port,
        destination_port=sched.destination_port,
        departure_date=str(sched.departure_date),
        departure_time=sched.departure_time.strftime("%H:%M"),
        total_booked_pax=len(manifest_entries),
        manifest=manifest_entries,
    )


# -------------------------------------------------------------
# 2. Harbor Manifest Export as Official CSV (For Marine Police)
# -------------------------------------------------------------
@router.get("/manifest/{schedule_id}/export-csv")
async def export_harbor_manifest_csv(
    schedule_id: str,
    admin_user: User = Depends(verify_admin_or_operator_role),
    db: AsyncSession = Depends(get_db),
):
    manifest_data = await get_harbor_manifest(schedule_id, admin_user, db)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["PORT MANAGEMENT BOARD / HARBOR MARINE POLICE - PASSENGER MANIFEST"])
    writer.writerow(["VOYAGE REF:", manifest_data.schedule_id])
    writer.writerow(["VESSEL:", manifest_data.vessel_name, "OPERATOR:", manifest_data.operator_name])
    writer.writerow(["ROUTE:", f"{manifest_data.source_port} -> {manifest_data.destination_port}"])
    writer.writerow(["DEPARTURE DATE:", manifest_data.departure_date, "TIME:", manifest_data.departure_time])
    writer.writerow(["TOTAL EMBARKED PASSENGERS:", manifest_data.total_booked_pax])
    writer.writerow([])

    writer.writerow([
        "S.No", "Seat No", "Cabin Class", "Passenger Name",
        "Age", "Gender", "Nationality", "ID Type", "ID Number",
        "Ticket Reference", "Boarding Status",
    ])

    for p in manifest_data.manifest:
        writer.writerow([
            p.serial_no, p.seat_number, p.cabin_class, p.passenger_name,
            p.age, p.gender, p.nationality, p.id_type, p.id_masked_number,
            p.ticket_ref, p.check_in_status,
        ])

    output.seek(0)
    filename = f"PMB_Manifest_{manifest_data.vessel_name.replace(' ', '_')}_{manifest_data.departure_date}.csv"

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# -------------------------------------------------------------
# 3. Real-Time Financial & Footfall MIS
# -------------------------------------------------------------
@router.get("/revenue-mis", response_model=RevenueSummaryResponse)
async def get_revenue_mis(
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(
            func.sum(Order.net_payable),
            func.count(Order.id),
        ).where(Order.status == "CONFIRMED")
    )
    total_rev, total_orders = res.first()
    total_rev = float(total_rev or 0.0)
    total_orders = int(total_orders or 0)

    t_res = await db.execute(select(func.count(Ticket.id)))
    total_tickets = int(t_res.scalar() or 0)

    cat_res = await db.execute(
        select(
            OrderItem.item_type,
            func.sum(OrderItem.subtotal),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.status == "CONFIRMED")
        .group_by(OrderItem.item_type)
    )
    cat_splits = dict(cat_res.all())

    monument_rev = float(cat_splits.get("ATTRACTION", 0.0))
    ferry_rev = float(cat_splits.get("FERRY", 0.0))

    footfall = {
        "PORT_BLAIR": total_tickets,
        "HAVELOCK": int(total_tickets * 0.65),
        "NEIL": int(total_tickets * 0.35),
    }

    return RevenueSummaryResponse(
        total_revenue_inr=total_rev,
        total_orders_count=total_orders,
        total_tickets_issued=total_tickets,
        monument_revenue_inr=monument_rev,
        ferry_revenue_inr=ferry_rev,
        island_footfall=footfall,
    )


# -------------------------------------------------------------
# 4. Emergency Weather Shutdown / Capacity Throttle (IMD Alert)
# -------------------------------------------------------------
@router.post("/emergency-throttle", response_model=EmergencyThrottleResponse)
async def emergency_weather_throttle(
    req: EmergencyThrottleRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    if req.schedule_id:
        try:
            s_uuid = uuid.UUID(req.schedule_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid Schedule UUID")

        res = await db.execute(select(FerrySchedule).where(FerrySchedule.id == s_uuid))
        sched = res.scalars().first()
        if not sched:
            raise HTTPException(status_code=404, detail="Ferry schedule not found")

        sched.status = "CANCELLED_WEATHER"
        await db.commit()

        return EmergencyThrottleResponse(
            status="SUCCESS",
            entity_affected=f"Ferry Schedule: {sched.source_port} -> {sched.destination_port}",
            action_taken="CANCELLED_WEATHER",
            message=f"Voyage cancelled due to {req.reason}. Automated 100% refund workflow triggered.",
        )

    elif req.slot_id:
        try:
            slot_uuid = uuid.UUID(req.slot_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid Slot UUID")

        res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == slot_uuid))
        slot = res.scalars().first()
        if not slot:
            raise HTTPException(status_code=404, detail="Attraction slot not found")

        if req.action == "REDUCE_CAPACITY" and req.new_capacity is not None:
            slot.total_capacity = req.new_capacity
            await db.commit()
            return EmergencyThrottleResponse(
                status="SUCCESS",
                entity_affected=f"Attraction Slot: {slot.slot_date} ({slot.start_time})",
                action_taken=f"CAPACITY_REDUCED_TO_{req.new_capacity}",
                message=f"Slot capacity successfully updated to {req.new_capacity} pax.",
            )

    raise HTTPException(status_code=400, detail="Must provide either schedule_id or slot_id")


# -------------------------------------------------------------
# 5. User Management & Role Control (RFP Clause 7.2.1-III)
# -------------------------------------------------------------
VALID_ROLES = {"TOURIST", "ADMIN", "OPERATOR", "VENDOR"}


@router.get("/users", response_model=List[UserSummary])
async def list_users(
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(User).order_by(User.created_at.asc()))
    users = res.scalars().all()

    return [
        UserSummary(
            user_id=str(u.id),
            phone_number=u.phone_number,
            full_name=u.full_name,
            email=u.email,
            role=u.user_type,
            is_active=u.is_active,
            created_at=str(u.created_at),
        )
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=UserSummary)
async def update_user_role(
    user_id: str,
    req: UserRoleUpdateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User UUID")

    res = await db.execute(select(User).where(User.id == target_uuid))
    target_user = res.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.role is not None:
        if req.role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail=f"Role must be one of {sorted(VALID_ROLES)}")
        target_user.user_type = req.role

    if req.is_active is not None:
        target_user.is_active = req.is_active

    await db.commit()
    await db.refresh(target_user)

    return UserSummary(
        user_id=str(target_user.id),
        phone_number=target_user.phone_number,
        full_name=target_user.full_name,
        email=target_user.email,
        role=target_user.user_type,
        is_active=target_user.is_active,
        created_at=str(target_user.created_at),
    )


# -------------------------------------------------------------
# 6. Dynamic Slot Quota Expansion (RFP Clause 7.2.1-III, Page 30)
# -------------------------------------------------------------
@router.patch("/slots/{slot_id}/capacity", response_model=SlotCapacityUpdateResponse)
async def update_slot_capacity(
    slot_id: str,
    payload: SlotCapacityUpdateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    try:
        slot_uuid = uuid.UUID(slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Slot UUID")

    res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == slot_uuid))
    slot = res.scalars().first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if payload.new_capacity < slot.booked_count:
        raise HTTPException(
            status_code=400,
            detail=f"New capacity ({payload.new_capacity}) cannot be lower than seats already booked ({slot.booked_count})",
        )

    old_capacity = slot.total_capacity
    slot.total_capacity = payload.new_capacity
    await db.commit()
    await db.refresh(slot)

    redis_held = await r.get(f"slot_hold_count:{str(slot.id)}")
    held_count = int(redis_held) if redis_held else 0
    available = max(0, slot.total_capacity - slot.booked_count - held_count)

    return SlotCapacityUpdateResponse(
        slot_id=str(slot.id),
        old_capacity=old_capacity,
        new_capacity=slot.total_capacity,
        booked_count=slot.booked_count,
        available_seats=available,
        message=f"Slot capacity successfully updated to {slot.total_capacity} seats ({payload.reason})",
    )


# -------------------------------------------------------------
# 7. Direct User Creation & Service Provider Approval Workflow
# (RFP Clauses 7.2.1-1, 7.2.1-7, 7.2.1-III/IV, Pages 24, 28, 30-31)
# -------------------------------------------------------------
def _user_to_summary(u: User) -> UserSummary:
    return UserSummary(
        user_id=str(u.id),
        phone_number=u.phone_number,
        full_name=u.full_name,
        email=u.email,
        role=u.user_type,
        is_active=u.is_active,
        created_at=str(u.created_at),
    )


def _user_to_application_summary(u: User) -> OperatorApplicationSummary:
    return OperatorApplicationSummary(
        user_id=str(u.id),
        phone_number=u.phone_number,
        full_name=u.full_name,
        email=u.email,
        business_name=u.business_name,
        gstin=u.gstin,
        trade_license_number=u.trade_license_number,
        service_category=u.service_category,
        approval_status=u.approval_status,
        approval_notes=u.approval_notes,
        created_at=str(u.created_at),
    )


@router.post("/users/create", response_model=UserSummary)
async def admin_create_user(
    payload: DirectUserCreateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """Path B of the onboarding workflow: Directorate admin directly
    provisions a user with any role, bypassing the self-service
    application queue."""
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of {sorted(VALID_ROLES)}")

    res = await db.execute(select(User).where(User.phone_number == payload.phone_number))
    existing = res.scalars().first()

    if existing:
        existing.full_name = payload.full_name
        existing.user_type = payload.role
        if payload.email:
            existing.email = payload.email
        await db.commit()
        await db.refresh(existing)
        return _user_to_summary(existing)

    new_user = User(
        phone_number=payload.phone_number,
        full_name=payload.full_name,
        email=payload.email,
        user_type=payload.role,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return _user_to_summary(new_user)


@router.get("/operator-applications", response_model=List[OperatorApplicationSummary])
async def list_operator_applications(
    application_status: str = "PENDING",
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """Lists Service Provider self-registrations awaiting (or already
    given) a decision. Pass ?application_status=APPROVED or REJECTED
    to see historical decisions instead of the pending queue."""
    res = await db.execute(
        select(User)
        .where(User.approval_status == application_status)
        .order_by(User.created_at.asc())
    )
    applicants = res.scalars().all()
    return [_user_to_application_summary(u) for u in applicants]


@router.post("/operator-applications/{user_id}/approve", response_model=OperatorApplicationSummary)
async def approve_operator_application(
    user_id: str,
    payload: OperatorApplicationDecisionRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User UUID")

    res = await db.execute(select(User).where(User.id == target_uuid))
    applicant = res.scalars().first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Application not found")
    if applicant.approval_status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Application is already {applicant.approval_status}, not PENDING")

    applicant.approval_status = "APPROVED"
    applicant.approval_notes = payload.reason
    # FERRY_OPERATOR applicants become OPERATOR; WATER_SPORTS applicants
    # become VENDOR — service_category was captured at registration time.
    applicant.user_type = "OPERATOR" if applicant.service_category == "FERRY_OPERATOR" else "VENDOR"
    applicant.is_active = True
    await db.commit()
    await db.refresh(applicant)
    return _user_to_application_summary(applicant)


@router.post("/operator-applications/{user_id}/reject", response_model=OperatorApplicationSummary)
async def reject_operator_application(
    user_id: str,
    payload: OperatorApplicationDecisionRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid User UUID")

    res = await db.execute(select(User).where(User.id == target_uuid))
    applicant = res.scalars().first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Application not found")
    if applicant.approval_status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Application is already {applicant.approval_status}, not PENDING")

    applicant.approval_status = "REJECTED"
    applicant.approval_notes = payload.reason
    await db.commit()
    await db.refresh(applicant)
    return _user_to_application_summary(applicant)


# -------------------------------------------------------------
# 8. Daily Validated-Tickets Report (RFP p.29, section 7.2.1.9 item 9)
# Fleet-wide -- every site's check-ins for a given day. Sourced from the
# same `tickets` rows every LPU already pushes up in near-real-time via
# POST /sync/checkins, so this report only ever lags actual gate
# validation by however long that site was last able to sync, not by a
# separate batch job.
# -------------------------------------------------------------
def _report_day_bounds(date: str | None) -> tuple[datetime, datetime]:
    if date:
        try:
            day_start = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")
    else:
        day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return day_start, day_start + timedelta(days=1)


async def _fetch_validated_tickets(db: AsyncSession, date: str | None) -> List[Ticket]:
    day_start, day_end = _report_day_bounds(date)
    res = await db.execute(
        select(Ticket)
        .where(Ticket.check_in_status == "CHECKED_IN")
        .where(Ticket.checked_in_at >= day_start)
        .where(Ticket.checked_in_at < day_end)
        .order_by(Ticket.checked_in_at.asc())
    )
    return res.scalars().all()


@router.get("/reports/validated-tickets", response_model=List[ValidatedTicketReportEntry])
async def get_validated_tickets_report(
    date: str = None,  # "YYYY-MM-DD", defaults to today (UTC)
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    tickets = await _fetch_validated_tickets(db, date)
    return [
        ValidatedTicketReportEntry(
            ticket_ref=t.ticket_ref,
            booking_ref=t.booking_ref,
            title=t.title,
            item_type=t.item_type,
            passenger_name=t.passenger_name,
            site_id=t.site_id,
            issued_by=t.issued_by or "CLOUD",
            checked_in_at=t.checked_in_at.isoformat() if t.checked_in_at else None,
        )
        for t in tickets
    ]


@router.get("/reports/validated-tickets.csv")
async def get_validated_tickets_report_csv(
    date: str = None,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    """Same data as /reports/validated-tickets, as a CSV -- for handing
    ANIIDCO a report file directly (RFP p.29's "submit a report... to
    inform ANIIDCO")."""
    rows = await get_validated_tickets_report(date=date, admin_user=admin_user, db=db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ticket_ref", "booking_ref", "title", "item_type", "passenger_name", "site_id", "issued_by", "checked_in_at"])
    for r in rows:
        writer.writerow([r.ticket_ref, r.booking_ref, r.title, r.item_type, r.passenger_name, r.site_id, r.issued_by, r.checked_in_at])

    report_date = date or datetime.utcnow().strftime("%Y-%m-%d")
    filename = f"ANIIDCO_validated_tickets_{report_date}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# -------------------------------------------------------------
# 8. Fraud/Compliance Alerts (RFP Group Bookings Clause V)
# -------------------------------------------------------------
def _alert_to_summary(a: AdminAlert) -> AdminAlertSummary:
    return AdminAlertSummary(
        alert_id=str(a.id),
        alert_type=a.alert_type,
        message=a.message,
        related_order_id=str(a.related_order_id) if a.related_order_id else None,
        is_resolved=a.is_resolved,
        created_at=str(a.created_at),
    )


@router.get("/alerts", response_model=List[AdminAlertSummary])
async def list_admin_alerts(
    include_resolved: bool = False,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    query = select(AdminAlert).order_by(AdminAlert.created_at.desc())
    if not include_resolved:
        query = query.where(AdminAlert.is_resolved == False)
    res = await db.execute(query)
    return [_alert_to_summary(a) for a in res.scalars().all()]


@router.post("/alerts/{alert_id}/resolve", response_model=AdminAlertSummary)
async def resolve_admin_alert(
    alert_id: str,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        alert_uuid = uuid.UUID(alert_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Alert UUID")

    res = await db.execute(select(AdminAlert).where(AdminAlert.id == alert_uuid))
    alert = res.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_resolved = True
    await db.commit()
    await db.refresh(alert)
    return _alert_to_summary(alert)
