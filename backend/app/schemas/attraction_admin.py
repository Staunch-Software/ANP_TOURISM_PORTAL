from typing import List, Optional
from pydantic import BaseModel


class SlotTimeInput(BaseModel):
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"
    capacity: int


class AttractionCreateRequest(BaseModel):
    title: str
    island: str  # PORT_BLAIR, HAVELOCK, NEIL
    category: str  # MONUMENT, LIGHT_SOUND, WATER_SPORT
    base_price_inr: float
    foreign_price_inr: float
    express_price_inr: Optional[float] = None
    express_price_foreign_inr: Optional[float] = None
    description: Optional[str] = None
    # Derived from the earliest start / latest end of slot_times when omitted.
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    estimated_exploration_minutes: Optional[int] = None
    image_url: Optional[str] = None
    slot_times: List[SlotTimeInput]


class AttractionUpdateRequest(BaseModel):
    title: Optional[str] = None
    island: Optional[str] = None
    category: Optional[str] = None
    base_price_inr: Optional[float] = None
    foreign_price_inr: Optional[float] = None
    express_price_inr: Optional[float] = None
    express_price_foreign_inr: Optional[float] = None
    description: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    estimated_exploration_minutes: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class SlotTimesReplaceRequest(BaseModel):
    slot_times: List[SlotTimeInput]


class ClosureCreateRequest(BaseModel):
    start_date: str  # "YYYY-MM-DD", inclusive
    end_date: str  # inclusive; same as start_date for a single day
    start_time: Optional[str] = None  # omit both times for a whole-day closure
    end_time: Optional[str] = None
    reason: str


class ClosureResponse(BaseModel):
    id: str
    attraction_id: str
    start_date: str
    end_date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: str
    created_at: str


class ClosureCreateResponse(BaseModel):
    closure: ClosureResponse
    slots_closed: int
    # Seats already sold inside the closed range. These bookings are NOT
    # cancelled -- the admin has to handle them separately.
    booked_seats_in_range: int


class SlotStatusUpdateRequest(BaseModel):
    is_active: bool


class SlotStatusResponse(BaseModel):
    slot_id: str
    slot_date: str
    start_time: str
    end_time: str
    is_active: bool
    booked_count: int


class AdminAttractionResponse(BaseModel):
    id: str
    title: str
    island: str
    category: str
    base_price_inr: float
    foreign_price_inr: float
    express_price_inr: Optional[float] = None
    express_price_foreign_inr: Optional[float] = None
    is_active: bool
    description: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    estimated_exploration_minutes: Optional[int] = None
    image_url: Optional[str] = None
    slot_times: List[SlotTimeInput]
    closures: List[ClosureResponse]


class CancelBookingsRequest(BaseModel):
    # Shown to the affected visitors in their cancellation notice.
    reason: str


class AffectedBookingsResponse(BaseModel):
    orders_affected: int
    tickets_affected: int
    orders_fully_cancelled: int
    total_refund_inr: float


class CancelBookingsResponse(AffectedBookingsResponse):
    refunds_failed: int  # visible under Cancellations & Refunds for retry
