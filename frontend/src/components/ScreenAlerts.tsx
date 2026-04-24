"use client";
import React, { useEffect, useState } from "react";
import {
  CloudRain, Droplet, Bug, X, BookOpen, ChevronRight, Loader2,
  RefreshCw, Thermometer, Snowflake, Wind, Sun, AlertTriangle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { api, Alert, AlertsResponse } from "@/lib/api";

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const REGION = "Kanpur, Uttar Pradesh";
const TABS = ["All", "Weather", "Pest", "Irrigation"] as const;
type Tab = (typeof TABS)[number];

function AlertIcon({ icon, color }: { icon: string; color: string }) {
  const base = "w-6 h-6";
  const colorMap: Record<string, string> = {
    blue: "text-blue-500", sky: "text-sky-500", red: "text-red-500",
    orange: "text-orange-500", green: "text-emerald-500", indigo: "text-indigo-500",
  };
  const cls = cn(base, colorMap[color] ?? "text-slate-500");
  switch (icon) {
    case "cloud-rain":   return <CloudRain className={cls} />;
    case "droplet":      return <Droplet className={cls} />;
    case "bug":          return <Bug className={cls} />;
    case "thermometer":  return <Thermometer className={cls} />;
    case "snowflake":    return <Snowflake className={cls} />;
    case "wind":         return <Wind className={cls} />;
    case "sun":          return <Sun className={cls} />;
    default:             return <AlertTriangle className={cls} />;
  }
}

function iconBgMap(color: string) {
  const map: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100",
    sky: "bg-sky-50 border-sky-100",
    red: "bg-red-50 border-red-100",
    orange: "bg-orange-50 border-orange-100",
    green: "bg-emerald-50 border-emerald-100",
    indigo: "bg-indigo-50 border-indigo-100",
  };
  return map[color] ?? "bg-slate-50 border-slate-100";
}

function titleColorMap(color: string) {
  const map: Record<string, string> = {
    blue: "text-blue-600", sky: "text-sky-600", red: "text-red-600",
    orange: "text-orange-600", green: "text-emerald-600", indigo: "text-indigo-600",
  };
  return map[color] ?? "text-slate-700";
}

export default function ScreenAlerts() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .alerts(REGION)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const dismiss = (id: string) => setDismissed((prev) => new Set([...prev, id]));

  const visible = (data?.alerts ?? []).filter(
    (a) =>
      !dismissed.has(a.id) &&
      (activeTab === "All" || a.type === activeTab)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tab Bar */}
      <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-400 font-medium">
            {loading ? "Updating…" : `${data?.total ?? 0} active alerts`}
          </span>
          <button
            onClick={load}
            className="p-1.5 rounded-full text-slate-400 hover:text-emerald-600 transition"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 border",
                activeTab === tab
                  ? "bg-emerald-900 border-emerald-900 text-white shadow-md shadow-emerald-900/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Generating agronomy alerts…</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {!loading && visible.length === 0 && !error && (
          <div className="text-center py-16 text-slate-400 font-medium text-sm">
            No {activeTab !== "All" ? activeTab.toLowerCase() : ""} alerts at this time. ✅
          </div>
        )}

        {visible.map((alert: Alert) => (
          <div key={alert.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative">
            <button
              onClick={() => dismiss(alert.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-4">
              <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center shrink-0", iconBgMap(alert.color))}>
                <AlertIcon icon={alert.icon} color={alert.color} />
              </div>
              <div className="pr-4">
                <h4 className={cn("font-bold", titleColorMap(alert.color))}>{alert.title}</h4>
                <p className="text-sm text-slate-700 mt-1 mb-2 leading-snug">{alert.message}</p>
                <p className="text-[10px] font-bold text-slate-400">{alert.timestamp}</p>
              </div>
            </div>
          </div>
        ))}

        {!loading && data && data.total > 0 && (
          <button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition">
            View All Notifications
            <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
              {data.total}
            </span>
          </button>
        )}

        {/* Knowledge Center Link */}
        <div className="mt-4 border border-slate-200 rounded-3xl bg-white p-5 flex items-center justify-between cursor-pointer group hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Knowledge Center</h4>
              <p className="text-xs text-slate-500 font-medium">
                Learn best farming practices,
                <br />
                expert tips and more.
              </p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition" />
        </div>

        <div className="pb-16"></div>
      </div>
    </div>
  );
}
