from typing import List, Optional
from datetime import datetime

from pydantic import BaseModel


class TicketChangeLeg(BaseModel):
    """One entitlement within a booking -- a booking's QR may cover several
    (RFP p.28: "Unified QR code... across multiple attractions"), including
    a Group Booking, where every leg is a DIFFERENT PASSENGER on the same
    attraction/slot rather than a different attraction. Order in this list
    is the contract: the LPU matches a leg to its local row by position
    (item_index), not by title, so never reorder an existing booking's
    items list once pushed.

    Passenger identity lives HERE, per leg -- not only on TicketChangeItem
    -- because a Group Booking has one passenger per leg, not one shared
    passenger for the whole booking. TicketChangeItem.passenger_name/
    id_type/id_number remain as a booking-level "lead contact" fallback
    for older LPU builds; these per-leg fields are what an updated LPU
    actually uses to attribute a scan to the right person.
    """
    ticket_ref: str  # this leg's own individual Ticket.ticket_ref (one per passenger)
    item_type: str
    title: str
    slot_or_seat_info: str
    check_in_status: str  # ISSUED, CHECKED_IN, or CANCELLED -- per leg
    checked_in_at: Optional[datetime] = None
    version: int = 1  # monotonic per-leg counter -- see models/ticket.py
    passenger_name: str
    passenger_age: Optional[int] = None
    passenger_gender: Optional[str] = None
    id_type: str
    id_number: str


class TicketChangeItem(BaseModel):
    ticket_ref: str  # this is the booking_ref -- what the LPU keys its local booking on
    items: List[TicketChangeLeg]
    passenger_name: str  # lead/head passenger only -- see TicketChangeLeg for per-leg identity
    passenger_age: Optional[int] = None
    passenger_gender: Optional[str] = None
    id_type: str
    id_number: str
    qr_payload_json: str
    qr_signature_b64: str
    issued_by: str
    updated_at: datetime


class TicketChangesResponse(BaseModel):
    tickets: List[TicketChangeItem]
    server_time: datetime


class CheckinRequest(BaseModel):
    ticket_ref: str  # booking_ref
    item_index: int  # which leg of the booking was just scanned
    title: str  # denormalized for a human reading cloud-side logs/admin
    version: Optional[int] = None  # the LPU's own post-check-in version, for cross-checking/logging only -- this server still bumps its own version independently as the authority for what version means here
    site_id: str
    checked_in_at: datetime


class CheckinResponse(BaseModel):
    status: str
    ticket_ref: str
    message: str


class CounterTicketRequest(BaseModel):
    ticket_ref: str
    site_id: str
    item_type: str  # ATTRACTION or FERRY
    title: str
    slot_or_seat_info: str
    passenger_name: str
    passenger_age: Optional[int] = None
    passenger_gender: Optional[str] = None
    id_type: str
    id_number: str
    price_inr: float
    contact_phone: str
    contact_email: Optional[str] = None
    qr_payload_json: str
    qr_signature_b64: str
    issued_at: datetime


class CounterTicketResponse(BaseModel):
    status: str
    ticket_ref: str
    message: str


class HeartbeatRequest(BaseModel):
    site_id: str
    reported_at: datetime
    local_ticket_count: int
    pending_sync_items: int


class HeartbeatResponse(BaseModel):
    status: str
    site_id: str