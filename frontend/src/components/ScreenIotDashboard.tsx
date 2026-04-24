import React from "react";
import { Droplet, ThermometerSun, Wind, CloudRain, Clock, Activity, Signal } from "lucide-react";

export default function ScreenIotDashboard() {
  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-6">
       
       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
           
           <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Live Field Data</h3>
              <p className="text-xs text-slate-500 font-medium">Last Updated: 09:30 AM</p>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                 
                 {/* Soil Moisture */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                    <p className="text-slate-500 text-xs font-semibold mb-3">Soil Moisture</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                       <Droplet className="w-8 h-8 text-sky-500" />
                       <span className="text-3xl font-bold text-slate-800 tracking-tighter">32%</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                       <Clock className="w-3 h-3" /> Optimal
                    </div>
                 </div>

                 {/* Soil Temperature */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                    <p className="text-slate-500 text-xs font-semibold mb-3">Soil Temperature</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                       <ThermometerSun className="w-8 h-8 text-rose-500" />
                       <span className="text-3xl font-bold text-slate-800 tracking-tighter">27°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                       <Clock className="w-3 h-3" /> Normal
                    </div>
                 </div>

                 {/* Air Temperature */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                    <p className="text-slate-500 text-xs font-semibold mb-3">Air Temperature</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                       <CloudRain className="w-8 h-8 text-blue-400" />
                       <span className="text-3xl font-bold text-slate-800 tracking-tighter">31°C</span>
                    </div>
                    <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-[10px] font-bold border border-red-100">
                       <Activity className="w-3 h-3" /> Hot
                    </div>
                 </div>

                 {/* Humidity */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                    <p className="text-slate-500 text-xs font-semibold mb-3">Humidity</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                       <Droplet className="w-8 h-8 text-sky-400 fill-sky-200" />
                       <span className="text-3xl font-bold text-slate-800 tracking-tighter">46%</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                       <Clock className="w-3 h-3" /> Normal
                    </div>
                 </div>

                 {/* Rainfall */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                    <p className="text-slate-500 text-xs font-semibold mb-3">Rainfall</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                       <CloudRain className="w-8 h-8 text-indigo-500 fill-indigo-200" />
                       <span className="text-3xl font-bold text-slate-800 tracking-tighter">0 mm</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200">
                       + Today
                    </div>
                 </div>

                 {/* Sunlight */}
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
                    <p className="text-slate-500 text-xs font-semibold mb-3">Sunlight</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                       <ThermometerSun className="w-8 h-8 text-amber-500 fill-amber-200" />
                       <span className="text-2xl font-bold text-slate-800 tracking-tighter">670 lux</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200">
                       <Activity className="w-3 h-3" /> High
                    </div>
                 </div>
                 
              </div>
           </div>

           <div>
              <h3 className="font-bold text-slate-800 text-lg mb-4">Device Status</h3>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                 <div className="flex justify-between items-center p-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-50 rounded-xl"><Droplet className="w-5 h-5 text-slate-600" /></div>
                       <span className="font-bold text-slate-800 text-sm">Soil Moisture Sensor</span>
                    </div>
                    <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Online</span>
                 </div>
                 <div className="flex justify-between items-center p-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-50 rounded-xl"><Signal className="w-5 h-5 text-slate-600" /></div>
                       <span className="font-bold text-slate-800 text-sm">Weather Station</span>
                    </div>
                    <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Online</span>
                 </div>
                 <div className="flex justify-between items-center p-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-50 rounded-xl"><CloudRain className="w-5 h-5 text-slate-600" /></div>
                       <span className="font-bold text-slate-800 text-sm">Rain Gauge</span>
                    </div>
                    <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Online</span>
                 </div>
                 <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-50 rounded-xl"><Wind className="w-5 h-5 text-slate-600" /></div>
                       <span className="font-bold text-slate-800 text-sm">Wind Sensor</span>
                    </div>
                    <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Online</span>
                 </div>
              </div>
           </div>

           <button className="w-full bg-emerald-900 text-white font-bold py-4 rounded-xl shadow-lg mt-2 mb-20 hover:bg-emerald-800 transition">
              View All Devices
           </button>

       </div>
    </div>
  );
}
