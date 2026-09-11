import React, { useState } from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import {
  MapPin,
  Tractor,
  Navigation,
  Compass,
  Layers,
  Info,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { calculateDistanceKm, calculateTransitMinutes } from '../utils/priorityEngine';

export const FarmLogisticsMap: React.FC = () => {
  const { farmers, resources, requests } = useFarmGrid();
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    type: 'farmer' | 'resource';
    name: string;
    village: string;
    details: string;
    x: number;
    y: number;
  } | null>(null);

  // Focus on first depot
  const primaryDepot = resources[0]?.location || { name: 'Central Depot', x: 45, y: 30 };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            Regional Farm & Equipment Logistics Grid
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic topography tracking farm parcels, machinery depots, and travel buffer vectors.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span className="text-slate-600 font-medium">Farmer Farm Plots</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            <span className="text-slate-600 font-medium">Machinery Depots</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-amber-500 inline-block border-t border-dashed border-amber-600" />
            <span className="text-slate-600 font-medium">Transit Routes</span>
          </span>
        </div>
      </div>

      {/* Selected Entity Card */}
      {selectedEntity && (
        <div className="bg-slate-900 text-white p-3.5 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                selectedEntity.type === 'farmer' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
            >
              {selectedEntity.type === 'farmer' ? '🌾' : '🚜'}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{selectedEntity.name}</div>
              <div className="text-slate-300">
                {selectedEntity.village} • {selectedEntity.details}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedEntity(null)}
            className="text-slate-400 hover:text-white px-2 py-1 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* SVG Interactive Map Canvas */}
      <div className="relative w-full aspect-2/1 sm:aspect-5/2 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Subtle grid background */}
          <defs>
            <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="0.5"
              />
            </pattern>
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <rect width="100" height="100" fill="url(#grid-pattern)" />

          {/* Regional Zones contour lines */}
          <path
            d="M 10 20 Q 30 15 50 25 T 90 20"
            fill="none"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <path
            d="M 15 65 Q 40 50 70 65 T 95 60"
            fill="none"
            stroke="rgba(59, 130, 246, 0.15)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Zone Labels */}
          <text x="12" y="15" fill="#6ee7b7" fontSize="2.8" opacity="0.6" fontWeight="bold">
            RATNAGIRI VALLEY ZONE
          </text>
          <text x="40" y="10" fill="#93c5fd" fontSize="2.8" opacity="0.6" fontWeight="bold">
            KALYANPUR CANAL CORRIDOR
          </text>
          <text x="65" y="85" fill="#fde047" fontSize="2.8" opacity="0.6" fontWeight="bold">
            SHIVGARH & DHIRPUR HIGHLANDS
          </text>

          {/* Draw Transit Route lines between farmers and primary depot */}
          {farmers.map((farmer) => {
            const dist = calculateDistanceKm(farmer.location, primaryDepot);
            const transitMins = calculateTransitMinutes(dist);

            return (
              <g key={`route-${farmer.id}`}>
                <line
                  x1={primaryDepot.x}
                  y1={primaryDepot.y}
                  x2={farmer.location.x}
                  y2={farmer.location.y}
                  stroke="url(#route-gradient)"
                  strokeWidth="0.8"
                  strokeDasharray="1.5 1.5"
                  opacity="0.6"
                />
                {/* Distance pill on midpoint */}
                <text
                  x={(primaryDepot.x + farmer.location.x) / 2}
                  y={(primaryDepot.y + farmer.location.y) / 2 - 1}
                  fill="#fcd34d"
                  fontSize="2"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {dist}km ({transitMins}m)
                </text>
              </g>
            );
          })}

          {/* Resource Depots (Blue Squares) */}
          {resources.map((res) => (
            <g
              key={`res-node-${res.id}`}
              className="cursor-pointer group"
              onClick={() =>
                setSelectedEntity({
                  id: res.id,
                  type: 'resource',
                  name: res.name,
                  village: res.location.village,
                  details: `Status: ${res.status.toUpperCase()} • Operating: ${res.operatingWindow.startHour}:00 - ${res.operatingWindow.endHour}:00`,
                  x: res.location.x,
                  y: res.location.y,
                })
              }
            >
              <rect
                x={res.location.x - 2.2}
                y={res.location.y - 2.2}
                width="4.4"
                height="4.4"
                rx="1"
                fill={res.status === 'disrupted' ? '#f43f5e' : '#2563eb'}
                stroke="#ffffff"
                strokeWidth="0.6"
              />
              <text
                x={res.location.x}
                y={res.location.y + 4.5}
                fill="#93c5fd"
                fontSize="2.2"
                textAnchor="middle"
                fontWeight="bold"
              >
                {res.name.split(' ')[0]}
              </text>
            </g>
          ))}

          {/* Farmer Farms (Green Circles) */}
          {farmers.map((farmer) => {
            const req = requests.find((r) => r.farmerId === farmer.id);
            const isContested = req?.status === 'conflict';
            const isAllocated = req?.status === 'allocated';

            return (
              <g
                key={`farmer-node-${farmer.id}`}
                className="cursor-pointer group"
                onClick={() =>
                  setSelectedEntity({
                    id: farmer.id,
                    type: 'farmer',
                    name: farmer.name,
                    village: farmer.village,
                    details: `Crop: ${farmer.primaryCrop} (${farmer.landAreaAcres} Acres) • Priority: ${
                      req ? `${req.priorityScore.totalScore}/100` : 'N/A'
                    }`,
                    x: farmer.location.x,
                    y: farmer.location.y,
                  })
                }
              >
                <circle
                  cx={farmer.location.x}
                  cy={farmer.location.y}
                  r={isContested ? 3.2 : 2.5}
                  fill={isContested ? '#e11d48' : isAllocated ? '#10b981' : '#059669'}
                  stroke="#ffffff"
                  strokeWidth="0.7"
                />
                <text
                  x={farmer.location.x}
                  y={farmer.location.y + 4.5}
                  fill="#ffffff"
                  fontSize="2.3"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {farmer.name.split(' ')[0]}
                </text>
                {req && (
                  <text
                    x={farmer.location.x}
                    y={farmer.location.y - 3.5}
                    fill={isContested ? '#fca5a5' : '#a7f3d0'}
                    fontSize="2.0"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    ★{req.priorityScore.totalScore}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Controls / Map Legend */}
        <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-xs p-2 rounded-lg border border-slate-700 text-[10px] text-slate-300 space-y-1">
          <div>Scale: 100 Grid Units ≈ 12 km²</div>
          <div>Avg Tractor Transit Speed: 18 km/h</div>
          <div>Transit Buffer: 2.5m/km + 10m coupling</div>
        </div>
      </div>
    </div>
  );
};
