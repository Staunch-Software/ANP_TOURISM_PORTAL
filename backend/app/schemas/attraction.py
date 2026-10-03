from typing import List, Optional

from pydantic import BaseModel


class AttractionResponse(BaseModel):
    id: str
    title: str
    island: str
    category: str
    base_price_inr: float
    foreign_price_inr: float
    is_active: bool
    description: Optional[str] = None
    opening_time: Optional[str] = None  # "HH:MM"
    closing_time: Optional[str] = None  # "HH:MM"
    estimated_exploration_minutes: Optional[int] = None

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
