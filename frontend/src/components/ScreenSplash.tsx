import React from "react";
import { Sprout, Wifi, BarChart3, ChevronRight } from "lucide-react";

export default function ScreenSplash({ navigate }: { navigate: (screen: string) => void }) {
  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-emerald-50 via-white to-transparent opacity-60 pointer-events-none" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        <div className="w-32 h-32 bg-white rounded-full p-2 shadow-2xl shadow-emerald-900/10 mb-8 border border-emerald-50">
          <img
            src="/logo.jpeg"
            alt="KisanDrishti Logo"
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/200x200/059669/ffffff?text=KD+AI";
            }}
          />
        </div>

        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">
          KisanDrishti <span className="text-emerald-600">AI</span>
        </h1>
        <div className="flex items-center gap-4 w-full px-12 opacity-50 mb-8">
          <div className="h-px bg-slate-300 flex-1"></div>
          <span className="text-slate-500 font-medium text-sm whitespace-nowrap">From Guesswork to Smart Farming</span>
          <div className="h-px bg-slate-300 flex-1"></div>
        </div>

        <div className="grid grid-cols-3 gap-6 w-full mb-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center mb-3">
              <Sprout className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 leading-tight">AI-Powered<br/>Crop Advisory</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center mb-3">
              <Wifi className="w-6 h-6 text-slate-800" />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 leading-tight">IoT Sensor<br/>Data Insights</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-600 leading-tight">Scientific<br/>Recommendations</span>
          </div>
        </div>
      </div>

      <div className="p-8 pb-12 z-10 w-full">
        <button
          onClick={() => navigate("home")}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all text-lg mb-6"
        >
          Get Started <ChevronRight className="w-5 h-5" />
        </button>

        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-center gap-4 text-center">
          <div className="w-8 h-8 bg-emerald-800 text-amber-400 font-bold flex items-center justify-center rounded">
            RS
          </div>
          <div className="text-left">
            <p className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">Powered by</p>
            <p className="text-sm font-bold text-slate-800">RS GreenGrow</p>
            <p className="text-[10px] text-emerald-700 font-medium">Growing Together for Tomorrow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
