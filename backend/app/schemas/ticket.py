from typing import List, Optional

from pydantic import BaseModel


class EntitlementResponse(BaseModel):
    order_item_id: str
    item_type: str
    title: str
    slot_or_seat_info: str
    passenger_name: str
    id_type: str
    id_number: str
    check_in_status: str


class OrderPassResponse(BaseModel):
    pass_ref: str
    order_ref: str
    lead_passenger_name: str
    qr_token: str  # Combined JSON payload + signature, encoded once for the whole order
    entitlements: List[EntitlementResponse]


class OfflineVerificationResponse(BaseModel):
    pass_ref: str
    lead_passenger_name: str
    is_signature_valid: bool
    verification_mode: str
    entitlements: List[EntitlementResponse]


class StaffCheckInRequest(BaseModel):
    pass_ref: str
    order_item_id: str


class StaffCheckInResponse(BaseModel):
    check_in_status: str
    pass_ref: str
    order_item_id: str
    passenger_name: str
    item_type: str
    title: str
    slot_or_seat_info: str
    message: str
    remaining_entitlements: List[EntitlementResponse]
