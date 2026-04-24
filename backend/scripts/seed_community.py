import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.models.models import CommunityPost
from uuid import uuid4

def main():
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL_SYNC)
    Session = sessionmaker(bind=engine)
    session = Session()

    posts = [
        CommunityPost(
            id=uuid4(),
            author_name="Suresh Yadav",
            author_role="Paddy Farmer",
            author_img="https://placehold.co/100x100/1e293b/ffffff?text=SY",
            content="What is the best method to control brown planthopper in paddy?",
            likes=12,
            comments=8,
            post_type="discussion"
        ),
        CommunityPost(
            id=uuid4(),
            author_name="Dr. Ankit Verma",
            author_role="Agriculture Expert",
            author_img="https://placehold.co/100x100/0f172a/ffffff?text=AV",
            content="Use neem-based pesticides and maintain proper field hygiene.",
            likes=15,
            comments=6,
            post_type="expert"
        ),
        CommunityPost(
            id=uuid4(),
            author_name="Rita Devi",
            author_role="Vegetable Farmer",
            author_img="https://placehold.co/100x100/334155/ffffff?text=RD",
            content="Which variety of tomato is best for summer season?",
            likes=9,
            comments=5,
            post_type="discussion"
        )
    ]

    session.add_all(posts)
    session.commit()
    print("Seed data for community posts inserted successfully.")

if __name__ == "__main__":
    main()
