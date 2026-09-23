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
