import React from 'react';
import { Menu, Bell, Smartphone, Monitor, Search } from 'lucide-react';
import { LOGO_IMAGE_PATH } from '../data/scoutData';

interface AndroidTopAppBarProps {
  title: string;
  subtitle?: string;
  onOpenDrawer: () => void;
  onOpenNotifications: () => void;
  isDeviceFrame: boolean;
  onToggleDeviceFrame: () => void;
  notificationCount?: number;
}

export const AndroidTopAppBar: React.FC<AndroidTopAppBarProps> = ({
  title,
  subtitle = 'Gudep 10-035 & 10-036',
  onOpenDrawer,
  onOpenNotifications,
  isDeviceFrame,
  onToggleDeviceFrame,
  notificationCount = 2
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white border-b-2 border-amber-400 shadow-sm transition-all">
      {/* Top micro bar with logo color strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#e51c24] via-amber-400 to-[#e51c24]" />
      
      <div className="flex items-center justify-between px-3.5 py-2.5">
        {/* Left: Navigation Drawer Hamburger Button */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenDrawer}
            aria-label="Buka Sidebar Menu"
            className="p-2 -ml-1 text-slate-700 hover:text-[#e51c24] active:scale-95 transition-transform rounded-xl hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>

          {/* Logo badge */}
          <div className="relative group cursor-pointer" onClick={onOpenDrawer}>
            <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#e51c24] via-amber-400 to-[#e51c24] shadow-sm">
              <img
                src={LOGO_IMAGE_PATH}
                alt="Ambalan La Surullah Petta Lopo"
                className="w-full h-full object-contain rounded-full bg-white/90"
              />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="leading-tight">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{title}</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold bg-red-100 text-[#e51c24] border border-amber-300 px-1.5 py-0.2 rounded-full">
                Sulsel
              </span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <span className="text-[#e51c24] font-bold">10-035</span>
              <span>•</span>
              <span className="text-amber-600 font-bold">10-036</span>
              <span className="text-slate-400">|</span>
              <span className="truncate max-w-[120px] sm:max-w-none">{subtitle}</span>
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-1">
          {/* Toggle Phone Frame button for desktop inspection */}
          <button
            onClick={onToggleDeviceFrame}
            title={isDeviceFrame ? 'Beralih ke Tampilan Layar Penuh' : 'Beralih ke Bingkai Android Native'}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors hidden md:flex items-center text-xs gap-1 border border-slate-200"
          >
            {isDeviceFrame ? (
              <>
                <Monitor className="w-4 h-4 text-[#e51c24]" />
                <span className="text-[11px] font-medium">Layar Penuh</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-[#e51c24]" />
                <span className="text-[11px] font-medium">Format Android</span>
              </>
            )}
          </button>

          {/* Notification Button */}
          <button
            onClick={onOpenNotifications}
            aria-label="Pemberitahuan Ambalan"
            className="relative p-2 text-slate-700 hover:text-[#e51c24] hover:bg-red-50 rounded-xl transition-all focus:outline-none"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#e51c24] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
