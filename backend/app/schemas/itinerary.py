from typing import List, Optional
from pydantic import BaseModel


class ItineraryRequest(BaseModel):
    start_date: str  # "YYYY-MM-DD"
    end_date: str  # "YYYY-MM-DD"
    island: Optional[str] = None  # PORT_BLAIR, HAVELOCK, NEIL -- omit for any island
    categories: Optional[List[str]] = None  # e.g. ["MONUMENT", "WATER_SPORT"] -- omit for any category
    nationality: str = "INDIAN"  # INDIAN or FOREIGN, decides which price is shown
    pace: Optional[str] = "STANDARD"  # RELAXED, STANDARD, PACKED -- stops suggested per day


class ItineraryStop(BaseModel):
    attraction_id: str
    title: str
    island: str
    category: str
    slot_id: str
    start_time: str
    end_time: str
    price: float
    available_seats: int


class ItineraryDay(BaseModel):
    date: str
    stops: List[ItineraryStop]


class ItineraryResponse(BaseModel):
    start_date: str
    end_date: str
    days: List[ItineraryDay]
    # Dates in range where no bookable slot matched the filters -- surfaced
    # explicitly so the caller can tell "nothing suggested" apart from
    # "day not requested".
    unplanned_dates: List[str]
