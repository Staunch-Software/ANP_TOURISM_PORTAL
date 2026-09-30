import hmac
import hashlib

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.redis import get_redis
from app.core.config import settings
from app.models.user import User
from app.models.order import Order
from app.models.wallet import WalletTransaction
from app.api.v1.auth import get_current_user
from app.api.v1.payments import razorpay_client, issue_tickets_for_paid_order
from app.services.wallet_service import get_or_create_wallet, credit_wallet, debit_wallet
from app.schemas.wallet import (
    WalletResponse,
    WalletTopupCreateOrderRequest,
    WalletTopupCreateOrderResponse,
    WalletTopupConfirmRequest,
    WalletPayRequest,
    WalletTransactionResponse,
    WalletTransactionsResponse,
)
from app.schemas.payment import PaymentConfirmResponse

router = APIRouter(prefix="/wallet", tags=["Tourist e-Wallet"])


@router.get("/me", response_model=WalletResponse)
async def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await get_or_create_wallet(db, current_user.id)
    await db.commit()
    return WalletResponse(balance=float(wallet.balance), status=wallet.status)


@router.get("/transactions", response_model=WalletTransactionsResponse)
async def get_my_wallet_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await get_or_create_wallet(db, current_user.id)
    await db.commit()

    res = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.wallet_id == wallet.id)
        .order_by(WalletTransaction.created_at.desc())
        .limit(100)
    )
    rows = res.scalars().all()

    return WalletTransactionsResponse(
        balance=float(wallet.balance),
        status=wallet.status,
        transactions=[
            WalletTransactionResponse(
                txn_type=t.txn_type,
                amount=float(t.amount),
                balance_after=float(t.balance_after),
                description=t.description,
                reference_order_id=str(t.reference_order_id) if t.reference_order_id else None,
                created_at=t.created_at.isoformat(),
            )
            for t in rows
        ],
    )


@router.post("/topup/create-order", response_model=WalletTopupCreateOrderResponse)
async def create_topup_order(
    req: WalletTopupCreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Top-up amount must be greater than zero")

    wallet = await get_or_create_wallet(db, current_user.id)
    await db.commit()

    if wallet.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="This wallet is suspended and cannot be topped up")

    try:
        rzp_order = razorpay_client.order.create({
            "amount": int(req.amount * 100),
            "currency": "INR",
            "receipt": f"wallet-topup-{current_user.id}",
            "notes": {"user_id": str(current_user.id), "purpose": "WALLET_TOPUP"},
        })
        return WalletTopupCreateOrderResponse(
            order_id=rzp_order["id"],
            amount=req.amount,
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {str(e)}")


@router.post("/topup/confirm", response_model=WalletResponse)
async def confirm_topup(
    req: WalletTopupConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), msg.encode(), hashlib.sha256
    ).hexdigest()

    if expected_signature != req.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Same Razorpay payment id can only ever fund one top-up -- guards
    # against the confirm call being replayed with a captured signature.
    existing = await db.execute(
        select(WalletTransaction).where(WalletTransaction.razorpay_payment_id == req.razorpay_payment_id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="This payment has already been credited to a wallet")

    wallet = await get_or_create_wallet(db, current_user.id)
    if wallet.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="This wallet is suspended and cannot be topped up")

    await credit_wallet(
        db, wallet, req.amount, "TOPUP",
        description="Wallet top-up via Razorpay",
        razorpay_payment_id=req.razorpay_payment_id,
    )
    await db.commit()

    return WalletResponse(balance=float(wallet.balance), status=wallet.status)


@router.post("/pay", response_model=PaymentConfirmResponse)
async def pay_order_with_wallet(
    req: WalletPayRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    r=Depends(get_redis),
):
    res = await db.execute(
        select(Order).where(Order.order_ref == req.order_ref, Order.user_id == current_user.id)
    )
    order = res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order reference not found")

    if order.status == "CONFIRMED":
        raise HTTPException(status_code=400, detail="Order has already been paid and tickets are issued")

    wallet = await get_or_create_wallet(db, current_user.id)

    await debit_wallet(
        db, wallet, float(order.net_payable), "DEBIT_PURCHASE",
        description=f"Payment for order {order.order_ref}",
        reference_order_id=order.id,
    )

    order.status = "CONFIRMED"
    order.payment_method = "WALLET"

    tickets_to_create = await issue_tickets_for_paid_order(order, current_user, db, r, background_tasks)

    return PaymentConfirmResponse(
        order_ref=order.order_ref,
        order_status=order.status,
        tickets_issued_count=len(tickets_to_create),
        total_paid=float(order.net_payable),
        message="Paid from wallet. A single Unified QR boarding pass has been generated for this order!",
    )
