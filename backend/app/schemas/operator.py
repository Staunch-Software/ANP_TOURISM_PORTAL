from pydantic import BaseModel


class OperatorRevenueSummary(BaseModel):
    today_gross_ferry_revenue_inr: float
    aniidco_commission_inr: float
    net_payable_inr: float
    total_passengers_today: int
    active_vessels_today: int
    commission_rate_pct: float
