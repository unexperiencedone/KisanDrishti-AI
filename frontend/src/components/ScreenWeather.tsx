"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  MapPin, Sun, CloudRain, Droplets, Wind, Cloud, 
  CloudLightning, Loader2, Sunrise, Sunset, 
  Thermometer, Activity, Navigation, BookOpen, AlertTriangle
} from "lucide-react";
import { api, WeatherForecast, WeatherDay, wmoToIcon, WeatherResponse } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const REGION = "Kanpur, Uttar Pradesh";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function WeatherIcon({ code, className = "" }: { code: number; className?: string }) {
  const type = wmoToIcon(code);
  if (type === "sun") return <Sun className={className + " text-amber-400 fill-amber-200"} />;
  if (type === "rain") return <CloudRain className={className + " text-sky-500 fill-sky-200"} />;
  if (type === "storm") return <CloudLightning className={className + " text-indigo-500"} />;
  return <Cloud className={className + " text-slate-400 fill-slate-100"} />;
}

function wmoLabel(code: number) {
  if (code === 0) return "Clear Sky";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  return "Thunderstorm";
}

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

function dayLabel(dateStr: string, i: number) {
  if (i === 0) return "Today";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ScreenWeather() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = api.getWeatherCached(REGION);
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    api.weather(REGION)
      .then((r) => setData(r))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const forecast = data?.weather_forecast;
  const today = forecast?.daily?.[0];

  const chartData = useMemo(() => {
    if (!forecast?.today_hourly) return [];
    return forecast.today_hourly.map(h => ({
      time: formatTime(h.time),
      temp: h.temp,
      precip: h.precip_mm,
      humidity: h.humidity || 0,
      wind: h.wind_speed || 0,
    }));
  }, [forecast]);

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <div className="text-center">
            <p className="text-lg font-bold text-slate-700">Analyzing Atmosphere</p>
            <p className="text-sm text-slate-400">Fetching high-res global weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-20">

        {/* 1. Hero Summary Card */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Sun className="w-32 h-32 rotate-12" />
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold tracking-tight mb-6 animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> LIVE STATION: {REGION}
            </div>

            <div className="flex items-center justify-center gap-6 mb-2">
               <WeatherIcon code={today?.weather_code ?? 0} className="w-20 h-20 drop-shadow-xl" />
               <div>
                  <h2 className="text-6xl font-black text-slate-800 tracking-tighter">
                    {Math.round(today?.temp_max ?? 31)}<span className="text-slate-300 text-4xl font-light">°</span>
                  </h2>
                  <p className="text-lg font-bold text-emerald-600 -mt-1">{wmoLabel(today?.weather_code ?? 0)}</p>
               </div>
            </div>
            <p className="text-slate-400 text-xs font-medium">Feels like {Math.round((today?.temp_max ?? 31) - 2)}°C • Clear Sky</p>
          </div>

          {/* Detailed Row */}
          <div className="grid grid-cols-4 gap-2 mt-8 pt-6 border-t border-slate-50">
             <div className="text-center">
                <div className="flex justify-center mb-1"><Droplets className="w-4 h-4 text-sky-500"/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Rain Prob</p>
                <p className="font-bold text-slate-800 text-xs">{today?.precip_prob_pct}%</p>
             </div>
             <div className="text-center">
                <div className="flex justify-center mb-1"><Wind className="w-4 h-4 text-slate-500"/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Wind</p>
                <p className="font-bold text-slate-800 text-xs">{chartData[0]?.wind} km/h</p>
             </div>
             <div className="text-center">
                <div className="flex justify-center mb-1"><Activity className="w-4 h-4 text-amber-500"/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Humidity</p>
                <p className="font-bold text-slate-800 text-xs">{chartData[0]?.humidity}%</p>
             </div>
             <div className="text-center">
                <div className="flex justify-center mb-1"><Sun className="w-4 h-4 text-orange-400"/></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">UV Index</p>
                <p className="font-bold text-slate-800 text-xs">High</p>
             </div>
          </div>
        </motion.div>

        {/* 2. Sunrise/Sunset Logic */}
        <div className="flex gap-3">
           <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                 <Sunrise className="w-5 h-5"/>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Sunrise</p>
                 <p className="text-sm font-black text-slate-800">5:42 AM</p>
              </div>
           </div>
           <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                 <Sunset className="w-5 h-5"/>
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Sunset</p>
                 <p className="text-sm font-black text-slate-800">6:32 PM</p>
              </div>
           </div>
        </div>

        {/* 3. Charts: 48-Hour Temperature */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Thermometer className="w-4 h-4 text-red-500" /> Temperature Graph
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded italic">48-Hour Outlook</span>
           </div>
           <div className="h-48 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="time" 
                    interval={6} 
                    fontSize={10} 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '10px', color: '#64748b' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTemp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 4. AI Analysis Advisory */}
        {data?.ai_report && (
          <div className="bg-emerald-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <BookOpen className="w-24 h-24 rotate-12" />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-emerald-300" />
                   </div>
                   <h3 className="font-bold text-emerald-400 uppercase tracking-widest text-[10px]">KisanDrishti AI Analysis</h3>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-emerald-50/90 leading-relaxed font-medium">
                   <ReactMarkdown>{data.ai_report}</ReactMarkdown>
                </div>
             </div>
          </div>
        )}

        {/* 5. Charts: Wind & Humidity */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Wind className="w-4 h-4 text-sky-500" /> Wind & Humidity
              </h3>
           </div>
           <div className="h-40 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="time" 
                    interval={8} 
                    fontSize={10} 
                    tick={{fill: '#94a3b8'}} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="humidity" fill="#e2e8f0" radius={[4,4,0,0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.humidity > 80 ? '#0ea5e9' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
           <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
              <div className="text-center px-4">
                 <p className="text-[10px] font-bold text-slate-400">Peak Wind</p>
                 <p className="text-sm font-black text-slate-800">{Math.max(...chartData.map(d => d.wind))} km/h</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center px-4">
                 <p className="text-[10px] font-bold text-slate-400">Avg Humidity</p>
                 <p className="text-sm font-black text-slate-800">{Math.round(chartData.reduce((a,b)=>a+b.humidity, 0)/chartData.length)}%</p>
              </div>
           </div>
        </div>

        {/* 6. 7-Day Forecast Row */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">10-Day Outlook</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Scroll Right →</span>
           </div>
           <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {forecast?.daily.map((day, i) => (
                <div key={day.date} className="bg-white min-w-[100px] p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                   <p className="text-[10px] font-bold text-slate-400 mb-2">{dayLabel(day.date, i)}</p>
                   <WeatherIcon code={day.weather_code} className="w-8 h-8 mb-3" />
                   <div className="space-y-0.5">
                      <p className="text-sm font-black text-slate-800 leading-none">{Math.round(day.temp_max)}°</p>
                      <p className="text-[10px] font-bold text-slate-400">{Math.round(day.temp_min)}°</p>
                   </div>
                   {day.precipitation_mm > 0 && (
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded italic">
                         <Droplets className="w-2.5 h-2.5" />{day.precipitation_mm}mm
                      </div>
                   )}
                </div>
              ))}
           </div>
        </div>

        {/* Safe Window Alert */}
        {today?.safe_hours && today.safe_hours !== "Not Safe" && today.safe_hours !== "Unknown" && (
          <div className="bg-sky-50 rounded-3xl p-5 border border-sky-100 flex gap-4 items-center">
            <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-lg">
               <Activity className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sky-900 text-sm">Recommended Spray Window</h4>
              <p className="text-xs text-sky-700 font-medium leading-relaxed">
                Conditions are safe for spraying between <span className="font-black underline">{today.safe_hours}</span> today.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
