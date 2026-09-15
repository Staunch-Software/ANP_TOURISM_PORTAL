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
