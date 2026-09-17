from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.ferry import FerrySchedule
from app.api.v1.admin import verify_admin_or_operator_role
from app.schemas.operator import OperatorRevenueSummary

router = APIRouter(prefix="/operator", tags=["Ferry Operator & Service Provider Portal"])

COMMISSION_RATE = 0.05  # RFP 7.2.1-II: 5% ANIIDCO convenience fee


@router.get("/revenue-summary", response_model=OperatorRevenueSummary)
async def get_operator_revenue_summary(
    operator_user: User = Depends(verify_admin_or_operator_role),
    db: AsyncSession = Depends(get_db),
):
    """
    Real-time settlement figures for the ferry operator dashboard
    (RFP Clause 7.2.1-II, Page 29-30): gross ticket revenue booked
    today, the ANIIDCO platform commission, and the net amount
    payable to the operator.
    """
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    res = await db.execute(
        select(
            func.coalesce(func.sum(OrderItem.subtotal), 0),
            func.count(OrderItem.id),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            OrderItem.item_type == "FERRY",
            Order.status == "CONFIRMED",
            Order.created_at >= today_start,
        )
    )
    gross_revenue, ticket_count = res.first()
    gross_revenue = float(gross_revenue or 0.0)
    ticket_count = int(ticket_count or 0)

    commission = round(gross_revenue * COMMISSION_RATE, 2)
    net_payable = round(gross_revenue - commission, 2)

    vessels_res = await db.execute(
        select(func.count(func.distinct(FerrySchedule.vessel_id))).where(
            FerrySchedule.departure_date == datetime.utcnow().date()
        )
    )
    active_vessels = int(vessels_res.scalar() or 0)

    return OperatorRevenueSummary(
        today_gross_ferry_revenue_inr=gross_revenue,
        aniidco_commission_inr=commission,
        net_payable_inr=net_payable,
        total_passengers_today=ticket_count,
        active_vessels_today=active_vessels,
        commission_rate_pct=COMMISSION_RATE * 100,
    )
