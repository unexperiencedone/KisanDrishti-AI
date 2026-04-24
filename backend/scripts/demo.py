"""
KisaanDrishti AI Quick Demo — Run without database
==========================================
Demonstrates the STCR Engine logic for a typical Wheat scenario.
"""

from app.services.stcr_engine import SoilInput, generate_prescription

def run_demo():
    print("="*50)
    print(" KisaanDrishti AI PRECISION RECOMMENDATION DEMO ")
    print("="*50)

    # 1. Simulate farmer input
    # Scenario: Wheat in Kanpur, decent Soil Test values
    soil = SoilInput(
        crop_name="Wheat",
        target_yield_q_ha=45.0,  # Goal: 45 quintals/ha
        n_kg_ha=180.0,           # Medium-Low Nitrogen
        p_kg_ha=12.0,            # Low Phosphorus
        k_kg_ha=250.0,           # High Potassium
        ph=7.5,                  # Slightly Alkaline
        ec_ds_m=0.8,             # Good
        oc_pct=0.45,             # Low Organic Carbon
        fym_t_ha=5.0             # Farmer applied 5 tons FYM
    )

    print(f"\n[INPUT] Target: {soil.target_yield_q_ha} q/ha Wheat")
    print(f"[INPUT] Soil: N={soil.n_kg_ha}, P={soil.p_kg_ha}, K={soil.k_kg_ha}, OC={soil.oc_pct}%")
    print(f"[INPUT] Manure: {soil.fym_t_ha} t/ha FYM")

    # 2. Generate Prescription
    result = generate_prescription(soil)

    # 3. Print Results
    print("\n" + "-"*30)
    print(" RESULTS ")
    print("-"*30)
    print(f"Confidence Score: {result.confidence_score * 100}%")
    
    if result.priority_issues:
        print("\nPRIORITY ISSUES:")
        for issue in result.priority_issues:
            print(f"  - [{issue.severity.upper()}] {issue.parameter}: {issue.action}")

    print(f"\nNUTRIENT DOSES (kg/ha):")
    print(f"  Nitrogen (N)   : {result.nutrients.n_kg_ha}")
    print(f"  Phosphorus (P) : {result.nutrients.p_kg_ha}")
    print(f"  Potassium (K)  : {result.nutrients.k_kg_ha}")

    print(f"\nCOMMERCIAL PRODUCT RECOMMENDATION:")
    for product in result.products_chemical:
        print(f"  - {product.product_name}: {product.kg_per_ha} kg/ha")
        print(f"    Timing: {product.application_timing}")
        if product.notes:
            print(f"    Note: {product.notes}")

    if result.products_organic:
        print(f"\nORGANIC ALTERNATIVES:")
        for p in result.products_organic:
            print(f"  - {p.product_name}: {p.kg_per_ha} kg/ha ({p.bags_per_acre} bags/acre)")

    print("\n" + "="*50)

if __name__ == "__main__":
    run_demo()
