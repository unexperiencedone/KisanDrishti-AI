from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.models import Farm, Recommendation, CommunityPost
from typing import List, Dict

router = APIRouter(prefix="/api/v1/farm", tags=["farm"])

@router.get("/summary")
async def get_farm_summary(db: AsyncSession = Depends(get_db)):
    """
    Returns farm summary. 
    Resilient to database connectivity issues or empty tables.
    """
    try:
        farm_stmt = select(Farm).limit(1)
        farm_result = await db.execute(farm_stmt)
        farm = farm_result.scalar_one_or_none()
        
        if not farm:
            # Return default mock if DB is empty
            return {
                "farm_name": "Ramesh's Farm",
                "district": "Kanpur, UP",
                "irrigation_type": "Tubewell",
                "recent_recommendations": []
            }
            
        rec_stmt = select(Recommendation).order_by(Recommendation.created_at.desc()).limit(5)
        rec_result = await db.execute(rec_stmt)
        recs = rec_result.scalars().all()
        
        return {
            "farm_name": farm.name,
            "district": farm.district,
            "irrigation_type": farm.irrigation_type,
            "recent_recommendations": [
                {
                    "id": str(r.id),
                    "created_at": r.created_at.isoformat() if r.created_at else "",
                    "n_kg": float(r.n_required_kg_ha or 0),
                    "p_kg": float(r.p_required_kg_ha or 0),
                    "k_kg": float(r.k_required_kg_ha or 0),
                } for r in recs
            ]
        }
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Database error in farm summary: {e}")
        # Return fallback mock so UI doesn't crash
        return {
            "farm_name": "Ramesh's Farm (Offline)",
            "district": "Kanpur, UP",
            "irrigation_type": "Rainfed",
            "recent_recommendations": [],
            "_error": "Database connectivity issue. Showing offline profile."
        }
