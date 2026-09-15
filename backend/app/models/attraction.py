import uuid

from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Attraction(Base):
    __tablename__ = "attractions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(150), nullable=False)  # e.g. "Cellular Jail National Memorial"
    island = Column(String(50), nullable=False)  # "PORT_BLAIR", "HAVELOCK", "NEIL"
    category = Column(String(50), nullable=False)  # "MUSEUM", "LIGHT_SOUND", "WATER_SPORT"
    base_price_inr = Column(Numeric(10, 2), nullable=False)  # Indian price
    foreign_price_inr = Column(Numeric(10, 2), nullable=False)  # Foreign national price
    is_active = Column(Boolean, default=True)


class AttractionSlot(Base):
    __tablename__ = "attraction_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attraction_id = Column(UUID(as_uuid=True), ForeignKey("attractions.id"), nullable=False)
    slot_date = Column(String(10), index=True, nullable=False)  # "YYYY-MM-DD"
    start_time = Column(String(10), nullable=False)  # "09:00"
    end_time = Column(String(10), nullable=False)  # "10:00"
    total_capacity = Column(Integer, nullable=False)  # e.g. 500
    booked_count = Column(Integer, default=0)
