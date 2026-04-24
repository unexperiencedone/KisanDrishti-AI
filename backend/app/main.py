"""
KisaanDrishti AI FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.recommendations import router as recommendations_router
from app.api.weather import router as weather_router
from app.api.market_prices import router as market_prices_router
from app.api.alerts import router as alerts_router
from app.api.chat import router as chat_router
from app.api.farm import router as farm_router
from app.core.config import get_settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="KisaanDrishti AI API",
    description="Precision Fertilizer Recommendation System for Indian farmers.",
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations_router)
app.include_router(weather_router)
app.include_router(market_prices_router)
app.include_router(alerts_router)
app.include_router(chat_router)
app.include_router(farm_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "KisaanDrishti AI API",
        "version": settings.APP_VERSION,
    }