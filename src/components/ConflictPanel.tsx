import React from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import { detectAllConflicts } from '../utils/scheduler';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Tractor,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ConflictPanel: React.FC = () => {
  const { requests, resources, resolveConflict } = useFarmGrid();

  const { conflicts } = detectAllConflicts(requests, resources);
  const conflictRequests = requests.filter((r) => r.status === 'conflict');

  if (conflicts.length === 0 && conflictRequests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-sm">
        <div className="flex items-center space-x-2.5 text-emerald-800">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h2 className="text-base font-black">No Active Resource Conflicts</h2>
        </div>
        <p className="text-xs font-semibold text-slate-600 mt-2">
          All equipment allocations are non-overlapping with strictly validated inter-farm transit buffers.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-rose-500 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-rose-200">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-950">
              ⚠ Active Resource Conflicts Detected
            </h2>
            <p className="text-xs text-rose-700 font-bold mt-0.5">
              Overlapping physical resource requests prevented double booking. Non-FCFS priority
              arbitration enforced.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
          {conflicts.length + conflictRequests.length} Contested
        </span>
      </div>

      <div className="space-y-4">
        {conflictRequests.map((req) => (
          <div
            key={req.id}
            className="bg-rose-50 rounded-xl border-2 border-rose-300 p-4 space-y-3 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-black text-rose-950 text-sm">{req.resourceType} Overlap</span>
                <span className="text-rose-400 font-bold">•</span>
                <span className="font-bold text-slate-800">
                  Farmer: <strong className="text-slate-950">{req.farmerName}</strong> ({req.farmLocation.village})
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-black text-white bg-rose-600 px-2.5 py-1 rounded-md shadow-xs">
                  Score: {req.priorityScore.totalScore}/100
                </span>
                <span className="text-xs font-bold text-slate-600">vs Primary Lock (Score 94)</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3.5 border-2 border-rose-200 text-slate-800 space-y-1">
              <div className="font-black text-rose-900 text-xs">Conflict Explanation:</div>
              <p className="text-xs leading-relaxed text-slate-700 font-medium">
                {req.decisionExplanation}
              </p>
            </div>

            {req.conflictDetails && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-700">
                  <div>
                    <strong className="text-slate-900">Suggested Subsequent Slot:</strong>{' '}
                    <span className="text-emerald-700 font-black">
                      {req.conflictDetails.alternativeSlotSuggested}
                    </span>
                  </div>
                  {req.conflictDetails.alternativeResourceSuggested && (
                    <div className="mt-1">
                      <strong className="text-slate-900">Suggested Alternative Machine:</strong>{' '}
                      <span className="text-slate-950 font-black">
                        {req.conflictDetails.alternativeResourceSuggested}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {req.conflictDetails.alternativeSlotSuggested && (
                    <button
                      onClick={() => resolveConflict(req.id, 'accept_alt_slot')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                    >
                      Accept Feasible Shift
                    </button>
                  )}
                  <button
                    onClick={() => resolveConflict(req.id, 'assign_alt_resource')}
                    className="bg-slate-950 hover:bg-slate-800 text-white font-black px-3.5 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                  >
                    Assign Swaraj Tractor 02
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
