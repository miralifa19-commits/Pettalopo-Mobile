import React, { useState } from 'react';
import { Users, Compass, Shield, Award, Flag, ChevronRight, UserCheck } from 'lucide-react';
import { UserAccount } from '../../types';

interface SanggaViewProps {
  currentUser: UserAccount;
  allMembers?: UserAccount[];
}

interface SanggaInfo {
  nama: 'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana';
  arti: string;
  filosofi: string;
  warna: string;
  tugas: string;
  iconBg: string;
  borderColor: string;
}

const SANGGA_DATA: SanggaInfo[] = [
  {
    nama: 'Perintis',
    arti: 'Perintisan Gerakan Kebangkitan Nasional 1908 (Boedi Oetomo)',
    filosofi: 'Menjadi pionir pemikiran inovatif, pembuka jalan bagi kemajuan Ambalan, dan inisiator ide-ide baru yang konstruktif.',
    warna: 'Merah Putih',
    tugas: 'Menginisiasi gagasan kegiatan, merancang konsep baru, dan menjadi penggerak awal dinamika ambalan.',
    iconBg: 'bg-red-500 text-white',
    borderColor: 'border-red-400'
  },
  {
    nama: 'Penegas',
    arti: 'Penegasan Tekad Sumpah Pemuda 1928',
    filosofi: 'Menegakkan disiplin adat ambalan, memantapkan tekad kebersamaan, dan memperkokoh persaudaraan pandu.',
    warna: 'Kuning Emas',
    tugas: 'Mempertegas kesepakatan dewan ambalan, mengawal kepatuhan adat, dan penegak ketertiban latihan.',
    iconBg: 'bg-amber-500 text-white',
    borderColor: 'border-amber-400'
  },
  {
    nama: 'Pendobrak',
    arti: 'Pendobrakan Belenggu Penjajahan (Proklamasi 1945)',
    filosofi: 'Berani mendobrak kemalasan, rintangan medan, dan kekakuan demi pencapaian prestasi penegak sejati.',
    warna: 'Merah Jingga',
    tugas: 'Pelopor kegiatan penjelajahan alam, navigasi darat, survival, dan tanggap darurat bencana.',
    iconBg: 'bg-orange-600 text-white',
    borderColor: 'border-orange-400'
  },
  {
    nama: 'Pencoba',
    arti: 'Percobaan & Pengujian Teknologi Pembangunan Nasional',
    filosofi: 'Selalu haus akan ilmu pengetahuan, siap menguji teori kepramukaan dalam praktik pionering dan teknologi tepat guna.',
    warna: 'Hijau Daun',
    tugas: 'Eksperimen teknik pionering, simpul-ikatan rumit, pemetaan, sandi morse lanjutan, dan kaji lingkungan.',
    iconBg: 'bg-emerald-600 text-white',
    borderColor: 'border-emerald-400'
  },
  {
    nama: 'Pelaksana',
    arti: 'Pelaksanaan Amanah Pembangunan Menuju Masa Depan',
    filosofi: 'Setia bekerja tuntas, amanah dalam eksekusi tugas, dan bertanggung jawab penuh atas keberhasilan program kerja.',
    warna: 'Biru Langit',
    tugas: 'Pengorganisasian teknis lapangan, logistik perlengkapan ambalan, dan pelaksanaan bakti sosial masyarakat.',
    iconBg: 'bg-blue-600 text-white',
    borderColor: 'border-blue-400'
  }
];

export const SanggaView: React.FC<SanggaViewProps> = ({ currentUser, allMembers = [] }) => {
  const [selectedSangga, setSelectedSangga] = useState<'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana'>(
    currentUser.sangga || 'Perintis'
  );

  const activeInfo = SANGGA_DATA.find(s => s.nama === selectedSangga) || SANGGA_DATA[0];
  const sanggaMembers = allMembers.filter(m => m.sangga === selectedSangga);

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#e51c24] flex items-center justify-center border border-red-200 shadow-xs shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono tracking-wider">
              Satuan Terkecil Penegak
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Sangga Ambalan La Surullah
            </h1>
            <p className="text-xs text-slate-500">
              Sangga Anda: <strong className="text-[#e51c24]">Sangga {currentUser.sangga}</strong>
            </p>
          </div>
        </div>

        {/* 5 Sangga Selector Tabs */}
        <div className="grid grid-cols-5 gap-1.5 mt-4 pt-3 border-t border-slate-100">
          {SANGGA_DATA.map((s) => {
            const isSelected = selectedSangga === s.nama;
            const isUserSangga = currentUser.sangga === s.nama;

            return (
              <button
                key={s.nama}
                onClick={() => setSelectedSangga(s.nama)}
                className={`py-2 px-1 rounded-xl text-center transition-all relative ${
                  isSelected
                    ? 'bg-[#e51c24] text-white shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold'
                }`}
              >
                <span className="text-xs block truncate">{s.nama}</span>
                {isUserSangga && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto mt-0.5 block" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Sangga Aktif */}
      <div className={`bg-white rounded-2xl p-5 border-2 ${activeInfo.borderColor} shadow-xs space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black ${activeInfo.iconBg}`}>
                Sangga {activeInfo.nama}
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold">
                Warna: {activeInfo.warna}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mt-2">
              {activeInfo.arti}
            </h2>
          </div>
        </div>

        {/* Filosofi & Tugas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
              Filosofi Perjuangan:
            </span>
            <p className="text-slate-700 leading-relaxed">
              {activeInfo.filosofi}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
              Tugas & Karakteristik:
            </span>
            <p className="text-slate-700 leading-relaxed">
              {activeInfo.tugas}
            </p>
          </div>
        </div>

        {/* Daftar Anggota Sangga */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#e51c24]" />
              <span>Daftar Anggota Sangga {activeInfo.nama} ({sanggaMembers.length})</span>
            </h3>
          </div>

          {sanggaMembers.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Belum ada anggota yang terdaftar di Sangga {activeInfo.nama}.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {sanggaMembers.map((m) => (
                <div
                  key={m.uid || m.username}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <strong className="text-slate-900 block truncate">{m.nama}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {m.jabatan || 'Anggota Sangga'} • {m.tingkat}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-600 shrink-0">
                    Gudep {m.gudep}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
