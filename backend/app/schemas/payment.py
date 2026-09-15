from pydantic import BaseModel


class PaymentConfirmRequest(BaseModel):
    order_ref: str
    payment_method: str = "UPI"  # UPI, CARD, NETBANKING
    mock_success: bool = True


class PaymentConfirmResponse(BaseModel):
    order_ref: str
    order_status: str
    tickets_issued_count: int
    total_paid: float
    message: str
