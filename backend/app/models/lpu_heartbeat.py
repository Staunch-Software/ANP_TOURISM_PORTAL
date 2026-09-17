# One row per LPU site, upserted on every heartbeat POST from that site's
# LPU (see app/api/v1/sync.py). Lets an Authority dashboard show real-time
# uptime for "Local Processing Units at gates" per the RFP's SLA 8.4,
# which names LPUs among the hardware whose operational status must be
# reported in real time -- without this, a dead/unreachable LPU looks
# identical to a quiet one, since ticket push/pull traffic only happens
# when there's something to sync.
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime

from app.core.database import Base


class LPUHeartbeat(Base):
    __tablename__ = "lpu_heartbeats"

    site_id = Column(String(50), primary_key=True)
    last_heartbeat_at = Column(DateTime, nullable=False)
    local_ticket_count = Column(Integer, nullable=True)
    pending_sync_items = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
