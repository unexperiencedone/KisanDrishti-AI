"""
Market Prices Router (with Supabase-backed region-wise cache)
=============================================================
Cache policy: fetch from Agmarknet at most TWICE per region per day
  - Morning slot  06:00–17:59 IST
  - Evening slot  18:00–05:59 IST

All users hitting the same region within a slot share one DB row —
Agmarknet is never called more than 2× per region per day.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import logging
from datetime import datetime
from typing import Optional

from app.db.session import get_db
from app.services.market_cache_service import get_cached_prices, store_cached_prices
from app.core.config import get_settings

_settings = get_settings()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/market-prices", tags=["market-prices"])

# ── Realistic UP mandi baseline (used when Agmarknet is unreachable) ──────────
FALLBACK_PRICES = [
    {"commodity": "Paddy (Rice)",    "price": 2150, "prev_price": 2093},
    {"commodity": "Wheat",           "price": 2050, "prev_price": 2023},
    {"commodity": "Maize",           "price": 1850, "prev_price": 1861},
    {"commodity": "Gram (Chickpea)", "price": 5450, "prev_price": 5276},
    {"commodity": "Mustard",         "price": 5950, "prev_price": 5839},
    {"commodity": "Soybean",         "price": 4250, "prev_price": 4284},
]

def _pct_change(new: float, old: float) -> float:
    if old == 0:
        return 0.0
    return round(((new - old) / old) * 100, 1)


async def _fetch_agmarknet(state: str, district: str) -> Optional[list]:
    """Fetch live prices from data.gov.in Agmarknet."""
    url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    params = {
        "api-key": _settings.AGMARKNET_API_KEY,
        "format": "json",
        "filters[State]": state,
        "filters[District]": district,
        "limit": 30,
        "offset": 0,
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                records = resp.json().get("records", [])
                seen: dict[str, dict] = {}
                for rec in records:
                    name = rec.get("Commodity", "")
                    modal_price = rec.get("Modal Price")
                    if name and modal_price:
                        seen[name] = {
                            "commodity": name,
                            "price": float(modal_price),
                            "min_price": float(rec.get("Min Price", 0)),
                            "max_price": float(rec.get("Max Price", 0)),
                            "unit": "Quintal",
                            "market": rec.get("Market", district),
                            "arrival_date": rec.get("Arrival Date", ""),
                        }
                if seen:
                    return list(seen.values())
    except Exception as exc:
        logger.warning("Agmarknet fetch failed for %s/%s: %s", state, district, exc)
    return None


def _build_response(commodities: list, region: str, source: str, cache_meta: Optional[dict] = None) -> dict:
    return {
        "region": region,
        "as_of": datetime.now().isoformat(),
        "source": source,
        "commodities": commodities,
        **({"_cache": cache_meta} if cache_meta else {}),
    }


@router.get("/")
async def get_market_prices(
    region: str = "Kanpur, Uttar Pradesh",
    db: AsyncSession = Depends(get_db),
):
    """
    Return commodity prices for `region`.

    Cache hit  → response is served instantly from Supabase (no Agmarknet call).
    Cache miss → Agmarknet is called once; result stored for the rest of the slot.
    """
    # ── 1. Try cache first ────────────────────────────────────────────────────
    cached = await get_cached_prices(db, region)
    if cached:
        logger.info("Cache HIT for region='%s' slot=%s", region, cached["_cache"]["slot"])
        return cached

    # ── 2. Cache miss → call Agmarknet ────────────────────────────────────────
    logger.info("Cache MISS for region='%s'. Fetching from Agmarknet…", region)
    parts = [p.strip() for p in region.replace("/", ",").split(",")]
    district = parts[0] if parts else "Kanpur"
    state    = parts[1] if len(parts) > 1 else "Uttar Pradesh"

    live_items = await _fetch_agmarknet(state, district)

    if live_items:
        commodities = [
            {**item, "change_pct": 0.0, "trend": "stable", "source": "live"}
            for item in live_items
        ]
        source = "Agmarknet (data.gov.in)"
    else:
        logger.warning("Agmarknet unavailable for '%s'; using fallback.", region)
        commodities = []
        for item in FALLBACK_PRICES:
            ch = _pct_change(item["price"], item["prev_price"])
            commodities.append({
                "commodity": item["commodity"],
                "price":     item["price"],
                "unit":      "Quintal",
                "change_pct": ch,
                "trend":     "up" if ch > 0 else ("down" if ch < 0 else "stable"),
                "source":    "estimated",
            })
        source = "Estimated (Agmarknet unavailable)"

    payload = _build_response(commodities, region, source)

    # ── 3. Store in Supabase cache (best-effort; never crash the response) ────
    try:
        await store_cached_prices(db, region, payload, source)
        logger.info("Cache STORED for region='%s'.", region)
    except Exception as exc:
        logger.warning("Cache write failed for '%s': %s", region, exc)

    return payload
