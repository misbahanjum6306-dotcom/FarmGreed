import React, { useState } from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import {
  ResourceCategory,
  ResourceItem,
  ResourceStatus,
} from '../types';
import {
  Wrench,
  PlusCircle,
  Clock,
  Calendar,
  AlertOctagon,
  CheckCircle,
  MapPin,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

const RESOURCE_CATALOG: Record<ResourceCategory, string[]> = {
  'Agricultural Machinery': ['Tractor', 'Harvester', 'Tiller', 'Seeder'],
  'Irrigation Equipment': ['Portable pump', 'Drip lines', 'Sprinkler set'],
  'Storage': ['Temporary solar storage', 'Cold storage'],
  'Transportation': ['Mini-truck', 'Trailer', 'Grain cart'],
  'Agricultural Labour': ['Sowing team', 'Weeding team', 'Harvesting team'],
  'Specialized Services': ['Drone spraying', 'Soil testing', 'Grafting'],
};

export const OwnerView: React.FC = () => {
  const {
    selectedOwnerId,
    resourceOwners,
    resources,
    bookings,
    updateResourceStatus,
    addResource,
  } = useFarmGrid();

  const currentOwner =
    resourceOwners.find((o) => o.id === selectedOwnerId) || resourceOwners[0];

  const ownerResources = resources.filter((r) => r.ownerId === currentOwner.id);
  const ownerBookings = bookings.filter((b) =>
    ownerResources.some((r) => r.id === b.resourceId)
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCat, setNewCat] = useState<ResourceCategory>('Agricultural Machinery');
  const [newSubType, setNewSubType] = useState<string>('Tractor');
  const [newName, setNewName] = useState<string>('');
  const [newSpecs, setNewSpecs] = useState<string>('');
  const [newLocName, setNewLocName] = useState<string>(currentOwner.village);
  const [newStartHour, setNewStartHour] = useState<number>(7);
  const [newEndHour, setNewEndHour] = useState<number>(19);
  const [newRate, setNewRate] = useState<number>(700);

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    addResource({
      ownerId: currentOwner.id,
      ownerName: currentOwner.name,
      name: newName || `${newSubType} Unit`,
      category: newCat,
      subType: newSubType,
      specifications: newSpecs || 'Standard rural equipment specification',
      location: {
        name: newLocName,
        village: currentOwner.village,
        x: 45,
        y: 35,
        lat: 17.02,
        lng: 73.34,
      },
      operatingWindow: { startHour: newStartHour, endHour: newEndHour },
      hourlyRateEst: newRate,
      status: 'available',
    });
    setShowAddModal(false);
    setNewName('');
    setNewSpecs('');
  };

  return (
    <div className="space-y-6">
      {/* Owner Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-700/25">
              {currentOwner.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-black text-slate-950">{currentOwner.name}</h1>
                <span className="text-xs font-black px-3 py-0.5 rounded-full bg-slate-950 text-blue-400 shadow-xs">
                  Resource Owner Hub
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold mt-1">
                <span>Org: <strong className="text-slate-900 font-black">{currentOwner.organization || 'Independent Custom Hiring'}</strong></span>
                <span>•</span>
                <span>Base: <strong className="text-slate-900 font-black">{currentOwner.village}</strong></span>
                <span>•</span>
                <span>
                  Operator Rating: <strong className="text-amber-600 font-black">★ {currentOwner.rating}</strong>
                </span>
              </div>
            </div>
          </div>

          <button
            id="add-resource-modal-btn"
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 self-start md:self-auto cursor-pointer shadow-md shadow-emerald-700/20 transition-all hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Resource</span>
          </button>
        </div>
      </div>

      {/* Fleet Inventory & Operating Control */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            My Managed Equipment & Labour Fleet ({ownerResources.length})
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Set real-time maintenance status & availability windows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownerResources.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">
                      {res.category}
                    </span>
                    <h3 className="font-black text-slate-950 text-base mt-0.5">{res.name}</h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs ${
                      res.status === 'available'
                        ? 'bg-emerald-600 text-white'
                        : res.status === 'booked'
                        ? 'bg-blue-600 text-white'
                        : res.status === 'maintenance'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-rose-600 text-white animate-pulse'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium mt-2 line-clamp-2">
                  {res.specifications}
                </p>

                <div className="mt-3.5 pt-3 border-t-2 border-slate-100 space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Depot Hub:</span>
                    <span className="font-black text-slate-900">{res.location.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Operating Window:</span>
                    <span className="font-black text-slate-900">
                      {res.operatingWindow.startHour}:00 – {res.operatingWindow.endHour}:00
                    </span>
                  </div>
                  {res.hourlyRateEst && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Standard Tariff:</span>
                      <span className="font-black text-emerald-700">
                        ₹{res.hourlyRateEst} / hour
                      </span>
                    </div>
                  )}

                  {res.maintenanceReason && (
                    <div className="mt-2 bg-amber-50 border-2 border-amber-400 text-amber-950 p-2.5 rounded-xl text-[11px] font-semibold">
                      <strong className="font-black">Maintenance Note:</strong> {res.maintenanceReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Status Toggle */}
              <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 font-bold">Status Control:</span>
                <div className="flex items-center space-x-2">
                  {res.status !== 'available' && (
                    <button
                      onClick={() => updateResourceStatus(res.id, 'available')}
                      className="px-3 py-1.5 text-xs rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-black shadow-xs cursor-pointer transition-colors"
                    >
                      Set Ready
                    </button>
                  )}
                  {res.status !== 'maintenance' && (
                    <button
                      onClick={() =>
                        updateResourceStatus(
                          res.id,
                          'maintenance',
                          'Scheduled servicing & routine maintenance inspection'
                        )
                      }
                      className="px-3 py-1.5 text-xs rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-black shadow-xs cursor-pointer transition-colors"
                    >
                      Maintenance
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Owner Calendar / Assigned Bookings */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
          Assigned Bookings on Your Equipment ({ownerBookings.length})
        </h2>

        {ownerBookings.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold italic">No bookings assigned yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border-2 border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-200 font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">Resource</th>
                  <th className="py-3 px-3.5">Farmer</th>
                  <th className="py-3 px-3.5">Farm Location</th>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Work Hours</th>
                  <th className="py-3 px-3.5">Transit Start</th>
                  <th className="py-3 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {ownerBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3.5 font-black text-slate-950">{b.resourceName}</td>
                    <td className="py-3.5 px-3.5 font-bold">{b.farmerName}</td>
                    <td className="py-3.5 px-3.5 text-slate-600 font-semibold">{b.farmLocation.village}</td>
                    <td className="py-3.5 px-3.5 font-bold">{b.date}</td>
                    <td className="py-3.5 px-3.5">
                      <span className="font-black text-emerald-950 bg-emerald-100 border border-emerald-400 px-2 py-1 rounded-md">
                        {b.startTime} – {b.endTime}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-amber-800 font-bold">
                      {b.transitStartTime} ({b.transitMinutes}m travel)
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-md bg-emerald-600 text-white shadow-xs">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border-2 border-slate-300">
            <h3 className="text-base font-black text-slate-950 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
              Register Agricultural Resource
            </h3>

            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-800 mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => {
                    const cat = e.target.value as ResourceCategory;
                    setNewCat(cat);
                    setNewSubType(RESOURCE_CATALOG[cat][0]);
                  }}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {(Object.keys(RESOURCE_CATALOG) as ResourceCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1">Resource Sub-Type</label>
                <select
                  value={newSubType}
                  onChange={(e) => setNewSubType(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  {RESOURCE_CATALOG[newCat].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1">Resource Name / Model</label>
                <input
                  type="text"
                  placeholder="e.g. Swaraj 744 XT / Drone Atomizer"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-black text-slate-800 mb-1">
                  Specifications & Implements
                </label>
                <textarea
                  rows={2}
                  placeholder="Horsepower, cutting width, pump head, attachments included..."
                  value={newSpecs}
                  onChange={(e) => setNewSpecs(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">Operating Start Hour</label>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    value={newStartHour}
                    onChange={(e) => setNewStartHour(parseInt(e.target.value, 10))}
                    className="w-full border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-800 mb-1">Operating End Hour</label>
                  <input
                    type="number"
                    min={14}
                    max={23}
                    value={newEndHour}
                    onChange={(e) => setNewEndHour(parseInt(e.target.value, 10))}
                    className="w-full border-2 border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-4 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  Register Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
