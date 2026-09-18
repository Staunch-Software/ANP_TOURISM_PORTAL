import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class GroupBookingRequest(Base):
    """
    RFP Page 26, Group Bookings Clauses I-IV: organization/school/college
    group applications. Distinct from the self-service cart flow — these
    require admin approval before any payment can happen. On approval, a
    real Order + OrderItems (one per roster member) are created against
    the chosen slot, so an approved group flows through the exact same
    payment -> Unified QR pass pipeline as an individual booking.
    """
    __tablename__ = "group_booking_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_ref = Column(String(50), unique=True, index=True, nullable=False)  # "AN-2026-GRP-XXXXXX"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    organization_name = Column(String(150), nullable=False)
    organization_type = Column(String(30), nullable=False)  # SCHOOL, COLLEGE, CORPORATE, TOUR_OPERATOR, GOVT_DELEGATION
    contact_person = Column(String(100), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    contact_email = Column(String(150), nullable=False)

    attraction_slot_id = Column(UUID(as_uuid=True), ForeignKey("attraction_slots.id"), nullable=False)

    indian_travelers_count = Column(Integer, default=0)
    foreign_travelers_count = Column(Integer, default=0)
    total_headcount = Column(Integer, nullable=False)

    status = Column(String(30), default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED
    roster_json = Column(Text, nullable=False)  # JSON list of {full_name, age, gender, nationality, id_type, id_number}

    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)  # set once approved

    created_at = Column(DateTime, default=datetime.utcnow)
