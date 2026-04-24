# KisaanDrishti AI Implementation Plan (Kanpur-First MVP)

## Objective

Build a scientifically grounded soil recommendation system where numeric prescriptions come from STCR/rule logic, and AI is used only for explanation and retrieval.

---

## Phase 0 - Baseline Stabilization (Done)

- [x] STCR engine and data classes in place
- [x] Core validation tests passing
- [x] FastAPI app import fixed (async DB URL)
- [x] Basic recommendation and soil validation endpoints available

---

## Phase 1 - Core Domain Hardening (Week 1)

### 1.1 Coefficient Governance

- Add source/version metadata to each coefficient set
- Add valid ranges (soil-test method + geography + crop stage)
- Add "confidence downgrade" when out-of-range values are used

### 1.2 Safety Rules

- Enforce hard blocks for uncultivable states (critical pH/EC)
- Add salinity-adjusted fertilizer suggestions
- Add unit guards for macro vs micro nutrients

### 1.3 Deterministic Audit Trail

- Persist:
  - input soil values
  - equations used
  - intermediate nutrient calculations
  - final products and warnings

Deliverable: reproducible, traceable recommendation output.

---

## Phase 2 - Persistence + API Maturity (Week 2)

### 2.1 Database Integration

- Store generated recommendations in `recommendations`
- Link recommendation to crop/source/equation records
- Add query endpoint by recommendation ID

### 2.2 API Enhancements

- `GET /api/v1/crops`
- `GET /api/v1/recommendations/{id}`
- `GET /api/v1/dealers?district=&product=`

### 2.3 API Tests

- Add endpoint-level tests with FastAPI test client
- Verify schema contract + deterministic outputs

Deliverable: production-ready backend contract for frontend integration.

---

## Phase 3 - Evidence and Explanation Layer (Week 3)

### 3.1 RAG Foundation

- Build knowledge corpus from:
  - ICAR-AICRP STCR bulletins
  - CSAU Kanpur extension notes
  - FAO nutrient guidelines
- Chunk + embed + store with metadata (`crop`, `region`, `nutrient`, `year`)

### 3.2 Explanation Service Upgrade

- Include top retrieved sources for every explanation
- Prevent numeric dose edits in LLM layer
- Add bilingual templates (EN/HI)

Deliverable: source-grounded, auditable explanations.

---

## Phase 4 - Procurement + Local Viability (Week 4)

### 4.1 Dealer Pipeline

- Seed Kanpur offline dealers with coordinates
- Implement nearest dealer ranking
- Product-to-dealer matching

### 4.2 Marketplace Integration

- Keep simple links for online stores (search query based)
- Add price/availability placeholders and freshness timestamp

Deliverable: recommendation-to-procurement flow.

---

## Phase 5 - Validation Program (Week 5+)

### 5.1 Digital Validation

- Literature replay test set (published STCR-style cases)
- Stress tests (extreme pH/EC + contradictory inputs)
- Consistency tests (same input = same output)

### 5.2 Pilot Validation (when available)

- Compare outputs with local agronomist checks
- Track acceptance and correction rates
- Add coefficient recalibration backlog

Deliverable: viability evidence beyond API output.

---

## Development Workflow

1. Keep formulas deterministic and versioned
2. Add tests before/with each rule change
3. Never let LLM generate numeric doses
4. Keep Kanpur/Central UP as the initial scope
5. Expand crops/regions only after validation benchmarks pass

---

## Immediate Next 3 Tasks

1. Add recommendation persistence in router (`create_recommendation`)
2. Add `GET /api/v1/recommendations/{id}` endpoint
3. Add API integration tests for both endpoints
