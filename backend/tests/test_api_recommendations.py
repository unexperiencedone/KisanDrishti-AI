from datetime import datetime
from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db


class DummyExecuteResult:
    def __init__(self, record=None, records=None):
        self._record = record
        self._records = records or []

    def scalar_one_or_none(self):
        return self._record

    def scalars(self):
        return self

    def all(self):
        return self._records


class DummySession:
    def __init__(self, record=None, records=None, fail_commit=False):
        self.record = record
        self.records = records or []
        self.fail_commit = fail_commit
        self.added = []

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        if self.fail_commit:
            raise RuntimeError("commit failed")

    async def rollback(self):
        return None

    async def execute(self, query):
        return DummyExecuteResult(record=self.record, records=self.records)


def _override_db(session):
    async def _get_db_override():
        yield session
    return _get_db_override


def _valid_payload():
    return {
        "crop_name": "wheat",
        "target_yield_q_ha": 40,
        "soil": {
            "n_kg_ha": 200,
            "p_kg_ha": 15,
            "k_kg_ha": 200,
            "ph": 6.8,
            "ec_ds_m": 0.4,
            "oc_pct": 0.5,
            "zn_ppm": 0.8,
            "fe_ppm": 5,
            "s_ppm": 10,
            "fym_t_ha": 0,
            "compost_t_ha": 0,
        },
        "region": "Kanpur/Central UP",
        "soil_type": "Alluvial",
        "is_irrigated": True,
        "language": "en",
    }


def test_create_recommendation_success_and_persistence_best_effort():
    app.dependency_overrides[get_db] = _override_db(DummySession())
    client = TestClient(app)

    resp = client.post("/api/v1/recommendations", json=_valid_payload())
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] in {"success", "cultivable_issue"}
    assert "recommendation_id" in body
    assert body["prescription"]["n_kg_ha"] >= 0

    app.dependency_overrides.clear()


def test_create_recommendation_still_returns_when_db_commit_fails():
    app.dependency_overrides[get_db] = _override_db(DummySession(fail_commit=True))
    client = TestClient(app)

    resp = client.post("/api/v1/recommendations", json=_valid_payload())
    assert resp.status_code == 200
    assert "recommendation_id" in resp.json()

    app.dependency_overrides.clear()


def test_validate_soil_warns_for_high_ph_and_zero_np():
    client = TestClient(app)
    payload = {
        "crop_name": "wheat",
        "soil": {
            "n_kg_ha": 0,
            "p_kg_ha": 0,
            "k_kg_ha": 180,
            "ph": 8.8,
            "ec_ds_m": 0.4,
            "oc_pct": 0.4,
            "zn_ppm": 0.4,
            "fe_ppm": 3,
            "s_ppm": 8,
            "fym_t_ha": 0,
            "compost_t_ha": 0,
        },
    }
    resp = client.post("/api/v1/validate-soil", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["warnings"]) >= 1
    assert any("High pH" in w or "Both N and P are zero" in w for w in body["warnings"])


def test_get_recommendation_returns_record():
    record_id = uuid4()
    dummy_record = SimpleNamespace(
        id=record_id,
        n_required_kg_ha=Decimal("100.4"),
        p_required_kg_ha=Decimal("51.25"),
        k_required_kg_ha=Decimal("36.0"),
        products=[{"product_name": "DAP (18-46-0)", "kg_per_ha": 111.4}],
        confidence_score=Decimal("0.95"),
        rag_sources=[{"nutrient": "N", "source": "ICAR"}],
        explanation="Test explanation",
        created_at=datetime.utcnow(),
    )
    app.dependency_overrides[get_db] = _override_db(DummySession(record=dummy_record))
    client = TestClient(app)

    resp = client.get(f"/api/v1/recommendations/{record_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["recommendation_id"] == str(record_id)
    assert body["nutrients"]["n_kg_ha"] == 100.4

    app.dependency_overrides.clear()


def test_get_recommendation_bad_uuid():
    app.dependency_overrides[get_db] = _override_db(DummySession())
    client = TestClient(app)
    resp = client.get("/api/v1/recommendations/not-a-uuid")
    assert resp.status_code == 400
    app.dependency_overrides.clear()


def test_list_crops_endpoint():
    client = TestClient(app)
    resp = client.get("/api/v1/crops")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 7
    assert any(c["name"] == "wheat" for c in data["crops"])


def test_evidence_endpoint_returns_references():
    client = TestClient(app)
    resp = client.get("/api/v1/evidence?crop=rice&region=Eastern%20UP")
    assert resp.status_code == 200
    body = resp.json()
    assert body["crop"] == "rice"
    assert len(body["references"]) >= 1


def test_dealers_endpoint_filters_product():
    dealer_row = SimpleNamespace(
        id=uuid4(),
        name="Krishi Kendra Kalyanpur",
        dealer_type="offline",
        district="Kanpur Nagar",
        address="Kalyanpur",
        phone="000",
        url=None,
        products_available=["Urea", "DAP", "MOP"],
        is_govt_center=True,
        is_active=True,
    )
    app.dependency_overrides[get_db] = _override_db(DummySession(records=[dealer_row]))
    client = TestClient(app)
    resp = client.get("/api/v1/dealers?district=Kanpur&product=urea")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["dealers"][0]["name"] == "Krishi Kendra Kalyanpur"
    app.dependency_overrides.clear()
