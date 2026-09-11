import React from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import {
  AlertTriangle,
  CloudLightning,
  XCircle,
  RefreshCcw,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Tractor,
} from 'lucide-react';

export const SimulationCenter: React.FC = () => {
  const {
    triggerDisruption,
    resetDisruptions,
    activeDisruption,
    disruptions,
  } = useFarmGrid();

  return (
    <div
      id="simulation-center"
      className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </span>
            <h2 className="text-base font-black text-slate-950">
              Dynamic Disruption & Dynamic Reallocation Center
            </h2>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Test resilience under agricultural operational shocks. The automated scheduling engine
            identifies affected allocations, recalculates priorities, and generates revised schedules.
          </p>
        </div>

        {activeDisruption && (
          <button
            onClick={resetDisruptions}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-black text-white self-start sm:self-auto cursor-pointer shadow-md transition-colors"
          >
            <RefreshCcw className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
            <span>Reset Baseline</span>
          </button>
        )}
      </div>

      {/* Simulation Action Buttons with Bold Palette */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Button 1: Machine Breakdown */}
        <button
          id="btn-simulate-breakdown"
          onClick={() => triggerDisruption('machine_breakdown')}
          className="p-4 rounded-2xl border-2 border-rose-500 bg-rose-50/70 hover:bg-rose-100 text-left transition-all group cursor-pointer shadow-md shadow-rose-900/10 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-xs">
              <Tractor className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-rose-600 text-white shadow-xs">
              Hardware Shock
            </span>
          </div>
          <h3 className="font-black text-slate-950 text-sm group-hover:text-rose-700 transition-colors">
            Simulate Machine Breakdown
          </h3>
          <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
            Mahindra Tractor 01 suffers hydraulic failure. System auto-reallocates Anita Patil to
            Swaraj Tractor 02 without delay.
          </p>
        </button>

        {/* Button 2: Heavy Rain */}
        <button
          id="btn-simulate-rain"
          onClick={() => triggerDisruption('heavy_rain')}
          className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/70 hover:bg-blue-100 text-left transition-all group cursor-pointer shadow-md shadow-blue-900/10 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
              <CloudLightning className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-blue-600 text-white shadow-xs">
              Weather Shock
            </span>
          </div>
          <h3 className="font-black text-slate-950 text-sm group-hover:text-blue-700 transition-colors">
            Simulate Heavy Rain
          </h3>
          <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
            Severe storm triggers. System halts drone spraying, shifts priority scores, and prioritizes
            emergency paddy drainage.
          </p>
        </button>

        {/* Button 3: Cancellation / Early Release */}
        <button
          id="btn-simulate-cancellation"
          onClick={() => triggerDisruption('cancellation')}
          className="p-4 rounded-2xl border-2 border-purple-500 bg-purple-50/70 hover:bg-purple-100 text-left transition-all group cursor-pointer shadow-md shadow-purple-900/10 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-xs">
              <XCircle className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-purple-600 text-white shadow-xs">
              Schedule Release
            </span>
          </div>
          <h3 className="font-black text-slate-950 text-sm group-hover:text-purple-700 transition-colors">
            Simulate Early Release
          </h3>
          <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
            Sunita Devi finishes threshing early. Baldev Singh dynamically promoted forward from
            the waiting queue immediately.
          </p>
        </button>
      </div>

      {/* Disruption & Side-by-Side Reallocation Log */}
      {activeDisruption ? (
        <div className="bg-slate-950 text-white rounded-2xl p-6 border-2 border-emerald-500 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-black text-sm text-emerald-400">
                ✓ Dynamic Schedule Reallocation Applied
              </span>
            </div>
            <span className="text-xs text-slate-300 font-bold">
              Disruption Event: <strong className="text-white px-2 py-0.5 bg-slate-800 rounded">{activeDisruption.title}</strong>
            </span>
          </div>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {activeDisruption.description}
          </p>

          {/* Side by Side Comparison (BEFORE vs DISRUPTION vs AFTER) */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              Automated Reallocation Audit:
            </div>

            {activeDisruption.reallocations.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900 rounded-xl p-4 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
              >
                {/* BEFORE */}
                <div className="bg-slate-950 p-3.5 rounded-xl border-2 border-slate-700">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    BEFORE ALLOCATION
                  </div>
                  <div className="font-black text-white text-sm">{item.farmerName}</div>
                  <div className="text-slate-300 mt-1 font-semibold">
                    Resource: <strong className="text-white">{item.before.resourceName}</strong>
                  </div>
                  <div className="text-slate-400 mt-0.5 font-bold">
                    Slot: {item.before.timeWindow}
                  </div>
                </div>

                {/* DISRUPTION */}
                <div className="bg-rose-950/80 p-3.5 rounded-xl border-2 border-rose-600">
                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-400 mb-1">
                    DISRUPTION CAUSE
                  </div>
                  <div className="font-black text-rose-100 text-sm">
                    {item.disruptionReason}
                  </div>
                  <div className="text-rose-300 text-[11px] mt-1 font-semibold">
                    Halted baseline schedule execution
                  </div>
                </div>

                {/* AFTER */}
                <div className="bg-emerald-950/80 p-3.5 rounded-xl border-2 border-emerald-500">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">
                    AFTER: REALLOCATED PLAN
                  </div>
                  <div className="font-black text-emerald-300 text-sm">{item.farmerName}</div>
                  <div className="text-slate-200 mt-1 font-semibold">
                    Resource: <strong className="text-emerald-400 font-black">{item.after.resourceName}</strong>
                  </div>
                  <div className="text-slate-200 mt-0.5 font-bold">
                    Slot: <strong className="text-emerald-300">{item.after.timeWindow}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-200 mt-1 font-medium italic">
                    {item.explanation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-xs text-emerald-950 font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 stroke-[2.5]" />
            <span>
              Baseline system operating normally. Click any simulation button above to trigger an
              agricultural disruption and watch the dynamic reallocation engine in action.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
