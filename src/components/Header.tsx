import React from 'react';
import { useFarmGrid } from '../context/FarmGridContext';
import {
  UserRole,
} from '../types';
import {
  Tractor,
  Wifi,
  WifiOff,
  RefreshCw,
  Shield,
  User,
  Wrench,
  AlertCircle,
  Database,
  CheckCircle,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    selectedFarmerId,
    setSelectedFarmerId,
    selectedOwnerId,
    setSelectedOwnerId,
    farmers,
    resourceOwners,
    isOffline,
    setIsOffline,
    offlineQueue,
    syncStatus,
    syncOfflineQueue,
    lastSyncMessage,
    resetAllDemoData,
  } = useFarmGrid();

  const activeFarmer = farmers.find((f) => f.id === selectedFarmerId) || farmers[0];
  const activeOwner = resourceOwners.find((o) => o.id === selectedOwnerId) || resourceOwners[0];

  return (
    <header className="bg-slate-950 text-white border-b-2 border-emerald-500 sticky top-0 z-30 shadow-xl">
      {/* Top Banner Alert if Sync/Offline event */}
      {lastSyncMessage && (
        <div
          className={`py-2 px-4 text-xs text-center font-bold flex items-center justify-center space-x-2 shadow-inner ${
            isOffline ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
          }`}
        >
          {isOffline ? <WifiOff className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{lastSyncMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Purpose */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/30">
              <Tractor className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-white tracking-tight">FarmGrid</span>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-xs">
                  AgriTech Dispatch
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-300 hidden sm:block">
                Agricultural Resource Coordination Under Scarcity
              </p>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              id="role-farmer-tab"
              onClick={() => setCurrentRole('farmer')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'farmer'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Farmer</span>
            </button>

            <button
              id="role-owner-tab"
              onClick={() => setCurrentRole('owner')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'owner'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Resource Owner</span>
            </button>

            <button
              id="role-admin-tab"
              onClick={() => setCurrentRole('admin')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Admin / Master</span>
            </button>
          </div>

          {/* Right Action Tools: Offline Simulator, Reset, Active Entity */}
          <div className="flex items-center space-x-3">
            {/* Offline Simulation Toggle */}
            <div className="flex items-center bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs shadow-xs">
              <button
                id="toggle-offline-btn"
                onClick={() => setIsOffline(!isOffline)}
                className={`flex items-center space-x-1.5 font-bold transition-colors ${
                  isOffline
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
                title="Toggle offline-first simulation mode"
              >
                {isOffline ? (
                  <>
                    <WifiOff className="w-4 h-4 animate-pulse text-amber-400" />
                    <span className="font-extrabold text-amber-400">📴 Offline</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-emerald-400">🟢 Online</span>
                  </>
                )}
              </button>

              {offlineQueue.length > 0 && (
                <button
                  id="sync-queue-btn"
                  onClick={syncOfflineQueue}
                  disabled={syncStatus === 'syncing'}
                  className="ml-2 px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center space-x-1 shadow-xs"
                  title="Synchronize offline queue now"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                  />
                  <span>Sync ({offlineQueue.length})</span>
                </button>
              )}
            </div>

            {/* Quick Demo Reset */}
            <button
              id="reset-demo-btn"
              onClick={resetAllDemoData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs flex items-center space-x-1 font-bold"
              title="Reset to clean demo data baseline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-Bar: Active Profile Selection & Context */}
        <div className="py-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold">Active Context:</span>
            {currentRole === 'farmer' && (
              <div className="flex items-center space-x-1.5 text-slate-100">
                <span className="font-black px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[11px]">Farmer</span>
                <select
                  id="farmer-selector"
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="bg-slate-900 border-2 border-emerald-500 text-white font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.village} • {f.primaryCrop})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentRole === 'owner' && (
              <div className="flex items-center space-x-1.5 text-slate-100">
                <span className="font-black px-2 py-0.5 rounded bg-blue-600 text-white text-[11px]">Owner Hub</span>
                <select
                  id="owner-selector"
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="bg-slate-900 border-2 border-blue-500 text-white font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {resourceOwners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.village})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="flex items-center space-x-2">
                <span className="font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[11px]">Master Coordinator</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-semibold">Deterministic Non-FCFS Engine</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">Transit Buffer Optimization</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline font-medium">
              Cluster: <strong className="text-emerald-400">Kalyanpur-Ratnagiri Valley</strong>
            </span>
            <span className="flex items-center space-x-1.5 font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Reactive DB</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
