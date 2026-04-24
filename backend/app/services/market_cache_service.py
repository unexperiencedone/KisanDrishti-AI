"""
Market Price Cache Service
==========================
Implements a region-wise, slot-based cache stored in Supabase (Postgres).

Slot logic (IST = UTC+5:30):
  morning  →  06:00 – 17:59 IST   (valid for the whole morning block)
  evening  →  18:00 – 05:59 IST   (valid for the whole evening block, date is the IST date at 18:00)

Each (region_key, slot, slot_date) row is unique.  Only TWO Agmarknet calls
are ever made per region per calendar day, regardless of how many users hit
the endpoint.
"""

from datetime import datetime, date, timezone, timedelta
from typing import Optional, Tuple
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.models import MarketPriceCache

# IST offset
_IST = timezone(timedelta(hours=5, minutes=30))


def _normalise_region(region: str) -> str:
    """Stable lowercase slug used as the cache key (strips extra spaces/case)."""
    return region.strip().lower().replace("  ", " ")


def _current_slot_ist() -> Tuple[str, date]:
    """
    Returns (slot_name, slot_date) for the current IST moment.

    morning  → 06:00–17:59 IST  — date is today (IST)
    evening  → 18:00–23:59 IST  — date is today (IST)
    night    → 00:00–05:59 IST  — treated as 'evening' of the PREVIOUS IST day
                                   so it belongs to the same cache entry as last
                                   night's 18:00 fetch.
    """
    now_ist = datetime.now(_IST)
    h = now_ist.hour
    if 6 <= h < 18:
        return "morning", now_ist.date()
    elif h >= 18:
        return "evening", now_ist.date()
    else:
        # 00:00–05:59 IST: this is the "evening" of the previous IST day
        prev_day = (now_ist - timedelta(days=1)).date()
        return "evening", prev_day


async def get_cached_prices(
    db: AsyncSession, region: str
) -> Optional[dict]:
    """
    Return cached market data for `region` if a valid slot entry exists.
    Returns None if the slot has never been fetched or has expired.
    """
    region_key = _normalise_region(region)
    slot, slot_date = _current_slot_ist()

    stmt = select(MarketPriceCache).where(
        MarketPriceCache.region_key == region_key,
        MarketPriceCache.slot == slot,
        MarketPriceCache.slot_date == slot_date,
    )
    result = await db.execute(stmt)
    row: Optional[MarketPriceCache] = result.scalar_one_or_none()

    if row is not None:
        # Annotate so the caller knows it came from cache
        payload = dict(row.data)
        payload["_cache"] = {
            "hit": True,
            "slot": slot,
            "slot_date": str(slot_date),
            "fetched_at": row.fetched_at.isoformat() if row.fetched_at else None,
        }
        return payload
    return None


async def store_cached_prices(
    db: AsyncSession, region: str, data: dict, source: str
) -> None:
    """
    Upsert a market-price payload into the cache for the current slot.
    Uses INSERT … ON CONFLICT DO UPDATE so concurrent requests are safe.
    """
    region_key = _normalise_region(region)
    slot, slot_date = _current_slot_ist()

    stmt = pg_insert(MarketPriceCache).values(
        id=uuid4(),
        region_key=region_key,
        region_label=region,
        slot=slot,
        slot_date=slot_date,
        data=data,
        source=source,
        fetched_at=datetime.now(_IST).replace(tzinfo=None),
    ).on_conflict_do_update(
        constraint="uq_market_cache_slot",
        set_={
            "data": data,
            "source": source,
            "fetched_at": datetime.now(_IST).replace(tzinfo=None),
        },
    )
    await db.execute(stmt)
    await db.commit()
