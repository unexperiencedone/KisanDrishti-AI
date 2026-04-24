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

from fastapi.responses import JSONResponse
from fastapi import Request

app = FastAPI(
    title="KisaanDrishti AI API",
    description="Precision Fertilizer Recommendation System for Indian farmers.",
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "https://kisan-drishti-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}")
    # Return a JSON response with CORS headers manually if needed, 
    # but FastAPI's JSONResponse with middleware should handle it.
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred.", "detail": str(exc)},
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