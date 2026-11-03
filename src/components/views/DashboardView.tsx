import React, { useEffect, useState } from 'react';
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
import { SusunKegiatanModal } from '../dashboard/SusunKegiatanModal';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { formatAgendaDate, parseAgendaDate } from '../../utils/agendaDate';

interface DashboardViewProps {
  programKerjaList: ProgramKerjaItem[];
  onNavigateToProgramKerja: () => void;
  onBack?: () => void;
  isAdmin?: boolean;
  onAddProgramKerja?: (item: ProgramKerjaItem) => void;
  activeKegiatan?: import('../../types').ActiveKegiatanSession | null;
  onStopKegiatan?: () => void;
  onSharePresensi?: (item: ProgramKerjaItem) => void;
  onOpenPresensiModal?: (kegiatanId?: string) => void;
  initialSelectedAgendaId?: string | null;
  onAgendaDetailOpened?: () => void;
}

const INDONESIA_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  programKerjaList,
  onNavigateToProgramKerja,
  onBack,
  isAdmin = false,
  onAddProgramKerja,
  activeKegiatan,
  onStopKegiatan,
  onSharePresensi,
  onOpenPresensiModal,
  initialSelectedAgendaId,
  onAgendaDetailOpened
}) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;

  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activeTab, setActiveTab] = useState<'Kegiatan' | 'Latihan Rutin'>('Kegiatan');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ProgramKerjaItem | null>(null);
  const [showSusunModal, setShowSusunModal] = useState(false);

  useEffect(() => {
    if (!initialSelectedAgendaId) return;
    const agenda = programKerjaList.find((item) => item.id === initialSelectedAgendaId);
    if (agenda) setSelectedItem(agenda);
    onAgendaDetailOpened?.();
  }, [initialSelectedAgendaId, programKerjaList, onAgendaDetailOpened]);

  const upcomingItems = programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) =>
      entry.date &&
      entry.date >= now &&
      (entry.item.tipe || 'Kegiatan') === activeTab &&
      (entry.item.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .map((entry) => entry.item);

  const groupedMonths: { month: string; monthKey: string; items: ProgramKerjaItem[] }[] = [];
  upcomingItems.forEach((item) => {
    const date = parseAgendaDate(item.waktuPelaksanaan);
    if (!date) return;
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    let group = groupedMonths.find((entry) => entry.monthKey === monthKey);
    if (!group) {
      group = {
        month: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date),
        monthKey,
        items: []
      };
      groupedMonths.push(group);
    }
    group.items.push(item);
  });

  return (
    <div className="space-y-4 pb-28 font-sans">

      {/* Header Card dengan Tombol Kembali Melingkar */}
      <MenuHeaderCard
        title="Kegiatan & Latihan"
        subtitle="Agenda ambalan selama 1 masa bakti"
        onBack={onBack || (() => {})}
        actionRight={
          isAdmin && onAddProgramKerja ? (
            <button
              onClick={() => setShowSusunModal(true)}
              className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[11px] font-bold border border-white/30 transition-all shrink-0 cursor-pointer"
              title="Susun kegiatan dari contoh katalog"
            >
              Susun Kegiatan
            </button>
          ) : undefined
        }
      />

      <section className="agenda-controls">
        <label className="agenda-search"><span className="sr-only">Cari agenda</span><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari kegiatan atau latihan..." /></label>
        <div className="agenda-tabs" role="tablist" aria-label="Jenis agenda">
          <button type="button" role="tab" aria-selected={activeTab === 'Kegiatan'} className={activeTab === 'Kegiatan' ? 'active' : ''} onClick={() => setActiveTab('Kegiatan')}>Kegiatan</button>
          <button type="button" role="tab" aria-selected={activeTab === 'Latihan Rutin'} className={activeTab === 'Latihan Rutin' ? 'active' : ''} onClick={() => setActiveTab('Latihan Rutin')}>Latihan Rutin</button>
        </div>
      </section>

      {/* KARTU KEGIATAN SEDANG DILAKSANAKAN (LIVE SESSION) */}
      {activeKegiatan && activeKegiatan.isRunning && (
        <div className="bg-red-50 border-2 border-[#e51c24] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 animate-in zoom-in-95 duration-150">
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
              onClick={() => {
                const item = programKerjaList.find((p) => p.id === activeKegiatan.kegiatanId);
                if (item && onSharePresensi) {
                  onSharePresensi(item);
                } else if (onSharePresensi) {
                  onSharePresensi({
                    id: activeKegiatan.kegiatanId,
                    nama: activeKegiatan.kegiatanNama,
                    tipe: activeKegiatan.tipe,
                    waktuPelaksanaan: activeKegiatan.waktuPelaksanaan,
                    bulan: 'Aktif',
                    bulanUrutan: 1,
                    sasaran: 'Seluruh Anggota',
                    penanggungJawab: 'Dewan Ambalan',
                    status: 'Berjalan',
                    deskripsi: 'Kegiatan sedang berlangsung'
                  });
                }
              }}
              className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-[#e51c24] hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>📢</span>
              <span>Bagikan Presensi</span>
            </button>

            <button
              onClick={() => onOpenPresensiModal && onOpenPresensiModal(activeKegiatan.kegiatanId)}
              className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>📋</span>
              <span>Isi Presensi & Evaluasi</span>
            </button>

            {isAdmin && onStopKegiatan && (
              <button
                onClick={onStopKegiatan}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors cursor-pointer"
                title="Hentikan / Selesaikan Sesi Kegiatan Ini"
              >
                <span>⏹️ Selesai</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {groupedMonths.length === 0 ? (
          <div className="agenda-empty-state">
            <CalendarDays size={22} />
            <strong>{searchQuery ? 'Tidak ada agenda yang cocok' : 'Belum ada agenda mendatang'}</strong>
            <span>{searchQuery ? 'Coba kata kunci lain.' : 'Agenda berikutnya akan muncul di sini.'}</span>
          </div>
        ) : groupedMonths.map(({ month, monthKey, items }) => {
          const isCurrentMonth = monthKey === currentMonthKey;
          return (
            <section key={monthKey} className="agenda-month-card">
              <div className={`agenda-month-heading ${isCurrentMonth ? 'is-current' : ''}`}>
                <strong>{month}</strong>
                {isCurrentMonth && <span>BULAN INI</span>}
                <small>{items.length} agenda</small>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <button type="button" key={item.id} onClick={() => setSelectedItem(item)} className="agenda-row">
                    <span className="agenda-row-copy">
                      <strong>{item.nama}</strong>
                      <small>{formatAgendaDate(item.waktuPelaksanaan)}</small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* 5. MODAL RINCIAN PROGRAM KERJA (PROGRESSIVE DISCLOSURE) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#e51c24] text-white p-5 border-b border-red-700 relative">
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

              {/* Running Status & Action Strip in Modal */}
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800">Operasional Kegiatan:</span>
                  {activeKegiatan?.kegiatanId === selectedItem.id && activeKegiatan.isRunning ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-black text-[10px] animate-pulse">
                      🔴 SEDANG BERLANGSUNG
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">
                      Belum dijalankan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {activeKegiatan?.kegiatanId === selectedItem.id && activeKegiatan.isRunning ? (
                    <>
                      <button
                        onClick={() => onSharePresensi && onSharePresensi(selectedItem)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#e51c24] hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>📢</span>
                        <span>Bagikan Presensi</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItem(null);
                          if (onOpenPresensiModal) onOpenPresensiModal(selectedItem.id);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>📋</span>
                        <span>Isi Presensi</span>
                      </button>

                      {isAdmin && onStopKegiatan && (
                        <button
                          onClick={onStopKegiatan}
                          className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs"
                        >
                          ⏹️ Selesai
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-600 font-medium leading-relaxed block">
                        Pengaktifan kegiatan & latihan hanya dapat diaktifkan oleh Dewan Ambalan pada menu <strong>Kelola Program Kerja</strong>.
                      </span>
                    </div>
                  )}
                </div>
              </div>

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
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Buka di Program Kerja</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Modal Susun Kegiatan dari Contoh (Khusus Admin) */}
      {isAdmin && onAddProgramKerja && (
        <SusunKegiatanModal
          isOpen={showSusunModal}
          onClose={() => setShowSusunModal(false)}
          onAddKegiatan={(newItem) => {
            onAddProgramKerja(newItem);
          }}
        />
      )}

    </div>
  );
};
