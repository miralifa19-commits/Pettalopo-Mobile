import React from 'react';
import { 
  Home, 
  CheckSquare, 
  Award, 
  Radio, 
  BookOpen, 
  Calendar, 
  Users, 
  Shield, 
  FileText, 
  Compass, 
  Sparkles, 
  ChevronRight, 
  X, 
  Languages, 
  Flame, 
  UserCheck 
} from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';
import { LOGO_IMAGE_PATH } from '../data/scoutData';

interface AndroidNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  profile: UserProfile;
  onToggleGudep: () => void;
}

export const AndroidNavigationDrawer: React.FC<AndroidNavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  profile,
  onToggleGudep
}) => {
  if (!isOpen) return null;

  const navGroups = [
    {
      group: 'Utama',
      items: [
        { id: 'home' as NavigationTab, label: 'Beranda Ambalan', icon: Home, badge: 'Aktif' },
        { id: 'profil' as NavigationTab, label: 'Filosofi Lambang & Sejarah', icon: Shield, badge: 'Pusaka' },
        { id: 'dasadarma' as NavigationTab, label: 'Tri Satya & Dasa Darma', icon: Flame, badge: 'Dasar' }
      ]
    },
    {
      group: 'Kecakapan Penegak',
      items: [
        { id: 'sku' as NavigationTab, label: 'SKU Bantara & Laksana', icon: CheckSquare, badge: 'Progres' },
        { id: 'sandi' as NavigationTab, label: 'Sandi Morse & Semaphore', icon: Radio, badge: 'Audio' },
        { id: 'pionering' as NavigationTab, label: 'Simpul & Tali Temali', icon: Compass, badge: 'Panduan' },
        { id: 'lontara' as NavigationTab, label: 'Penerjemah Aksara Lontara', icon: Languages, badge: 'Bugis' }
      ]
    },
    {
      group: 'Aktivitas & Sangga',
      items: [
        { id: 'agenda' as NavigationTab, label: 'Agenda & Jadwal Latihan', icon: Calendar, badge: 'Rutin' },
        { id: 'presensi' as NavigationTab, label: 'Presensi Kehadiran', icon: UserCheck, badge: 'Absen' },
        { id: 'logbook' as NavigationTab, label: 'Buku Catatan Logbook', icon: FileText, badge: 'Harian' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop with smooth fade */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container (Slides from Left) */}
      <div className="fixed inset-y-0 left-0 max-w-[320px] sm:max-w-[340px] w-full bg-white shadow-2xl flex flex-col z-10 border-r-2 border-amber-400 animate-in slide-in-from-left duration-300">
        
        {/* Drawer Header: Merah, Putih, & Lis Kuning */}
        <div className="relative bg-gradient-to-br from-[#e51c24] via-[#cc141a] to-[#a30b10] text-white p-5 border-b-4 border-amber-400 overflow-hidden">
          {/* Subtle gold line pattern decoration */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-4 border-amber-400/20 pointer-events-none" />
          <div className="absolute right-4 bottom-2 text-white/10 font-black text-6xl select-none font-mono pointer-events-none">
            {profile.gudep}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-amber-300 transition-colors"
            aria-label="Tutup Sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo & Identity */}
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 ring-2 ring-amber-400 shadow-lg shrink-0">
              <img
                src={LOGO_IMAGE_PATH}
                alt="Logo Ambalan"
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-mono shadow-xs">
                Gudep {profile.gudep}
              </span>
              <h2 className="text-base font-extrabold leading-tight tracking-tight mt-1 truncate">
                Ambalan La Surullah
              </h2>
              <p className="text-xs font-semibold text-amber-200 tracking-wide">
                Petta Lopo
              </p>
            </div>
          </div>

          {/* Profile Card Inside Drawer with yellow border */}
          <div className="mt-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-amber-300/40 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-white/80 font-medium">Anggota Aktif:</p>
                <p className="font-bold text-white text-sm truncate">{profile.name}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-md bg-white text-[#e51c24] font-bold text-[10px] shadow-xs inline-block">
                  {profile.sangga}
                </span>
                <p className="text-[10px] text-amber-200 font-medium mt-0.5">{profile.level}</p>
              </div>
            </div>

            {/* Quick Switch Button Gudep Putra / Putri */}
            <button
              onClick={onToggleGudep}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] flex items-center justify-between transition-colors shadow-sm"
            >
              <span>Satuan: {profile.gudep === '10-035' ? '10-035 (Putra)' : '10-036 (Putri)'}</span>
              <span className="text-[10px] underline font-semibold">Ganti Satuan ➔</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu List (Dominant White with Red/Yellow accents) */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                {group.group}
              </h3>
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-red-50 text-[#e51c24] border-2 border-amber-400 shadow-sm font-bold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-[#e51c24] text-white shadow-xs' 
                            : 'bg-slate-100 text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-800'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="tracking-tight">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                            isActive 
                              ? 'bg-amber-300 text-amber-950 font-bold' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          isActive ? 'text-[#e51c24] translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer with Motto & Lis Kuning */}
        <div className="p-3.5 bg-slate-50 border-t-2 border-amber-400">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
            <p className="text-[10px] font-bold text-[#e51c24] tracking-wide uppercase">
              "Siri' na Pacce"
            </p>
            <p className="text-[10px] text-slate-500 italic mt-0.5">
              Satyaku Kudarmakan, Darmaku Kubaktikan
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400 font-mono">
            <span>Ambalan App v2.4</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Android Native
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
