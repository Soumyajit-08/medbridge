"""
app/utils/datetime_utils.py
──────────────────────────────────────────────────────────────────────────────
Date and time helper functions.

IMPORTANT: Always use timezone-aware datetimes (UTC).
Never use naive datetime.now() — it makes comparisons unreliable.
"""

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def days_until(dt: datetime) -> int:
    """
    Calculate how many days remain until a given datetime.
    Returns negative number if the date has already passed.

    Example:
        expiry = datetime(2025, 12, 31, tzinfo=timezone.utc)
        days = days_until(expiry)  # e.g., 7
    """
    dt_aware = ensure_utc(dt)
    delta = dt_aware - utc_now()
    return delta.days  # This is floor division, gives whole days


def is_expired(dt: datetime) -> bool:
    """Return True if the given datetime is in the past."""
    return ensure_utc(dt) < utc_now()
