from typing import List, Optional

from pydantic import BaseModel


class VendorRevenueSummary(BaseModel):
    today_gross_activity_revenue_inr: float
    aniidco_commission_inr: float
    net_payable_inr: float
    total_visitors_today: int
    active_attractions_today: int
    commission_rate_pct: float


class ActivityManifestEntry(BaseModel):
    serial_no: int
    ticket_ref: str
    passenger_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    id_type: str
    id_masked_number: str
    check_in_status: str


class ActivityManifestResponse(BaseModel):
    slot_id: str
    attraction_title: str
    slot_date: str
    start_time: str
    end_time: str
    total_booked_pax: int
    manifest: List[ActivityManifestEntry]
