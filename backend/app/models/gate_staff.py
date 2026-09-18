import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class GateStaff(Base):
    """
    Cloud-authored counterpart of the LPU's local StaffUser (LPU_backend/
    app/models/staff.py) -- COUNTER/GATEKEEPER login accounts for one
    Gate. An admin creates/edits/deletes these here; the LPU pulls them
    down via GET /sync/staff and mirrors them into its own local
    StaffUser table (see LPU's sync_service.apply_staff_snapshot), the
    same push/pull relationship Gate has with GateService for tickets.

    `is_deleted` is a tombstone, not a hard delete: GET /sync/staff is a
    "since" feed like tickets, so a row that's simply gone would leave no
    trace for an LPU to notice. Flagging it deleted (and bumping
    updated_at) is what lets an already-pulled account actually get
    removed from an LPU's local StaffUser table on the next sync, instead
    of lingering forever as a stale login that still works offline.
    """
    __tablename__ = "gate_staff"
    __table_args__ = (UniqueConstraint("site_id", "username", name="uq_gate_staff_username"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(String(50), ForeignKey("gates.site_id"), nullable=False, index=True)
    username = Column(String(50), nullable=False)
    password_hash = Column(String(200), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False)  # COUNTER or GATEKEEPER
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
