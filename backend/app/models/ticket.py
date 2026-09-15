import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_ref = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "AN-2026-TKT-91823"
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    order_item_id = Column(UUID(as_uuid=True), ForeignKey("order_items.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    item_type = Column(String(30), nullable=False)  # "ATTRACTION" or "FERRY"
    title = Column(String(150), nullable=False)
    slot_or_seat_info = Column(String(100), nullable=False)

    passenger_name = Column(String(100), nullable=False)
    passenger_age = Column(Integer, nullable=True)
    passenger_gender = Column(String(10), nullable=True)
    id_type = Column(String(20), nullable=False)
    id_number = Column(String(50), nullable=False)

    qr_payload_json = Column(Text, nullable=False)
    qr_signature_b64 = Column(Text, nullable=False)

    check_in_status = Column(String(30), default="ISSUED")  # ISSUED, CHECKED_IN, CANCELLED
    checked_in_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
