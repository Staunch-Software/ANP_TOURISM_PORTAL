import random
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.models.grievance import GrievanceTicket
from app.api.v1.auth import get_current_user
from app.schemas.grievance import GrievanceCreateRequest, GrievanceSummary

router = APIRouter(prefix="/grievances", tags=["Grievance Redressal"])

VALID_CATEGORIES = {"BOOKING", "PAYMENT", "TICKET_VALIDATION", "SERVICE_QUALITY", "OTHER"}


def _to_summary(g: GrievanceTicket, complainant_phone: str = None) -> GrievanceSummary:
    return GrievanceSummary(
        id=str(g.id),
        ticket_ref=g.ticket_ref,
        category=g.category,
        subject=g.subject,
        description=g.description,
        related_booking_ref=g.related_booking_ref,
        priority=g.priority,
        escalation_level=g.escalation_level,
        status=g.status,
        resolution_notes=g.resolution_notes,
        complainant_phone=complainant_phone,
        created_at=g.created_at.isoformat(),
        acknowledged_at=g.acknowledged_at.isoformat() if g.acknowledged_at else None,
        resolved_at=g.resolved_at.isoformat() if g.resolved_at else None,
    )


# RFP p.21 "Grievance Redressal": the tourist/service-provider side of the
# helpdesk log that the SLA clock (Priority Matrix, p.30) starts on.
@router.post("", response_model=GrievanceSummary)
async def submit_grievance(
    payload: GrievanceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    category = payload.category.upper()
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"category must be one of {sorted(VALID_CATEGORIES)}")
    if not payload.subject.strip() or not payload.description.strip():
        raise HTTPException(status_code=400, detail="subject and description are required")

    ticket = GrievanceTicket(
        ticket_ref=f"AN-2026-GRV-{random.randint(100000, 999999)}",
        user_id=current_user.id,
        category=category,
        subject=payload.subject.strip(),
        description=payload.description.strip(),
        related_booking_ref=payload.related_booking_ref,
        priority="P3",
        escalation_level="L1",
        status="OPEN",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return _to_summary(ticket)


@router.get("/my", response_model=List[GrievanceSummary])
async def get_my_grievances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(GrievanceTicket)
        .where(GrievanceTicket.user_id == current_user.id)
        .order_by(GrievanceTicket.created_at.desc())
    )
    return [_to_summary(g) for g in res.scalars().all()]
