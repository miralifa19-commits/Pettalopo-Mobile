import React, { useState } from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Navigation, 
  Calendar,
  ChevronRight
} from 'lucide-react';
import { ProgramKerjaItem } from '../types';

export const BULAN_LIST = [
  { nama: 'Juli', urutan: 1 },
  { nama: 'Agustus', urutan: 2 },
  { nama: 'September', urutan: 3 },
  { nama: 'Oktober', urutan: 4 },
  { nama: 'November', urutan: 5 },
  { nama: 'Desember', urutan: 6 },
  { nama: 'Januari', urutan: 7 },
  { nama: 'Februari', urutan: 8 },
  { nama: 'Maret', urutan: 9 },
  { nama: 'April', urutan: 10 },
  { nama: 'Mei', urutan: 11 },
  { nama: 'Juni', urutan: 12 }
];

interface PetaPerjalananProkerProps {
  programKerjaList: ProgramKerjaItem[];
  onNavigateToProgramKerja: () => void;
}

export const PetaPerjalananProker: React.FC<PetaPerjalananProkerProps> = ({
  programKerjaList,
  onNavigateToProgramKerja
}) => {
  // Bulan posisi saat ini (Default: 4 = Oktober)
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(4);

  // WAJIB MENGURUTKAN BULAN DARI JULI (1) KE JUNI (12)
  const sortedProker = [...programKerjaList].sort((a, b) => {
    return (a.bulanUrutan || 1) - (b.bulanUrutan || 1);
  });

  const currentMonthName = BULAN_LIST.find(b => b.urutan === currentMonthIndex)?.nama || 'Oktober';

  // Kelompokkan kegiatan berdasarkan bulan agar bulan menjadi header utama yang BOLD dan NAIK KE ATAS
  const prokerByMonth: { [key: number]: { bulan: string; urutan: number; items: ProgramKerjaItem[] } } = {};
  
  // Ambil hanya bulan yang memiliki kegiatan, diurutkan dari Juli ke Juni
  sortedProker.forEach(item => {
    const urutan = item.bulanUrutan || 1;
    if (!prokerByMonth[urutan]) {
      prokerByMonth[urutan] = {
        bulan: item.bulan || BULAN_LIST.find(b => b.urutan === urutan)?.nama || 'Juli',
        urutan,
        items: []
      };
    }
    prokerByMonth[urutan].items.push(item);
  });

  const monthGroups = Object.values(prokerByMonth).sort((a, b) => a.urutan - b.urutan);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-400 shadow-md space-y-4">
      
      {/* Header Peta Perjalanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-red-100 text-[#e51c24]">
              <Navigation className="w-4 h-4 fill-current" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono">
              Rute Terurut (Juli s.d. Juni)
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
            Peta Perjalanan Program Kerja
          </h2>
          <p className="text-xs text-slate-500">
            Jalur alur kegiatan tahunan terurut per bulan dari atas ke bawah
          </p>
        </div>

        {/* Pemilih Posisi Bulan Berjalan */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <MapPin className="w-4 h-4 text-[#e51c24] animate-bounce" />
            <span className="text-slate-700">Posisi Saat Ini:</span>
            <select
              value={currentMonthIndex}
              onChange={(e) => setCurrentMonthIndex(Number(e.target.value))}
              className="bg-transparent font-black text-[#e51c24] cursor-pointer focus:outline-none"
              title="Pilih posisi bulan saat ini untuk simulasi alur"
            >
              {BULAN_LIST.map((b) => (
                <option key={b.urutan} value={b.urutan}>
                  Bulan {b.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Indikator Status Jalur (Garis Kuning Tua vs Abu-abu) */}
      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {/* Garis Kuning Tua = Sudah Terlewati */}
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0 border-t-2 border-dashed border-amber-600 font-black"></span>
            <span className="text-amber-800 font-bold">Jalur Terlewati (s.d. {currentMonthName})</span>
          </div>
          {/* Garis Abu-abu = Belum Terlewati */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-6 h-0 border-t-2 border-dashed border-slate-300 font-black"></span>
            <span className="text-slate-400 font-medium">Jalur Mendatang</span>
          </div>
        </div>

        <span className="text-[10px] text-slate-500">
          Total: <strong>{sortedProker.length}</strong> Agenda Terjadwal
        </span>
      </div>

      {/* RUTE PERJALANAN DARI ATAS KE BAWAH DENGAN BULAN DI ATAS & BOLD */}
      {monthGroups.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/20 space-y-2">
          <Navigation className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            Peta Rute Masih Kosong
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Tambahkan kegiatan di menu Program Kerja agar titik rute perjalanan terhubung otomatis terurut dari bulan Juli ke Juni.
          </p>
          <button
            onClick={onNavigateToProgramKerja}
            className="mt-1 px-4 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-bold shadow-xs border border-amber-400"
          >
            + Tambah Agenda Pertama
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 py-2 space-y-8">
          
          {/* Label Awal Rute */}
          <div className="relative -ml-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-[10px] font-black tracking-wider shadow-xs">
              START • BULAN JULI
            </span>
            <span className="text-[10px] text-slate-400">Awal Tahun Ajaran Ambalan</span>
          </div>

          {/* Render Kelompok Berdasarkan Bulan yang Dinaikkan & BOLD */}
          {monthGroups.map((group, groupIndex) => {
            const isGroupPassedOrCurrent = group.urutan <= currentMonthIndex;
            const isGroupCurrent = group.urutan === currentMonthIndex;
            const isNextGroupPassed = groupIndex < monthGroups.length - 1 && monthGroups[groupIndex + 1].urutan <= currentMonthIndex;

            return (
              <div key={group.urutan} className="relative">
                
                {/* GARIS PUTUS-PUTUS KE KELOMPOK BULAN BERIKUTNYA */}
                {groupIndex < monthGroups.length - 1 && (
                  <div
                    className={`absolute left-[-16px] sm:left-[-18px] top-6 bottom-[-32px] w-0 border-l-[3px] border-dashed transition-colors duration-500 ${
                      isNextGroupPassed ? 'border-amber-600' : 'border-slate-300'
                    }`}
                  />
                )}

                {/* BULAN DINAIKKAN, BOLD & MENCOROK (Header Penanda Rute) */}
                <div className="relative flex items-center gap-2.5 mb-3">
                  {/* Titik Node Rute Bulan */}
                  <div
                    className={`absolute left-[-23px] sm:left-[-25px] w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                      isGroupPassedOrCurrent
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100 border-2 border-white'
                        : 'bg-slate-300 text-slate-600 ring-2 ring-slate-100 border-2 border-white'
                    } ${isGroupCurrent ? 'scale-120 animate-pulse ring-amber-300' : ''}`}
                  >
                    <span className="text-[10px] font-mono font-black">{group.urutan}</span>
                  </div>

                  {/* TEKS BULAN BESAR & BOLD DI ATAS KEGIATAN */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-wider uppercase font-mono bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 shadow-xs">
                      BULAN {group.bulan}
                    </h3>

                    {isGroupCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e51c24] text-white font-mono shadow-xs animate-bounce">
                        📍 Posisi Saat Ini
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-mono">
                      ({group.items.length} Agenda)
                    </span>
                  </div>
                </div>

                {/* KARTU KEGIATAN DI BAWAH NAMA BULAN */}
                <div className="space-y-2.5 pl-1">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border-2 transition-all shadow-xs bg-white ${
                        isGroupPassedOrCurrent
                          ? 'border-amber-400/80 hover:border-amber-500'
                          : 'border-slate-200 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                              📅 {item.waktuPelaksanaan}
                            </span>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {item.tipe}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 leading-snug">
                            {item.nama}
                          </h4>
                        </div>

                        {/* STATUS: TERLAKSANA / TIDAK TERLAKSANA / DLL */}
                        <div className="shrink-0 text-right">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border inline-flex items-center gap-1 shadow-xs ${
                            item.status === 'Terlaksana'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : item.status === 'Tidak Terlaksana'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : item.status === 'Berjalan'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}>
                            {item.status === 'Terlaksana' && <CheckCircle2 className="w-3 h-3" />}
                            {item.status === 'Tidak Terlaksana' && <XCircle className="w-3 h-3" />}
                            {item.status === 'Berjalan' && <Clock className="w-3 h-3" />}
                            {item.status === 'Direncanakan' && <AlertCircle className="w-3 h-3" />}
                            <span>{item.status}</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                        {item.deskripsi}
                      </p>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span>PJ: <strong className="text-slate-600">{item.penanggungJawab}</strong></span>
                        <span className="font-mono">
                          {isGroupPassedOrCurrent ? '✓ Jalur Terlewati' : '⏳ Jalur Mendatang'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}

          {/* Label Akhir Rute */}
          <div className="relative -ml-4 flex items-center gap-2 pt-2">
            <span className="px-3 py-1 rounded-full bg-[#e51c24] text-white font-mono text-[10px] font-black tracking-wider shadow-xs">
              FINISH • BULAN JUNI
            </span>
            <span className="text-[10px] text-slate-400">Tutup Tahun Ajaran & Pelaporan Ambalan</span>
          </div>

        </div>
      )}

    </div>
  );
};
