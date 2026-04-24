import React, { useState, useEffect } from "react";
import { Sprout, MapPin, Activity, Beaker, Play, Droplet, Bug, Loader2, History } from "lucide-react";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { api } from "@/lib/api";

function cn2(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function ScreenMyFarm() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFarmData = async () => {
      try {
        const res = await api.farmSummary();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFarmData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your farm stats...</p>
      </div>
    );
  }

  const farm = data || {
    farm_name: "Green Valley Farm",
    district: "Kanpur, UP",
    irrigation_type: "Tubewell",
    recent_recommendations: []
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 relative pb-6 px-4 pt-4 space-y-4">
       
       {/* Top Farm Info Card */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <img src="https://placehold.co/100x100/059669/ffffff?text=F" alt="Farm" className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100 shadow-sm" />
             <div>
                <h2 className="font-bold text-slate-800 text-lg">{farm.farm_name}</h2>
                <p className="text-slate-500 text-xs font-medium">{farm.district}</p>
             </div>
          </div>
          <div className="bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold rounded-lg border border-emerald-200">
             {farm.irrigation_type}
          </div>
       </div>

       {/* Farm Details Grid */}
       <div className="grid grid-cols-3 gap-2 py-2">
          <div className="flex flex-col items-center justify-center p-3 text-center border-r border-slate-200">
             <div className="flex items-center gap-1 mb-1">
                 <MapPin className="w-4 h-4 text-slate-500" />
                 <span className="font-bold text-slate-800 text-sm">2.5 Acres</span>
             </div>
             <span className="text-[10px] text-slate-500 font-medium">Total Area</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 text-center border-r border-slate-200">
             <div className="flex items-center gap-1 mb-1">
                 <Sprout className="w-4 h-4 text-emerald-600" />
                 <span className="font-bold text-slate-800 text-sm leading-tight text-left">Paddy, Wheat</span>
             </div>
             <span className="text-[10px] text-slate-500 font-medium">Crops</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 text-center">
             <div className="flex items-center gap-1 mb-1">
                 <Activity className="w-4 h-4 text-amber-500" />
                 <span className="font-bold text-slate-800 text-sm leading-tight text-left">Clay Loam</span>
             </div>
             <span className="text-[10px] text-slate-500 font-medium">Soil Type</span>
          </div>
       </div>

       {/* Stats Overview */}
       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-2 rounded-xl text-slate-700"><Activity className="w-5 h-5"/></div>
              <div>
                  <div className="font-bold text-slate-800 leading-none">1</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Fields</div>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Sprout className="w-5 h-5"/></div>
              <div>
                  <div className="font-bold text-slate-800 leading-none">2</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Crops</div>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Droplet className="w-5 h-5"/></div>
              <div>
                  <div className="font-bold text-emerald-600 leading-none">Good</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Water</div>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><Beaker className="w-5 h-5"/></div>
              <div>
                  <div className="font-bold text-emerald-600 leading-none">Good</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">Soil</div>
              </div>
           </div>
       </div>

       {/* Recent Recommendations */}
       <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 pb-2">
           <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Recommendation History</h3>
              <History className="w-4 h-4 text-slate-400" />
           </div>
           
           <div className="space-y-4">
              {farm.recent_recommendations.length > 0 ? (
                farm.recent_recommendations.map((rec: any) => (
                  <div key={rec.id} className="flex gap-4">
                     <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl h-fit border border-emerald-100">
                         <Beaker className="w-5 h-5"/>
                     </div>
                     <div className="flex-1 pb-4 border-b border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800">Soil Prescription Issued</h4>
                        <div className="flex gap-3 mt-1">
                           <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">N: {rec.n_kg}</span>
                           <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">P: {rec.p_kg}</span>
                           <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">K: {rec.k_kg}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {new Date(rec.created_at).toLocaleDateString()} at {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No recent prescriptions. Use the Fertilizer Advisor to get one!
                </div>
              )}
           </div>
           
           <button className="w-full text-center py-4 text-emerald-700 font-bold text-sm mt-2 border-t border-slate-100">
              View Detailed Labs
           </button>
       </div>

    </div>
  );
}
