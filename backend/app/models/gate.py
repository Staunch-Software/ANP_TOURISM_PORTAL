import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Gate(Base):
    """
    Provisioning record for one LPU deployment -- the cloud-side
    counterpart of the LPU's own SITE_ID (LPU_backend/.env). Nothing
    syncs for a site_id with no active Gate row here (see
    app/api/v1/sync.py's require_provisioned_gate), mirroring how
    Aepms-backend's VesselInfo gates every /engine-sync/* call on a
    vessel being provisioned first.

    A Gate's assigned GateService rows decide which tickets that LPU
    pulls (RFP: "each site's local DB should only contain related
    tickets") -- see get_ticket_changes.
    """
    __tablename__ = "gates"

    site_id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    services = relationship("GateService", back_populates="gate", cascade="all, delete-orphan")


class GateService(Base):
    """
    One attraction/ferry-route a Gate is authorized to serve. Matched
    against Ticket.title -- the same field every other gate-matching
    check in this system already keys on (the LPU's own
    SITE_ALLOWED_TITLES, and scan.py's wrong-gate check) -- so this has
    to be the exact title text, not a fuzzy match.

    `attraction_id` is optional: set it when this service is a real
    Attraction (lets the admin UI show a proper name/picker instead of
    free text); leave it null for a ferry route, which doesn't have one
    canonical Attraction row to point at.
    """
    __tablename__ = "gate_services"
    __table_args__ = (UniqueConstraint("site_id", "title", name="uq_gate_service_title"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(String(50), ForeignKey("gates.site_id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    attraction_id = Column(UUID(as_uuid=True), ForeignKey("attractions.id"), nullable=True)

    gate = relationship("Gate", back_populates="services")
