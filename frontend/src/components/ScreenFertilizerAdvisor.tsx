"use client";
import React, { useState, useMemo } from "react";
import {
  Sprout, Beaker, ChevronRight, AlertTriangle,
  CheckCircle, Loader2, RotateCcw, BookOpen
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, RecommendationRequest, RecommendationResponse, ProductResponse } from "@/lib/api";

// ─── Default form ─────────────────────────────────────────────────────────────
const DEFAULT: RecommendationRequest = {
  crop_name: "wheat",
  target_yield_q_ha: 40,
  region: "Kanpur/Central UP",
  soil_type: "Alluvial",
  is_irrigated: true,
  language: "hi",
  farm_size: 1.0,
  farm_unit: "Acre",
  soil: {
    n_kg_ha: 200, p_kg_ha: 15, k_kg_ha: 200,
    ph: 6.8, ec_ds_m: 0.4, oc_pct: 0.5,
    zn_ppm: 0.8, fe_ppm: 5, s_ppm: 10,
    fym_t_ha: 0, compost_t_ha: 0,
  },
};

const CROPS = ["wheat", "rice", "maize", "sugarcane", "pigeon_pea", "tomato", "potato", "onion"];
const UNITS = ["Acre", "Hectare", "Bigha"];

// Farm multiplier to get total kg from kg/ha
function useFarmMulti(size: number, unit: string) {
  return useMemo(() => {
    if (unit === "Acre") return size * 0.404686;
    if (unit === "Bigha") return size * 0.25;
    return size; // Hectare
  }, [size, unit]);
}

const FERTILIZER_ICONS: Record<string, string> = {
  Urea: "💧", DAP: "🟡", MOP: "🟢", "Zinc Sulphate": "🔵",
  SSP: "🟠", Gypsum: "⚪",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCard({ product, totalKg, color }: {
  product: ProductResponse; totalKg: number; color: string;
}) {
  const icon = FERTILIZER_ICONS[product.product_name] ?? "🧪";
  return (
    <div className={`flex justify-between items-center px-5 py-4 border-b border-slate-50 last:border-b-0`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-bold text-slate-700 text-sm">{product.product_name}</div>
          {product.notes && (
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{product.notes}</div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-mono font-bold text-sm ${color}`}>
          {product.kg_per_ha} kg/ha
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          {totalKg.toFixed(1)} kg total
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type View = "overview" | "form" | "result";

export default function ScreenFertilizerAdvisor() {
  const [view, setView] = useState<View>("overview");
  const [form, setForm] = useState<RecommendationRequest>(DEFAULT);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const farmMulti = useFarmMulti(form.farm_size, form.farm_unit);

  function updateSoil(key: keyof RecommendationRequest["soil"], val: number) {
    setForm((p) => ({ ...p, soil: { ...p.soil, [key]: val } }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.recommend(form);
      setResult(res);
      setView("result");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Overview (static design-matching view) ───────────────────────────────
  if (view === "overview") {
    return (
      <div className="bg-slate-50 min-h-full">
        <div className="px-4 py-4 space-y-6">

          {/* Crop Card */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex gap-4">
            <div className="w-24 h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
              <img
                src="https://placehold.co/400x600/16a34a/ffffff?text=Paddy"
                alt="Crop"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="py-2 flex-1">
              <h2 className="font-bold text-slate-800 text-lg mb-3">Paddy (Rice)</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Growth Stage</p>
                  <p className="text-sm font-bold text-slate-700">Tillering Stage</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Area</p>
                  <p className="text-sm font-bold text-slate-700">2.5 Acres</p>
                </div>
              </div>
              <button
                onClick={() => setView("form")}
                className="mt-4 bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-emerald-800 transition"
              >
                Run STCR Analysis <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Recommendation Cards */}
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-3">Recommended Fertilizers</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Based on soil and crop requirement</p>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {[
                { name: "Urea", dose: "20 kg/acre", icon: "💧", color: "text-blue-500" },
                { name: "DAP", dose: "15 kg/acre", icon: "🟡", color: "text-amber-500" },
                { name: "MOP (Potash)", dose: "15 kg/acre", icon: "🟢", color: "text-emerald-500" },
                { name: "Zinc Sulphate", dose: "5 kg/acre", icon: "⚪", color: "text-slate-500" },
              ].map((item, i, arr) => (
                <div
                  key={item.name}
                  className={`flex justify-between items-center px-5 py-4 ${i !== arr.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                  </div>
                  <span className={`font-mono font-bold text-sm ${item.color}`}>{item.dose}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex gap-3 items-center">
            <Sprout className="w-6 h-6 text-emerald-600 shrink-0" />
            <p className="text-sm text-slate-700 leading-snug font-medium">
              Apply fertilizers in split doses for better nutrient use efficiency.
            </p>
          </div>

          {/* CTA to full form */}
          <button
            onClick={() => setView("form")}
            className="w-full border border-emerald-200 bg-white text-emerald-700 font-bold py-4 rounded-xl shadow-sm hover:bg-emerald-50 transition text-sm flex items-center justify-center gap-2"
          >
            <Beaker className="w-5 h-5" /> Calculate STCR Prescription for My Farm
          </button>

          <div className="pb-16" />
        </div>
      </div>
    );
  }

  // ─── STCR Input Form ──────────────────────────────────────────────────────
  if (view === "form") {
    const soilFields: { key: keyof RecommendationRequest["soil"]; label: string; step: string }[] = [
      { key: "n_kg_ha", label: "Nitrogen (N) kg/ha", step: "1" },
      { key: "p_kg_ha", label: "Phosphorus (P) kg/ha", step: "1" },
      { key: "k_kg_ha", label: "Potassium (K) kg/ha", step: "1" },
      { key: "ph", label: "Soil pH", step: "0.1" },
      { key: "ec_ds_m", label: "EC (dS/m)", step: "0.1" },
      { key: "oc_pct", label: "Organic Carbon (%)", step: "0.1" },
      { key: "zn_ppm", label: "Zinc (ppm)", step: "0.1" },
      { key: "fym_t_ha", label: "FYM Applied (t/ha)", step: "0.5" },
    ];

    return (
      <div className="bg-slate-50 min-h-full">
        <div className="px-4 py-4">
          <form onSubmit={onSubmit} className="space-y-6">

            {/* Farm Profile */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" /> Farm Profile
              </h3>

              {/* Crop */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Crop</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  value={form.crop_name}
                  onChange={(e) => setForm((p) => ({ ...p, crop_name: e.target.value }))}
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ").toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Farm Size + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Size</label>
                  <input
                    type="number" step="0.1" min="0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                    value={form.farm_size}
                    onChange={(e) => setForm((p) => ({ ...p, farm_size: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                    value={form.farm_unit}
                    onChange={(e) => setForm((p) => ({ ...p, farm_unit: e.target.value }))}
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Target Yield */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Yield (q/ha)</label>
                <input
                  type="number" step="1" min="1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  value={form.target_yield_q_ha}
                  onChange={(e) => setForm((p) => ({ ...p, target_yield_q_ha: Number(e.target.value) }))}
                />
              </div>

              {/* Irrigated toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Irrigated Field</span>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, is_irrigated: !p.is_irrigated }))}
                  className={`w-12 h-6 rounded-full transition-colors ${form.is_irrigated ? "bg-emerald-600" : "bg-slate-300"}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.is_irrigated ? "translate-x-6" : ""}`} />
                </button>
              </div>

              {/* Language */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Language</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  value={form.language}
                  onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                >
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Soil Test Values */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-emerald-600" /> Soil Test Parameters
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {soilFields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</label>
                    <input
                      type="number" step={f.step}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                      value={(form.soil as Record<string, number>)[f.key]}
                      onChange={(e) => updateSoil(f.key, Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm font-medium flex gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 pb-16">
              <button
                type="button"
                onClick={() => setView("overview")}
                className="flex-1 border border-slate-200 bg-white text-slate-600 font-bold py-4 rounded-xl transition hover:bg-slate-50 text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-800 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-60 transition hover:bg-emerald-700 text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analysing…</>
                ) : (
                  <><CheckCircle className="w-5 h-5" /> Get Prescription</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ─── Result View ──────────────────────────────────────────────────────────
  if (view === "result" && result) {
    const allProducts = [...result.amendments, ...result.products];
    const phase1 = result.amendments;
    const phase2 = result.products.filter((p) =>
      p.application_timing.toLowerCase().includes("basal") ||
      p.application_timing.toLowerCase().includes("sowing")
    );
    const phase3 = result.products.filter((p) =>
      p.application_timing.toLowerCase().includes("top") ||
      p.application_timing.toLowerCase().includes("split")
    );

    return (
      <div className="bg-slate-50 min-h-full">
        <div className="px-4 py-4 space-y-6">

          {/* Summary Banner */}
          <div className={`rounded-3xl p-5 border shadow-sm ${result.is_cultivable ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
            <div className="flex items-center gap-3 mb-2">
              {result.is_cultivable
                ? <CheckCircle className="w-6 h-6 text-emerald-600" />
                : <AlertTriangle className="w-6 h-6 text-red-500" />}
              <h3 className="font-bold text-slate-800 text-lg">
                {result.is_cultivable ? "Prescription Ready" : "Soil Issues Detected"}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-xl p-2 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">N req.</p>
                <p className="font-mono font-bold text-slate-800 text-sm">{Math.round(result.prescription.n_kg_ha)} kg/ha</p>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">P req.</p>
                <p className="font-mono font-bold text-slate-800 text-sm">{Math.round(result.prescription.p_kg_ha)} kg/ha</p>
              </div>
              <div className="bg-white rounded-xl p-2 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">K req.</p>
                <p className="font-mono font-bold text-slate-800 text-sm">{Math.round(result.prescription.k_kg_ha)} kg/ha</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <ul className="text-sm text-amber-800 font-medium space-y-1 list-disc list-inside">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Phase Timeline */}
          {allProducts.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Beaker className="w-5 h-5 text-emerald-400" /> Application Timeline
              </h3>

              {phase1.length > 0 && (
                <div>
                  <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">① Pre-Sowing — Soil Prep</p>
                  {phase1.map((p, i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-3 mb-2 flex justify-between items-center">
                      <span className="font-semibold text-slate-200 text-sm">{p.product_name}</span>
                      <div className="text-right">
                        <span className="font-mono text-amber-300 font-bold text-sm">{(p.kg_per_ha * farmMulti).toFixed(1)} kg</span>
                        <span className="text-[10px] text-slate-400 block">total</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {phase2.length > 0 && (
                <div>
                  <p className="text-sky-400 font-bold text-xs uppercase tracking-wider mb-2">② Basal — At Sowing</p>
                  {phase2.map((p, i) => {
                    const isSplit = p.application_timing.toLowerCase().includes("split");
                    const qty = (isSplit ? p.kg_per_ha / 2 : p.kg_per_ha) * farmMulti;
                    return (
                      <div key={i} className="bg-white/10 rounded-xl p-3 mb-2 flex justify-between items-center">
                        <span className="font-semibold text-slate-200 text-sm">
                          {p.product_name}
                          {isSplit && <span className="ml-2 text-[10px] text-sky-300 bg-sky-900/30 px-1.5 py-0.5 rounded">50%</span>}
                        </span>
                        <div className="text-right">
                          <span className="font-mono text-sky-300 font-bold text-sm">{qty.toFixed(1)} kg</span>
                          <span className="text-[10px] text-slate-400 block">total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {phase3.length > 0 && (
                <div>
                  <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">③ Top-Dress — 25–30 Days</p>
                  {phase3.map((p, i) => {
                    const isSplit = p.application_timing.toLowerCase().includes("split");
                    const qty = (isSplit ? p.kg_per_ha / 2 : p.kg_per_ha) * farmMulti;
                    return (
                      <div key={i} className="bg-white/10 rounded-xl p-3 mb-2 flex justify-between items-center">
                        <span className="font-semibold text-slate-200 text-sm">
                          {p.product_name}
                          {isSplit && <span className="ml-2 text-[10px] text-emerald-300 bg-emerald-900/30 px-1.5 py-0.5 rounded">Final 50%</span>}
                        </span>
                        <div className="text-right">
                          <span className="font-mono text-emerald-300 font-bold text-sm">{qty.toFixed(1)} kg</span>
                          <span className="text-[10px] text-slate-400 block">total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* AI Explanation */}
          {result.explanation && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-emerald-600" /> AI Explanation
              </h3>
              <div className="prose prose-sm prose-slate prose-emerald max-w-none text-slate-700 font-medium">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.explanation}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white ${result.confidence_score >= 0.8 ? "bg-emerald-600" : result.confidence_score >= 0.6 ? "bg-amber-500" : "bg-red-500"}`}>
              {Math.round(result.confidence_score * 100)}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Confidence Score</p>
              <p className="text-xs text-slate-500">Based on STCR equations and soil data quality</p>
            </div>
          </div>

          <div className="flex gap-3 pb-16">
            <button
              onClick={() => setView("form")}
              className="flex-1 border border-slate-200 bg-white text-slate-600 font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-4 h-4" /> Recalculate
            </button>
            <button
              onClick={() => setView("overview")}
              className="flex-1 bg-emerald-800 text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
            >
              <CheckCircle className="w-4 h-4" /> Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
