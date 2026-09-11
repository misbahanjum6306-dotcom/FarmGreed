import React, { useState } from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import { ResourceItem, Booking, ResourceRequest } from '../types';
import { timeStrToDecimal } from '../utils/scheduler';
import {
  Calendar,
  Clock,
  Truck,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Info,
} from 'lucide-react';

const TIMELINE_START = 7; // 07:00
const TIMELINE_END = 19; // 19:00
const TOTAL_HOURS = TIMELINE_END - TIMELINE_START;

export const MasterCalendar: React.FC = () => {
  const { resources, bookings, requests } = useFarmGrid();
  const [selectedBlock, setSelectedBlock] = useState<{
    title: string;
    farmer?: string;
    resource: string;
    time: string;
    type: string;
    notes?: string;
  } | null>(null);

  // Generate hour markers: 7, 8, 9, ... 19
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => TIMELINE_START + i);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Master Feasible Schedule & Inter-Farm Transit Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Synchronized timeline showing work windows, inter-farm travel buffers, and equipment availability.
          </p>
        </div>

        {/* Legend with bold badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-extrabold shadow-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Allocated Work</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-extrabold shadow-xs flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Transit Buffer</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-extrabold shadow-xs flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Conflict / Shock</span>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-700 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Available</span>
          </span>
        </div>
      </div>

      {/* Selected Block Info Banner */}
      {selectedBlock && (
        <div className="bg-slate-950 text-white p-4 rounded-xl border-2 border-emerald-500 flex items-center justify-between text-xs animate-in fade-in duration-200 shadow-lg">
          <div className="flex items-center space-x-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 stroke-[2.5]" />
            <div>
              <span className="font-black text-emerald-400 mr-2 text-sm">{selectedBlock.title}:</span>
              <span className="font-bold">{selectedBlock.resource}</span>
              {selectedBlock.farmer && <span> • Farmer: <strong className="text-emerald-300">{selectedBlock.farmer}</strong></span>}
              <span className="text-slate-300 ml-2 font-semibold">({selectedBlock.time})</span>
              {selectedBlock.notes && <span className="text-slate-300 ml-2 italic">— {selectedBlock.notes}</span>}
            </div>
          </div>
          <button
            onClick={() => setSelectedBlock(null)}
            className="text-slate-400 hover:text-white font-black ml-3 px-2 py-1 bg-slate-800 rounded-lg hover:bg-slate-700"
          >
            ✕ Close
          </button>
        </div>
      )}

      {/* Timeline Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px] space-y-3">
          {/* Header Hour Markers */}
          <div className="flex border-b border-slate-300 pb-2 pl-44 text-xs font-black text-slate-600">
            {hours.map((h) => (
              <div key={h} className="flex-1 text-left">
                {h < 10 ? `0${h}:00` : `${h}:00`}
              </div>
            ))}
          </div>

          {/* Resource Lanes */}
          {resources.map((res) => {
            const resBookings = bookings.filter(
              (b) => b.resourceId === res.id && b.status !== 'disrupted'
            );
            const resConflicts = requests.filter(
              (r) => r.assignedResourceId === res.id && r.status === 'conflict'
            );

            const isDisrupted = res.status === 'disrupted';
            const isMaintenance = res.status === 'maintenance';

            return (
              <div key={res.id} className="flex items-center group">
                {/* Resource Title Column */}
                <div className="w-44 pr-3 shrink-0">
                  <div className="font-black text-slate-900 text-xs truncate" title={res.name}>
                    {res.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate flex items-center justify-between mt-0.5">
                    <span className="font-bold text-slate-600">{res.category.split(' ')[0]}</span>
                    <span
                      className={`font-black uppercase text-[9px] px-1.5 py-0.2 rounded ${
                        isDisrupted
                          ? 'bg-rose-600 text-white'
                          : isMaintenance
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>
                </div>

                {/* Timeline Track */}
                <div className="flex-1 relative h-13 bg-slate-100 rounded-xl border-2 border-slate-300 overflow-hidden flex items-center">
                  {/* Subtle hourly vertical lines */}
                  {hours.map((h, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-l border-slate-300/80 pointer-events-none"
                      style={{
                        left: `${((h - TIMELINE_START) / TOTAL_HOURS) * 100}%`,
                      }}
                    />
                  ))}

                  {/* Disrupted Resource Overlay */}
                  {isDisrupted && (
                    <div
                      onClick={() =>
                        setSelectedBlock({
                          title: 'Resource Disrupted',
                          resource: res.name,
                          time: 'All Shift',
                          type: 'disrupted',
                          notes: res.maintenanceReason || 'Mechanical breakdown during operations',
                        })
                      }
                      className="absolute inset-0 bg-rose-600 text-white flex items-center justify-center cursor-pointer text-xs font-black gap-2 z-10 shadow-inner"
                    >
                      <AlertTriangle className="w-4 h-4 stroke-[3]" />
                      <span>{res.maintenanceReason || 'Equipment Breakdown – Operations Halted'}</span>
                    </div>
                  )}

                  {/* Maintenance Overlay */}
                  {isMaintenance && (
                    <div
                      onClick={() =>
                        setSelectedBlock({
                          title: 'Under Maintenance',
                          resource: res.name,
                          time: 'Scheduled Maintenance',
                          type: 'maintenance',
                          notes: res.maintenanceReason || 'Routine servicing & recalibration',
                        })
                      }
                      className="absolute inset-0 bg-amber-500 text-slate-950 flex items-center justify-center cursor-pointer text-xs font-black gap-2 z-10 shadow-inner"
                    >
                      <Wrench className="w-4 h-4 stroke-[3]" />
                      <span>{res.maintenanceReason || 'Scheduled Maintenance Hold'}</span>
                    </div>
                  )}

                  {/* Bookings & Transits */}
                  {!isDisrupted &&
                    !isMaintenance &&
                    resBookings.map((b) => {
                      const startDec = timeStrToDecimal(b.startTime);
                      const endDec = timeStrToDecimal(b.endTime);
                      const transitDec = timeStrToDecimal(b.transitStartTime);

                      // Transit block
                      const transitLeft = ((transitDec - TIMELINE_START) / TOTAL_HOURS) * 100;
                      const transitWidth = ((startDec - transitDec) / TOTAL_HOURS) * 100;

                      // Work block
                      const workLeft = ((startDec - TIMELINE_START) / TOTAL_HOURS) * 100;
                      const workWidth = ((endDec - startDec) / TOTAL_HOURS) * 100;

                      return (
                        <React.Fragment key={b.id}>
                          {/* Transit / Travel Buffer */}
                          {transitWidth > 0 && (
                            <div
                              onClick={() =>
                                setSelectedBlock({
                                  title: 'Inter-Farm Transit Buffer',
                                  farmer: b.farmerName,
                                  resource: res.name,
                                  time: `${b.transitStartTime} – ${b.startTime}`,
                                  type: 'transit',
                                  notes: `${b.transitMinutes} mins transit to ${b.farmLocation.village}`,
                                })
                              }
                              style={{
                                left: `${Math.max(0, transitLeft)}%`,
                                width: `${Math.max(2, transitWidth)}%`,
                              }}
                              className="absolute top-1 bottom-1 bg-amber-400 hover:bg-amber-300 border-l-4 border-amber-600 rounded-l text-slate-950 font-black text-[10px] flex items-center justify-center cursor-pointer shadow-md z-1 transition-all"
                              title={`Transit Buffer: ${b.transitStartTime} - ${b.startTime} (${b.transitMinutes}m)`}
                            >
                              <Truck className="w-3.5 h-3.5 text-slate-950" />
                            </div>
                          )}

                          {/* Allocated Work Window */}
                          <div
                            onClick={() =>
                              setSelectedBlock({
                                title: 'Allocated Work Window',
                                farmer: b.farmerName,
                                resource: res.name,
                                time: `${b.startTime} – ${b.endTime}`,
                                type: 'work',
                                notes: `Crop: ${b.cropStage.replace('_', ' ')} • Priority Score: ${b.priorityScore}/100`,
                              })
                            }
                            style={{
                              left: `${Math.max(0, workLeft)}%`,
                              width: `${Math.max(4, workWidth)}%`,
                            }}
                            className="absolute top-1 bottom-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-2.5 rounded-r border-l-4 border-emerald-300 flex items-center justify-between cursor-pointer shadow-md z-2 transition-transform hover:scale-[1.01]"
                            title={`Work: ${b.farmerName} (${b.startTime} - ${b.endTime})`}
                          >
                            <span className="truncate mr-1">{b.farmerName}</span>
                            <span className="text-[10px] text-emerald-100 font-bold shrink-0">
                              {b.startTime}–{b.endTime}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })}

                  {/* Conflicting overlay if any */}
                  {resConflicts.map((c) => {
                    const cStart = timeStrToDecimal(c.earliestStart);
                    const cEnd = cStart + c.durationHours;
                    const cLeft = ((cStart - TIMELINE_START) / TOTAL_HOURS) * 100;
                    const cWidth = ((cEnd - cStart) / TOTAL_HOURS) * 100;

                    return (
                      <div
                        key={c.id}
                        onClick={() =>
                          setSelectedBlock({
                            title: 'Contested Request / Overlap',
                            farmer: c.farmerName,
                            resource: res.name,
                            time: `${c.earliestStart} – ${c.latestEnd}`,
                            type: 'conflict',
                            notes: `Competing claim on ${res.name}. Non-FCFS score: ${c.priorityScore.totalScore}/100. Double booking prevented.`,
                          })
                        }
                        style={{
                          left: `${Math.max(0, cLeft)}%`,
                          width: `${Math.max(4, cWidth)}%`,
                        }}
                        className="absolute top-2 bottom-2 bg-rose-600 border-2 border-white text-white rounded-lg text-[10px] font-black px-2 flex items-center justify-center cursor-pointer z-3 animate-pulse shadow-lg"
                        title={`⚠ Conflict: ${c.farmerName} overlapping request`}
                      >
                        ⚠ Conflict: {c.farmerName}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
