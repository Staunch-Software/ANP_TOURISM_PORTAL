from typing import List, Optional

from pydantic import BaseModel


class EntitlementResponse(BaseModel):
    ticket_ref: str
    item_type: str
    title: str
    slot_or_seat_info: str
    passenger_name: str
    id_type: str
    id_number: str
    check_in_status: str


class OrderPassResponse(BaseModel):
    booking_ref: str
    order_ref: str
    lead_passenger_name: str
    qr_token: str  # Combined JSON payload + signature, shared by every Ticket row under this booking_ref
    entitlements: List[EntitlementResponse]


class OfflineVerificationResponse(BaseModel):
    booking_ref: str
    lead_passenger_name: str
    is_signature_valid: bool
    verification_mode: str
    entitlements: List[EntitlementResponse]


class StaffCheckInRequest(BaseModel):
    ticket_ref: str


class StaffCheckInResponse(BaseModel):
    check_in_status: str
    booking_ref: Optional[str] = None
    ticket_ref: str
    passenger_name: str
    item_type: str
    title: str
    slot_or_seat_info: str
    message: str
    remaining_entitlements: List[EntitlementResponse]
