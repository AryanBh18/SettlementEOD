from datetime import datetime
from zoneinfo import ZoneInfo

SURINAME_TZ = ZoneInfo("America/Paramaribo")


def now_sr() -> datetime:
    """Return the current naive datetime in Suriname local time (UTC-3)."""
    return datetime.now(SURINAME_TZ).replace(tzinfo=None)


def now_sr_aware() -> datetime:
    """Return the current timezone-aware datetime in Suriname local time (UTC-3)."""
    return datetime.now(SURINAME_TZ)
