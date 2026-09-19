import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Nullable because a tourist who signs up via Google has no phone
    # number yet -- collected afterwards during profile completion instead
    # of being required up front, matching how OTP-signup already defers
    # email collection to that same step.
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)  # NULL until user completes first-time password setup (RFP 7.2.1-1)
    google_sub = Column(String(64), unique=True, index=True, nullable=True)  # Google account ID, for "Continue with Google"
    full_name = Column(String(100), default="Valued Tourist")
    email = Column(String(150), nullable=True)
    state_or_country = Column(String(100), nullable=True)
    user_type = Column(String(30), default="TOURIST")  # TOURIST, ADMIN, OPERATOR, VENDOR
    nationality = Column(String(20), default="INDIAN")  # INDIAN, FOREIGN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # RFP Clause 7.2.1-1/7/III: Service Provider onboarding & approval workflow
    business_name = Column(String(150), nullable=True)
    gstin = Column(String(20), nullable=True)
    trade_license_number = Column(String(50), nullable=True)
    service_category = Column(String(30), nullable=True)  # FERRY_OPERATOR, WATER_SPORTS
    approval_status = Column(String(20), nullable=True)  # PENDING, APPROVED, REJECTED (NULL = not an applicant)
    approval_notes = Column(Text, nullable=True)
