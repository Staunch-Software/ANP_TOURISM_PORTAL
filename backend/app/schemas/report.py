from typing import List, Optional
from pydantic import BaseModel


class AdHocReportRow(BaseModel):
    order_ref: str
    ticket_ref: Optional[str] = None
    item_type: str
    title: str
    slot_or_seat_info: str
    passenger_name: str
    nationality: Optional[str] = None
    unit_price: float
    order_status: str
    refund_status: Optional[str] = None
    created_at: str


class AdHocReportSummary(BaseModel):
    total_rows: int
    gross_amount: float


class AdHocReportResponse(BaseModel):
    summary: AdHocReportSummary
    rows: List[AdHocReportRow]
