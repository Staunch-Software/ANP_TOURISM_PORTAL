import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), default="Valued Tourist")
    email = Column(String(150), nullable=True)
    state_or_country = Column(String(100), nullable=True)
    user_type = Column(String(30), default="TOURIST")  # TOURIST, ADMIN, OPERATOR, VENDOR
    nationality = Column(String(20), default="INDIAN")  # INDIAN, FOREIGN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
