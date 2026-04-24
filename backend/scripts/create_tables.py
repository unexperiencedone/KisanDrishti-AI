"""
create_tables.py
================
One-shot script to create all SQLAlchemy ORM tables in Supabase (or any Postgres).
Run ONCE after pointing DATABASE_URL_SYNC at your Supabase project.

Usage:
    cd backend
    python scripts/create_tables.py
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine, text
from app.core.config import get_settings
from app.models.models import Base

settings = get_settings()

def main():
    url = settings.DATABASE_URL_SYNC
    print(f"Connecting to: {url[:40]}…")

    # Disable prepared statements for Supabase pooler
    connect_args = {}
    if "pooler.supabase.com" in url or ":6543/" in url:
        connect_args = {"options": "-c statement_timeout=30000"}

    engine = create_engine(url, echo=True, connect_args=connect_args)

    with engine.connect() as conn:
        print("\n[OK] Connection OK. Creating tables...\n")
        Base.metadata.create_all(engine)
        # Verify the new cache table exists
        result = conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema='public' ORDER BY table_name"
        ))
        tables = [r[0] for r in result]
        print("\n[INFO] Tables in public schema:")
        for t in tables:
            print(f"   * {t}")

    print("\n[SUCCESS] All tables created successfully.")

if __name__ == "__main__":
    main()
