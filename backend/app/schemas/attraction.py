from typing import List

from pydantic import BaseModel


class AttractionResponse(BaseModel):
    id: str
    title: str
    island: str
    category: str
    base_price_inr: float
    foreign_price_inr: float
    is_active: bool

    class Config:
        from_attributes = True


class SlotResponse(BaseModel):
    slot_id: str
    attraction_id: str
    slot_date: str
    start_time: str
    end_time: str
    total_capacity: int
    booked_count: int
    available_seats: int
    is_available: bool
