import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class AdminAlert(Base):
    __tablename__ = "admin_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_type = Column(String(50), nullable=False)  # e.g. SUSPICIOUS_REPEAT_BOOKING
    message = Column(Text, nullable=False)
    related_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    related_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
