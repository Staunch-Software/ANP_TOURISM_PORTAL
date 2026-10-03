"""
Cancel + refund + notify for tickets sold in a slot the admin has closed
(RFP p.27 Force Majeure / "attraction is unprepared for visitation": full
refund within two working days, and the visitor is told why).

Only tickets that are still ISSUED are touched -- someone already checked in
has used their entry. If an order also contains attractions in OTHER, open
slots, only the closed-slot tickets are cancelled and only their share of
the order total (GST included) is refunded; the rest of the booking and its
QR stay valid. If every live ticket in the order is affected the whole order
is cancelled.
"""
from dataclasses import dataclass, field

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.attraction import AttractionSlot
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.models.user import User
from app.api.v1.payments import process_cancellation_refund
from app.services.email_service import send_slot_cancellation_notice
from app.services.whatsapp_service import send_whatsapp_slot_cancellation

LIVE_STATUSES = ("ISSUED", "CHECKED_IN")


@dataclass
class OrderCancellationPlan:
    order: Order
    tickets: list = field(default_factory=list)  # Ticket rows to cancel
    items: list = field(default_factory=list)  # their OrderItems
    slots: dict = field(default_factory=dict)  # slot_id -> AttractionSlot
    whole_order: bool = False
    refund_amount: float = 0.0


async def plan_slot_cancellations(db: AsyncSession, slot_ids: list) -> list:
    """What cancelling would touch -- no changes made. Used for the admin's
    confirmation preview and as the first step of the real thing."""
    if not slot_ids:
        return []

    # Tickets (not OrderItems): an Express upgrade creates an extra
    # OrderItem on the same slot but no Ticket, so going via tickets keeps
    # those out.
    rows = (await db.execute(
        select(Ticket, OrderItem, AttractionSlot, Order)
        .join(OrderItem, Ticket.order_item_id == OrderItem.id)
        .join(AttractionSlot, OrderItem.attraction_slot_id == AttractionSlot.id)
        .join(Order, Ticket.order_id == Order.id)
        .where(
            OrderItem.attraction_slot_id.in_(slot_ids),
            Ticket.check_in_status == "ISSUED",
            Order.status == "CONFIRMED",
        )
    )).all()

    plans: dict = {}
    for ticket, item, slot, order in rows:
        plan = plans.setdefault(order.id, OrderCancellationPlan(order=order))
        plan.tickets.append(ticket)
        plan.items.append(item)
        plan.slots[slot.id] = slot

    for plan in plans.values():
        order = plan.order
        cancel_ids = {t.id for t in plan.tickets}
        live = (await db.execute(
            select(Ticket.id).where(Ticket.order_id == order.id, Ticket.check_in_status.in_(LIVE_STATUSES))
        )).scalars().all()
        plan.whole_order = all(tid in cancel_ids for tid in live)

        net = float(order.net_payable)
        already_refunded = float(order.refund_amount or 0)
        if plan.whole_order:
            amount = net - already_refunded
        else:
            gross = float(order.gross_amount)
            ratio = (net / gross) if gross > 0 else 1.0
            amount = sum(float(i.subtotal) for i in plan.items) * ratio
        plan.refund_amount = round(max(0.0, min(amount, net - already_refunded)), 2)

    return list(plans.values())


def summarize(plans: list) -> dict:
    return {
        "orders_affected": len(plans),
        "tickets_affected": sum(len(p.tickets) for p in plans),
        "orders_fully_cancelled": sum(1 for p in plans if p.whole_order),
        "total_refund_inr": round(sum(p.refund_amount for p in plans), 2),
    }


async def execute_slot_cancellations(
    db: AsyncSession, background_tasks: BackgroundTasks, plans: list, reason: str
) -> dict:
    refunds_failed = 0
    for plan in plans:
        order = plan.order

        for ticket, item in zip(plan.tickets, plan.items):
            ticket.check_in_status = "CANCELLED"
            ticket.version = (ticket.version or 1) + 1
            slot = plan.slots.get(item.attraction_slot_id)
            if slot:
                slot.booked_count = max(0, (slot.booked_count or 0) - 1)
                if ticket.ticket_tier == "EXPRESS":
                    slot.premium_booked_count = max(0, (slot.premium_booked_count or 0) - 1)

        if plan.whole_order:
            order.status = "CANCELLED"
        # For a partial cancellation the order stays CONFIRMED; the refund
        # fields below record the latest refund event, and cancelled_at marks
        # it so the admin/tourist cancellation lists still surface it.
        await process_cancellation_refund(db, order, plan.refund_amount, reason)
        if order.refund_status == "FAILED":
            refunds_failed += 1

        user = (await db.execute(select(User).where(User.id == order.user_id))).scalars().first()
        if user:
            first = plan.tickets[0]
            n = len(plan.tickets)
            details = f"{first.title} on {first.slot_or_seat_info}" + (f" ({n} tickets)" if n > 1 else "")
            refund_to = "your e-wallet" if order.payment_method == "WALLET" else "your original payment method"
            if user.email:
                background_tasks.add_task(
                    send_slot_cancellation_notice,
                    user.email, order.order_ref, details, reason, plan.refund_amount, refund_to, plan.whole_order,
                )
            if user.phone_number:
                background_tasks.add_task(
                    send_whatsapp_slot_cancellation,
                    user.phone_number, order.order_ref, details, reason, plan.refund_amount, refund_to, plan.whole_order,
                )

    result = summarize(plans)
    result["refunds_failed"] = refunds_failed
    return result
