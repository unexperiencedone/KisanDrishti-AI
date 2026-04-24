"""
KisaanDrishti AI Recommendation Router
Main prescription endpoint — the core user-facing API.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4, UUID
import logging

from app.db.session import get_db
from app.schemas.schemas import (
    RecommendationRequest, RecommendationResponse,
    ValidateSoilRequest, ValidateSoilResponse,
    PriorityIssueResponse, ProductResponse, NutrientPrescriptionResponse
)
from app.services.stcr_engine import (
    SoilInput, generate_prescription, validate_soil_input, get_reference_sources_for_crop
)
from app.services.llm_service import generate_explanation
from app.services.weather_service import get_coordinates_from_region, get_7_day_forecast
from app.models.models import Recommendation, Dealer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Recommendations"])

def _soil_status(value: float, low: float, medium: float) -> str:
    if value < low:
        return "Low (Deficient)"
    elif value < medium:
        return "Medium (Marginal)"
    return "High (Sufficient)"

@router.post("/recommendations", response_model=RecommendationResponse)
async def create_recommendation(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db)
):
    soil = SoilInput(
        crop_name=request.crop_name,
        target_yield_q_ha=request.target_yield_q_ha,
        n_kg_ha=request.soil.n_kg_ha,
        p_kg_ha=request.soil.p_kg_ha,
        k_kg_ha=request.soil.k_kg_ha,
        ph=request.soil.ph,
        ec_ds_m=request.soil.ec_ds_m,
        oc_pct=request.soil.oc_pct,
        zn_ppm=request.soil.zn_ppm,
        fe_ppm=request.soil.fe_ppm,
        s_ppm=request.soil.s_ppm,
        fym_t_ha=request.soil.fym_t_ha,
        compost_t_ha=request.soil.compost_t_ha,
        region=request.region,
        soil_type=request.soil_type,
        is_irrigated=request.is_irrigated,
    )

    # Fetch Weather context asynchronously
    lat, lon = await get_coordinates_from_region(request.region)
    weather_data = await get_7_day_forecast(lat, lon)

    result = generate_prescription(soil)
    explanation = await generate_explanation(
        soil, result, language=request.language, weather=weather_data,
        farm_size=request.farm_size, farm_unit=request.farm_unit
    )

    soil_health = {
        "n_status": _soil_status(soil.n_kg_ha, 280, 560),
        "p_status": _soil_status(soil.p_kg_ha, 10, 25),
        "k_status": _soil_status(soil.k_kg_ha, 110, 280),
        "ph_status": "Optimal" if 6.0 <= soil.ph <= 7.5 else ("Acidic" if soil.ph < 6.0 else "Alkaline"),
    }

    recommendation_id = uuid4()
    response_payload = RecommendationResponse(
        status="cultivable_issue" if not result.is_cultivable else "success",
        recommendation_id=recommendation_id,
        soil_health=soil_health,
        priority_issues=[
            PriorityIssueResponse(
                parameter=i.parameter, severity=i.severity,
                measured_value=i.measured_value, threshold=i.threshold,
                action=i.action, correction_product=i.correction_product,
                correction_quantity=i.correction_quantity
            ) for i in result.priority_issues
        ],
        limiting_nutrient=result.limiting_nutrient,
        is_cultivable=result.is_cultivable,
        prescription=NutrientPrescriptionResponse(
            n_kg_ha=result.nutrients.n_kg_ha,
            p_kg_ha=result.nutrients.p_kg_ha,
            k_kg_ha=result.nutrients.k_kg_ha,
            zn_kg_ha=result.nutrients.zn_kg_ha
        ),
        products=[
            ProductResponse(
                product_name=p.product_name, nutrient_source=p.nutrient_source,
                kg_per_ha=p.kg_per_ha, bags_per_acre=p.bags_per_acre,
                is_organic=p.is_organic, application_timing=p.application_timing,
                notes=p.notes
            ) for p in result.products_chemical
        ],
        organic_products=[
            ProductResponse(
                product_name=p.product_name, nutrient_source=p.nutrient_source,
                kg_per_ha=p.kg_per_ha, bags_per_acre=p.bags_per_acre,
                is_organic=True, application_timing=p.application_timing,
                notes=p.notes
            ) for p in result.products_organic
        ],
        amendments=[
            ProductResponse(
                product_name=p.product_name, nutrient_source=p.nutrient_source,
                kg_per_ha=p.kg_per_ha, bags_per_acre=p.bags_per_acre,
                application_timing=p.application_timing, notes=p.notes
            ) for p in result.amendments
        ],
        confidence_score=result.confidence_score,
        confidence_reasons=result.confidence_reasons,
        equations_applied=result.equations_applied,
        explanation=explanation,
        warnings=result.warnings,
        weather_forecast=weather_data,
    )

    # Best-effort persistence: API should still respond even if DB write fails.
    try:
        db_recommendation = Recommendation(
            id=recommendation_id,
            soil_sample_id=None,
            n_required_kg_ha=result.nutrients.n_kg_ha,
            p_required_kg_ha=result.nutrients.p_kg_ha,
            k_required_kg_ha=result.nutrients.k_kg_ha,
            products=[
                {
                    "product_name": p.product_name,
                    "nutrient_source": p.nutrient_source,
                    "kg_per_ha": p.kg_per_ha,
                    "bags_per_acre": p.bags_per_acre,
                    "is_organic": p.is_organic,
                    "application_timing": p.application_timing,
                    "notes": p.notes,
                }
                for p in result.products_chemical
            ],
            confidence_score=result.confidence_score,
            rag_sources=result.equations_applied,
            explanation=explanation,
        )
        db.add(db_recommendation)
        await db.commit()
    except Exception as exc:
        await db.rollback()
        logger.warning("Recommendation persisted failed for %s: %s", recommendation_id, exc)

    return response_payload

@router.post("/validate-soil", response_model=ValidateSoilResponse)
async def validate_soil(request: ValidateSoilRequest):
    soil = SoilInput(
        crop_name=request.crop_name, target_yield_q_ha=1.0,
        n_kg_ha=request.soil.n_kg_ha, p_kg_ha=request.soil.p_kg_ha,
        k_kg_ha=request.soil.k_kg_ha, ph=request.soil.ph,
        ec_ds_m=request.soil.ec_ds_m, oc_pct=request.soil.oc_pct,
        zn_ppm=request.soil.zn_ppm,
    )
    is_valid, errors = validate_soil_input(soil)
    warnings = []
    if soil.ph > 8.5:
        warnings.append("High pH detected. Possible Usar/sodic soil — common in Kanpur outskirts.")
    if soil.n_kg_ha == 0 and soil.p_kg_ha == 0:
        warnings.append("Both N and P are zero. Verify lab report.")

    plausibility = 1.0 - (len(errors) * 0.2)
    return ValidateSoilResponse(
        is_valid=is_valid, errors=errors, warnings=warnings,
        plausibility_score=max(0.0, plausibility)
    )


@router.get("/recommendations/{recommendation_id}")
async def get_recommendation(
    recommendation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch a persisted recommendation by ID.
    Returns core stored fields for dashboard history/details views.
    """
    try:
        recommendation_uuid = UUID(recommendation_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid recommendation ID format") from exc

    try:
        query = select(Recommendation).where(Recommendation.id == recommendation_uuid)
        result = await db.execute(query)
        record = result.scalar_one_or_none()
    except Exception as exc:
        logger.error("Failed to fetch recommendation %s: %s", recommendation_id, exc)
        raise HTTPException(status_code=503, detail="Database unavailable") from exc

    if not record:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return {
        "recommendation_id": str(record.id),
        "nutrients": {
            "n_kg_ha": float(record.n_required_kg_ha or 0),
            "p_kg_ha": float(record.p_required_kg_ha or 0),
            "k_kg_ha": float(record.k_required_kg_ha or 0),
        },
        "products": record.products or [],
        "confidence_score": float(record.confidence_score or 0),
        "equations_applied": record.rag_sources or [],
        "explanation": record.explanation,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }


@router.get("/crops")
async def list_crops(region: str = "UP"):
    """List supported crops with ideal ranges and available nutrient equations."""
    from app.services.stcr_engine import STCR_COEFFICIENTS, CROP_IDEAL_RANGES

    crops = []
    for crop_name, nutrients in STCR_COEFFICIENTS.items():
        ranges = CROP_IDEAL_RANGES.get(crop_name, {})
        crops.append({
            "name": crop_name,
            "nutrients_covered": [n for n in nutrients.keys() if n in {"N", "P", "K"}],
            "ph_range": f"{ranges.get('ph_min', 'N/A')} – {ranges.get('ph_max', 'N/A')}",
            "ec_max": ranges.get("ec_max", "N/A"),
            "zn_critical_ppm": ranges.get("zn_critical", "N/A"),
        })

    return {"region": region, "crops": crops, "total": len(crops)}


@router.get("/evidence")
async def evidence(crop: str, region: str = "Kanpur/Central UP"):
    """
    Return curated source list currently used for crop/region inference.
    """
    crop_key = crop.lower()
    return {
        "crop": crop_key,
        "region": region,
        "references": get_reference_sources_for_crop(crop_key, region),
    }


@router.get("/dealers")
async def list_dealers(
    district: str | None = None,
    product: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List online/offline procurement options with optional district/product filtering.
    """
    try:
        query = select(Dealer).where(Dealer.is_active.is_(True))
        if district:
            query = query.where(Dealer.district.ilike(f"%{district}%"))
        rows = (await db.execute(query)).scalars().all()
    except Exception as exc:
        logger.error("Failed to fetch dealers: %s", exc)
        raise HTTPException(status_code=503, detail="Database unavailable") from exc

    items = []
    for row in rows:
        available = row.products_available or []
        if product:
            p = product.lower()
            if not any(p in str(x).lower() for x in available):
                continue
        items.append({
            "id": str(row.id),
            "name": row.name,
            "dealer_type": row.dealer_type,
            "district": row.district,
            "address": row.address,
            "phone": row.phone,
            "url": row.url,
            "products_available": available,
            "is_govt_center": bool(row.is_govt_center),
        })

    return {"total": len(items), "dealers": items}
