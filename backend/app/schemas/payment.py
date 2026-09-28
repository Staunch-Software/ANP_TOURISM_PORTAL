from pydantic import BaseModel
from typing import Optional

class RazorpayOrderRequest(BaseModel):
    order_ref: str

class RazorpayOrderResponse(BaseModel):
    success: bool
    order_id: str
    amount: float
    currency: str
    key_id: str

class PaymentConfirmRequest(BaseModel):
    order_ref: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentConfirmResponse(BaseModel):
    order_ref: str
    order_status: str
    tickets_issued_count: int
    total_paid: float
    message: str

class RefundRequest(BaseModel):
    payment_id: str
    amount: float
    reason: Optional[str] = "Customer ticket cancellation"


class CancellationSummary(BaseModel):
    id: Optional[str] = None
    order_ref: str
    order_status: str
    gross_amount: float
    net_payable: float
    cancelled_at: Optional[str] = None
    refund_status: Optional[str] = None  # PROCESSED, FAILED, NOT_APPLICABLE
    refund_amount: Optional[float] = None
    refund_id: Optional[str] = None
    refund_failure_reason: Optional[str] = None
    complainant_phone: Optional[str] = None  # admin view only
