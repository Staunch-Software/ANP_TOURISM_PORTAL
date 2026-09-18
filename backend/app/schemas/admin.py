from typing import List, Optional

from pydantic import BaseModel


class HarborPassengerEntry(BaseModel):
    serial_no: int
    seat_number: str
    cabin_class: str
    passenger_name: str
    age: Optional[int]
    gender: Optional[str]
    nationality: str
    id_type: str
    id_masked_number: str
    ticket_ref: str
    check_in_status: str


class HarborManifestResponse(BaseModel):
    schedule_id: str
    vessel_name: str
    operator_name: str
    source_port: str
    destination_port: str
    departure_date: str
    departure_time: str
    total_booked_pax: int
    manifest: List[HarborPassengerEntry]


class RevenueSummaryResponse(BaseModel):
    total_revenue_inr: float
    total_orders_count: int
    total_tickets_issued: int
    monument_revenue_inr: float
    ferry_revenue_inr: float
    island_footfall: dict


class EmergencyThrottleRequest(BaseModel):
    schedule_id: Optional[str] = None
    slot_id: Optional[str] = None
    action: str = "CANCEL_WEATHER"  # "CANCEL_WEATHER" or "REDUCE_CAPACITY"
    new_capacity: Optional[int] = None
    reason: str = "IMD Cyclone / Squally Weather Warning"


class EmergencyThrottleResponse(BaseModel):
    status: str
    entity_affected: str
    action_taken: str
    message: str


class UserSummary(BaseModel):
    user_id: str
    phone_number: str
    full_name: str
    email: Optional[str] = None
    role: str
    is_active: bool
    created_at: str


class UserRoleUpdateRequest(BaseModel):
    role: Optional[str] = None  # TOURIST, ADMIN, OPERATOR, VENDOR
    is_active: Optional[bool] = None


class SlotCapacityUpdateRequest(BaseModel):
    new_capacity: int
    reason: str = "Admin Manual Expansion"


class SlotCapacityUpdateResponse(BaseModel):
    slot_id: str
    old_capacity: int
    new_capacity: int
    booked_count: int
    available_seats: int
    message: str


class DirectUserCreateRequest(BaseModel):
    phone_number: str
    full_name: str
    email: Optional[str] = None
    role: str  # TOURIST, ADMIN, OPERATOR, VENDOR


class OperatorApplicationSummary(BaseModel):
    user_id: str
    phone_number: str
    full_name: str
    email: Optional[str] = None
    business_name: Optional[str] = None
    gstin: Optional[str] = None
    trade_license_number: Optional[str] = None
    service_category: Optional[str] = None
    approval_status: str
    approval_notes: Optional[str] = None
    created_at: str


class OperatorApplicationDecisionRequest(BaseModel):
    reason: Optional[str] = None


class AdminAlertSummary(BaseModel):
    alert_id: str
    alert_type: str
    message: str
    related_order_id: Optional[str] = None
    is_resolved: bool
    created_at: str
