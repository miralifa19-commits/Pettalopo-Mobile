import React, { useState } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  X, 
  ArrowRight,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { ProgramKerjaItem } from '../../types';

interface DashboardViewProps {
  programKerjaList: ProgramKerjaItem[];
  onNavigateToProgramKerja: () => void;
}

const INDONESIA_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  programKerjaList,
  onNavigateToProgramKerja
}) => {
  // Current Month calculation
  const now = new Date();
  const currentMonthName = INDONESIA_MONTHS[now.getMonth()]; // e.g. "Oktober"
  const currentYear = now.getFullYear();

  // Option to show only this month vs all activities
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Selected item for Detailed Modal
  const [selectedItem, setSelectedItem] = useState<ProgramKerjaItem | null>(null);

  // Sort by scout school year (Juli = 1 ... Juni = 12)
  const sortedList = [...programKerjaList].sort(
    (a, b) => (a.bulanUrutan || 1) - (b.bulanUrutan || 1)
  );

  // Items for this current month
  const currentMonthItems = sortedList.filter(
    (item) => item.bulan?.toLowerCase() === currentMonthName.toLowerCase()
  );

  // Display list: only this month by default, or all if toggled via icon
  const displayedList = showAllActivities ? sortedList : currentMonthItems;

  return (
    <div className="space-y-4 pb-28 font-sans">

      {/* 2. Header: Cukup tulisan "Kegiatan dan Latihan" & dibawahnya bulan saat ini */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Kegiatan dan Latihan
        </h1>
        <p className="text-xs sm:text-sm font-bold text-[#e51c24] mt-0.5">
          {showAllActivities ? 'Semua Bulan (Tahun Ajaran 2026/2027)' : `Bulan ${currentMonthName} ${currentYear}`}
        </p>
      </div>

      {/* 3. Daftar Program (Hanya bulan ini secara default, atau semua jika ikon diklik) */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">
              Tidak ada agenda di Bulan {currentMonthName}
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Gunakan tombol ikon di bawah untuk melihat seluruh kegiatan tahunan.
            </p>
          </div>
        ) : (
          displayedList.map((item) => {
            const isKegiatan = (item.tipe || 'Kegiatan') === 'Kegiatan';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                  isKegiatan
                    ? 'border-l-4 border-l-[#e51c24] border-slate-200 hover:border-amber-400'
                    : 'border-l-4 border-l-amber-400 border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Left: Clean Date & Title */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-slate-900 font-mono tracking-wider border border-amber-300">
                        {item.bulan || currentMonthName}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 font-mono">
                        {item.waktuPelaksanaan}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#e51c24] transition-colors leading-snug truncate">
                      {item.nama}
                    </h3>

                    <p className="text-[11px] text-slate-500 font-normal">
                      PJ: <strong>{item.penanggungJawab}</strong> • Sasaran: {item.sasaran}
                    </p>
                  </div>

                  {/* Right: Status Pill & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      item.status === 'Terlaksana'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : item.status === 'Berjalan'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : item.status === 'Tidak Terlaksana'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {item.status}
                    </span>

                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 group-hover:bg-[#e51c24] group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Opsi untuk menampilkan semua kegiatan (Anggaplah ikon saja, tidak perlu pakai tulisan) */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => setShowAllActivities(!showAllActivities)}
          title={showAllActivities ? 'Tampilkan Hanya Bulan Ini' : 'Tampilkan Semua Kegiatan & Latihan'}
          aria-label="Tampilkan semua kegiatan dan latihan"
          className="w-12 h-12 rounded-2xl bg-[#e51c24] hover:bg-[#c9141b] text-white flex items-center justify-center shadow-md border border-red-700 transition-all active:scale-95 hover:rotate-180 duration-300"
        >
          {showAllActivities ? (
            <ChevronUp className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <Layers className="w-6 h-6 stroke-[2.2]" />
          )}
        </button>
      </div>

      {/* 5. MODAL RINCIAN PROGRAM KERJA (PROGRESSIVE DISCLOSURE) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#e51c24] to-[#c9141b] text-white p-5 border-b border-red-700 relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-amber-300 transition-colors"
                aria-label="Tutup Rincian"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono">
                  {selectedItem.tipe || 'Kegiatan'}
                </span>
                <span className="text-xs text-amber-200 font-mono font-bold">
                  Bulan {selectedItem.bulan}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black leading-snug mt-1 pr-6">
                {selectedItem.nama}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Status & Timing Strip */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">
                    Jadwal Waktu:
                  </span>
                  <span className="font-extrabold text-slate-900 text-xs">
                    {selectedItem.waktuPelaksanaan}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">
                    Status Pelaksanaan:
                  </span>
                  <span className={`inline-block font-black text-xs px-2.5 py-0.5 rounded-full border mt-0.5 ${
                    selectedItem.status === 'Terlaksana'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : selectedItem.status === 'Berjalan'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : selectedItem.status === 'Tidak Terlaksana'
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>

              {/* Deskripsi Lengkap */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
                  Deskripsi & Tujuan Agenda
                </h4>
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 text-slate-700 leading-relaxed font-normal">
                  {selectedItem.deskripsi || 'Tidak ada catatan tambahan untuk kegiatan ini.'}
                </div>
              </div>

              {/* Rincian Operasional & Tanggung Jawab */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">
                    Penanggung Jawab:
                  </span>
                  <strong className="text-slate-900 block font-bold">
                    {selectedItem.penanggungJawab}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">
                    Sasaran Peserta:
                  </span>
                  <strong className="text-slate-900 block font-bold">
                    {selectedItem.sasaran}
                  </strong>
                </div>
              </div>

              {/* Location & Uniform if any */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">
                    Tempat / Lokasi:
                  </span>
                  <span className="text-slate-800 font-medium block">
                    {selectedItem.tempat || 'Pangkalan Gudep 10-035/10-036'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">
                    Ketentuan Seragam:
                  </span>
                  <span className="text-slate-800 font-medium block">
                    {selectedItem.seragam || 'Seragam Pramuka Lengkap'}
                  </span>
                </div>
              </div>

              {/* Anggaran */}
              {selectedItem.anggaran && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800">Estimasi Anggaran:</span>
                  <strong className="font-mono text-emerald-950 text-sm">{selectedItem.anggaran}</strong>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Tutup Rincian
                </button>

                <button
                  onClick={() => {
                    setSelectedItem(null);
                    onNavigateToProgramKerja();
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-[#e51c24] hover:bg-[#c9141b] text-white font-black text-xs shadow-md border border-red-700 transition-all flex items-center gap-1.5"
                >
                  <span>Buka di Program Kerja</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
