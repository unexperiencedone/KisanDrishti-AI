import httpx
import logging
import time
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Backend Cache for weather to handle API downtime and rate limits
# Key: (lat, lon), Value: { "data": forecast_dict, "timestamp": unix_time }
WEATHER_BACKEND_CACHE: Dict[tuple[float, float], Dict] = {}
CACHE_TTL_SECONDS = 3600 # 1 hour

async def get_coordinates_from_region(region: str) -> tuple[float, float]:
    """Fallback: Attempt to geocode a region string like 'Kanpur' to lat/lon using Open-Meteo Geocoding."""
    query = region.split("/")[0].split(",")[0].strip()
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={query}&count=1&format=json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5.0)
            data = resp.json()
            if "results" in data and len(data["results"]) > 0:
                res = data["results"][0]
                return float(res["latitude"]), float(res["longitude"])
    except Exception as e:
        logger.warning(f"Geocoding failed for '{query}': {e}")
    # Default to Kanpur, UP, India if geocoding fails
    return 26.4499, 80.3319

def _extract_safe_hours(hourly_data: Dict, day_index: int) -> str:
    start_idx = day_index * 24
    end_idx = start_idx + 24
    
    temps = hourly_data.get("temperature_2m", [])[start_idx:end_idx]
    precips = hourly_data.get("precipitation", [])[start_idx:end_idx]
    
    if not temps or not precips:
        return "Unknown"
        
    safe_blocks = []
    current_block_start = None
    
    for hour in range(len(temps)):
        try:
            is_safe = temps[hour] < 35 and precips[hour] <= 0.5
        except (IndexError, TypeError):
            is_safe = False
            
        if is_safe:
            if current_block_start is None:
                current_block_start = hour
        else:
            if current_block_start is not None:
                safe_blocks.append((current_block_start, hour - 1))
                current_block_start = None
                
    if current_block_start is not None:
        safe_blocks.append((current_block_start, 23))
        
    labels = []
    for (start, end) in safe_blocks:
        if start == end: continue 
        
        def format_hr(h):
            if h == 0: return "12 AM"
            if h == 12: return "12 PM"
            if h > 12: return f"{h - 12} PM"
            return f"{h} AM"
            
        labels.append(f"{format_hr(start)} - {format_hr(end)}")
        
    return ", ".join(labels) if labels else "Not Safe"

async def get_7_day_forecast(lat: float, lon: float) -> Optional[Dict]:
    """Fetch 7-day forecast for agriculture with backend caching."""
    cache_key = (round(lat, 2), round(lon, 2))
    now = time.time()
    
    # Check cache
    if cache_key in WEATHER_BACKEND_CACHE:
        cached_entry = WEATHER_BACKEND_CACHE[cache_key]
        if now - cached_entry["timestamp"] < CACHE_TTL_SECONDS:
            logger.info(f"Serving weather from backend cache for {cache_key}")
            return cached_entry["data"]

    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&hourly=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m"
            f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code,sunrise,sunset"
            f"&timezone=auto"
        )
        async with httpx.AsyncClient() as client:
            # Add retries for robust fetching
            for attempt in range(2):
                try:
                    resp = await client.get(url, timeout=8.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        daily = data.get("daily", {})
                        hourly = data.get("hourly", {})
                        
                        today_hourly = []
                        if hourly.get("time"):
                            for h in range(min(48, len(hourly["time"]))): # 48 hours for better charts
                                today_hourly.append({
                                    "time": hourly["time"][h],
                                    "temp": hourly["temperature_2m"][h],
                                    "precip_mm": hourly["precipitation"][h],
                                    "humidity": hourly.get("relative_humidity_2m", [0]*48)[h],
                                    "wind_speed": hourly.get("wind_speed_10m", [0]*48)[h],
                                })

                        forecast = []
                        for i in range(len(daily.get("time", []))):
                            safe_w = _extract_safe_hours(hourly, i)
                            forecast.append({
                                "date": daily["time"][i],
                                "temp_max": daily["temperature_2m_max"][i],
                                "temp_min": daily["temperature_2m_min"][i],
                                "precipitation_mm": daily["precipitation_sum"][i],
                                "precip_prob_pct": daily["precipitation_probability_max"][i],
                                "weather_code": daily["weather_code"][i],
                                "sunrise": daily.get("sunrise", [""]*7)[i],
                                "sunset": daily.get("sunset", [""]*7)[i],
                                "safe_hours": safe_w
                            })
                        
                        full_result = {
                            "latitude": lat, 
                            "longitude": lon, 
                            "daily": forecast,
                            "today_hourly": today_hourly,
                            "current_units": data.get("hourly_units", {})
                        }
                        
                        # Save to cache
                        WEATHER_BACKEND_CACHE[cache_key] = {
                            "data": full_result,
                            "timestamp": now
                        }
                        return full_result
                    
                    logger.warning(f"Weather API returned {resp.status_code} on attempt {attempt+1}")
                except (httpx.RequestError, httpx.TimeoutException) as exc:
                    logger.warning(f"Weather API request failed on attempt {attempt+1}: {exc}")
                
                if attempt == 0:
                    import asyncio
                    await asyncio.sleep(1) # Quick backoff
                    
    except Exception as e:
        logger.error(f"Weather Service unexpected error: {e}")

    # Final Fallback: If API fails, return STALE cache if it exists at all
    if cache_key in WEATHER_BACKEND_CACHE:
        logger.warning(f"API Failed. Returning STALE weather data for {cache_key}")
        return WEATHER_BACKEND_CACHE[cache_key]["data"]
        
    return None
