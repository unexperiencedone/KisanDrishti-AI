"""
Alerts & Advisory Router
=========================
Auto-generates agronomy alerts from weather forecast + static rules.
No IoT data needed — purely software-driven.
"""

from fastapi import APIRouter
from app.services.weather_service import get_coordinates_from_region, get_7_day_forecast
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


def _generate_alerts_from_forecast(forecast: list, region: str) -> list:
    """Generate agronomic alert cards from raw weather forecast."""
    alerts = []
    if not forecast:
        return alerts

    today = forecast[0] if len(forecast) > 0 else {}
    tomorrow = forecast[1] if len(forecast) > 1 else {}
    day3 = forecast[2] if len(forecast) > 2 else {}

    today_rain = today.get("precipitation_mm", 0) or 0
    tomorrow_rain = tomorrow.get("precipitation_mm", 0) or 0
    day3_rain = day3.get("precipitation_mm", 0) or 0
    today_max = today.get("temp_max", 30) or 30
    today_min = today.get("temp_min", 20) or 20
    today_precip_prob = today.get("precip_prob_pct", 0) or 0
    tomorrow_precip_prob = tomorrow.get("precip_prob_pct", 0) or 0

    now_str = datetime.now().strftime("%d %b %Y | %I:%M %p")

    # 1. Heavy Rainfall Alert
    if tomorrow_rain > 20 or day3_rain > 20:
        alerts.append({
            "id": "heavy_rain",
            "type": "Weather",
            "severity": "high",
            "title": "Heavy Rainfall Alert",
            "message": f"Heavy rainfall ({max(tomorrow_rain, day3_rain):.0f} mm) expected in the next 48–72 hours. Delay fertilizer application to prevent runoff.",
            "icon": "cloud-rain",
            "color": "blue",
            "timestamp": now_str,
        })
    elif tomorrow_rain > 5 or tomorrow_precip_prob > 50:
        alerts.append({
            "id": "moderate_rain",
            "type": "Weather",
            "severity": "medium",
            "title": "Moderate Rain Expected",
            "message": f"Moderate rain expected tomorrow ({tomorrow_rain:.1f} mm). Avoid spraying pesticides.",
            "icon": "cloud-rain",
            "color": "blue",
            "timestamp": now_str,
        })

    # 2. Irrigation Advisory (low rain → good to irrigate)
    if today_rain < 2 and tomorrow_rain < 2 and today_precip_prob < 20:
        alerts.append({
            "id": "irrigation",
            "type": "Irrigation",
            "severity": "info",
            "title": "Irrigation Advisory",
            "message": "Good time for irrigation in your fields. No rain expected in the next 24 hours. Soil moisture may be optimal for top-dressing.",
            "icon": "droplet",
            "color": "sky",
            "timestamp": now_str,
        })

    # 3. Heat Stress Alert
    if today_max > 38:
        alerts.append({
            "id": "heat_stress",
            "type": "Weather",
            "severity": "high",
            "title": "Heat Stress Warning",
            "message": f"Extreme heat ({today_max:.0f}°C) today. Avoid field operations between 10 AM–4 PM. Ensure adequate soil moisture.",
            "icon": "thermometer",
            "color": "red",
            "timestamp": now_str,
        })

    # 4. Seasonal Pest Risk (rule-based by temperature/humidity)
    if 25 <= today_max <= 35 and today_precip_prob > 30:
        alerts.append({
            "id": "pest_risk",
            "type": "Pest",
            "severity": "medium",
            "title": "Pest Attack Risk",
            "message": "Warm, humid conditions increase stem borer and brown planthopper risk in paddy. Scout fields regularly and apply neem-based pesticides if needed.",
            "icon": "bug",
            "color": "orange",
            "timestamp": now_str,
        })

    # 5. Frost Warning (winter crops) 
    if today_min < 4:
        alerts.append({
            "id": "frost",
            "type": "Weather",
            "severity": "high",
            "title": "Frost Warning",
            "message": f"Near-frost night temperatures ({today_min:.0f}°C) expected. Cover sensitive seedlings and delay irrigation till morning.",
            "icon": "snowflake",
            "color": "indigo",
            "timestamp": now_str,
        })

    # 6. Spray Window Advisory (if no rain and temp is safe)
    safe_hours_today = today.get("safe_hours", "")
    if safe_hours_today and safe_hours_today not in ("Not Safe", "Unknown"):
        alerts.append({
            "id": "spray_window",
            "type": "Irrigation",
            "severity": "info",
            "title": "Good Spray Window Today",
            "message": f"Ideal conditions for foliar spray or pesticide application: {safe_hours_today}. Temperature safe and no precipitation expected.",
            "icon": "droplet",
            "color": "green",
            "timestamp": now_str,
        })

    return alerts


@router.get("/")
async def get_alerts(region: str = "Kanpur, Uttar Pradesh"):
    """Return dynamically generated agronomy alerts based on live weather data."""
    try:
        lat, lon = await get_coordinates_from_region(region)
        weather_data = await get_7_day_forecast(lat, lon)
        forecast = weather_data.get("daily", []) if weather_data else []
    except Exception as e:
        logger.error(f"Failed to fetch weather for alerts: {e}")
        forecast = []

    alerts = _generate_alerts_from_forecast(forecast, region)

    return {
        "region": region,
        "generated_at": datetime.now().isoformat(),
        "total": len(alerts),
        "alerts": alerts,
    }
