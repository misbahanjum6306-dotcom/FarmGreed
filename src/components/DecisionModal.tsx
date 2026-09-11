import React from 'react';
import { ResourceRequest } from '../types';
import { PriorityScoreCard } from './PriorityScoreCard';
import { CheckCircle2, X, Info, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DecisionModalProps {
  request: ResourceRequest | null;
  onClose: () => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({ request, onClose }) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Transparent Allocation & Priority Audit
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Request ID: <strong className="text-slate-800">{request.id}</strong> • Farmer:{' '}
              <strong className="text-slate-800">{request.farmerName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Why was this farmer prioritized? Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              Decision Rationale: Why was this request evaluated at this priority?
            </h3>
            <p className="text-xs text-emerald-900 leading-relaxed font-medium mb-3">
              {request.decisionExplanation}
            </p>

            <div className="text-xs font-semibold text-emerald-950 mb-1.5">
              Key Contributing Factors:
            </div>
            <ul className="space-y-1 text-xs text-emerald-900">
              {request.priorityScore.reasons.map((r, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Numerical Scorecard */}
          <div>
            <PriorityScoreCard score={request.priorityScore} />
          </div>

          {/* Allocation & Logistics Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 text-sm">Scheduled Logistics Parameters:</div>
            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400">Assigned Resource:</span>{' '}
                <strong className="text-slate-800">
                  {request.assignedResourceName || 'Unassigned / Pending'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Operation Date:</span>{' '}
                <strong className="text-slate-800">{request.date}</strong>
              </div>
              <div>
                <span className="text-slate-400">Time Window:</span>{' '}
                <strong className="text-slate-800">
                  {request.allocatedSlot
                    ? `${request.allocatedSlot.startTime} – ${request.allocatedSlot.endTime}`
                    : `${request.earliestStart} – ${request.latestEnd}`}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Transit & Buffer:</span>{' '}
                <strong className="text-slate-800">
                  {request.allocatedSlot
                    ? `${request.allocatedSlot.transitMinutes}m transit + 15m buffer`
                    : 'Estimated 30m'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
