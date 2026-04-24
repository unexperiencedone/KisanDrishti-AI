# KisaanDrishti AI Backend

Rules-first STCR prescription engine for crop-specific soil nutrient recommendations.

## What is working now

- STCR engine with crop-wise coefficients for `wheat`, `rice`, `maize`, `sugarcane`, `tomato`, `potato`, `onion`
- Priority/safety checks for pH, EC, OC, Zn
- Product conversion layer (Urea, DAP/SSP, MOP, ZnSO4, amendments)
- FastAPI endpoints:
  - `POST /api/v1/recommendations`
  - `POST /api/v1/validate-soil`
  - `GET /api/v1/crops`
  - `GET /api/v1/evidence?crop=&region=`
  - `GET /api/v1/dealers?district=&product=`
  - `GET /api/v1/recommendations/{id}`
- DeepSeek explanation service with fallback mode
- Unit tests for core engine logic

## Quick start (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open:

- Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## Environment (Supabase-first)

Create `.env` inside `backend`:

```env
APP_VERSION=1.0.0
# Supabase transaction pooler (recommended for app runtime)
DATABASE_URL=postgresql+asyncpg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
# Supabase direct connection (recommended for scripts/seeding/migrations)
DATABASE_URL_SYNC=postgresql+psycopg2://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

If `DEEPSEEK_API_KEY` is empty, fallback explanation is used automatically.

Why Supabase over local-only DB:

- Managed Postgres with backups, auth, uptime, and observability
- Easy deployment parity between dev/staging/prod
- Better collaboration and shared dataset for coefficients/tests
- Optional local Postgres can still be used for offline dev

## Test

```powershell
cd backend
python -m pytest tests/test_stcr_engine.py -q
```

## Seed DB (optional)

```powershell
cd backend
python scripts/init_db.py
```

The seed includes a curated source set for:

- Eastern UP rice STCR equations
- Central/Eastern UP wheat STCR equations
- UP pigeon pea STCR equations
- FCO fertilizer specification reference

## Suggested next implementation targets

1. Persist recommendation results in DB from `POST /recommendations`
2. Add `dealers_nearby` from DB + distance calculation
3. Add coefficient source/version table with district-level calibration
4. Add retrieval layer for source-cited agronomy explanation
5. Add integration tests for API responses
