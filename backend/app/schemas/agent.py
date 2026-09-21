from typing import List, Optional

from pydantic import BaseModel

from app.schemas.cart import PassengerDetail


class AgentBookingRequest(BaseModel):
    slot_id: str
    nationality: str = "INDIAN"  # INDIAN, FOREIGN
    passenger: PassengerDetail


class AgentFerryBookingRequest(BaseModel):
    schedule_id: str
    seat_number: str
    passenger: PassengerDetail


class AgentBookingResponse(BaseModel):
    booking_ref: str
    ticket_ref: str
    title: str
    slot_or_seat_info: str
    amount_charged_inr: float
    message: str


class AgentBookingSummary(BaseModel):
    order_ref: str
    title: str
    slot_or_seat_info: str
    passenger_name: str
    amount_inr: float
    check_in_status: str
    created_at: str
