"""Shared schema helpers used across event, risk and forecast schemas."""
from datetime import datetime, timezone
from typing import Annotated

from pydantic import BeforeValidator


def _ensure_utc(value):
    """Treat naive datetimes as UTC so the API always emits an explicit offset.

    The database stores naive UTC datetimes. Without this, Pydantic serializes
    them with no offset and browsers parse the value as local time.
    """
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


UtcDatetime = Annotated[datetime, BeforeValidator(_ensure_utc)]
