"""
KisaanDrishti AI STCR Prescription Engine
=================================
Implements the Soil Test Crop Response (STCR) / Targeted-Yield method.

Core Formula:
    Fn = (X × T) - (Y × Sn) - (Z × Mn)

Where:
    Fn  = Fertilizer nutrient to add (kg/ha)
    T   = Target yield (quintals/ha)
    Sn  = Soil test value for nutrient n (kg/ha)
    Mn  = Nutrient contribution from organic manure (kg/ha)
    X,Y,Z = Region-calibrated coefficients from ICAR-AICRP-STCR data

Priority Stack (Liebig's Law of the Minimum):
    1. CRITICAL safety checks (pH, EC — if violated, nothing grows)
    2. Soil amendments (lime, gypsum)
    3. Limiting nutrient correction
    4. Macronutrient (N, P, K) prescription
    5. Micronutrient supplementation
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# DATA CLASSES
# ─────────────────────────────────────────────────────────────

@dataclass
class SoilInput:
    """Validated soil test input for the prescription engine."""
    crop_name: str
    target_yield_q_ha: float

    # Macronutrients (kg/ha)
    n_kg_ha: float = 0.0
    p_kg_ha: float = 0.0
    k_kg_ha: float = 0.0

    # Soil health
    ph: float = 7.0
    ec_ds_m: float = 0.0
    oc_pct: float = 0.5

    # Micronutrients (ppm)
    zn_ppm: float = 0.0
    fe_ppm: float = 0.0
    b_ppm: float = 0.0
    s_ppm: float = 0.0

    # Organic inputs
    fym_t_ha: float = 0.0
    compost_t_ha: float = 0.0
    neem_cake_kg_ha: float = 0.0

    # Location context
    region: str = "Kanpur/Central UP"
    soil_type: str = "Alluvial"
    is_irrigated: bool = True


@dataclass
class NutrientPrescription:
    """Calculated nutrient doses in kg/ha."""
    n_kg_ha: float = 0.0
    p_kg_ha: float = 0.0
    k_kg_ha: float = 0.0
    s_kg_ha: float = 0.0
    zn_kg_ha: float = 0.0
    fe_kg_ha: float = 0.0
    lime_t_ha: float = 0.0
    gypsum_kg_ha: float = 0.0


@dataclass
class PriorityIssue:
    """A detected soil issue with severity and action."""
    parameter: str
    severity: str          # critical / warning / info
    measured_value: float
    threshold: float
    action: str
    correction_product: Optional[str] = None
    correction_quantity: Optional[str] = None


@dataclass
class ProductRecommendation:
    """A commercial fertilizer/amendment recommendation."""
    product_name: str
    nutrient_source: str
    kg_per_ha: float
    bags_per_acre: float   # standard 50kg bags
    is_organic: bool = False
    application_timing: str = "Basal"
    notes: str = ""


@dataclass
class PrescriptionResult:
    """Complete output of the STCR engine."""
    # Status
    is_cultivable: bool = True
    confidence_score: float = 1.0
    confidence_reasons: List[str] = field(default_factory=list)

    # Priority issues (pH, EC, OC alerts)
    priority_issues: List[PriorityIssue] = field(default_factory=list)
    critical_blocks: List[str] = field(default_factory=list)  # stop-prescribing reasons
    limiting_nutrient: Optional[str] = None

    # Nutrient prescription
    nutrients: NutrientPrescription = field(default_factory=NutrientPrescription)

    # Product recommendations
    products_chemical: List[ProductRecommendation] = field(default_factory=list)
    products_organic: List[ProductRecommendation] = field(default_factory=list)
    amendments: List[ProductRecommendation] = field(default_factory=list)

    # STCR equations used (for audit trail)
    equations_applied: List[Dict] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────
# STCR COEFFICIENT TABLES
# ─────────────────────────────────────────────────────────────

STCR_COEFFICIENTS = {
    "wheat": {
        "N": {
            "without_manure": (4.86, 0.47, 0),
            "with_manure":    (3.52, 0.33, 3.20),
            "source": "ICAR-AICRP STCR, Central Plain Zone UP, Inceptisol"
        },
        "P": {
            "without_manure": (2.92, 4.37, 0),
            "with_manure":    (2.10, 3.14, 2.80),
            "source": "ICAR-AICRP STCR, Central Plain Zone UP, Inceptisol"
        },
        "K": {
            "without_manure": (2.20, 0.26, 0),
            "with_manure":    (1.58, 0.19, 1.40),
            "source": "ICAR-AICRP STCR, Central Plain Zone UP, Inceptisol"
        },
    },
    "rice": {
        "N": {
            "without_manure": (4.18, 0.71, 0),
            "with_manure":    (3.01, 0.51, 2.90),
            "source": "ICAR-AICRP STCR, Kharif, Alluvial soil UP"
        },
        "P": {
            "without_manure": (3.69, 7.17, 0),
            "with_manure":    (2.65, 5.16, 2.20),
            "source": "ICAR-AICRP STCR, Kharif, Alluvial soil UP"
        },
        "K": {
            "without_manure": (1.49, 0.28, 0),
            "with_manure":    (1.07, 0.20, 1.10),
            "source": "ICAR-AICRP STCR, Kharif, Alluvial soil UP"
        },
    },
    "maize": {
        "N": {
            "without_manure": (10.29, 1.20, 0),
            "with_manure":    (7.20,  0.84, 0.66),
            "source": "ICAR-AICRP STCR, Kharif Maize, North India"
        },
        "P": {
            "without_manure": (5.93, 6.07, 0),
            "with_manure":    (4.33, 4.42, 1.12),
            "source": "ICAR-AICRP STCR, Kharif Maize, North India"
        },
        "K": {
            "without_manure": (3.25, 0.37, 0),
            "with_manure":    (2.52, 0.29, 0.35),
            "source": "ICAR-AICRP STCR, Kharif Maize, North India"
        },
    },
    "sugarcane": {
        "N": {
            "without_manure": (1.60, 0.30, 0),
            "with_manure":    (1.20, 0.22, 1.80),
            "source": "ICAR STCR for Sugarcane, UP"
        },
        "P": {
            "without_manure": (0.80, 3.50, 0),
            "with_manure":    (0.60, 2.60, 0.90),
            "source": "ICAR STCR for Sugarcane, UP"
        },
        "K": {
            "without_manure": (1.20, 0.20, 0),
            "with_manure":    (0.90, 0.15, 0.80),
            "source": "ICAR STCR for Sugarcane, UP"
        },
    },
    "tomato": {
        "N": {
            "without_manure": (3.50, 0.40, 0),
            "with_manure":    (2.60, 0.30, 2.50),
            "source": "ICAR-IIVR Varanasi, Vegetable STCR UP"
        },
        "P": {
            "without_manure": (1.80, 3.20, 0),
            "with_manure":    (1.35, 2.40, 1.20),
            "source": "ICAR-IIVR Varanasi, Vegetable STCR UP"
        },
        "K": {
            "without_manure": (2.20, 0.28, 0),
            "with_manure":    (1.65, 0.21, 1.00),
            "source": "ICAR-IIVR Varanasi, Vegetable STCR UP"
        },
    },
    "potato": {
        "N": {
            "without_manure": (2.80, 0.38, 0),
            "with_manure":    (2.10, 0.28, 2.20),
            "source": "ICAR-CPRI Shimla, STCR for Potato, Rabi UP"
        },
        "P": {
            "without_manure": (1.50, 3.80, 0),
            "with_manure":    (1.10, 2.80, 1.10),
            "source": "ICAR-CPRI Shimla, STCR for Potato, Rabi UP"
        },
        "K": {
            "without_manure": (3.50, 0.45, 0),
            "with_manure":    (2.60, 0.33, 1.40),
            "source": "ICAR-CPRI Shimla, STCR for Potato, Rabi UP"
        },
    },
    "onion": {
        "N": {
            "without_manure": (2.20, 0.32, 0),
            "with_manure":    (1.65, 0.24, 1.80),
            "source": "ICAR-DOGR Pune, Allium STCR"
        },
        "P": {
            "without_manure": (1.20, 2.90, 0),
            "with_manure":    (0.90, 2.15, 0.90),
            "source": "ICAR-DOGR Pune, Allium STCR"
        },
        "K": {
            "without_manure": (2.80, 0.35, 0),
            "with_manure":    (2.10, 0.26, 1.20),
            "source": "ICAR-DOGR Pune, Allium STCR"
        },
    },
}

# Curated source registry (seed references supplied during planning/discovery)
STCR_REFERENCE_SOURCES = {
    "SRC_UP_RICE_EAST_01": {
        "title": "Validation of STCR fertilizer prescription model for rice on Inceptisol of Eastern UP",
        "url": "https://www.researchgate.net/publication/313623187_Validation_of_Soil_Test_and_Yield_Target_based_Fertilizer_Prescription_Model_for_Rice_on_Inceptisol_of_Eastern_Zone_of_Uttar_Pradesh_India",
    },
    "SRC_UP_WHEAT_CE_01": {
        "title": "STCR-IPNS equations for wheat in Inceptisol of Central/Eastern UP",
        "url": "https://epubs.icar.org.in/index.php/JISSS/article/view/45550",
    },
    "SRC_UP_PIGEONPEA_01": {
        "title": "AICRP-STCR pulse equation set (Pigeon pea var. UPAS-120)",
        "url": "https://www.gbpuat.res.in/uploads/aicrp/17%20AICRP%20-%20SOIL%20TEST%20CROP%20RESPONSE.pdf",
    },
}

# Region-aware overrides derived from curated references above.
# These values are used when crop+region match.
STCR_REGIONAL_OVERRIDES = {
    ("rice", "eastern up"): {
        "N": {
            "with_manure": (4.76, 0.49, 0.34),
            "without_manure": (4.76, 0.49, 0.0),
            "source": "Eastern UP Inceptisol STCR-IPNS",
            "source_id": "SRC_UP_RICE_EAST_01",
        },
        "P": {
            "with_manure": (1.53, 1.41, 0.09),
            "without_manure": (1.53, 1.41, 0.0),
            "source": "Eastern UP Inceptisol STCR-IPNS",
            "source_id": "SRC_UP_RICE_EAST_01",
        },
        "K": {
            "with_manure": (2.92, 0.35, 0.11),
            "without_manure": (2.92, 0.35, 0.0),
            "source": "Eastern UP Inceptisol STCR-IPNS",
            "source_id": "SRC_UP_RICE_EAST_01",
        },
    },
    ("wheat", "eastern up"): {
        "N": {
            "with_manure": (6.96, 0.34, 0.12),
            "without_manure": (6.96, 0.34, 0.0),
            "source": "Central/Eastern UP wheat STCR-IPNS",
            "source_id": "SRC_UP_WHEAT_CE_01",
        },
        "P": {
            "with_manure": (2.96, 2.57, 0.29),
            "without_manure": (2.96, 2.57, 0.0),
            "source": "Central/Eastern UP wheat STCR-IPNS",
            "source_id": "SRC_UP_WHEAT_CE_01",
        },
        "K": {
            "with_manure": (2.83, 0.11, 0.03),
            "without_manure": (2.83, 0.11, 0.0),
            "source": "Central/Eastern UP wheat STCR-IPNS",
            "source_id": "SRC_UP_WHEAT_CE_01",
        },
    },
    ("pigeon_pea", "up"): {
        "N": {
            "with_manure": (5.66, 0.28, 0.21),
            "without_manure": (5.66, 0.28, 0.0),
            "source": "Pigeon pea UPAS-120 STCR-IPNS",
            "source_id": "SRC_UP_PIGEONPEA_01",
        },
        "P": {
            "with_manure": (16.81, 7.92, 2.26),
            "without_manure": (16.81, 7.92, 0.0),
            "source": "Pigeon pea UPAS-120 STCR-IPNS",
            "source_id": "SRC_UP_PIGEONPEA_01",
        },
        "K": {
            "with_manure": (9.56, 0.47, 0.31),
            "without_manure": (9.56, 0.47, 0.0),
            "source": "Pigeon pea UPAS-120 STCR-IPNS",
            "source_id": "SRC_UP_PIGEONPEA_01",
        },
    },
}

FYM_NUTRIENT_CONTENT = {
    "N_pct": 0.50,
    "P_pct": 0.25,
    "K_pct": 0.50,
}

CROP_IDEAL_RANGES = {
    "wheat":     {"ph_min": 6.0, "ph_max": 7.5, "ec_max": 6.0, "oc_low": 0.5, "zn_critical": 0.6},
    "rice":      {"ph_min": 5.5, "ph_max": 7.0, "ec_max": 3.0, "oc_low": 0.5, "zn_critical": 0.6},
    "maize":     {"ph_min": 6.0, "ph_max": 7.5, "ec_max": 4.0, "oc_low": 0.5, "zn_critical": 0.6},
    "sugarcane": {"ph_min": 6.0, "ph_max": 8.0, "ec_max": 3.0, "oc_low": 0.4, "zn_critical": 0.5},
    "tomato":    {"ph_min": 5.5, "ph_max": 7.0, "ec_max": 2.5, "oc_low": 0.6, "zn_critical": 0.5},
    "potato":    {"ph_min": 5.0, "ph_max": 6.5, "ec_max": 1.7, "oc_low": 0.6, "zn_critical": 0.5},
    "onion":     {"ph_min": 6.0, "ph_max": 7.5, "ec_max": 1.2, "oc_low": 0.5, "zn_critical": 0.5},
    "pigeon_pea": {"ph_min": 6.5, "ph_max": 7.5, "ec_max": 1.0, "oc_low": 0.6, "zn_critical": 0.6},
}


def _normalize_region(region: str) -> str:
    region_l = (region or "").lower()
    if "eastern" in region_l:
        return "eastern up"
    if "central" in region_l or "kanpur" in region_l:
        return "central up"
    if "uttar pradesh" in region_l or "up" in region_l:
        return "up"
    return region_l


def get_reference_sources_for_crop(crop_key: str, region: str = "Kanpur/Central UP") -> List[Dict]:
    """
    Return curated references used for crop/region coefficients.
    """
    region_key = _normalize_region(region)
    refs = []
    reg_data = STCR_REGIONAL_OVERRIDES.get((crop_key, region_key))
    if reg_data:
        for nutrient in ("N", "P", "K"):
            src_id = reg_data.get(nutrient, {}).get("source_id")
            if src_id and src_id in STCR_REFERENCE_SOURCES:
                refs.append({"nutrient": nutrient, "source_id": src_id, **STCR_REFERENCE_SOURCES[src_id]})
    if not refs:
        refs.append({
            "nutrient": "NPK",
            "source_id": "default",
            "title": "Built-in STCR seed set for Kanpur/Central UP",
            "url": "",
        })
    return refs

# ─────────────────────────────────────────────────────────────
# VALIDATION LAYER
# ─────────────────────────────────────────────────────────────

def validate_soil_input(soil: SoilInput) -> Tuple[bool, List[str]]:
    errors = []
    if not (2.0 <= soil.ph <= 12.0):
        errors.append(f"pH {soil.ph} is outside measurable range (2–12). Verify lab data.")
    if soil.ec_ds_m < 0 or soil.ec_ds_m > 50:
        errors.append(f"EC {soil.ec_ds_m} dS/m is implausible.")
    if not (0 <= soil.oc_pct <= 20):
        errors.append(f"Organic Carbon {soil.oc_pct}% is outside normal range.")
    if soil.n_kg_ha < 0 or soil.n_kg_ha > 1000:
        errors.append(f"Nitrogen {soil.n_kg_ha} kg/ha is implausible.")
    if soil.p_kg_ha < 0 or soil.p_kg_ha > 500:
        errors.append(f"Phosphorus {soil.p_kg_ha} kg/ha is implausible.")
    if soil.k_kg_ha < 0 or soil.k_kg_ha > 2000:
        errors.append(f"Potassium {soil.k_kg_ha} kg/ha is implausible.")
    if soil.target_yield_q_ha <= 0 or soil.target_yield_q_ha > 500:
        errors.append(f"Target yield {soil.target_yield_q_ha} q/ha is implausible.")
    if soil.zn_ppm < 0 or soil.zn_ppm > 100:
        errors.append(f"Zinc {soil.zn_ppm} ppm is outside measurable range.")
    return len(errors) == 0, errors

# ─────────────────────────────────────────────────────────────
# PRIORITY ASSESSMENT
# ─────────────────────────────────────────────────────────────

def assess_priority_issues(soil: SoilInput) -> List[PriorityIssue]:
    issues = []
    crop_key = soil.crop_name.lower()
    ranges = CROP_IDEAL_RANGES.get(crop_key, CROP_IDEAL_RANGES["wheat"])

    if soil.ph < 4.0:
        issues.append(PriorityIssue(
            parameter="pH", severity="critical",
            measured_value=soil.ph, threshold=4.0,
            action="Soil is strongly acidic and uncultivable. Do NOT apply any fertilizer. Requires heavy liming before any crop can be grown.",
            correction_product="Lime (CaCO3)",
            correction_quantity=f"~{round((6.0 - soil.ph) * 3.5, 1)} t/ha (in splits)"
        ))
    elif soil.ph < ranges["ph_min"]:
        lime_needed = round((ranges["ph_min"] - soil.ph) * 2.5, 1)
        issues.append(PriorityIssue(
            parameter="pH", severity="warning",
            measured_value=soil.ph, threshold=ranges["ph_min"],
            action=f"Soil is too acidic for {soil.crop_name}. Apply lime before fertilizer application.",
            correction_product="Lime (CaCO3)",
            correction_quantity=f"{lime_needed} t/ha"
        ))
    elif soil.ph > 9.0:
        issues.append(PriorityIssue(
            parameter="pH", severity="critical",
            measured_value=soil.ph, threshold=9.0,
            action="Strongly alkaline/sodic soil (Usar). Apply Gypsum for reclamation. Nutrient availability severely impaired.",
            correction_product="Gypsum",
            correction_quantity=f"~{round((soil.ph - 8.0) * 5, 0)} kg/ha"
        ))
    elif soil.ph > ranges["ph_max"]:
        issues.append(PriorityIssue(
            parameter="pH", severity="warning",
            measured_value=soil.ph, threshold=ranges["ph_max"],
            action="Mildly alkaline. Consider Gypsum or Sulphur application.",
            correction_product="Gypsum",
            correction_quantity="250–500 kg/ha"
        ))

    if soil.ec_ds_m > 8.0:
        issues.append(PriorityIssue(
            parameter="EC", severity="critical",
            measured_value=soil.ec_ds_m, threshold=8.0,
            action="Severely saline soil. Most crops cannot survive. Requires drainage and leaching before cultivation.",
            correction_quantity="Consult agronomist for reclamation plan."
        ))
    elif soil.ec_ds_m > ranges["ec_max"]:
        issues.append(PriorityIssue(
            parameter="EC", severity="warning",
            measured_value=soil.ec_ds_m, threshold=ranges["ec_max"],
            action=f"Salinity exceeds tolerance for {soil.crop_name}. Reduce chemical fertilizer doses by 20%. Prefer Gypsum.",
        ))

    if soil.oc_pct < ranges["oc_low"]:
        issues.append(PriorityIssue(
            parameter="OC", severity="warning",
            measured_value=soil.oc_pct, threshold=ranges["oc_low"],
            action="Low organic carbon reduces fertilizer efficiency. Apply FYM (5–10 t/ha) or Vermicompost (2–3 t/ha).",
            correction_product="FYM",
            correction_quantity="5–10 t/ha"
        ))

    if 0 < soil.zn_ppm < ranges["zn_critical"]:
        issues.append(PriorityIssue(
            parameter="Zn", severity="warning",
            measured_value=soil.zn_ppm, threshold=ranges["zn_critical"],
            action="Zinc deficiency detected. Apply Zinc Sulphate.",
            correction_product="Zinc Sulphate 21%",
            correction_quantity="25 kg/ha (basal)"
        ))

    severity_order = {"critical": 0, "warning": 1, "info": 2}
    issues.sort(key=lambda x: severity_order[x.severity])
    return issues

# ─────────────────────────────────────────────────────────────
# STCR EQUATION ENGINE
# ─────────────────────────────────────────────────────────────

def calculate_stcr_nutrient(
    crop_key: str,
    nutrient: str,
    target_yield: float,
    soil_test_value: float,
    fym_t_ha: float = 0.0,
    region: str = "Kanpur/Central UP",
) -> Tuple[float, str]:
    region_key = _normalize_region(region)
    region_data = STCR_REGIONAL_OVERRIDES.get((crop_key, region_key), {})
    crop_data = region_data if nutrient in region_data else STCR_COEFFICIENTS.get(crop_key)
    if not crop_data or nutrient not in crop_data:
        logger.warning(f"No STCR data for {crop_key}/{nutrient}. Returning 0.")
        return 0.0, "No equation available"

    nutrient_data = crop_data[nutrient]
    use_manure = fym_t_ha > 0

    if use_manure:
        X, Y, Z = nutrient_data["with_manure"]
        fym_nutrient_pct = FYM_NUTRIENT_CONTENT.get(f"{nutrient}_pct", 0)
        Mn = fym_t_ha * 1000 * (fym_nutrient_pct / 100)
    else:
        X, Y, Z = nutrient_data["without_manure"]
        Mn = 0.0

    source = nutrient_data["source"]
    source_id = nutrient_data.get("source_id")
    fertilizer_needed = (X * target_yield) - (Y * soil_test_value) - (Z * Mn)
    fertilizer_needed = max(0.0, fertilizer_needed)
    if source_id and source_id in STCR_REFERENCE_SOURCES:
        source = f"{source} | {STCR_REFERENCE_SOURCES[source_id]['url']}"
    return round(fertilizer_needed, 2), source

def convert_nutrient_to_products(
    n_kg_ha: float,
    p_kg_ha: float,
    k_kg_ha: float,
    s_kg_ha: float = 0.0,
    zn_kg_ha: float = 0.0
) -> List[ProductRecommendation]:
    products = []
    ha_to_acre = 1 / 2.47
    def bags(kg_ha): return round((kg_ha / 50) * ha_to_acre, 1)

    if p_kg_ha > 0:
        if n_kg_ha > 0:
            dap_kg = round(p_kg_ha / 0.46, 1)
            n_from_dap = dap_kg * 0.18
            products.append(ProductRecommendation(
                product_name="DAP (18-46-0)", nutrient_source="P, N",
                kg_per_ha=dap_kg, bags_per_acre=bags(dap_kg),
                application_timing="Basal (at sowing)",
                notes=f"Provides {round(n_from_dap, 1)} kg/ha N additionally"
            ))
            n_kg_ha = max(0, n_kg_ha - n_from_dap)
        else:
            ssp_kg = round(p_kg_ha / 0.16, 1)
            products.append(ProductRecommendation(
                product_name="SSP (Single Super Phosphate 16%)", nutrient_source="P, S",
                kg_per_ha=ssp_kg, bags_per_acre=bags(ssp_kg),
                application_timing="Basal (at sowing)",
                notes=f"Also provides ~{round(ssp_kg * 0.11, 1)} kg/ha Sulphur"
            ))

    if n_kg_ha > 0:
        urea_kg = round(n_kg_ha / 0.46, 1)
        products.append(ProductRecommendation(
            product_name="Urea (46% N)", nutrient_source="N",
            kg_per_ha=urea_kg, bags_per_acre=bags(urea_kg),
            application_timing="Split: 50% basal + 50% top-dress",
            notes="Do not apply before heavy rain forecast."
        ))

    if k_kg_ha > 0:
        mop_kg = round(k_kg_ha / 0.60, 1)
        products.append(ProductRecommendation(
            product_name="MOP (Muriate of Potash 60%)", nutrient_source="K",
            kg_per_ha=mop_kg, bags_per_acre=bags(mop_kg),
            application_timing="Basal (at sowing)"
        ))

    if zn_kg_ha > 0:
        znso4_kg = round(zn_kg_ha / 0.21, 1)
        products.append(ProductRecommendation(
            product_name="Zinc Sulphate 21%", nutrient_source="Zn",
            kg_per_ha=znso4_kg, bags_per_acre=bags(znso4_kg),
            application_timing="Basal (at sowing)"
        ))

    return products

def get_organic_alternatives(n_kg_ha: float, p_kg_ha: float, k_kg_ha: float, fym_already: float = 0.0) -> List[ProductRecommendation]:
    organics = []
    ha_to_acre = 1 / 2.47
    def bags(kg_ha): return round((kg_ha / 50) * ha_to_acre, 1)

    if n_kg_ha > 0 or p_kg_ha > 0:
        vc_kg = min(round(n_kg_ha / 0.015, 0), 5000)
        organics.append(ProductRecommendation(
            product_name="Vermicompost", nutrient_source="N, P, K",
            kg_per_ha=vc_kg, bags_per_acre=bags(vc_kg), is_organic=True,
            application_timing="7–10 days before sowing"
        ))
    return organics

def calculate_confidence(soil: SoilInput, priority_issues: List[PriorityIssue], has_equation: bool) -> Tuple[float, List[str]]:
    score = 1.0
    reasons = []
    if not has_equation:
        score -= 0.4
        reasons.append("No validated STCR equation for this crop in this region.")
    critical_count = sum(1 for i in priority_issues if i.severity == "critical")
    if critical_count > 0:
        score -= 0.3 * critical_count
        reasons.append(f"{critical_count} critical soil issue(s) detected.")
    return max(0.0, min(1.0, score)), reasons

# ─────────────────────────────────────────────────────────────
# MAIN PRESCRIPTION FUNCTION
# ─────────────────────────────────────────────────────────────

def generate_prescription(soil: SoilInput) -> PrescriptionResult:
    result = PrescriptionResult()
    crop_key = soil.crop_name.lower()

    is_valid, errors = validate_soil_input(soil)
    if not is_valid:
        result.is_cultivable = False
        result.critical_blocks = errors
        result.confidence_score = 0.0
        return result

    priority_issues = assess_priority_issues(soil)
    result.priority_issues = priority_issues
    critical_issues = [i for i in priority_issues if i.severity == "critical"]
    
    if critical_issues:
        result.is_cultivable = False
        result.critical_blocks = [i.action for i in critical_issues]
        for issue in critical_issues:
            if issue.correction_product:
                result.amendments.append(ProductRecommendation(
                    product_name=issue.correction_product,
                    nutrient_source="Amendment",
                    kg_per_ha=0, bags_per_acre=0,
                    application_timing="Before any fertilizer application",
                    notes=issue.correction_quantity or ""
                ))
        result.confidence_score = 0.0
        return result

    for issue in priority_issues:
        if issue.correction_product and issue.severity == "warning":
            result.amendments.append(ProductRecommendation(
                product_name=issue.correction_product, nutrient_source="Amendment",
                kg_per_ha=0, bags_per_acre=0,
                application_timing="Prioritize before NPK application",
                notes=f"{issue.action} | Quantity: {issue.correction_quantity or 'As directed'}"
            ))

    has_equation = crop_key in STCR_COEFFICIENTS
    n_needed, n_src = calculate_stcr_nutrient(crop_key, "N", soil.target_yield_q_ha, soil.n_kg_ha, soil.fym_t_ha, soil.region)
    p_needed, p_src = calculate_stcr_nutrient(crop_key, "P", soil.target_yield_q_ha, soil.p_kg_ha, soil.fym_t_ha, soil.region)
    k_needed, k_src = calculate_stcr_nutrient(crop_key, "K", soil.target_yield_q_ha, soil.k_kg_ha, soil.fym_t_ha, soil.region)

    result.equations_applied = [
        {"nutrient": "N", "kg_ha": n_needed, "source": n_src},
        {"nutrient": "P", "kg_ha": p_needed, "source": p_src},
        {"nutrient": "K", "kg_ha": k_needed, "source": k_src}
    ]

    zn_needed = 0.0
    if soil.zn_ppm > 0:
        ranges = CROP_IDEAL_RANGES.get(crop_key, {})
        if soil.zn_ppm < ranges.get("zn_critical", 0.6):
            zn_needed = 5.0

    result.nutrients = NutrientPrescription(n_kg_ha=n_needed, p_kg_ha=p_needed, k_kg_ha=k_needed, zn_kg_ha=zn_needed)
    result.products_chemical = convert_nutrient_to_products(n_needed, p_needed, k_needed, zn_kg_ha=zn_needed)
    result.products_organic = get_organic_alternatives(n_needed, p_needed, k_needed, fym_already=soil.fym_t_ha)

    score, reasons = calculate_confidence(soil, priority_issues, has_equation)
    result.confidence_score = score
    result.confidence_reasons = reasons
    return result
