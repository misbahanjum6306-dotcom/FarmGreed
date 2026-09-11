import React, { useState } from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import {
  ResourceCategory,
  CropStage,
  UrgencyLevel,
  WeatherRiskLevel,
  ResourceRequest,
} from '../types';
import { PriorityScoreCard } from './PriorityScoreCard';
import {
  Calendar,
  Clock,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Tractor,
  Layers,
  MapPin,
  FileText,
} from 'lucide-react';

const RESOURCE_CATALOG: Record<ResourceCategory, string[]> = {
  'Agricultural Machinery': ['Tractor', 'Harvester', 'Tiller', 'Seeder'],
  'Irrigation Equipment': ['Portable pump', 'Drip lines', 'Sprinkler set'],
  'Storage': ['Temporary solar storage', 'Cold storage'],
  'Transportation': ['Mini-truck', 'Trailer', 'Grain cart'],
  'Agricultural Labour': ['Sowing team', 'Weeding team', 'Harvesting team'],
  'Specialized Services': ['Drone spraying', 'Soil testing', 'Grafting'],
};

export const FarmerRequestForm: React.FC = () => {
  const { selectedFarmerId, farmers, submitRequest, isOffline } = useFarmGrid();
  const currentFarmer = farmers.find((f) => f.id === selectedFarmerId) || farmers[0];

  const [category, setCategory] = useState<ResourceCategory>('Agricultural Machinery');
  const [resourceType, setResourceType] = useState<string>('Tractor');
  const [date, setDate] = useState<string>('2026-09-11');
  const [earliestStart, setEarliestStart] = useState<string>('08:00');
  const [latestEnd, setLatestEnd] = useState<string>('12:00');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [cropStage, setCropStage] = useState<CropStage>(currentFarmer?.activeCropStage || 'critical_ripening');
  const [urgency, setUrgency] = useState<UrgencyLevel>('high');
  const [urgencyJustification, setUrgencyJustification] = useState<string>(
    'Critical weather forecast and ripening crop requires urgent machine intervention to avoid loss.'
  );
  const [weatherRisk, setWeatherRisk] = useState<WeatherRiskLevel>('moderate');
  const [weatherNote, setWeatherNote] = useState<string>('Localized rain predicted within next 24-36h');

  const [lastSubmittedRequest, setLastSubmittedRequest] = useState<ResourceRequest | null>(null);

  const handleCategoryChange = (newCat: ResourceCategory) => {
    setCategory(newCat);
    const subTypes = RESOURCE_CATALOG[newCat];
    if (subTypes && subTypes.length > 0) {
      setResourceType(subTypes[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = submitRequest({
      farmerId: currentFarmer.id,
      resourceCategory: category,
      resourceType,
      date,
      earliestStart,
      latestEnd,
      durationHours,
      cropStage,
      urgency,
      urgencyJustification,
      weatherRisk,
      weatherNote,
    });
    setLastSubmittedRequest(result);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-950 flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                <Tractor className="w-5 h-5 stroke-[2.5]" />
              </span>
              Agricultural Resource Request Form
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Submit short-window time-critical equipment and labour needs under regional scarcity.
            </p>
          </div>
          {isOffline && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs">
              Offline Queue Mode
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Farmer & Location Readonly Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100 p-4 rounded-xl border-2 border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Farmer Profile:</span>
              <div className="font-black text-slate-950 text-sm mt-0.5">
                {currentFarmer.name}
              </div>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" /> Farm Location:
              </span>
              <div className="font-black text-slate-950 text-sm mt-0.5">
                {currentFarmer.location.name} ({currentFarmer.village})
              </div>
            </div>
          </div>

          {/* Category & Specific Resource */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Agricultural Resource Category
              </label>
              <select
                id="req-category-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as ResourceCategory)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                {(Object.keys(RESOURCE_CATALOG) as ResourceCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Required Resource Type
              </label>
              <select
                id="req-type-select"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                {RESOURCE_CATALOG[category].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Window & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Operation Date
              </label>
              <input
                type="date"
                id="req-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Earliest Start Time
              </label>
              <input
                type="time"
                id="req-earliest-start"
                value={earliestStart}
                onChange={(e) => setEarliestStart(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Latest End Time
              </label>
              <input
                type="time"
                id="req-latest-end"
                value={latestEnd}
                onChange={(e) => setLatestEnd(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Duration (Hours)
              </label>
              <input
                type="number"
                id="req-duration-input"
                min="0.5"
                max="8"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                required
              />
            </div>
          </div>

          {/* Biological Crop Stage & Urgency Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Crop Biological Stage
              </label>
              <select
                id="req-cropstage-select"
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value as CropStage)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                <option value="immediate_harvest">Immediate Harvest (Perishable)</option>
                <option value="critical_ripening">Critical Ripening (Shattering Risk)</option>
                <option value="flowering">Flowering / Pollination Stage</option>
                <option value="sowing">Sowing / Nursery Bed Prep</option>
                <option value="vegetative">Vegetative Growth</option>
                <option value="land_prep">Land Preparation / Tillage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Urgency Level
              </label>
              <select
                id="req-urgency-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                <option value="critical">Critical (&lt; 12 Hours Emergency)</option>
                <option value="high">High (Within 24 Hours)</option>
                <option value="moderate">Moderate (24–48 Hours)</option>
                <option value="standard">Standard Planned Schedule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Weather Risk Exposure
              </label>
              <select
                id="req-weather-select"
                value={weatherRisk}
                onChange={(e) => setWeatherRisk(e.target.value as WeatherRiskLevel)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                <option value="severe">Severe (Heavy Rain/Hailstorm Imminent)</option>
                <option value="moderate">Moderate (Precipitation Expected in 24h)</option>
                <option value="low">Low (Light Breeze / Cloud)</option>
                <option value="none">None (Clear Sky / Stable)</option>
              </select>
            </div>
          </div>

          {/* Urgency Justification & Weather Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Urgency Justification (Required for priority audit)
              </label>
              <textarea
                id="req-justification-input"
                rows={2}
                value={urgencyJustification}
                onChange={(e) => setUrgencyJustification(e.target.value)}
                placeholder="Explain the agronomic consequence if allocation is delayed..."
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5">
                Local Meteorological Details / Risk Notes
              </label>
              <textarea
                id="req-weather-note-input"
                rows={2}
                value={weatherNote}
                onChange={(e) => setWeatherNote(e.target.value)}
                placeholder="e.g. IMD rain forecast, localized squall warning, soil saturation index..."
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              id="submit-farmer-request-btn"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-7 py-3 rounded-xl text-sm shadow-md shadow-emerald-700/25 flex items-center space-x-2 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>
                {isOffline ? 'Save to Offline Queue' : 'Submit & Calculate Priority'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Post-Submission Result Card */}
      {lastSubmittedRequest && (
        <div
          id="submission-result-panel"
          className="bg-white rounded-2xl border-2 border-emerald-500 shadow-xl p-6 bg-gradient-to-br from-white to-emerald-50/50"
        >
          <div className="flex items-start justify-between pb-4 border-b-2 border-emerald-200">
            <div>
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
                <span className="font-black text-slate-950 text-base">
                  Request Successfully Processed
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-black bg-slate-950 text-emerald-400">
                  {lastSubmittedRequest.id}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Processed by FarmGrid Deterministic Priority & Feasible Allocation Engine
              </p>
            </div>

            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-xs ${
                  lastSubmittedRequest.status === 'allocated'
                    ? 'bg-emerald-600 text-white'
                    : lastSubmittedRequest.status === 'conflict'
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                Status: {lastSubmittedRequest.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
            {/* Priority Score Breakdown */}
            <div>
              <PriorityScoreCard score={lastSubmittedRequest.priorityScore} />
            </div>

            {/* Allocation & Decision Details */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Allocation & Scheduling Verdict
                </h3>

                <div>
                  <span className="text-xs text-slate-500 font-bold">Assigned Resource:</span>
                  <div className="text-base font-black text-slate-950 mt-0.5">
                    {lastSubmittedRequest.assignedResourceName || (
                      <span className="text-amber-600">Pending Assignment / Conflict Review</span>
                    )}
                  </div>
                </div>

                {lastSubmittedRequest.allocatedSlot && (
                  <div className="bg-emerald-50 rounded-xl p-3.5 border-2 border-emerald-400 text-xs text-emerald-950">
                    <div className="font-black flex items-center gap-1.5 mb-1 text-emerald-950">
                      <Clock className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      Allocated Working Window: {lastSubmittedRequest.allocatedSlot.startTime} –{' '}
                      {lastSubmittedRequest.allocatedSlot.endTime}
                    </div>
                    <div className="text-emerald-800 font-semibold">
                      Inter-farm transit starts at{' '}
                      <strong className="font-black text-emerald-950">{lastSubmittedRequest.allocatedSlot.transitStartTime}</strong> (
                      {lastSubmittedRequest.allocatedSlot.transitMinutes}m travel buffer) + 15m prep buffer.
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs text-slate-500 font-bold">
                    Explanation of Decision:
                  </span>
                  <p className="text-xs text-slate-800 font-medium bg-slate-100 p-3 rounded-xl border border-slate-200 mt-1 leading-relaxed">
                    {lastSubmittedRequest.decisionExplanation}
                  </p>
                </div>
              </div>

              {lastSubmittedRequest.conflictDetails && (
                <div className="bg-rose-50 rounded-2xl border-2 border-rose-500 p-4 text-xs text-rose-950 space-y-2">
                  <div className="font-black flex items-center gap-1.5 text-rose-950 text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                    ⚠ Competing Overlapping Request Detected
                  </div>
                  <div className="font-semibold text-rose-900">
                    {lastSubmittedRequest.conflictDetails.resourceName} was contested during{' '}
                    {lastSubmittedRequest.conflictDetails.overlappingTime}.
                  </div>
                  {lastSubmittedRequest.conflictDetails.alternativeSlotSuggested && (
                    <div className="font-bold text-rose-950">
                      <strong>Feasible Alternative Slot:</strong>{' '}
                      {lastSubmittedRequest.conflictDetails.alternativeSlotSuggested}
                    </div>
                  )}
                  {lastSubmittedRequest.conflictDetails.alternativeResourceSuggested && (
                    <div className="font-bold text-rose-950">
                      <strong>Alternative Available Machine:</strong>{' '}
                      {lastSubmittedRequest.conflictDetails.alternativeResourceSuggested}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
