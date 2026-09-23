from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

VALID_STAFF_ROLES = {"COUNTER", "GATEKEEPER"}


class StaffCreateRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str  # COUNTER or GATEKEEPER


class StaffUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None  # set to reset it
    is_active: Optional[bool] = None


class StaffSummary(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: str


class StaffSyncEntry(BaseModel):
    username: str
    password_hash: str
    full_name: str
    role: str
    is_active: bool
    is_deleted: bool
    updated_at: datetime


class StaffChangesResponse(BaseModel):
    staff: List[StaffSyncEntry]
    allowed_titles: List[str]
    allowed_slots: dict = {}
    server_time: datetime
