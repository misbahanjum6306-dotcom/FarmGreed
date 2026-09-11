import React from 'react';
import { PriorityBreakdown } from '../types';
import { Award, AlertTriangle, CloudRain, Clock, MapPin, Cpu, CheckCircle2 } from 'lucide-react';

interface PriorityScoreCardProps {
  score: PriorityBreakdown;
  compact?: boolean;
}

export const PriorityScoreCard: React.FC<PriorityScoreCardProps> = ({ score, compact = false }) => {
  const getBadgeColor = (total: number) => {
    if (total >= 80) return 'bg-rose-600 text-white shadow-xs';
    if (total >= 60) return 'bg-amber-500 text-slate-950 shadow-xs';
    if (total >= 40) return 'bg-blue-600 text-white shadow-xs';
    return 'bg-emerald-600 text-white shadow-xs';
  };

  const getPriorityLabel = (total: number) => {
    if (total >= 80) return 'Critical Priority';
    if (total >= 60) return 'High Priority';
    if (total >= 40) return 'Moderate Priority';
    return 'Standard Priority';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <span
          className={`px-3 py-1 text-xs font-black rounded-lg ${getBadgeColor(
            score.totalScore
          )}`}
        >
          {score.totalScore}/100 • {getPriorityLabel(score.totalScore)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">
            Deterministic Allocation Score
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-4xl font-black text-slate-950 tracking-tight">{score.totalScore}</span>
            <span className="text-sm font-bold text-slate-500">/ 100</span>
          </div>
        </div>
        <div
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${getBadgeColor(
            score.totalScore
          )}`}
        >
          {getPriorityLabel(score.totalScore)}
        </div>
      </div>

      <div className="mt-5 space-y-3.5">
        <div className="text-xs font-black text-slate-800 uppercase tracking-wider">Scoring Factor Breakdown:</div>

        {/* 1. Urgency / Deadline Proximity */}
        <div>
          <div className="flex justify-between text-xs text-slate-700 mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[2.5]" />
              Urgency / Deadline Proximity
            </span>
            <span className="font-extrabold text-slate-900">{score.urgencyScore} / 25 pts</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(score.urgencyScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* 2. Weather Risk Exposure */}
        <div>
          <div className="flex justify-between text-xs text-slate-700 mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-600 stroke-[2.5]" />
              Weather Risk Exposure
            </span>
            <span className="font-extrabold text-slate-900">{score.weatherRiskScore} / 25 pts</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(score.weatherRiskScore / 25) * 100}%` }}
            />
          </div>
        </div>

        {/* 3. Crop Readiness / Biological Stage */}
        <div>
          <div className="flex justify-between text-xs text-slate-700 mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              Crop Readiness / Biological Stage
            </span>
            <span className="font-extrabold text-slate-900">{score.cropStageScore} / 20 pts</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(score.cropStageScore / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* 4. Queue Waiting Time */}
        <div>
          <div className="flex justify-between text-xs text-slate-700 mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600 stroke-[2.5]" />
              Queue Waiting Time
            </span>
            <span className="font-extrabold text-slate-900">{score.queueWaitingScore} / 15 pts</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(score.queueWaitingScore / 15) * 100}%` }}
            />
          </div>
        </div>

        {/* 5. Distance & Logistics Overhead */}
        <div>
          <div className="flex justify-between text-xs text-slate-700 mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-600 stroke-[2.5]" />
              Distance & Logistics Overhead
            </span>
            <span className="font-extrabold text-slate-900">{score.distanceScore} / 10 pts</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-orange-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(score.distanceScore / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* 6. Resource Constraints */}
        <div>
          <div className="flex justify-between text-xs text-slate-700 mb-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
              Resource Scarcity & Constraints
            </span>
            <span className="font-extrabold text-slate-900">
              {score.resourceConstraintsScore} / 5 pts
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${(score.resourceConstraintsScore / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {score.reasons && score.reasons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Transparent Decision Factors:
          </div>
          <ul className="space-y-1.5">
            {score.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5 mt-0.5 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
