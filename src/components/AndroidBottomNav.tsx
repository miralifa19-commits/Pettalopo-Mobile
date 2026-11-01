import React from 'react';
import { Home, CheckSquare, Radio, Calendar, Shield } from 'lucide-react';
import { NavigationTab } from '../types';

interface AndroidBottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs = [
    { id: 'home' as NavigationTab, label: 'Beranda', icon: Home },
    { id: 'sku' as NavigationTab, label: 'SKU Penegak', icon: CheckSquare },
    { id: 'sandi' as NavigationTab, label: 'Sandi Morse', icon: Radio },
    { id: 'agenda' as NavigationTab, label: 'Agenda', icon: Calendar },
    { id: 'profil' as NavigationTab, label: 'Lambang', icon: Shield }
  ];

  return (
    <nav className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t-2 border-amber-400 shadow-lg px-2 py-1.5">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-[#e51c24] font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {/* Active Pill background */}
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-red-50 text-[#e51c24] ring-1 ring-amber-400 scale-105 shadow-xs'
                    : 'bg-transparent text-slate-500'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-[#e51c24] font-bold' : ''}`}>
                {tab.label}
              </span>

              {/* Tiny yellow dot indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full absolute -top-0.5 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
