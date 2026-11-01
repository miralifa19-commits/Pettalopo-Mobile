import React from 'react';
import { Home, Calendar, Flame, User } from 'lucide-react';
import { ActiveMenu } from '../types';

interface FloatingBottomNavProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeMenu,
  onSelectMenu
}) => {
  const tabs = [
    { id: 'home' as ActiveMenu, label: 'Home', icon: Home },
    { id: 'dashboard' as ActiveMenu, label: 'Kegiatan', icon: Calendar },
    { id: 'latihan_rutin' as ActiveMenu, label: 'Latihan Rutin', icon: Flame },
    { id: 'akun' as ActiveMenu, label: 'Akun', icon: User }
  ];

  return (
    <footer className="sticky bottom-0 z-30 w-full bg-white border-t border-slate-200 shadow-md font-sans">
      <nav className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeMenu === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectMenu(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 transition-all relative ${
                isActive ? 'text-[#e51c24]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active Pill Background */}
              <div
                className={`w-10 h-6.5 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-red-50 text-[#e51c24] scale-105'
                    : 'bg-transparent text-slate-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>

              <span className={`text-[10px] mt-0.5 tracking-tight ${
                isActive ? 'font-bold text-[#e51c24]' : 'font-medium text-slate-500'
              }`}>
                {tab.label}
              </span>

              {/* Red Active Indicator */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#e51c24] absolute top-1" />
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
