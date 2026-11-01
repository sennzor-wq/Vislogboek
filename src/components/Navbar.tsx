import React from 'react';
import {
  Compass,
  Clock,
  MapPin,
  BarChart3,
  CloudSun,
  Settings,
  Sparkles,
} from 'lucide-react';

export type TabType = 'prognosis' | 'sessions' | 'locations' | 'stats' | 'weather' | 'settings';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeSessionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeSessionCount,
}) => {
  const tabs = [
    { id: 'prognosis' as TabType, label: 'Visprognose', icon: Compass },
    { id: 'sessions' as TabType, label: 'Sessies', icon: Clock, badge: activeSessionCount },
    { id: 'locations' as TabType, label: 'Stekken', icon: MapPin },
    { id: 'stats' as TabType, label: 'Statistieken', icon: BarChart3 },
    { id: 'weather' as TabType, label: 'Weer', icon: CloudSun },
    { id: 'settings' as TabType, label: 'Instellingen', icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Header Nav (md+) */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition relative cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Fixed Bar (< md) met grote touch targets */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 pb-safe shadow-2xl">
        <div className="grid grid-cols-6 items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition relative cursor-pointer ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                  {tab.id === 'prognosis' ? 'Prognose' : tab.label}
                </span>
                {isActive && (
                  <div className="w-4 h-0.5 rounded-full bg-emerald-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
