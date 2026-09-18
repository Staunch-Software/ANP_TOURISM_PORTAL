from typing import List, Optional

from pydantic import BaseModel


class GateServiceEntry(BaseModel):
    id: str
    title: str
    attraction_id: Optional[str] = None


class GateCreateRequest(BaseModel):
    site_id: str  # must match the LPU's own .env SITE_ID exactly
    name: str


class GateUpdateRequest(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class GateSummary(BaseModel):
    site_id: str
    name: str
    is_active: bool
    services: List[GateServiceEntry]
    created_at: str


class AssignServiceRequest(BaseModel):
    title: str
    attraction_id: Optional[str] = None
