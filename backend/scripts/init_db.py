"""
KisaanDrishti AI Database Initialization & Seed Data
===========================================
Connects to Supabase/PostgreSQL and seeds initial crop data,
STCR coefficients, and fertilizer product catalog.
"""

import asyncio
import uuid
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.models import Base, Crop, Source, STCREquation, FertilizerProduct, Dealer, ValidationCase
from app.core.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_data():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Seed curated literature sources used for prototype inference/evidence
        sources = [
            Source(
                id=uuid.uuid4(),
                title="Validation of STCR model for rice on Inceptisol of Eastern UP",
                institution="ResearchGate / STCR study",
                publication_year=2017,
                url="https://www.researchgate.net/publication/313623187_Validation_of_Soil_Test_and_Yield_Target_based_Fertilizer_Prescription_Model_for_Rice_on_Inceptisol_of_Eastern_Zone_of_Uttar_Pradesh_India",
                source_type="paper",
            ),
            Source(
                id=uuid.uuid4(),
                title="Wheat STCR-IPNS equation calibration in UP Inceptisol",
                institution="ICAR JISSS",
                publication_year=2015,
                url="https://epubs.icar.org.in/index.php/JISSS/article/view/45550",
                source_type="paper",
            ),
            Source(
                id=uuid.uuid4(),
                title="AICRP Soil Test Crop Response bulletin (pulse equations)",
                institution="GBPUAT / AICRP-STCR",
                publication_year=2019,
                url="https://www.gbpuat.res.in/uploads/aicrp/17%20AICRP%20-%20SOIL%20TEST%20CROP%20RESPONSE.pdf",
                source_type="bulletin",
            ),
            Source(
                id=uuid.uuid4(),
                title="Fertilizer Control Order specifications",
                institution="Dept of Agriculture, India",
                publication_year=1985,
                url="https://agriwelfare.gov.in/Documents/SCHEDULE%20%20I%20of%20%20FCO.pdf",
                source_type="regulation",
            ),
        ]
        session.add_all(sources)

        # 2. Seed Crops
        wheat = Crop(
            id=uuid.uuid4(), name="Wheat", local_name="Gehu",
            season="Rabi", crop_type="Cereal"
        )
        rice = Crop(
            id=uuid.uuid4(), name="Rice", local_name="Dhan",
            season="Kharif", crop_type="Cereal"
        )
        pigeon_pea = Crop(
            id=uuid.uuid4(), name="Pigeon_pea", local_name="Arhar",
            season="Kharif", crop_type="Pulse"
        )
        session.add_all([wheat, rice, pigeon_pea])
        await session.flush()

        # 3. Seed STCR coefficients from curated source set
        eq_rows = [
            # Rice Eastern UP (with manure form coefficients)
            (rice.id, "Eastern UP", "Inceptisol", "N", "4.76", "0.49", "0.34", sources[0].id),
            (rice.id, "Eastern UP", "Inceptisol", "P", "1.53", "1.41", "0.09", sources[0].id),
            (rice.id, "Eastern UP", "Inceptisol", "K", "2.92", "0.35", "0.11", sources[0].id),
            # Wheat Central/Eastern UP
            (wheat.id, "Eastern UP", "Inceptisol", "N", "6.96", "0.34", "0.12", sources[1].id),
            (wheat.id, "Eastern UP", "Inceptisol", "P", "2.96", "2.57", "0.29", sources[1].id),
            (wheat.id, "Eastern UP", "Inceptisol", "K", "2.83", "0.11", "0.03", sources[1].id),
            # Pigeon pea UPAS-120
            (pigeon_pea.id, "UP", "Alluvial", "N", "5.66", "0.28", "0.21", sources[2].id),
            (pigeon_pea.id, "UP", "Alluvial", "P", "16.81", "7.92", "2.26", sources[2].id),
            (pigeon_pea.id, "UP", "Alluvial", "K", "9.56", "0.47", "0.31", sources[2].id),
        ]
        session.add_all([
            STCREquation(
                id=uuid.uuid4(),
                crop_id=crop_id,
                region=region,
                soil_type=soil_type,
                nutrient=nutrient,
                x_coeff=Decimal(x),
                y_coeff=Decimal(y),
                z_coeff=Decimal(z),
                source_id=src_id,
            )
            for crop_id, region, soil_type, nutrient, x, y, z, src_id in eq_rows
        ])

        # 4. Seed Products
        products = [
            FertilizerProduct(
                id=uuid.uuid4(), name="Urea", product_code="UREA",
                n_pct=Decimal("46"), is_organic=False
            ),
            FertilizerProduct(
                id=uuid.uuid4(), name="DAP", product_code="DAP",
                n_pct=Decimal("18"), p2o5_pct=Decimal("46"), is_organic=False
            ),
            FertilizerProduct(
                id=uuid.uuid4(), name="MOP", product_code="MOP",
                k2o_pct=Decimal("60"), is_organic=False
            ),
        ]
        session.add_all(products)

        await session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
