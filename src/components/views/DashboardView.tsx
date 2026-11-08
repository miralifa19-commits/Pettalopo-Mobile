import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  X, 
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Award
} from 'lucide-react';
import { ProgramKerjaItem } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { formatAgendaDate, parseAgendaDate } from '../../utils/agendaDate';

interface DashboardViewProps {
  programKerjaList: ProgramKerjaItem[];
  onNavigateToProgramKerja?: () => void;
  onBack?: () => void;
  isAdmin?: boolean;
  activeKegiatan?: import('../../types').ActiveKegiatanSession | null;
  onStopKegiatan?: () => void;
  onSharePresensi?: (item: ProgramKerjaItem) => void;
  onOpenPresensiModal?: (kegiatanId?: string) => void;
  initialSelectedAgendaId?: string | null;
  initialSelectedMonthIndex?: number;
  onAgendaDetailOpened?: () => void;
}

const MONTH_PALETTES = [
  { index: 0, name: 'Januari', start: '#9F1239', end: '#E11D48', tagBg: '#FFE4E6', tagText: '#9F1239' },
  { index: 1, name: 'Februari', start: '#C2410C', end: '#F97316', tagBg: '#FFEDD5', tagText: '#C2410C' },
  { index: 2, name: 'Maret', start: '#B45309', end: '#F59E0B', tagBg: '#FEF3C7', tagText: '#B45309' },
  { index: 3, name: 'April', start: '#4D7C0F', end: '#84CC16', tagBg: '#ECFCCB', tagText: '#4D7C0F' },
  { index: 4, name: 'Mei', start: '#166534', end: '#22C55E', tagBg: '#DCFCE7', tagText: '#166534' },
  { index: 5, name: 'Juni', start: '#0E7490', end: '#06B6D4', tagBg: '#CFFAFE', tagText: '#0E7490' },
  { index: 6, name: 'Juli', start: '#115E59', end: '#14B8A6', tagBg: '#CCFBF1', tagText: '#115E59' },
  { index: 7, name: 'Agustus', start: '#1E3A8A', end: '#3B82F6', tagBg: '#DBEAFE', tagText: '#1E3A8A' },
  { index: 8, name: 'September', start: '#3730A3', end: '#8B5CF6', tagBg: '#EDE9FE', tagText: '#3730A3' },
  { index: 9, name: 'Oktober', start: '#581C87', end: '#A855F7', tagBg: '#F3E8FF', tagText: '#581C87' },
  { index: 10, name: 'November', start: '#831843', end: '#BE185D', tagBg: '#FCE7F3', tagText: '#831843' },
  { index: 11, name: 'Desember', start: '#9D174D', end: '#EC4899', tagBg: '#FDF2F8', tagText: '#9D174D' }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  programKerjaList,
  onNavigateToProgramKerja,
  onBack,
  activeKegiatan,
  onStopKegiatan,
  onSharePresensi,
  onOpenPresensiModal,
  initialSelectedAgendaId,
  initialSelectedMonthIndex,
  onAgendaDetailOpened
}) => {
  const today = useMemo(() => new Date(), []);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(initialSelectedMonthIndex ?? today.getMonth());

  useEffect(() => {
    if (typeof initialSelectedMonthIndex === 'number') setSelectedMonthIndex(initialSelectedMonthIndex);
  }, [initialSelectedMonthIndex]);
  const [viewMode, setViewMode] = useState<'per_bulan' | 'semua_12_bulan'>('per_bulan');
  const [activeTab, setActiveTab] = useState<'Semua' | 'Kegiatan' | 'Latihan Rutin'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ProgramKerjaItem | null>(null);

  useEffect(() => {
    if (!initialSelectedAgendaId) return;
    const agenda = programKerjaList.find((item) => item.id === initialSelectedAgendaId);
    if (agenda) setSelectedItem(agenda);
    onAgendaDetailOpened?.();
  }, [initialSelectedAgendaId, programKerjaList, onAgendaDetailOpened]);

  // Map each month with its corresponding items from programKerjaList
  const monthsData = useMemo(() => {
    return MONTH_PALETTES.map((pal) => {
      const items = programKerjaList.filter((item) => {
        // Match by bulan string or parsed date
        const matchName = item.bulan?.toLowerCase() === pal.name.toLowerCase();
        const date = parseAgendaDate(item.waktuPelaksanaan);
        const matchMonthIndex = date ? date.getMonth() === pal.index : false;
        const matchesMonth = matchName || matchMonthIndex;

        const matchesTab = activeTab === 'Semua' || (item.tipe || 'Kegiatan') === activeTab;
        const matchesSearch = !searchQuery.trim() || (item.nama || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesMonth && matchesTab && matchesSearch;
      });

      return {
        ...pal,
        items
      };
    });
  }, [programKerjaList, activeTab, searchQuery]);

  const currentMonthData = monthsData[selectedMonthIndex] || monthsData[0];

  return (
    <div className="space-y-4 pb-28 font-sans">
      <MenuHeaderCard
        title="Lihat Kegiatan"
        subtitle="Daftar lengkap program kerja 12 bulan masa bakti"
        onBack={onBack || (() => {})}
      />

      {/* Mode View Switcher: Per Bulan vs 12 Bulan Penuh */}
      <div className="flex items-center justify-between gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => setViewMode('per_bulan')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all ${
            viewMode === 'per_bulan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 Tampilan Per Bulan
        </button>
        <button
          type="button"
          onClick={() => setViewMode('semua_12_bulan')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all ${
            viewMode === 'semua_12_bulan' ? 'bg-[#c81e28] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🌈 12 Bulan Berwarna
        </button>
      </div>

      {/* 12-MONTH HORIZONTAL PILL STRIP */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs select-none">
        {MONTH_PALETTES.map((pal) => {
          const isSelected = selectedMonthIndex === pal.index && viewMode === 'per_bulan';
          return (
            <button
              key={pal.name}
              type="button"
              onClick={() => {
                setSelectedMonthIndex(pal.index);
                setViewMode('per_bulan');
              }}
              style={{
                background: isSelected 
                  ? `linear-gradient(135deg, ${pal.start}, ${pal.end})` 
                  : pal.tagBg,
                color: isSelected ? '#ffffff' : pal.tagText
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all shadow-xs ${
                isSelected ? 'scale-105 ring-2 ring-white shadow-md' : 'opacity-85 hover:opacity-100'
              }`}
            >
              {pal.name}
            </button>
          );
        })}
      </div>

      {/* FILTER TIPE KEGIATAN & PENCARIAN */}
      <section className="agenda-controls">
        <label className="agenda-search">
          <span className="sr-only">Cari agenda</span>
          <input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Cari kegiatan atau latihan..." 
          />
        </label>
        <div className="agenda-tabs" role="tablist" aria-label="Jenis agenda">
          <button 
            type="button" 
            role="tab" 
            aria-selected={activeTab === 'Semua'} 
            className={activeTab === 'Semua' ? 'active' : ''} 
            onClick={() => setActiveTab('Semua')}
          >
            Semua
          </button>
          <button 
            type="button" 
            role="tab" 
            aria-selected={activeTab === 'Kegiatan'} 
            className={activeTab === 'Kegiatan' ? 'active' : ''} 
            onClick={() => setActiveTab('Kegiatan')}
          >
            Kegiatan
          </button>
          <button 
            type="button" 
            role="tab" 
            aria-selected={activeTab === 'Latihan Rutin'} 
            className={activeTab === 'Latihan Rutin' ? 'active' : ''} 
            onClick={() => setActiveTab('Latihan Rutin')}
          >
            Latihan Rutin
          </button>
        </div>
      </section>

      {/* KARTU KEGIATAN SEDANG DILAKSANAKAN (LIVE SESSION) */}
      {activeKegiatan && activeKegiatan.isRunning && (
        <div className="bg-red-50 border-2 border-[#e51c24] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-[#e51c24] font-mono tracking-wider">
                Sedang Dilaksanakan
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#e51c24] text-white text-[10px] font-mono font-black">
              LIVE AKTIF
            </span>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {activeKegiatan.kegiatanNama}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {activeKegiatan.waktuPelaksanaan} • {activeKegiatan.tipe} {activeKegiatan.tempat ? `• ${activeKegiatan.tempat}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => onOpenPresensiModal && onOpenPresensiModal(activeKegiatan.kegiatanId)}
              className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>📋</span>
              <span>Isi Presensi & Evaluasi</span>
            </button>
            {onStopKegiatan && (
              <button
                onClick={onStopKegiatan}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <span>⏹️ Selesai</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: SINGLE MONTH FOCUS DENGAN BANNER WARNA DINAMIS */}
      {/* ======================================================== */}
      {viewMode === 'per_bulan' && (
        <div className="space-y-3">
          {/* Vibrant Month Banner Card */}
          <div
            className="overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-all"
            style={{
              background: `linear-gradient(135deg, ${currentMonthData.start} 0%, ${currentMonthData.end} 100%)`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/80">
                  PROGRAM KERJA AMBALAN
                </span>
                <h3 className="text-2xl font-black mt-0.5 tracking-tight">
                  {currentMonthData.name}
                </h3>
                <p className="text-xs font-semibold text-white/90 mt-1">
                  {currentMonthData.items.length} Agenda ({currentMonthData.items.filter(i => (i.tipe || 'Kegiatan') === 'Kegiatan').length} Kegiatan, {currentMonthData.items.filter(i => i.tipe === 'Latihan Rutin').length} Latihan)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMonthIndex(i => (i === 0 ? 11 : i - 1))}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30 text-white"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonthIndex(i => (i === 11 ? 0 : i + 1))}
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30 text-white"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Agenda List for current month */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs divide-y divide-slate-100">
            {currentMonthData.items.length > 0 ? (
              currentMonthData.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        (item.tipe || 'Kegiatan') === 'Kegiatan'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.tipe || 'Kegiatan'}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {item.waktuPelaksanaan}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      {item.nama}
                    </h4>
                    {item.tempat && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin size={11} className="shrink-0 text-slate-400" />
                        <span className="truncate">{item.tempat}</span>
                      </span>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <CalendarDays size={28} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">Tidak ada agenda pada bulan {currentMonthData.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: SEMUA 12 BULAN BERWARNA (FULL 12-MONTH CAROUSEL) */}
      {/* ======================================================== */}
      {viewMode === 'semua_12_bulan' && (
        <div className="space-y-4">
          {monthsData.map((month) => (
            <div 
              key={month.name}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Colorful Banner Header for this Month */}
              <div
                className="p-4 text-white"
                style={{
                  background: `linear-gradient(135deg, ${month.start} 0%, ${month.end} 100%)`
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/80">
                      BULAN KE-{month.index + 1}
                    </span>
                    <h3 className="text-xl font-black tracking-tight">{month.name}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold text-white">
                    {month.items.length} Agenda
                  </span>
                </div>
              </div>

              {/* Items in Month */}
              <div className="divide-y divide-slate-100 p-2">
                {month.items.length > 0 ? (
                  month.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            (item.tipe || 'Kegiatan') === 'Kegiatan'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {item.tipe || 'Kegiatan'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.waktuPelaksanaan}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                          {item.nama}
                        </h4>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    </div>
                  ))
                ) : (
                  <p className="py-3 text-center text-[11px] text-slate-400 font-medium">
                    Belum ada agenda terdaftar
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL PROGRAM KERJA (VIEW-ONLY, EDIT ONLY IN DEWAN)*/}
      {/* ======================================================== */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
            {/* Modal Header */}
            <div className="bg-[#c81e28] text-white p-5 border-b border-red-700 relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
                aria-label="Tutup Rincian"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white text-slate-950 font-mono">
                  {selectedItem.tipe || 'Kegiatan'}
                </span>
                <span className="text-xs text-red-100 font-bold">
                  Bulan {selectedItem.bulan}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black leading-snug mt-1 pr-6">
                {selectedItem.nama}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Pelaksanaan</span>
                  <span className="font-extrabold text-slate-900">{selectedItem.waktuPelaksanaan}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {selectedItem.status || 'Direncanakan'}
                </span>
              </div>

              {selectedItem.deskripsi && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Deskripsi & Tujuan</span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedItem.deskripsi}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Lokasi / Tempat</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedItem.tempat || 'Pangkalan Gudep'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Sasaran Peserta</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedItem.sasaran || 'Seluruh Anggota'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimasi Anggaran</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedItem.anggaran || '-'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Penanggung Jawab</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{selectedItem.penanggungJawab || 'Dewan Ambalan'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                🔒 <strong>Info:</strong> Perubahan atau pengeditan program kerja hanya dapat dilakukan oleh pengurus melalui menu <strong>Dewan Ambalan</strong>.
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
