import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { ShiningAmbalanLogo } from './common/ShiningAmbalanLogo';
import { ActiveKegiatanSession, AmbalanNotificationItem, UserRole } from '../types';
import { NotificationsModal } from './NotificationsModal';

interface CleanTopAppBarProps {
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
  userRole?: UserRole;
  onNavigateToAkun?: () => void;
  onOpenAuthModal?: () => void;
  activeKegiatan?: ActiveKegiatanSession | null;
  notifications?: AmbalanNotificationItem[];
  onOpenPresensi?: (kegiatanId?: string) => void;
}

export const CleanTopAppBar: React.FC<CleanTopAppBarProps> = ({
  onOpenSidebar,
  title,
  activeKegiatan,
  notifications = [],
  onOpenPresensi
}) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const isBeranda = title.toLowerCase().includes('beranda');

  const hasActiveKegiatan = activeKegiatan && activeKegiatan.isRunning;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs transition-all font-sans">
        {/* Top red strip */}
        <div className="h-0.5 w-full bg-[#e51c24]" />

        <div className="flex items-center justify-between px-3.5 py-2.5">
          
          {/* Left: Menu & Shining Logo Ambalan (1s sweep, 15s recurring interval) */}
          <div className="flex items-center space-x-2">
            {!isBeranda && (
              <button
                onClick={onOpenSidebar}
                aria-label="Buka Sidebar Menu"
                className="p-1.5 -ml-1 text-slate-700 hover:text-[#e51c24] active:scale-95 transition-transform rounded-xl hover:bg-red-50 focus:outline-none"
              >
                <Menu className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}

            {/* Reusable Shining Logo Ambalan */}
            <ShiningAmbalanLogo
              className="w-8 h-8"
              onClick={onOpenSidebar}
              alt="Logo Ambalan La Surullah"
            />

            {/* Judul Halaman */}
            {!isBeranda && (
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                {title}
              </h1>
            )}
          </div>

          {/* Right: Notifikasi Bell (Desain Vector Putih Bersih) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowNotificationModal(true)}
              aria-label="Pemberitahuan Ambalan"
              title="Pemberitahuan Ambalan"
              className="w-8 h-8 rounded-full bg-[#e51c24] hover:bg-[#c9141b] active:scale-95 flex items-center justify-center text-white transition-all shadow-xs relative"
            >
              <svg 
                className="w-4 h-4 fill-none stroke-white stroke-[2.2]" 
                viewBox="0 0 24 24" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {hasActiveKegiatan && (
                <span className="w-2 h-2 rounded-full bg-white absolute top-0.5 right-0.5 ring-2 ring-[#e51c24] animate-pulse" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* POPUP NOTIFIKASI AMBALAN */}
      <NotificationsModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        activeKegiatan={activeKegiatan}
        notifications={notifications}
        onOpenPresensi={onOpenPresensi}
      />
    </>
  );
};
