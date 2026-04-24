import React from "react";
import { Sprout, Bug, Beaker, FileText, ChevronRight } from "lucide-react";

export default function ScreenCropHealth() {
  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-6">
       
       <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          
          <div className="flex items-center justify-between mb-2">
             <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">Paddy (Rice) <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> <span className="text-emerald-600 text-sm">2.5 Acres</span></h3>
                <p className="text-xs text-slate-500 font-medium">Last Updated: 2nd July 2026</p>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-row gap-6 items-center">
             <div className="w-32 h-32 relative shrink-0">
                {/* SVG Donut Chart */}
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                   <path
                     className="text-slate-100"
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="3.5"
                   />
                   <path
                     className="text-emerald-500"
                     strokeDasharray="72, 100"
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="3.5"
                     strokeLinecap="round"
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-4xl font-extrabold text-slate-800 tracking-tighter -mt-1">72</span>
                   <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">Crop Health<br/>(Good)</span>
                </div>
             </div>
             
             <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-600">Nitrogen (N)</span>
                   <span className="font-bold text-emerald-600">Adequate</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-600">Phosphorus (P)</span>
                   <span className="font-bold text-emerald-600">Adequate</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-600">Potassium (K)</span>
                   <span className="font-bold text-emerald-600">Adequate</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-600">Organic Matter</span>
                   <span className="font-bold text-emerald-600">High</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-600">pH Level</span>
                   <span className="font-bold text-slate-800 text-[11px]">6.7 <span className="text-slate-400 font-medium">(Slightly Acidic)</span></span>
                </div>
             </div>
          </div>

          <div>
             <h3 className="font-bold text-slate-800 text-lg mb-3">AI Recommendation</h3>
             <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium mb-5">
                   Crop health is good. Continue balanced fertilization and maintain proper water management for best yields.
                </p>
                <button className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition text-sm flex items-center justify-center gap-2">
                   View Detailed Report
                </button>
             </div>
          </div>

          <div>
             <h3 className="font-bold text-slate-800 text-lg mb-3">Recommended Actions</h3>
             <div className="grid grid-cols-4 gap-2">
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                   <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center">
                      <Beaker className="w-5 h-5 text-emerald-600" />
                   </div>
                   <p className="text-[10px] font-bold text-slate-700 leading-tight">Apply Urea<br/><span className="text-slate-500">20 kg/acre</span></p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                   <div className="bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center">
                      <Beaker className="w-5 h-5 text-emerald-600" />
                   </div>
                   <p className="text-[10px] font-bold text-slate-700 leading-tight">Apply DAP<br/><span className="text-slate-500">15 kg/acre</span></p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                   <div className="bg-amber-50 w-10 h-10 rounded-xl flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-amber-600" />
                   </div>
                   <p className="text-[10px] font-bold text-slate-700 leading-tight">Organic Manure<br/><span className="text-slate-500">1 ton/acre</span></p>
                </div>
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                   <div className="bg-orange-50 w-10 h-10 rounded-xl flex items-center justify-center">
                      <Bug className="w-5 h-5 text-orange-500" />
                   </div>
                   <p className="text-[10px] font-bold text-slate-700 leading-tight">Pest Control<br/><span className="text-emerald-600">Recommended</span></p>
                </div>
             </div>
          </div>
          
          <div className="pb-16"></div>
       </div>

    </div>
  );
}
