import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Palette, 
  Shield, 
  Smartphone, 
  Database, 
  RefreshCw, 
  Check, 
  Info, 
  Volume2, 
  Lock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { UserAccount } from '../../types';

interface PengaturanViewProps {
  currentUser: UserAccount;
  onNavigateToAkun?: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  currentUser,
  onNavigateToAkun
}) => {
  const [notifKegiatan, setNotifKegiatan] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [suaraNotif, setSuaraNotif] = useState(true);
  const [getarNotif, setGetarNotif] = useState(true);
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearCache = () => {
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2000);
  };

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#e51c24] flex items-center justify-center border border-red-200 shadow-xs shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono tracking-wider">
              Preferensi Aplikasi
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Pengaturan Sistem
            </h1>
            <p className="text-xs text-slate-500">
              Ambalan La Surullah Petta Lopo • Versi 2.4
            </p>
          </div>
        </div>
      </div>

      {/* 1. Pengaturan Notifikasi */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#e51c24]" />
          <span>Notifikasi & Pemberitahuan</span>
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Pengingat Kegiatan & Latihan</span>
              <span className="text-[10px] text-slate-500">Pemberitahuan sebelum agenda dimulai</span>
            </div>
            <input
              type="checkbox"
              checked={notifKegiatan}
              onChange={(e) => setNotifKegiatan(e.target.checked)}
              className="w-4 h-4 accent-[#e51c24] rounded cursor-pointer"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Pemberitahuan Obrolan Grup</span>
              <span className="text-[10px] text-slate-500">Notifikasi pesan dan update list nama</span>
            </div>
            <input
              type="checkbox"
              checked={notifChat}
              onChange={(e) => setNotifChat(e.target.checked)}
              className="w-4 h-4 accent-[#e51c24] rounded cursor-pointer"
            />
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Suara & Nada Dering</span>
              <span className="text-[10px] text-slate-500">Bunyi lonceng peluit saat ada pengumuman</span>
            </div>
            <input
              type="checkbox"
              checked={suaraNotif}
              onChange={(e) => setSuaraNotif(e.target.checked)}
              className="w-4 h-4 accent-[#e51c24] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. Tema & Tampilan */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
          <Palette className="w-4 h-4 text-amber-600" />
          <span>Tema & Nuansa Visual</span>
        </h2>

        <div className="p-3 bg-red-50/70 rounded-xl border border-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#e51c24] border-2 border-amber-400" />
            <div>
              <strong className="text-slate-900 block font-bold">Merah Putih Pramuka Ambalan</strong>
              <span className="text-[10px] text-slate-500">Kombinasi Merah Berani, Putih Suci, & Aksen Kuning Emas</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
            Aktif
          </span>
        </div>
      </div>

      {/* 3. Manajemen Akun & Cache */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Data & Penyimpanan</span>
        </h2>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Sinkronisasi Cloud Real-time</span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Terhubung ke Google Cloud Firestore
              </span>
            </div>
          </div>

          <button
            onClick={handleClearCache}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Bersihkan Cache Lokal Aplikasi</span>
            </div>
            {clearedNotice ? (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Berhasil Bersih
              </span>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* 4. Profil Anggota Shortcut */}
      {onNavigateToAkun && (
        <button
          onClick={onNavigateToAkun}
          className="w-full bg-white rounded-2xl p-4 border-2 border-slate-200 hover:border-amber-400 shadow-xs flex items-center justify-between text-xs text-left group transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-slate-900 block group-hover:text-[#e51c24] transition-colors">
                Kelola Profil Akun ({currentUser.nama})
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Gudep {currentUser.gudep} • Sangga {currentUser.sangga}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#e51c24] transition-colors" />
        </button>
      )}

      {/* Footer Info */}
      <div className="text-center p-3 text-[10px] text-slate-400 space-y-0.5">
        <p className="font-bold text-slate-600">Ambalan La Surullah Petta Lopo</p>
        <p>Gugus Depan 10-035 & 10-036 • Kwartir Ranting</p>
      </div>

    </div>
  );
};
