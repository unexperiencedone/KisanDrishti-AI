from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "KisaanDrishti AI API"
    APP_VERSION: str = "1.0.0"

    # ── Supabase / Postgres ────────────────────────────────────────────────────
    # Async URL — used by FastAPI at runtime
    # Use Transaction Pooler (port 6543) for best scalability on Supabase
    DATABASE_URL: str = "postgresql+asyncpg://postgres.xxxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    # Sync URL — used only by scripts (create_tables.py, seed data, etc.)
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres.xxxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

    # ── AWS Bedrock (LLM) ──────────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    BEDROCK_NOVA_PRO_ID: str = "amazon.nova-pro-v1:0"
    BEDROCK_MISTRAL_LARGE_ID: str = "mistral.mistral-large-3-675b-instruct"
    BEDROCK_LLAMA_3_2_ID: str = "meta.llama4-scout-17b-instruct-v1:0"

    # ── Agmarknet (market prices) ──────────────────────────────────────────────
    # Optional: get a free key at https://data.gov.in to raise rate limits
    AGMARKNET_API_KEY: str = "579b464db66ec23bdd000001cdd3946e44ce4aae38d975e8f5b9b5a"

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }

def get_settings():
    return Settings()
