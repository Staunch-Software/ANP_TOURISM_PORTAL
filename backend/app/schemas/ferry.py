from typing import List

from pydantic import BaseModel


class CabinSummary(BaseModel):
    cabin_class: str
    starting_price_inr: float
    available_seats: int


class FerryTripResponse(BaseModel):
    schedule_id: str
    vessel_name: str
    operator_name: str
    source_port: str
    destination_port: str
    departure_date: str
    departure_time: str
    status: str
    cabins: List[CabinSummary]


class SeatMapItem(BaseModel):
    seat_id: str
    seat_number: str
    cabin_class: str
    deck_level: str
    is_window: bool
    price_inr: float
    is_available: bool
    is_held_by_you: bool


class SeatHoldRequest(BaseModel):
    seat_number: str


class SeatHoldResponse(BaseModel):
    schedule_id: str
    seat_number: str
    expires_in_seconds: int
    message: str
