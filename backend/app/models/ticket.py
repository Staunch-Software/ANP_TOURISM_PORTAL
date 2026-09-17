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
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Where this ticket originated: "CLOUD" (this web/app checkout) or
    # "COUNTER" (issued offline by an LPU at a physical ticket counter,
    # see POST /sync/counter-tickets). Counter-origin tickets are signed
    # with the LPU fleet's own keypair, not this server's.
    issued_by = Column(String(20), default="CLOUD")
    site_id = Column(String(50), nullable=True)  # LPU site that issued/checked in this ticket

    # --- Multi-attraction booking support (RFP p.28: "A Unified QR code
    # can be utilized for a single booking transaction across multiple
    # attractions") ---
    # `booking_ref` groups every Ticket row that shares one signed QR --
    # for a single-attraction purchase this is just `ticket_ref` again
    # (see payments.py). `item_index` is that row's position among the
    # booking's attractions, matching the position of its entry in the
    # signed payload's `items` array -- an LPU matches a scan to a local
    # row by that position, so a booking's rows must never be reordered
    # once first synced.
    booking_ref = Column(String(50), nullable=True, index=True)
    item_index = Column(Integer, nullable=True)

    # Monotonic counter for this leg. Bumped here (the authoritative side
    # for create/cancel) on every state change this server makes -- see
    # api/v1/payments.py (starts at 1) and api/v1/sync.py's push_checkin
    # (bumped on a successful check-in from an LPU). The LPU fleet merges
    # incoming snapshots by comparing this instead of `updated_at`, since
    # an LPU device's clock can drift after days offline in a way a plain
    # integer, bumped once per real event, can't be fooled by.
    version = Column(Integer, nullable=False, default=1)
