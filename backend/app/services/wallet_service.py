import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.wallet import Wallet, WalletTransaction


async def get_or_create_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
    """Wallets are created lazily on first access rather than at signup --
    most tourists will never use one, so there's no reason to pre-create
    a row for every account."""
    res = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = res.scalars().first()
    if wallet:
        return wallet

    wallet = Wallet(user_id=user_id, balance=0.00, status="ACTIVE")
    db.add(wallet)
    await db.flush()
    return wallet


async def credit_wallet(
    db: AsyncSession,
    wallet: Wallet,
    amount: float,
    txn_type: str,
    description: str = None,
    reference_order_id: uuid.UUID = None,
    razorpay_payment_id: str = None,
) -> WalletTransaction:
    wallet.balance = float(wallet.balance) + amount
    txn = WalletTransaction(
        wallet_id=wallet.id,
        txn_type=txn_type,
        amount=amount,
        balance_after=wallet.balance,
        reference_order_id=reference_order_id,
        razorpay_payment_id=razorpay_payment_id,
        description=description,
    )
    db.add(txn)
    return txn


async def debit_wallet(
    db: AsyncSession,
    wallet: Wallet,
    amount: float,
    txn_type: str,
    description: str = None,
    reference_order_id: uuid.UUID = None,
) -> WalletTransaction:
    if wallet.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="This wallet is suspended and cannot be used for payments")

    if float(wallet.balance) < amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    wallet.balance = float(wallet.balance) - amount
    txn = WalletTransaction(
        wallet_id=wallet.id,
        txn_type=txn_type,
        amount=amount,
        balance_after=wallet.balance,
        reference_order_id=reference_order_id,
        description=description,
    )
    db.add(txn)
    return txn
