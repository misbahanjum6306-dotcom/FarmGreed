import React from 'react';
import { FarmGridProvider, useFarmGrid } from './context/FarmGridContext';
import { Header } from './components/Header';
import { FarmerView } from './components/FarmerView';
import { OwnerView } from './components/OwnerView';
import { AdminView } from './components/AdminView';
import {
  Tractor,
  Shield,
  User,
  Wrench,
  Sparkles,
  Database,
  CheckCircle2,
  Workflow,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentRole, setCurrentRole } = useFarmGrid();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'farmer' && <FarmerView />}
        {currentRole === 'owner' && <OwnerView />}
        {currentRole === 'admin' && <AdminView />}
      </main>

      {/* Footer & Hackathon Quick Navigation Bar */}
      <footer className="bg-slate-950 border-t-2 border-emerald-500 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/25">
              <Tractor className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-black text-white text-sm">FarmGrid Platform</span>
            <span className="text-slate-600 font-bold">•</span>
            <span className="text-slate-300 font-semibold">Agricultural Resource Coordination Under Regional Scarcity</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400 font-bold">Portal Selector:</span>
            <button
              onClick={() => setCurrentRole('farmer')}
              className={`hover:text-emerald-400 font-bold cursor-pointer transition-colors px-2.5 py-1 rounded-lg ${
                currentRole === 'farmer' ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' : 'text-slate-300'
              }`}
            >
              Farmer Portal
            </button>
            <span className="text-slate-600 font-bold">•</span>
            <button
              onClick={() => setCurrentRole('owner')}
              className={`hover:text-blue-400 font-bold cursor-pointer transition-colors px-2.5 py-1 rounded-lg ${
                currentRole === 'owner' ? 'bg-blue-600 text-white font-black shadow-xs' : 'text-slate-300'
              }`}
            >
              Resource Owner
            </button>
            <span className="text-slate-600 font-bold">•</span>
            <button
              onClick={() => setCurrentRole('admin')}
              className={`hover:text-amber-400 font-bold cursor-pointer transition-colors px-2.5 py-1 rounded-lg ${
                currentRole === 'admin' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-300'
              }`}
            >
              Master Scheduler / Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <FarmGridProvider>
      <MainLayout />
    </FarmGridProvider>
  );
}
