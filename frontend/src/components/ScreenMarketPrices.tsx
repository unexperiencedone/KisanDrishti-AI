"use client";
import React, { useEffect, useState } from "react";
import { MapPin, TrendingUp, TrendingDown, Minus, ChevronDown, Mic, Loader2, RefreshCw } from "lucide-react";
import { api, CommodityPrice, MarketPricesResponse } from "@/lib/api";

const REGION = "Kanpur, Uttar Pradesh";

function TrendBadge({ trend, change }: { trend: string; change: number }) {
  if (trend === "up")
    return (
      <span className="font-bold text-sm text-right flex items-center justify-end gap-1 text-emerald-600">
        <TrendingUp className="w-4 h-4" />
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  if (trend === "down")
    return (
      <span className="font-bold text-sm text-right flex items-center justify-end gap-1 text-red-500">
        <TrendingDown className="w-4 h-4" />
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  return (
    <span className="font-bold text-sm text-right flex items-center justify-end gap-1 text-slate-400">
      <Minus className="w-4 h-4" /> —
    </span>
  );
}

export default function ScreenMarketPrices({ navigate }: { navigate: (screen: string) => void }) {
  const [data, setData] = useState<MarketPricesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .marketPrices(REGION)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const asOf = data?.as_of
    ? new Date(data.as_of).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-6">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* Region + Refresh */}
        <div className="flex justify-between items-center">
          <button className="bg-white border text-slate-700 border-slate-200 px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> {REGION}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={load}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-700 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Source & Timestamp */}
        {data && (
          <p className="text-[10px] text-slate-400 font-medium -mt-2 text-right">
            {data.source} • Updated {asOf}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Fetching mandi prices…</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Prices Table */}
        {data && !loading && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-500 uppercase">Commodity</div>
              <div className="text-xs font-bold text-slate-500 uppercase text-center">₹/Quintal</div>
              <div className="text-xs font-bold text-slate-500 uppercase text-right">Change</div>
            </div>

            {data.commodities.map((item: CommodityPrice, idx: number) => (
              <div
                key={idx}
                className={`grid grid-cols-3 px-4 py-4 items-center ${
                  idx !== data.commodities.length - 1 ? "border-b border-slate-50" : ""
                }`}
              >
                <div className="font-bold text-slate-800 text-sm pr-2">{item.commodity}</div>
                <div className="font-mono font-bold text-slate-700 text-center text-sm">
                  ₹{item.price.toLocaleString("en-IN")}
                </div>
                <TrendBadge trend={item.trend} change={item.change_pct} />
              </div>
            ))}

            <div className="px-4 pb-4 pt-2">
              <button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition">
                <TrendingUp className="w-5 h-5" /> View Market Trends
              </button>
            </div>
          </div>
        )}

        {/* AI Advisor Quick-Chat */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg mb-3">AI Advisor</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 space-y-4">
            <div className="flex gap-3">
              <img
                src="/logo.jpeg"
                alt="AI"
                className="w-10 h-10 rounded-full border border-slate-200"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 border border-slate-100 flex-1">
                <h3 className="font-bold text-slate-800 text-sm mb-0.5">Hi Ramesh! 👋</h3>
                <p className="text-slate-600 text-[11px] leading-tight font-medium">
                  I'm your AI farming advisor.
                  <br />
                  How can I help you today?
                </p>
              </div>
            </div>

            <div className="flex justify-end max-w-[85%] ml-auto">
              <div className="bg-emerald-900 text-white rounded-2xl rounded-tr-none p-3 shadow-sm">
                <p className="text-[11px] font-medium leading-tight">
                  What is the best fertilizer for paddy crop?
                </p>
              </div>
            </div>

            <div className="max-w-[90%]">
              <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 border border-slate-100">
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  For paddy at tillering stage, apply Urea 20 kg/acre and DAP 15 kg/acre. Ensure proper
                  irrigation after fertilization.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("ai-advisor")}
              className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 text-emerald-800 font-bold py-3 rounded-full shadow-sm hover:bg-slate-50 transition text-sm"
            >
              <Mic className="w-4 h-4 text-emerald-600" /> Talk to AI Advisor
            </button>
          </div>
        </div>

        <div className="pb-16"></div>
      </div>
    </div>
  );
}
