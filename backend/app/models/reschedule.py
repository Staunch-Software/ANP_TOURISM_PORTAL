import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class RescheduleRequest(Base):
    """
    RFP p.28: "In exceptional circumstances, visitors may approach the
    ticket counter to request a change of time slot for their purchased
    ticket. An approval workflow/SoP must be created, and upon
    acceptance, the revised ticket should be issued to the beneficiary."
    Unlike the self-service Express upgrade, this always needs a staff
    decision before the ticket actually changes.
    """
    __tablename__ = "reschedule_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_ref = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    requested_slot_id = Column(UUID(as_uuid=True), ForeignKey("attraction_slots.id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, REJECTED
    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
