import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class OrderPass(Base):
    """
    RFP Clause 7.2.1-9 / Page 49: "A Unified QR code can be utilized for a
    single booking transaction across multiple attractions." One row per
    Order (not per OrderItem) — a single Ed25519 signature covers the
    whole order's entitlement list. Each entitlement's own check-in state
    lives on its OrderItem, so one gate can consume its entitlement while
    the rest of the pass stays valid for the day.
    """
    __tablename__ = "order_passes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pass_ref = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "AN-2026-PASS-556677"
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    lead_passenger_name = Column(String(100), nullable=False)

    qr_payload_json = Column(Text, nullable=False)
    qr_signature_b64 = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
