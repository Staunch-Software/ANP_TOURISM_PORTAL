import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class GrievanceTicket(Base):
    """
    RFP p.21 "Grievance Redressal": envisaged escalation mechanism is
    L1 (Agency CC team) -> L2 (Agency Tech/O&M) -> L3 (Authority Nodal) ->
    Appellate (Authority), escalating on non-resolution within a defined
    turnaround. The Priority Matrix (P1-P4) ties an SLA clock to each
    ticket that "starts on helpdesk log" -- acknowledged_at/resolved_at
    are recorded here so that SLA compliance can be measured for real
    later, rather than fabricated on a dashboard.
    """
    __tablename__ = "grievance_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_ref = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    category = Column(String(50), nullable=False)  # BOOKING, PAYMENT, TICKET_VALIDATION, SERVICE_QUALITY, OTHER
    subject = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    related_booking_ref = Column(String(50), nullable=True)

    priority = Column(String(10), default="P3")  # P1 Critical, P2 High, P3 Medium, P4 Low
    escalation_level = Column(String(20), default="L1")  # L1, L2, L3, APPELLATE
    status = Column(String(20), default="OPEN")  # OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CLOSED

    resolution_notes = Column(Text, nullable=True)
    handled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
