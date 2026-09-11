import React, { useState } from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import { FarmerRequestForm } from './FarmerRequestForm';
import { PriorityScoreCard } from './PriorityScoreCard';
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  FilePlus,
  ListOrdered,
  UserCheck,
  ChevronRight,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react';

export const FarmerView: React.FC = () => {
  const {
    selectedFarmerId,
    farmers,
    requests,
    bookings,
    resolveConflict,
    resources,
  } = useFarmGrid();

  const [activeSubTab, setActiveSubTab] = useState<'new_request' | 'my_requests' | 'my_profile'>('new_request');
  const [selectedReqForModal, setSelectedReqForModal] = useState<string | null>(null);

  const currentFarmer = farmers.find((f) => f.id === selectedFarmerId) || farmers[0];

  // Requests submitted by this farmer
  const farmerRequests = requests.filter((r) => r.farmerId === currentFarmer.id);
  const farmerBookings = bookings.filter((b) => b.farmerId === currentFarmer.id);

  return (
    <div className="space-y-6">
      {/* Farmer Summary Banner */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-700/25">
              {currentFarmer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-black text-slate-950">{currentFarmer.name}</h1>
                <span className="text-xs font-black px-3 py-0.5 rounded-full bg-slate-950 text-emerald-400 shadow-xs">
                  Farmer Portal
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1 font-semibold">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  {currentFarmer.location.name} • {currentFarmer.village}
                </span>
                <span>•</span>
                <span>
                  Holding: <strong className="text-slate-900 font-black">{currentFarmer.landAreaAcres} Acres</strong>
                </span>
                <span>•</span>
                <span>
                  Crop: <strong className="text-slate-900 font-black">{currentFarmer.primaryCrop}</strong>
                </span>
                <span>•</span>
                <span className="capitalize">
                  Stage: <strong className="text-emerald-700 font-black">{currentFarmer.activeCropStage.replace('_', ' ')}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border-2 border-slate-200 self-start md:self-auto gap-1">
            <button
              id="subtab-new-request"
              onClick={() => setActiveSubTab('new_request')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
                activeSubTab === 'new_request'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <FilePlus className="w-4 h-4 stroke-[2.5]" />
              <span>New Request</span>
            </button>
            <button
              id="subtab-my-requests"
              onClick={() => setActiveSubTab('my_requests')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
                activeSubTab === 'my_requests'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <ListOrdered className="w-4 h-4 stroke-[2.5]" />
              <span>My Requests ({farmerRequests.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: New Request Form */}
      {activeSubTab === 'new_request' && <FarmerRequestForm />}

      {/* Tab 2: My Requests & Allocations */}
      {activeSubTab === 'my_requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Active Resource Requests & Allocations
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Deterministic priority scheduling • Non-first-come-first-served
            </span>
          </div>

          {farmerRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center text-slate-500">
              <p className="text-sm font-bold">No requests submitted yet for this farmer.</p>
              <button
                onClick={() => setActiveSubTab('new_request')}
                className="mt-3 text-xs font-black text-emerald-600 hover:underline cursor-pointer"
              >
                Submit your first agricultural resource request →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {farmerRequests.map((req) => (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-sm ${
                    req.status === 'conflict'
                      ? 'border-rose-500 bg-rose-50/30'
                      : req.status === 'allocated'
                      ? 'border-emerald-500'
                      : 'border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-slate-950 text-emerald-400 shadow-xs">
                        {req.id}
                      </span>
                      <span className="font-black text-slate-950 text-sm">
                        {req.resourceCategory}: {req.resourceType}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">• {req.date}</span>
                      {req.syncStatus === 'pending_sync' && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 shadow-xs">
                          Pending Sync
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <PriorityScoreCard score={req.priorityScore} compact />
                      <span
                        className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider shadow-xs ${
                          req.status === 'allocated'
                            ? 'bg-emerald-600 text-white'
                            : req.status === 'conflict'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 text-xs">
                    {/* Column 1: Time Window & Agronomics */}
                    <div className="space-y-1.5 text-slate-700 font-medium">
                      <div>
                        <span className="text-slate-500 font-bold">Requested Window:</span>{' '}
                        <strong className="text-slate-950 font-black">
                          {req.earliestStart} – {req.latestEnd} ({req.durationHours}h)
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Crop Stage:</span>{' '}
                        <span className="capitalize font-bold text-slate-800">
                          {req.cropStage.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Urgency:</span>{' '}
                        <span className="capitalize font-bold text-slate-800">{req.urgency}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold">Weather Risk:</span>{' '}
                        <span className="capitalize font-bold text-slate-800">
                          {req.weatherRisk}
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Allocation & Resource */}
                    <div className="space-y-1.5 text-slate-700 font-medium">
                      <div>
                        <span className="text-slate-500 font-bold">Assigned Resource:</span>{' '}
                        <strong className="text-slate-950 font-black">
                          {req.assignedResourceName || 'Pending / Unallocated'}
                        </strong>
                      </div>
                      {req.allocatedSlot ? (
                        <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl border-2 border-emerald-400">
                          <div>
                            Allocated Slot:{' '}
                            <strong className="font-black text-emerald-800">
                              {req.allocatedSlot.startTime} – {req.allocatedSlot.endTime}
                            </strong>
                          </div>
                          <div className="text-[11px] text-emerald-800 font-bold mt-1">
                            Transit depart: {req.allocatedSlot.transitStartTime} (
                            {req.allocatedSlot.transitMinutes}m travel buffer)
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 font-semibold italic">No slot locked yet.</div>
                      )}
                    </div>

                    {/* Column 3: Decision Explanation & Transparent Why */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200 space-y-1">
                      <div className="font-black text-slate-800 flex items-center justify-between">
                        <span>Why this priority & decision?</span>
                        <span className="text-emerald-700 font-black text-xs">
                          {req.priorityScore.totalScore}/100
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-xs font-medium">
                        {req.decisionExplanation}
                      </p>
                    </div>
                  </div>

                  {/* Conflict Notice & Resolution Actions */}
                  {req.status === 'conflict' && req.conflictDetails && (
                    <div className="mt-4 pt-3 border-t-2 border-rose-300 bg-rose-50 p-4 rounded-xl border-2 border-rose-400 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-black text-rose-950 text-sm flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                          ⚠ Resource Conflict Detected: {req.conflictDetails.resourceName}
                        </div>
                        <div className="text-rose-800 text-xs font-semibold mt-1">
                          Competing request from {req.conflictDetails.conflictingFarmerName} during{' '}
                          {req.conflictDetails.overlappingTime}. Competing request prioritized due to
                          higher urgency & weather risk score.
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {req.conflictDetails.alternativeSlotSuggested && (
                          <button
                            id={`accept-alt-slot-${req.id}`}
                            onClick={() => resolveConflict(req.id, 'accept_alt_slot')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                          >
                            Accept {req.conflictDetails.alternativeSlotSuggested}
                          </button>
                        )}
                        {req.conflictDetails.alternativeResourceSuggested && (
                          <button
                            id={`accept-alt-resource-${req.id}`}
                            onClick={() => resolveConflict(req.id, 'assign_alt_resource')}
                            className="bg-slate-950 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-xl text-xs shadow-md cursor-pointer transition-colors"
                          >
                            Switch to Alternative Machine
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
