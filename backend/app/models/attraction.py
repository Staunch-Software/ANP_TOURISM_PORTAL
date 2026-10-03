import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Text, DateTime, UniqueConstraint
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

    # RFP p.28 "Upgradation/Re-schedule of Tickets": "A certain percentage
    # of Tickets should be earmarked for Premium Tickets with higher
    # pricing." Nullable so an attraction with no configured Express price
    # falls back to a 1.5x default (see tickets.py) rather than blocking
    # the upgrade feature entirely.
    express_price_inr = Column(Numeric(10, 2), nullable=True)
    express_price_foreign_inr = Column(Numeric(10, 2), nullable=True)

    # RFP p.24 Visitors Dashboard item (b): each attraction must carry
    # "names, concise descriptions, images, estimated exploration times,
    # opening and closing hours, as well as available time slots".
    # Nullable so attractions created before these existed still load;
    # availability_service backfills them (only where still NULL, so an
    # admin's later edit is never overwritten).
    description = Column(Text, nullable=True)
    opening_time = Column(String(5), nullable=True)  # "09:00"
    closing_time = Column(String(5), nullable=True)  # "16:00"
    estimated_exploration_minutes = Column(Integer, nullable=True)
    # RFP p.30: admin adds attractions with images. A URL or a path under
    # the frontend's /images/ folder; the frontend falls back to its own
    # title-keyed lookup when this is NULL.
    image_url = Column(String(300), nullable=True)


class AttractionSlot(Base):
    __tablename__ = "attraction_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attraction_id = Column(UUID(as_uuid=True), ForeignKey("attractions.id"), nullable=False)
    slot_date = Column(String(10), index=True, nullable=False)  # "YYYY-MM-DD"
    start_time = Column(String(10), nullable=False)  # "09:00"
    end_time = Column(String(10), nullable=False)  # "10:00"
    total_capacity = Column(Integer, nullable=False)  # e.g. 500
    booked_count = Column(Integer, default=0)

    # Earmarked Express/Premium allocation, carved out of total_capacity --
    # a portion of every slot's seats are reserved so an upgrade can
    # always be honoured even once standard tickets sell out.
    premium_capacity = Column(Integer, default=0)
    premium_booked_count = Column(Integer, default=0)

    # RFP p.30: admin can deactivate individual time slots (e.g. for
    # maintenance). A closed slot takes no NEW bookings; tickets already
    # issued for it are left alone.
    is_active = Column(Boolean, default=True, nullable=False)


class AttractionSlotTemplate(Base):
    """The recurring daily slot pattern for an attraction. The rolling
    availability job turns these into dated AttractionSlot rows, so an
    attraction an admin creates gets bookable slots every day just like the
    seeded ones (previously the pattern lived only in catalog_templates.py)."""
    __tablename__ = "attraction_slot_templates"
    __table_args__ = (UniqueConstraint("attraction_id", "start_time", name="uq_slot_template_start"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attraction_id = Column(UUID(as_uuid=True), ForeignKey("attractions.id"), nullable=False, index=True)
    start_time = Column(String(5), nullable=False)  # "09:00"
    end_time = Column(String(5), nullable=False)  # "10:00"
    capacity = Column(Integer, nullable=False)


class AttractionClosure(Base):
    """RFP p.30: "Activate or deactivate attractions on any particular day or
    within specified time intervals." A date range, optionally narrowed to a
    time-of-day window; every slot it covers is closed to new bookings."""
    __tablename__ = "attraction_closures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attraction_id = Column(UUID(as_uuid=True), ForeignKey("attractions.id"), nullable=False, index=True)
    start_date = Column(String(10), nullable=False)  # "YYYY-MM-DD", inclusive
    end_date = Column(String(10), nullable=False)  # inclusive
    start_time = Column(String(5), nullable=True)  # NULL = whole day
    end_time = Column(String(5), nullable=True)
    reason = Column(Text, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
