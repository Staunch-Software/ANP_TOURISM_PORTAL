import uuid
from datetime import datetime

from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Wallet(Base):
    """
    RFP: "Digital Transaction Facility... shall include e-wallet and Card
    based Transactions" + Admin "approve/suspend wallets, add/edit
    comments" + "Wallet performance" in the Weekly Activity Report. One
    wallet per user, created lazily on first access (see GET /wallet/me).
    """
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    balance = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, SUSPENDED
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WalletTransaction(Base):
    """Immutable, append-only ledger -- every top-up, spend, refund-credit
    and admin adjustment gets its own row here, never edited afterwards."""
    __tablename__ = "wallet_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)

    txn_type = Column(String(30), nullable=False)  # TOPUP, DEBIT_PURCHASE, CREDIT_REFUND, ADMIN_CREDIT, ADMIN_DEBIT
    amount = Column(Numeric(10, 2), nullable=False)  # always a positive magnitude; txn_type gives direction
    balance_after = Column(Numeric(10, 2), nullable=False)

    reference_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)  # set for TOPUP rows only
    description = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
