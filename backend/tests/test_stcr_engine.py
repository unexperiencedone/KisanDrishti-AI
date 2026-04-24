"""
KisaanDrishti AI Test Suite — Scientific Validation
"""

import pytest
from app.services.stcr_engine import (
    SoilInput, generate_prescription, calculate_stcr_nutrient,
    validate_soil_input, assess_priority_issues,
    STCR_COEFFICIENTS
)

def make_soil(**kwargs) -> SoilInput:
    defaults = dict(
        crop_name="wheat", target_yield_q_ha=40.0,
        n_kg_ha=200.0, p_kg_ha=15.0, k_kg_ha=200.0,
        ph=7.0, ec_ds_m=0.4, oc_pct=0.5, zn_ppm=0.8,
    )
    defaults.update(kwargs)
    return SoilInput(**defaults)

def within_tolerance(actual: float, expected: float, tolerance_pct: float = 1.0) -> bool:
    if expected == 0: return actual == 0
    return abs(actual - expected) / expected * 100 <= tolerance_pct

class TestInputValidation:
    def test_valid_input_passes(self):
        soil = make_soil()
        is_valid, errors = validate_soil_input(soil)
        assert is_valid
        assert len(errors) == 0

    def test_ph_out_of_range_fails(self):
        assert not validate_soil_input(make_soil(ph=1.5))[0]
        assert not validate_soil_input(make_soil(ph=13.0))[0]

class TestSTCREquations:
    def test_wheat_nitrogen_arithmetic(self):
        # Wheat N: X=4.86, Y=0.47. T=40, Sn=200.
        # (4.86 * 40) - (0.47 * 200) = 194.4 - 94 = 100.4
        n, _ = calculate_stcr_nutrient("wheat", "N", 40, 200, fym_t_ha=0)
        assert within_tolerance(n, 100.4)

    def test_fym_reduces_fertilizer(self):
        n_no_fym, _ = calculate_stcr_nutrient("wheat", "N", 40, 200, fym_t_ha=0)
        n_with_fym, _ = calculate_stcr_nutrient("wheat", "N", 40, 200, fym_t_ha=5)
        assert n_with_fym < n_no_fym

    def test_region_override_for_eastern_up_rice(self):
        # Eastern UP override: FN = 4.76*T - 0.49*SN
        n, _ = calculate_stcr_nutrient(
            "rice", "N", 50, 200, fym_t_ha=0, region="Eastern UP"
        )
        expected = (4.76 * 50) - (0.49 * 200)
        assert within_tolerance(n, expected, tolerance_pct=1.0)

    def test_pigeon_pea_equation_available(self):
        n, src = calculate_stcr_nutrient("pigeon_pea", "N", 12, 180, fym_t_ha=0, region="UP")
        assert n >= 0
        assert "No equation available" not in src

class TestPriorityIssues:
    def test_acidic_ph_critical(self):
        issues = assess_priority_issues(make_soil(ph=3.5))
        assert any(i.severity == "critical" and i.parameter == "pH" for i in issues)

    def test_extreme_salinity_critical(self):
        issues = assess_priority_issues(make_soil(ec_ds_m=10.0))
        assert any(i.severity == "critical" and i.parameter == "EC" for i in issues)

class TestEdgeCaseSafety:
    def test_extreme_ph_blocks_cultivation(self):
        result = generate_prescription(make_soil(ph=2.0))
        assert not result.is_cultivable
        assert len(result.critical_blocks) > 0
