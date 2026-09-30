from typing import List, Optional
from pydantic import BaseModel


class WalletResponse(BaseModel):
    balance: float
    status: str  # ACTIVE, SUSPENDED


class WalletTopupCreateOrderRequest(BaseModel):
    amount: float


class WalletTopupCreateOrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str
    key_id: str


class WalletTopupConfirmRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount: float


class WalletPayRequest(BaseModel):
    order_ref: str


class WalletTransactionResponse(BaseModel):
    txn_type: str
    amount: float
    balance_after: float
    description: Optional[str] = None
    reference_order_id: Optional[str] = None
    created_at: str


class WalletTransactionsResponse(BaseModel):
    balance: float
    status: str
    transactions: List[WalletTransactionResponse]


class AdminWalletRow(BaseModel):
    wallet_id: str
    user_id: str
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    balance: float
    status: str
    admin_notes: Optional[str] = None


class AdminWalletListResponse(BaseModel):
    total_wallets: int
    total_balance: float
    wallets: List[AdminWalletRow]


class AdminWalletStatusUpdateRequest(BaseModel):
    status: str  # ACTIVE, SUSPENDED
    reason: Optional[str] = None
