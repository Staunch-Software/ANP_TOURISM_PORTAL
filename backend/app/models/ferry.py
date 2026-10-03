import uuid

from datetime import datetime

from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Date, Time, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)  # "MV Makruzz Diamond"
    operator_name = Column(String(100), nullable=False)  # "Makruzz" or "Directorate of Shipping"
    total_capacity = Column(Integer, nullable=False)  # 280
    image_url = Column(String(300), nullable=True)  # photo shown on the sailing card
    amenities = Column(String(300), nullable=True)  # comma-separated, e.g. "Air-conditioned,Cafeteria"


class FerrySchedule(Base):
    __tablename__ = "ferry_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vessel_id = Column(UUID(as_uuid=True), ForeignKey("vessels.id"), nullable=False)
    source_port = Column(String(50), nullable=False)  # "PORT_BLAIR"
    destination_port = Column(String(50), nullable=False)  # "HAVELOCK"
    departure_date = Column(Date, nullable=False)
    departure_time = Column(Time, nullable=False)
    arrival_time = Column(Time, nullable=True)  # scheduled arrival at the destination port
    # RFP Page 21, Section 6.2: Ferry Roster System — the voyage lifecycle a
    # Harbor Master/Captain steps a sailing through: SCHEDULED (open for
    # booking) -> BOARDING -> CAST_OFF (sailed; booking closes) -> BERTHED
    # (arrived), or CANCELLED_WEATHER at any point before CAST_OFF.
    status = Column(String(20), default="SCHEDULED")
    captain_name = Column(String(100), nullable=True)  # Master/Captain of record for this sailing


class FerrySeat(Base):
    __tablename__ = "ferry_seats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("ferry_schedules.id"), nullable=False)
    seat_number = Column(String(10), nullable=False)  # "A1", "D14"
    cabin_class = Column(String(20), nullable=False)  # "ECONOMY", "DELUXE", "ROYAL"
    price_inr = Column(Numeric(10, 2), nullable=False)
    is_booked = Column(Boolean, default=False)


class UserFavoriteVessel(Base):
    """A tourist's starred ferries, so their usual vessel is easy to find."""
    __tablename__ = "user_favorite_vessels"
    __table_args__ = (UniqueConstraint("user_id", "vessel_id", name="uq_user_favorite_vessel"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    vessel_id = Column(UUID(as_uuid=True), ForeignKey("vessels.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
