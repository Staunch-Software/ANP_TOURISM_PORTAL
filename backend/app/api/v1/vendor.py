import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.models.attraction import Attraction, AttractionSlot
from app.api.v1.admin import verify_admin_or_vendor_role
from app.schemas.vendor import VendorRevenueSummary, ActivityManifestResponse, ActivityManifestEntry

router = APIRouter(prefix="/vendor", tags=["Water Sports & Activity Vendor Portal"])

COMMISSION_RATE = 0.05  # RFP 7.2.1-II: 5% ANIIDCO convenience fee


@router.get("/revenue-summary", response_model=VendorRevenueSummary)
async def get_vendor_revenue_summary(
    vendor_user: User = Depends(verify_admin_or_vendor_role),
    db: AsyncSession = Depends(get_db),
):
    """
    Real-time settlement figures for the water sports / activity vendor
    dashboard (RFP Clause 7.2.1-II, Page 29-30): gross activity revenue
    booked today, the ANIIDCO platform commission, and the net amount
    payable to the vendor. Mirrors /operator/revenue-summary but scoped
    to non-ferry (ATTRACTION) order items.
    """
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    res = await db.execute(
        select(
            func.coalesce(func.sum(OrderItem.subtotal), 0),
            func.coalesce(func.sum(OrderItem.quantity), 0),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.item_type == "ATTRACTION",
            Order.status == "CONFIRMED",
            Order.created_at >= today_start,
        )
    )
    gross_revenue, total_visitors = res.first()
    gross_revenue = float(gross_revenue or 0.0)
    total_visitors = int(total_visitors or 0)

    commission = round(gross_revenue * COMMISSION_RATE, 2)
    net_payable = round(gross_revenue - commission, 2)

    active_res = await db.execute(
        select(func.count(func.distinct(AttractionSlot.attraction_id))).where(
            AttractionSlot.slot_date == datetime.utcnow().strftime("%Y-%m-%d")
        )
    )
    active_attractions = int(active_res.scalar() or 0)

    return VendorRevenueSummary(
        today_gross_activity_revenue_inr=gross_revenue,
        aniidco_commission_inr=commission,
        net_payable_inr=net_payable,
        total_visitors_today=total_visitors,
        active_attractions_today=active_attractions,
        commission_rate_pct=COMMISSION_RATE * 100,
    )


@router.get("/manifest/{slot_id}", response_model=ActivityManifestResponse)
async def get_activity_manifest(
    slot_id: str,
    vendor_user: User = Depends(verify_admin_or_vendor_role),
    db: AsyncSession = Depends(get_db),
):
    """
    Visitor roster for a single attraction time-slot (RFP Page 29): lets a
    dive master, boat guide, or monument gate staff see exactly who is
    arriving, mirroring the ferry harbor manifest at /admin/manifest/{id}.
    """
    try:
        slot_uuid = uuid.UUID(slot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Slot UUID")

    slot_res = await db.execute(
        select(AttractionSlot, Attraction)
        .join(Attraction, AttractionSlot.attraction_id == Attraction.id)
        .where(AttractionSlot.id == slot_uuid)
    )
    row = slot_res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Attraction slot not found")
    slot, attraction = row

    tickets_res = await db.execute(
        select(Ticket)
        .join(OrderItem, Ticket.order_item_id == OrderItem.id)
        .where(OrderItem.attraction_slot_id == slot.id)
        .order_by(Ticket.created_at.asc())
    )
    tickets = tickets_res.scalars().all()

    manifest_entries = []
    for idx, ticket in enumerate(tickets, start=1):
        manifest_entries.append(
            ActivityManifestEntry(
                serial_no=idx,
                ticket_ref=ticket.booking_ref or ticket.ticket_ref,
                passenger_name=ticket.passenger_name,
                age=ticket.passenger_age,
                gender=ticket.passenger_gender,
                id_type=ticket.id_type,
                id_masked_number=(
                    f"XXXX-XXXX-{ticket.id_number[-4:]}"
                    if ticket.id_number and len(ticket.id_number) >= 4
                    else "XXXX"
                ),
                check_in_status=ticket.check_in_status,
            )
        )

    return ActivityManifestResponse(
        slot_id=str(slot.id),
        attraction_title=attraction.title,
        slot_date=slot.slot_date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        total_booked_pax=len(manifest_entries),
        manifest=manifest_entries,
    )
