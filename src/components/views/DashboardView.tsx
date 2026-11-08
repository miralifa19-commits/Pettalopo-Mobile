import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  X, 
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Award
} from 'lucide-react';
import { ProgramKerjaItem } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { parseAgendaDate } from '../../utils/agendaDate';

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
  onAgendaDetailOpened
}) => {
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

        const itemType = (item.tipe || 'Kegiatan').toLowerCase();
        const isKegiatan = itemType === 'kegiatan' || itemType.includes('partisipasi') || (item as any).kategori === 'partisipasi';
        const isLatihan = itemType.includes('latihan');
        const matchesTab = activeTab === 'Semua' || (activeTab === 'Kegiatan' ? isKegiatan : isLatihan);
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
      <div className="w-full rounded-2xl bg-[#C41E2A] text-white px-4 py-4 text-center shadow-sm">
        <h1 className="text-base sm:text-lg font-extrabold tracking-wide">Program Kegiatan dan Latihan Rutin</h1>
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

      {/* 12 Kartu Bulanan — isi mengikuti format kartu agenda di Home */}
      <div className="grid grid-cols-1 gap-3">
        {monthsData.map((month) => {
          const categories = [
            {
              title: 'Kegiatan',
              match: (item: ProgramKerjaItem) =>
                (item.tipe || 'Kegiatan') === 'Kegiatan' ||
                (item.tipe || '').toLowerCase().includes('partisipasi') ||
                (item as any).kategori === 'partisipasi'
            },
            {
              title: 'Latihan Rutin',
              match: (item: ProgramKerjaItem) => (item.tipe || '').toLowerCase().includes('latihan')
            }
          ];

          return (
            <section key={month.name} className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
                <h3 className="text-base font-bold text-slate-800 leading-snug">{month.name}</h3>
                <span className="shrink-0 text-[10px] font-bold text-slate-500">
                  {month.items.length} agenda
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {categories.map((category) => {
                  const entries = month.items.filter(category.match);

                  return (
                    <div key={category.title} className="py-3">
                      <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                        category.title === 'Latihan Rutin'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-[#B91C2B]'
                      }`}>
                        {category.title}
                      </span>

                      {entries.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {entries.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="block w-full rounded-lg px-1 py-1 text-left text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap break-words active:bg-slate-50"
                            >
                              {item.nama}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-[13px] text-slate-400">-</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

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
