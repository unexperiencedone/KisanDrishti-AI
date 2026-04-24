from fastapi import APIRouter, HTTPException, Query
from app.services.weather_service import get_coordinates_from_region, get_7_day_forecast
from app.services.llm_service import generate_weather_report

router = APIRouter(prefix="/api/v1/weather", tags=["weather"])

@router.get("/")
async def get_weather(region: str, language: str = Query("en")):
    lat, lon = await get_coordinates_from_region(region)
    weather_data = await get_7_day_forecast(lat, lon)
    if not weather_data:
        raise HTTPException(status_code=503, detail="Weather service unavailable or location not found")
    
    # Generate AI summary
    ai_report = await generate_weather_report(weather_data, language)
    
    return {
        "region": region, 
        "weather_forecast": weather_data,
        "ai_report": ai_report
    }
