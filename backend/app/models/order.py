import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_ref = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "AN-2026-ORD-83910"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    channel = Column(String(30), default="WEB")  # WEB, MOBILE_APP, POS_COUNTER
    gross_amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0.00)  # GST
    net_payable = Column(Numeric(10, 2), nullable=False)
    status = Column(String(30), default="PENDING_PAYMENT")  # PENDING_PAYMENT, CONFIRMED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    item_type = Column(String(30), nullable=False)  # "ATTRACTION" or "FERRY"

    attraction_slot_id = Column(UUID(as_uuid=True), ForeignKey("attraction_slots.id"), nullable=True)
    ferry_seat_id = Column(UUID(as_uuid=True), ForeignKey("ferry_seats.id"), nullable=True)

    title = Column(String(150), nullable=False)
    slot_or_seat_info = Column(String(100), nullable=False)  # "2026-09-12 (09:00 - 10:00)" or "Seat D1A"
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=1)
    subtotal = Column(Numeric(10, 2), nullable=False)

    passenger_name = Column(String(100), nullable=False)
    passenger_age = Column(Integer, nullable=True)
    passenger_gender = Column(String(10), nullable=True)
    id_type = Column(String(20), nullable=False)  # AADHAAR, PASSPORT, VOTER_ID
    id_number = Column(String(50), nullable=False)

    # RFP Group Bookings Clause V: flags a booking that matches the
    # scalper/repeat-booking heuristic so ANIIDCO can review it — does not
    # block the purchase itself.
    fraud_flag = Column(String(50), nullable=True)

    order = relationship("Order", back_populates="items")
