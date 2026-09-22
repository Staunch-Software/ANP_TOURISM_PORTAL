from typing import Optional
from pydantic import BaseModel


class GrievanceCreateRequest(BaseModel):
    category: str
    subject: str
    description: str
    related_booking_ref: Optional[str] = None


class GrievanceSummary(BaseModel):
    id: str
    ticket_ref: str
    category: str
    subject: str
    description: str
    related_booking_ref: Optional[str] = None
    priority: str
    escalation_level: str
    status: str
    resolution_notes: Optional[str] = None
    complainant_phone: Optional[str] = None
    created_at: str
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None


class GrievancePriorityUpdateRequest(BaseModel):
    priority: str


class GrievanceEscalateRequest(BaseModel):
    reason: Optional[str] = None


class GrievanceResolveRequest(BaseModel):
    resolution_notes: str
