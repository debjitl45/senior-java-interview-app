import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Bug, 
  PlaySquare, 
  Layers, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { state, toggleVoice } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'defects', label: 'Spot Defect', icon: Bug },
    { id: 'interview', label: 'Simulator', icon: PlaySquare },
    { id: 'flashcards', label: 'Flashcards', icon: Layers },
    { id: 'info', label: 'Compliance', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800 shrink-0 select-none">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-mono font-bold text-lg text-white">J</span>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-white">JavaMaster Pro</h1>
              <span className="text-[11px] text-indigo-400 font-medium uppercase tracking-wider">10+ YOE Senior Prep</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.label}
                {item.id === 'defects' && (
                  <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono border border-amber-500/20">
                    Pro
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Quick Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Streak: <strong className="text-white">{state.streak} days</strong></span>
            </div>
            <button
              onClick={toggleVoice}
              title={state.voiceEnabled ? "Disable Speech Output" : "Enable Speech Output"}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {state.voiceEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
              <span className="font-mono font-bold text-sm text-white">J</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white leading-none">JavaMaster Pro</h1>
              <span className="text-[10px] text-indigo-400 font-medium">Senior • 10+ YOE</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full text-xs text-slate-300 border border-slate-700/50">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="font-bold">{state.streak}</span>
            </div>
            <button
              onClick={toggleVoice}
              className="p-1.5 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              {state.voiceEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 select-none shrink-0 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 relative text-center ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 bg-indigo-500 rounded-full" />
                )}
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-medium tracking-tight leading-none">
                  {item.label === 'Spot Defect' ? 'Defects' : item.label === 'Compliance' ? 'Info' : item.label}
                </span>
              </button>
            );
          })}
        </nav>

      </div>

    </div>
  );
};
