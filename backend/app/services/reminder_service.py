"""
RFP p.25 "Timely Reminders": "Visitors should receive timely
notifications prior to their scheduled time slots." Runs on a schedule
(see main.py's lifespan) and sends one email per ticket once its slot
falls within REMINDER_LEAD_HOURS -- never re-sent, tracked via
Ticket.reminder_sent_at.
"""
import logging
from datetime import datetime

from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.models.ticket import Ticket
from app.models.order import OrderItem
from app.models.attraction import AttractionSlot
from app.models.ferry import FerrySeat, FerrySchedule
from app.models.user import User
from app.services.email_service import send_pre_visit_reminder
from app.services.time_service import now_ist

logger = logging.getLogger("anp.reminders")

REMINDER_LEAD_HOURS = 24


async def _get_slot_start(db, ticket: Ticket):
    item_res = await db.execute(select(OrderItem).where(OrderItem.id == ticket.order_item_id))
    item = item_res.scalars().first()
    if not item:
        return None

    if item.attraction_slot_id:
        slot_res = await db.execute(select(AttractionSlot).where(AttractionSlot.id == item.attraction_slot_id))
        slot = slot_res.scalars().first()
        if not slot:
            return None
        slot_date = datetime.strptime(slot.slot_date, "%Y-%m-%d").date()
        start_time = datetime.strptime(slot.start_time, "%H:%M").time()
        return datetime.combine(slot_date, start_time)

    if item.ferry_seat_id:
        seat_res = await db.execute(select(FerrySeat).where(FerrySeat.id == item.ferry_seat_id))
        seat = seat_res.scalars().first()
        if not seat:
            return None
        sched_res = await db.execute(select(FerrySchedule).where(FerrySchedule.id == seat.schedule_id))
        sched = sched_res.scalars().first()
        if not sched:
            return None
        return datetime.combine(sched.departure_date, sched.departure_time)

    return None


async def send_pending_reminders() -> None:
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Ticket).where(Ticket.check_in_status == "ISSUED", Ticket.reminder_sent_at.is_(None))
        )
        tickets = res.scalars().all()

        now = now_ist()
        sent = 0
        for ticket in tickets:
            slot_start = await _get_slot_start(db, ticket)
            if not slot_start:
                continue

            hours_until = (slot_start - now).total_seconds() / 3600

            if hours_until < 0:
                # Slot already passed -- nothing to remind about, but mark
                # it so this ticket stops being rescanned every pass.
                ticket.reminder_sent_at = now
                continue

            if hours_until <= REMINDER_LEAD_HOURS:
                user_res = await db.execute(select(User).where(User.id == ticket.user_id))
                user = user_res.scalars().first()
                if user and user.email:
                    await send_pre_visit_reminder(user.email, ticket.title, ticket.slot_or_seat_info, ticket.ticket_ref)
                    sent += 1
                ticket.reminder_sent_at = now

        await db.commit()
        logger.info(f"Pre-visit reminders: sent {sent} email(s) this pass.")
