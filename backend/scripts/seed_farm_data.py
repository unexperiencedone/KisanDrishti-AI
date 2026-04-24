import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.models.models import Farm, Recommendation
from uuid import uuid4
from datetime import datetime, timedelta

def main():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)
    Session = sessionmaker(bind=engine)
    session = Session()

    farm_id = uuid4()
    farm = Farm(
        id=farm_id,
        name="Green Valley Farm",
        district="Kanpur",
        latitude=26.4499,
        longitude=80.3319,
        irrigation_type="Tubewell"
    )

    recs = [
        Recommendation(
            id=uuid4(),
            soil_sample_id=uuid4(),
            n_required_kg_ha=120,
            p_required_kg_ha=60,
            k_required_kg_ha=40,
            products={"chemical": [{"name": "Urea", "amount": "150 kg"}, {"name": "DAP", "amount": "100 kg"}]},
            explanation="Based on your soil test, your field is deficient in Nitrogen. Applying Urea will help in vegetative growth.",
            created_at=datetime.now() - timedelta(days=2)
        )
    ]

    session.add(farm)
    session.add_all(recs)
    session.commit()
    print("Seed data for farm and recommendations inserted successfully.")

if __name__ == "__main__":
    main()
