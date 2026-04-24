"use client";
import React, { useEffect, useState } from "react";
import {
  MapPin, Droplets, Wind, CloudLightning, ChevronRight,
  Sun, CloudRain, Cloud, Loader2
} from "lucide-react";
import { api, WeatherForecast, wmoToIcon } from "@/lib/api";

const REGION = "Kanpur, Uttar Pradesh";

const tools = [
  { id: "weather",            title: "Weather Forecast",       emoji: "🌤️", url: "weather" },
  { id: "crop-health",        title: "Crop Health",            emoji: "🌾", url: "crop-health" },
  { id: "soil-health",        title: "Soil Health",            emoji: "🪱", url: "my-farm" },
  { id: "fertilizer-advisor", title: "Fertilizer Advisor",     emoji: "🧪", url: "fertilizer-advisor" },
  { id: "irrigation-advisor", title: "Irrigation Advisor",     emoji: "💧", url: "my-farm" },
  { id: "pest-detection",     title: "Pest Detection",         emoji: "🐛", url: "my-farm" },
  { id: "market-prices",      title: "Market Prices",          emoji: "📈", url: "market-prices" },
  { id: "iot-dashboard",      title: "IoT Dashboard",          emoji: "📡", url: "iot-dashboard" },
  { id: "alerts",             title: "Alerts",                 emoji: "🔔", url: "alerts", badge: true },
  { id: "more",               title: "More Tools",             emoji: "⋯", url: "home" },
];

function WeatherMiniIcon({ code }: { code: number }) {
  const type = wmoToIcon(code);
  if (type === "sun")   return <Sun className="w-12 h-12 text-amber-400 fill-amber-200" />;
  if (type === "rain")  return <CloudRain className="w-12 h-12 text-sky-400 fill-sky-100" />;
  return <Cloud className="w-12 h-12 text-slate-400 fill-slate-100" />;
}

function advisoryMessage(forecast: WeatherForecast | null): string {
  if (!forecast?.daily?.length) return "Stay updated on weather and market conditions for better farm planning.";
  const today = forecast.daily[0];
  const tomorrow = forecast.daily[1];
  const rain = tomorrow?.precipitation_mm ?? 0;
  const prob = tomorrow?.precip_prob_pct ?? 0;
  if (rain > 15) return "Heavy rainfall expected tomorrow. Avoid fertilizer application — high runoff risk.";
  if (rain > 5 || prob > 50) return "Moderate rain expected in next 24 hours. Good time to plan for post-rain top-dressing.";
  if ((today?.temp_max ?? 30) > 38) return "High temperatures today. Irrigate early morning or evening to reduce crop heat stress.";
  return "No heavy rainfall in next 48 hours. Good time for irrigation and fertilization. Weather window is optimal.";
}

export default function ScreenHome({ navigate }: { navigate: (screen: string) => void }) {
  const cached = api.getWeatherCached(REGION);
  const [forecast, setForecast] = useState<WeatherForecast | null>(cached ? cached.weather_forecast : null);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    // Fetch weather for widget (uses internal cache check)
    api.weather(REGION)
      .then((r) => setForecast(r.weather_forecast))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch alert count for badge (always fresh is fine, or we could cache too)
    api.alerts(REGION)
      .then((r) => setAlertCount(r.total))
      .catch(() => {});
  }, []);

  const today = forecast?.daily?.[0];
  const advisory = advisoryMessage(forecast);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const now = new Date().toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", weekday: "long",
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 pb-6">
      <div className="p-4 space-y-4">

        {/* Welcome Card */}
        <div className="bg-emerald-800 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-700 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none" />
          <h2 className="text-xl font-bold mb-1 relative z-10">
            {greeting}, Ramesh Kumar! 👋
          </h2>
          <p className="text-emerald-100 text-xs mb-4 relative z-10">
            Here's what's happening on your farm today.
          </p>
          <div className="flex justify-between items-end relative z-10">
            <p className="text-emerald-200 text-xs font-medium">{now}</p>
            <div className="flex items-center gap-1 text-emerald-200 text-xs bg-emerald-900/50 px-2 py-1 rounded-full border border-emerald-700">
              <MapPin className="w-3 h-3" /> Kanpur, UP
            </div>
          </div>
        </div>

        {/* Live Weather Widget */}
        <div
          className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition"
          onClick={() => navigate("weather")}
        >
          {loading ? (
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Loading weather…</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <WeatherMiniIcon code={today?.weather_code ?? 0} />
                <div>
                  <p className="text-3xl font-bold leading-none tracking-tighter text-slate-800">
                    {Math.round(today?.temp_max ?? 31)}°C
                  </p>
                  <p className="text-sm text-amber-500 font-bold mt-0.5">
                    {today
                      ? today.precipitation_mm > 5
                        ? "Rainy"
                        : today.temp_max > 36
                        ? "Hot & Dry"
                        : "Sunny"
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-slate-100 pl-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  Rain Prob: {today?.precip_prob_pct ?? 0}%
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  Min: {Math.round(today?.temp_min ?? 22)}°C
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <CloudLightning className="w-3.5 h-3.5 text-slate-400" />
                  Rain: {today?.precipitation_mm ?? 0} mm
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tools Grid */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <div className="grid grid-cols-5 gap-3">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => navigate(tool.url)}
                className="flex flex-col items-center gap-1.5 relative group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl transition group-hover:bg-emerald-50 group-hover:scale-95 relative border border-slate-100">
                  {tool.emoji}
                  {tool.badge && alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-white">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-semibold text-slate-600 text-center leading-tight px-0.5">
                  {tool.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Advisory Banner — driven by real weather */}
        <div
          className="bg-emerald-900 rounded-3xl p-5 text-white flex items-center justify-between relative overflow-hidden shadow-lg cursor-pointer"
          onClick={() => navigate("ai-advisor")}
        >
          <div className="relative z-10 w-3/4">
            <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              AI Advisory for You
            </p>
            <p className="text-sm font-medium leading-relaxed mb-4">{advisory}</p>
            <button className="bg-white text-emerald-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-50 transition">
              View Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute -bottom-3 -right-4 w-28 h-28 opacity-30 pointer-events-none">
            <img
              src="/logo.jpeg"
              alt=""
              className="w-full h-full object-cover rounded-full"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
