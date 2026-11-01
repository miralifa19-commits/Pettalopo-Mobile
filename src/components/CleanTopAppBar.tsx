import React, { useState } from 'react';
import { Menu, Bell, X, Calendar, Award, Sparkles, Check } from 'lucide-react';
import { LOGO_IMAGE_PATH } from '../data/scoutData';

interface CleanTopAppBarProps {
  onOpenSidebar: () => void;
  title: string;
  subtitle?: string;
  userRole?: 'admin' | 'anggota';
  onNavigateToAkun?: () => void;
  onOpenAuthModal?: () => void;
}

export const CleanTopAppBar: React.FC<CleanTopAppBarProps> = ({
  onOpenSidebar,
  title,
  subtitle,
  userRole = 'admin',
  onNavigateToAkun,
  onOpenAuthModal
}) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const isBeranda = title.toLowerCase().includes('beranda');

  const notifications = [
    {
      id: 1,
      title: 'Latihan Rutin Pramuka Penegak',
      desc: 'Agenda latihan rutin terjadwal setiap hari Sabtu pukul 15.00 WITA.',
      time: 'Hari Ini',
      unread: true
    },
    {
      id: 2,
      title: 'Pengisian Uji SKU Bantara & Laksana',
      desc: 'Buku SKU digital dapat diakses melalui menu SKU dan SKK.',
      time: 'Kemarin',
      unread: false
    },
    {
      id: 3,
      title: 'Musyawarah Dewan Ambalan',
      desc: 'Persiapan program kerja tahun ajaran 2026/2027 Gugus Depan 10-035 & 10-036.',
      time: '3 hari lalu',
      unread: false
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs transition-all font-sans">
        {/* Top red strip */}
        <div className="h-0.5 w-full bg-[#e51c24]" />

        <div className="flex items-center justify-between px-3.5 py-2.5">
          
          {/* Left: Cukup Logo lalu tulisan Beranda */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSidebar}
              aria-label="Buka Sidebar Menu"
              className="p-1.5 -ml-1 text-slate-700 hover:text-[#e51c24] active:scale-95 transition-transform rounded-xl hover:bg-red-50 focus:outline-none"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Logo Ambalan */}
            <div
              onClick={onOpenSidebar}
              className="w-8 h-8 flex items-center justify-center cursor-pointer active:scale-95 transition-transform shrink-0"
              title="Buka Menu"
            >
              <img
                src={LOGO_IMAGE_PATH}
                alt="Logo Ambalan"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Tulisan: Cukup Beranda jika di halaman Beranda, atau nama menu */}
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
              {isBeranda ? 'Beranda' : title}
            </h1>
          </div>

          {/* Right: Ujung Kanan Notifikasi */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowNotificationModal(true)}
              aria-label="Notifikasi Ambalan"
              title="Notifikasi"
              className="p-2 text-slate-700 hover:text-[#e51c24] hover:bg-slate-100 rounded-full transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-[#e51c24] absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
            </button>
          </div>

        </div>
      </header>

      {/* POPUP NOTIFIKASI AMBALAN */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-red-50 text-[#e51c24] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Notifikasi Ambalan
                </h3>
              </div>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-2xl text-xs transition-colors border ${
                    notif.unread 
                      ? 'bg-red-50/60 border-red-200' 
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-slate-900 font-bold block">
                      {notif.title}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                    {notif.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full py-2 rounded-xl bg-[#e51c24] hover:bg-[#c9141b] text-white text-xs font-bold transition-colors"
              >
                Tutup Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
