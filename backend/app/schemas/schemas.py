"""
KisaanDrishti AI API Schemas — Pydantic v2
Request/Response models for all endpoints.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from uuid import UUID
from datetime import date


# ─────────────────────────────────────────────
# REQUEST SCHEMAS
# ─────────────────────────────────────────────

class SoilDataInput(BaseModel):
    """Soil test parameters from lab or sensor."""
    # Macronutrients (kg/ha)
    n_kg_ha: float = Field(0.0, ge=0, le=1000, description="Available Nitrogen (kg/ha)")
    p_kg_ha: float = Field(0.0, ge=0, le=500,  description="Available Phosphorus P2O5 (kg/ha)")
    k_kg_ha: float = Field(0.0, ge=0, le=2000, description="Available Potassium K2O (kg/ha)")

    # Soil health
    ph: float = Field(..., ge=2.0, le=12.0, description="Soil pH")
    ec_ds_m: float = Field(0.0, ge=0, le=50, description="Electrical Conductivity (dS/m)")
    oc_pct: float = Field(0.0, ge=0, le=20, description="Organic Carbon (%)")

    # Micronutrients (ppm)
    zn_ppm: float = Field(0.0, ge=0, le=100, description="Zinc (ppm)")
    fe_ppm: float = Field(0.0, ge=0, le=500, description="Iron (ppm)")
    s_ppm: float = Field(0.0, ge=0, le=200, description="Sulphur (ppm)")

    # Organic inputs
    fym_t_ha: float = Field(0.0, ge=0, le=50, description="Farm Yard Manure applied (t/ha)")
    compost_t_ha: float = Field(0.0, ge=0, le=20, description="Compost applied (t/ha)")

    # Physical (optional)
    sand_pct: Optional[float] = Field(None, ge=0, le=100)
    silt_pct: Optional[float] = Field(None, ge=0, le=100)
    clay_pct: Optional[float] = Field(None, ge=0, le=100)


class RecommendationRequest(BaseModel):
    """Main recommendation request body."""
    crop_name: str = Field(..., description="Crop name (wheat/rice/maize/sugarcane/tomato/potato/onion)")
    target_yield_q_ha: float = Field(..., gt=0, le=500, description="Target yield in quintals/hectare")
    soil: SoilDataInput
    region: str = Field("Kanpur/Central UP", description="Agro-climatic region")
    soil_type: str = Field("Alluvial", description="Soil type (Alluvial/Sandy/Clayey)")
    is_irrigated: bool = Field(True, description="Is the field irrigated?")
    farm_id: Optional[UUID] = None
    farm_size: float = Field(1.0, description="Size of the farm")
    farm_unit: str = Field("Hectare", description="Unit of the farm (Hectare, Acre, Bigha)")
    language: str = Field("en", description="Output language: en / hi")
    include_organic: bool = Field(True, description="Include organic alternatives")
    sample_date: Optional[date] = None

    @field_validator("crop_name")
    @classmethod
    def validate_crop(cls, v: str) -> str:
        supported = ["wheat", "rice", "maize", "sugarcane", "tomato", "potato", "onion", "pigeon_pea"]
        if v.lower() not in supported:
            raise ValueError(f"Crop '{v}' not yet supported. Supported: {supported}")
        return v.lower()

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ["en", "hi"]:
            raise ValueError("Language must be 'en' or 'hi'")
        return v


class ValidateSoilRequest(BaseModel):
    """Request to validate soil inputs before full prescription."""
    soil: SoilDataInput
    crop_name: str


class ExplainRequest(BaseModel):
    """Request for LLM-based explanation of an existing recommendation."""
    recommendation_id: UUID
    language: str = "en"
    question: Optional[str] = None


# ─────────────────────────────────────────────
# RESPONSE SCHEMAS
# ─────────────────────────────────────────────

class PriorityIssueResponse(BaseModel):
    parameter: str
    severity: str
    measured_value: float
    threshold: float
    action: str
    correction_product: Optional[str] = None
    correction_quantity: Optional[str] = None


class ProductResponse(BaseModel):
    product_name: str
    nutrient_source: str
    kg_per_ha: float
    bags_per_acre: float
    is_organic: bool = False
    application_timing: str
    notes: str = ""


class NutrientPrescriptionResponse(BaseModel):
    n_kg_ha: float
    p_kg_ha: float
    k_kg_ha: float
    zn_kg_ha: float = 0.0
    s_kg_ha: float = 0.0


class RecommendationResponse(BaseModel):
    """Complete prescription response."""
    status: str
    recommendation_id: Optional[UUID] = None

    soil_health: Dict
    priority_issues: List[PriorityIssueResponse]
    limiting_nutrient: Optional[str] = None
    is_cultivable: bool

    prescription: NutrientPrescriptionResponse
    products: List[ProductResponse]
    organic_products: List[ProductResponse]
    amendments: List[ProductResponse]

    confidence_score: float
    confidence_reasons: List[str]
    equations_applied: List[Dict]

    explanation: str
    warnings: List[str]

    dealers_online: List[Dict] = []
    dealers_nearby: List[Dict] = []
    weather_forecast: Optional[Dict] = None


class ValidateSoilResponse(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    plausibility_score: float


class CropListResponse(BaseModel):
    crops: List[Dict]


class DealerResponse(BaseModel):
    id: Optional[UUID] = None
    name: str
    dealer_type: str
    address: Optional[str] = None
    district: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    url: Optional[str] = None
    products_available: List[str] = []
    is_govt_center: bool = False
    distance_km: Optional[float] = None
