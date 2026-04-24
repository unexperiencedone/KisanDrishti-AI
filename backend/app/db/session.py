"""
Database session — SQLAlchemy async engine.

Supabase compatibility notes
─────────────────────────────
• Transaction pooler (port 6543): needs statement_cache_size=0 in connect_args
  because pgBouncer doesn't support prepared statements in transaction mode.
• Session pooler  (port 5432):    same requirement via prepared_statement_cache=False.
• Direct connection (port 5432):  no special args needed (use for local dev / scripts).

We detect the mode from the DATABASE_URL and apply the right args automatically.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

# Disable prepared-statement cache when using Supabase pooler
_is_pooler = (
    "pooler.supabase.com" in settings.DATABASE_URL
    or ":6543/" in settings.DATABASE_URL
)
_connect_args = {"statement_cache_size": 0} if _is_pooler else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,           # set True temporarily for SQL debugging
    pool_pre_ping=True,   # detect stale connections on checkout
    connect_args=_connect_args,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
