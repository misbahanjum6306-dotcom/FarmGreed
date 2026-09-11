import React, { useState } from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import { MasterCalendar } from './MasterCalendar';
import { SimulationCenter } from './SimulationCenter';
import { ConflictPanel } from './ConflictPanel';
import { FarmLogisticsMap } from './FarmLogisticsMap';
import { DecisionModal } from './DecisionModal';
import { ResourceRequest } from '../types';
import {
  Users,
  Tractor,
  Clock,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  Eye,
  BarChart3,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    farmers,
    resources,
    requests,
    bookings,
    disruptions,
    resolveConflict,
  } = useFarmGrid();

  const [auditRequest, setAuditRequest] = useState<ResourceRequest | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Summary Metrics
  const totalFarmers = farmers.length;
  const totalResources = resources.length;
  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const allocatedRequests = requests.filter((r) => r.status === 'allocated').length;
  const activeConflicts = requests.filter((r) => r.status === 'conflict').length;
  const disruptedResources = resources.filter((r) => r.status === 'disrupted').length;

  // Priority Distribution
  const highPriorityCount = requests.filter((r) => r.priorityScore.totalScore >= 80).length;
  const medPriorityCount = requests.filter(
    (r) => r.priorityScore.totalScore >= 50 && r.priorityScore.totalScore < 80
  ).length;
  const lowPriorityCount = requests.filter((r) => r.priorityScore.totalScore < 50).length;

  // Filtered requests list
  const filteredRequests = requests.filter((r) => {
    if (filterCategory !== 'all' && r.resourceCategory !== filterCategory) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Farmers */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-4 shadow-lg shadow-emerald-950/20 border border-emerald-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-100 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Farmers</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{totalFarmers}</div>
          <div className="text-[11px] font-semibold text-emerald-200 mt-1">Marginal & Smallholders</div>
        </div>

        {/* Card 2: Total Resources */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-4 shadow-lg shadow-blue-950/20 border border-blue-500/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-100 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Resources</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/40 flex items-center justify-center">
              <Tractor className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{totalResources}</div>
          <div className="text-[11px] font-semibold text-blue-200 mt-1">Machinery & Services</div>
        </div>

        {/* Card 3: Pending Requests */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 text-white rounded-2xl p-4 shadow-lg shadow-amber-950/20 border border-amber-400/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-100 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-400/40 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{pendingRequests}</div>
          <div className="text-[11px] font-semibold text-amber-100 mt-1">Awaiting Slot Match</div>
        </div>

        {/* Card 4: Allocated Requests */}
        <div className="bg-gradient-to-br from-teal-600 via-emerald-700 to-green-800 text-white rounded-2xl p-4 shadow-lg shadow-teal-950/20 border border-teal-400/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-teal-100 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider">Allocated</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/40 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{allocatedRequests}</div>
          <div className="text-[11px] font-semibold text-teal-100 mt-1">Locked in Schedule</div>
        </div>

        {/* Card 5: Active Conflicts */}
        <div
          className={`rounded-2xl p-4 shadow-lg border relative overflow-hidden text-white ${
            activeConflicts > 0
              ? 'bg-gradient-to-br from-rose-600 via-red-600 to-rose-800 border-rose-400 shadow-rose-950/30'
              : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 shadow-slate-900/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              Conflicts
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{activeConflicts}</div>
          <div className="text-[11px] font-semibold text-rose-100 mt-1">Overlaps Prevented</div>
        </div>

        {/* Card 6: Disrupted Resources */}
        <div
          className={`rounded-2xl p-4 shadow-lg border relative overflow-hidden text-white ${
            disruptedResources > 0
              ? 'bg-gradient-to-br from-purple-600 via-indigo-700 to-purple-800 border-purple-400 shadow-purple-950/30'
              : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-slate-900/20'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              Disrupted
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">{disruptedResources}</div>
          <div className="text-[11px] font-semibold text-purple-100 mt-1">
            {disruptedResources > 0 ? 'Auto-Reallocated' : 'Zero Breakdowns'}
          </div>
        </div>
      </div>

      {/* 2. Simulation Center (Clearly visible in Admin Dashboard) */}
      <SimulationCenter />

      {/* 3. Conflict Detection Panel */}
      <ConflictPanel />

      {/* 4. Priority Score Distribution Visualization */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Deterministic Priority Spectrum (Non-First-Come-First-Served)
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400">
            Urgency (25) + Weather (25) + Crop (20) + Queue (15) + Distance (10) + Scarcity (5)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="bg-rose-600 text-white rounded-xl p-4 shadow-md shadow-rose-900/20">
            <div className="flex justify-between font-black text-white text-sm">
              <span>Critical Priority (80–100)</span>
              <span className="bg-white text-rose-700 px-2 py-0.5 rounded-full text-xs font-black">{highPriorityCount} Requests</span>
            </div>
            <p className="text-xs text-rose-100 mt-2 font-medium leading-relaxed">
              Imminent harvest perishability or severe storm risk. Given immediate non-preemptable resource lock.
            </p>
          </div>

          <div className="bg-amber-500 text-slate-950 rounded-xl p-4 shadow-md shadow-amber-900/20">
            <div className="flex justify-between font-black text-slate-950 text-sm">
              <span>High Priority (50–79)</span>
              <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full text-xs font-black">{medPriorityCount} Requests</span>
            </div>
            <p className="text-xs text-slate-900 mt-2 font-medium leading-relaxed">
              Ripening crops, moderate weather, or queue wait. Scheduled within flexible buffer windows.
            </p>
          </div>

          <div className="bg-blue-600 text-white rounded-xl p-4 shadow-md shadow-blue-900/20">
            <div className="flex justify-between font-black text-white text-sm">
              <span>Standard Priority (&lt;50)</span>
              <span className="bg-white text-blue-800 px-2 py-0.5 rounded-full text-xs font-black">{lowPriorityCount} Requests</span>
            </div>
            <p className="text-xs text-blue-100 mt-2 font-medium leading-relaxed">
              Preparatory tillage or flexible window. Scheduled during non-peak operational windows.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Master Feasible Schedule & Transit Timeline */}
      <MasterCalendar />

      {/* 6. Farm & Resource Logistics Map */}
      <FarmLogisticsMap />

      {/* 7. Master Request Coordination Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Master Requests & Allocations Registry ({filteredRequests.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review deterministic scores, detect overlaps, and audit transparent decision trails.
            </p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center space-x-2 text-xs">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Agricultural Machinery">Machinery</option>
              <option value="Irrigation Equipment">Irrigation</option>
              <option value="Specialized Services">Specialized</option>
              <option value="Transportation">Transportation</option>
              <option value="Storage">Storage</option>
              <option value="Agricultural Labour">Labour</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="allocated">Allocated</option>
              <option value="conflict">Conflict</option>
              <option value="pending">Pending</option>
              <option value="disrupted">Disrupted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">Farmer</th>
                <th className="py-3 px-3">Resource Requested</th>
                <th className="py-3 px-3">Requested Window</th>
                <th className="py-3 px-3">Priority Score</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assigned Resource</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Farmer */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{req.farmerName}</div>
                    <div className="text-[11px] text-slate-500">{req.farmLocation.village}</div>
                  </td>

                  {/* Resource */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{req.resourceType}</div>
                    <div className="text-[10px] text-slate-500">{req.resourceCategory}</div>
                  </td>

                  {/* Requested Time */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-800">
                      {req.earliestStart} – {req.latestEnd}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {req.durationHours}h • {req.date}
                    </div>
                  </td>

                  {/* Priority Score */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-black text-xs shadow-xs ${
                          req.priorityScore.totalScore >= 80
                            ? 'bg-rose-600 text-white'
                            : req.priorityScore.totalScore >= 50
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {req.priorityScore.totalScore}/100
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs ${
                        req.status === 'allocated'
                          ? 'bg-emerald-600 text-white'
                          : req.status === 'conflict'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : req.status === 'disrupted'
                          ? 'bg-purple-600 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>

                  {/* Assigned Resource */}
                  <td className="py-3 px-3">
                    {req.assignedResourceName ? (
                      <div>
                        <div className="font-extrabold text-slate-900">{req.assignedResourceName}</div>
                        {req.allocatedSlot && (
                          <div className="text-[11px] text-emerald-800 font-bold">
                            Slot: {req.allocatedSlot.startTime}–{req.allocatedSlot.endTime} (
                            {req.allocatedSlot.transitMinutes}m transit buffer)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-medium italic">Pending Allocation</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        id={`audit-btn-${req.id}`}
                        onClick={() => setAuditRequest(req)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-xs transition-colors"
                        title="Audit transparent decision trail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit</span>
                      </button>

                      {req.status === 'conflict' && (
                        <button
                          onClick={() => resolveConflict(req.id, 'assign_alt_resource')}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer transition-colors"
                        >
                          Resolve Overlap
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Resource Fleet Availability Matrix */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Tractor className="w-5 h-5 text-emerald-600" />
          Regional Resource Fleet Status Matrix ({resources.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {resources.map((res) => (
            <div
              key={res.id}
              className={`p-4 rounded-xl border-2 text-xs flex flex-col justify-between transition-all ${
                res.status === 'disrupted'
                  ? 'bg-rose-50 border-rose-500 shadow-sm shadow-rose-500/10'
                  : res.status === 'maintenance'
                  ? 'bg-amber-50 border-amber-500 shadow-sm shadow-amber-500/10'
                  : res.status === 'booked'
                  ? 'bg-blue-50 border-blue-500 shadow-sm shadow-blue-500/10'
                  : 'bg-emerald-50 border-emerald-500 shadow-sm shadow-emerald-500/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    {res.category.split(' ')[0]}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                      res.status === 'disrupted'
                        ? 'bg-rose-600 text-white'
                        : res.status === 'maintenance'
                        ? 'bg-amber-500 text-slate-950'
                        : res.status === 'booked'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
                <div className="font-black text-slate-900 text-sm">{res.name}</div>
                <div className="text-[11px] font-semibold text-slate-700 mt-1">{res.location.name}</div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-300 flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>
                  Window: {res.operatingWindow.startHour}:00–{res.operatingWindow.endHour}:00
                </span>
                {res.hourlyRateEst && <span className="text-emerald-800 font-extrabold">₹{res.hourlyRateEst}/hr</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Audit Modal */}
      <DecisionModal request={auditRequest} onClose={() => setAuditRequest(null)} />
    </div>
  );
};
