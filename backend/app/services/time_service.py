"""
Attraction slot times and ferry departure times (AttractionSlot.start_time,
FerrySchedule.departure_time) are entered and displayed as Andaman & Nicobar
local wall-clock time (IST, UTC+5:30, no DST) -- when a tourist books
"09:00", they mean 9 AM in Port Blair, not 9 AM UTC. Several call sites
were comparing that naive IST-meaning datetime against datetime.utcnow()
directly, silently shifting every time-window check by 5.5 hours (e.g. the
"cancel only up to 24h before" rule was actually enforcing something
closer to 18.5h or 29.5h depending on direction). now_ist() is the fix:
use it instead of datetime.utcnow() wherever "now" is being compared
against one of those naive local-meaning slot timestamps.
"""
from datetime import datetime, timedelta

IST_OFFSET = timedelta(hours=5, minutes=30)


def now_ist() -> datetime:
    """Current wall-clock time in IST, as a naive datetime -- matches the
    convention slot_date/start_time and departure_date/departure_time
    already use, so it can be compared directly against them."""
    return datetime.utcnow() + IST_OFFSET
