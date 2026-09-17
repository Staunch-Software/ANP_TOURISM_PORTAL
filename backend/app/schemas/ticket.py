from pydantic import BaseModel


class TicketPassResponse(BaseModel):
    ticket_ref: str
    item_type: str
    title: str
    slot_or_seat_info: str
    passenger_name: str
    id_type: str
    id_number: str
    check_in_status: str
    qr_token: str  # Combined Base64 QR code representation


class OfflineVerificationResponse(BaseModel):
    ticket_ref: str
    passenger_name: str
    is_signature_valid: bool
    verification_mode: str
    gate_decision: str


class StaffCheckInRequest(BaseModel):
    ticket_ref: str


class StaffCheckInResponse(BaseModel):
    check_in_status: str
    ticket_ref: str
    passenger_name: str
    item_type: str
    slot_or_seat_info: str
    message: str
