import React, { useState, useMemo, useEffect } from 'react';
import { ProgramKerjaItem, KegiatanEvaluation, UserAccount } from '../../types';
import { subscribeToKegiatanEvaluations } from '../../services/firebaseService';
import { generateActivityReportWithAi, GeneratedReportNarrative } from '../../utils/aiReportGenerator';
import { ShiningAmbalanLogo } from '../common/ShiningAmbalanLogo';
import { MenuHeaderCard } from '../common/MenuHeaderCard';

interface LaporanViewProps {
  programKerjaList: ProgramKerjaItem[];
  currentUser: UserAccount;
  allMembers?: UserAccount[];
  onBack?: () => void;
}

type PeriodFilter = 'kegiatan' | 'triwulan' | 'masa_bakti';

type TriwulanRole = 'pradana' | 'pemangku_adat' | 'sekretaris' | 'bendahara';
interface TriwulanRoleDraft {
  uraian: string;
  kendala: string;
  tindakLanjut: string;
  saldoAwal: string;
  pemasukan: string;
  pengeluaran: string;
}
const EMPTY_TRIWULAN_DRAFT: TriwulanRoleDraft = {
  uraian: '', kendala: '', tindakLanjut: '', saldoAwal: '', pemasukan: '', pengeluaran: ''
};
const TRIWULAN_ROLE_META: Record<TriwulanRole, { label: string; subtitle: string }> = {
  pradana: { label: 'Pradana', subtitle: 'Koordinasi, pelaksanaan program kerja, dan evaluasi ambalan' },
  pemangku_adat: { label: 'Pemangku Adat', subtitle: 'Adat ambalan, ketertiban, kedisiplinan, dan pembinaan anggota' },
  sekretaris: { label: 'Sekretaris (Kerani)', subtitle: 'Administrasi, surat-menyurat, notulen, dan pengarsipan' },
  bendahara: { label: 'Bendahara (Juru Uang)', subtitle: 'Kas, pemasukan, pengeluaran, dan pertanggungjawaban keuangan' }
};

export const LaporanView: React.FC<LaporanViewProps> = ({
  programKerjaList,
  currentUser,
  allMembers = [],
  onBack
}) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('kegiatan');
  
  // Selected Activity for 'kegiatan' filter
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<string>(
    programKerjaList[0]?.id || ''
  );

  // Selected Triwulan (1: Jul-Sep, 2: Okt-Des, 3: Jan-Mar, 4: Apr-Jun)
  const [selectedTriwulan, setSelectedTriwulan] = useState<number>(1);

  // Live evaluations from Firebase & localStorage
  const [evaluations, setEvaluations] = useState<KegiatanEvaluation[]>(() => {
    const saved = localStorage.getItem('pettalopo_evaluations_list');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  // AI narrative state
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<GeneratedReportNarrative | null>(null);

  // PDF Preview Modal
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Laporan triwulan per jabatan. Catatan tersimpan lokal per jabatan dan periode.
  const [selectedRole, setSelectedRole] = useState<TriwulanRole>('pradana');
  const [roleDrafts, setRoleDrafts] = useState<Record<string, TriwulanRoleDraft>>(() => {
    try { return JSON.parse(localStorage.getItem('pettalopo_laporan_triwulan_jabatan_v1') || '{}'); }
    catch { return {}; }
  });
  const roleDraftKey = `${selectedTriwulan}:${selectedRole}`;
  const currentRoleDraft = { ...EMPTY_TRIWULAN_DRAFT, ...(roleDrafts[roleDraftKey] || {}) };
  const updateRoleDraft = (field: keyof TriwulanRoleDraft, value: string) => {
    setRoleDrafts((current) => ({
      ...current,
      [roleDraftKey]: { ...EMPTY_TRIWULAN_DRAFT, ...(current[roleDraftKey] || {}), [field]: value }
    }));
  };
  useEffect(() => {
    try { localStorage.setItem('pettalopo_laporan_triwulan_jabatan_v1', JSON.stringify(roleDrafts)); } catch {}
  }, [roleDrafts]);

  const quarterRange = [
    { start: 1, end: 3, year: 2026 },
    { start: 4, end: 6, year: 2026 },
    { start: 7, end: 9, year: 2027 },
    { start: 10, end: 12, year: 2027 }
  ][selectedTriwulan - 1];
  const quarterProgramKerja = useMemo(
    () => programKerjaList.filter((item) => item.bulanUrutan >= quarterRange.start && item.bulanUrutan <= quarterRange.end),
    [programKerjaList, quarterRange.start, quarterRange.end]
  );
  const quarterLetterArchive = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pettalopo_arsip_surat_resmi_v5') || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter((letter: { createdAt?: string }) => {
        if (!letter.createdAt) return false;
        const date = new Date(letter.createdAt);
        return !Number.isNaN(date.getTime())
          && date.getFullYear() === quarterRange.year
          && date.getMonth() + 1 >= quarterRange.start + 6
          && date.getMonth() + 1 <= quarterRange.end + 6;
      });
    } catch { return []; }
  }, [selectedTriwulan, quarterRange.year, quarterRange.start, quarterRange.end]);
  const parseRupiahInput = (value: string) => Number(value.replace(/[^0-9]/g, '')) || 0;
  const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(value);
  const financialClosingBalance = parseRupiahInput(currentRoleDraft.saldoAwal)
    + parseRupiahInput(currentRoleDraft.pemasukan)
    - parseRupiahInput(currentRoleDraft.pengeluaran);
  const hasFinancialEntries = Boolean(currentRoleDraft.saldoAwal || currentRoleDraft.pemasukan || currentRoleDraft.pengeluaran);

  // Subscribe to evaluations
  useEffect(() => {
    const unsubscribe = subscribeToKegiatanEvaluations((data) => {
      if (data && data.length > 0) {
        setEvaluations(data);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Selected Kegiatan Item
  const activeKegiatanItem = useMemo(() => {
    return programKerjaList.find((p) => p.id === selectedKegiatanId) || programKerjaList[0];
  }, [programKerjaList, selectedKegiatanId]);

  // Filtered evaluations according to selected period
  const filteredEvaluations = useMemo(() => {
    if (periodFilter === 'kegiatan') {
      return evaluations.filter((e) => e.kegiatanId === selectedKegiatanId);
    }
    if (periodFilter === 'triwulan') {
      // Triwulan mapping:
      // T1 (Jul, Ags, Sep): bulanUrutan 1, 2, 3
      // T2 (Okt, Nov, Des): bulanUrutan 4, 5, 6
      // T3 (Jan, Feb, Mar): bulanUrutan 7, 8, 9
      // T4 (Apr, Mei, Jun): bulanUrutan 10, 11, 12
      const allowedBulanUrutan = [
        (selectedTriwulan - 1) * 3 + 1,
        (selectedTriwulan - 1) * 3 + 2,
        (selectedTriwulan - 1) * 3 + 3
      ];
      const prokerInTriwulan = programKerjaList
        .filter((p) => allowedBulanUrutan.includes(p.bulanUrutan))
        .map((p) => p.id);
      return evaluations.filter((e) => prokerInTriwulan.includes(e.kegiatanId));
    }
    // masa_bakti: all evaluations
    return evaluations;
  }, [periodFilter, selectedKegiatanId, selectedTriwulan, evaluations, programKerjaList]);

  // Calculations for current filtered evaluations
  const totalHadir = filteredEvaluations.filter((e) => e.statusKehadiran === 'Hadir').length;
  const totalIzin = filteredEvaluations.filter((e) => e.statusKehadiran === 'Izin').length;
  const totalSakit = filteredEvaluations.filter((e) => e.statusKehadiran === 'Sakit').length;

  const averageRating = useMemo(() => {
    if (filteredEvaluations.length === 0) return '5.0';
    const sum = filteredEvaluations.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return (sum / filteredEvaluations.length).toFixed(1);
  }, [filteredEvaluations]);

  // Generate AI narrative
  const handleGenerateAiReport = async () => {
    if (!activeKegiatanItem) return;
    setIsGeneratingAi(true);
    try {
      const narrative = await generateActivityReportWithAi(
        activeKegiatanItem,
        filteredEvaluations,
        periodFilter === 'kegiatan'
          ? activeKegiatanItem.nama
          : periodFilter === 'triwulan'
          ? `Laporan Triwulan ${selectedTriwulan}`
          : 'Laporan Satu Masa Bakti'
      );
      setAiNarrative(narrative);
    } catch (err) {
      console.error('Error generating AI report:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Auto trigger default narrative when changing filters
  useEffect(() => {
    if (activeKegiatanItem) {
      handleGenerateAiReport();
    }
  }, [periodFilter, selectedKegiatanId, selectedTriwulan]);

  const getPeriodLabel = () => {
    if (periodFilter === 'kegiatan') {
      return activeKegiatanItem?.nama || 'Per Kegiatan';
    }
    if (periodFilter === 'triwulan') {
      const namaTriwulan = [
        'Triwulan I (Juli - September 2026)',
        'Triwulan II (Oktober - Desember 2026)',
        'Triwulan III (Januari - Maret 2027)',
        'Triwulan IV (April - Juni 2027)'
      ][selectedTriwulan - 1];
      return namaTriwulan;
    }
    return 'Satu Masa Bakti (Tahun Ajaran 2026/2027)';
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* Header Card Laporan dengan Tombol Kembali Melingkar */}
      <MenuHeaderCard
        title="Rekap Laporan"
        subtitle="Pertanggungjawaban kegiatan & evaluasi ambalan"
        onBack={onBack || (() => {})}
      />

      {/* Filter Periode Laporan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setPeriodFilter('kegiatan')}
            className={`flex-1 py-3 px-2 text-center transition-all relative font-bold text-xs flex items-center justify-center ${
              periodFilter === 'kegiatan'
                ? 'text-[#e51c24] bg-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            <span>Per Kegiatan</span>
            {periodFilter === 'kegiatan' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e51c24]" />
            )}
          </button>

          <button
            onClick={() => setPeriodFilter('triwulan')}
            className={`flex-1 py-3 px-2 text-center transition-all relative font-bold text-xs flex items-center justify-center ${
              periodFilter === 'triwulan'
                ? 'text-[#e51c24] bg-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            <span>Per Triwulan</span>
            {periodFilter === 'triwulan' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e51c24]" />
            )}
          </button>

          <button
            onClick={() => setPeriodFilter('masa_bakti')}
            className={`flex-1 py-3 px-2 text-center transition-all relative font-bold text-xs flex items-center justify-center ${
              periodFilter === 'masa_bakti'
                ? 'text-[#e51c24] bg-white'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            <span>Satu Masa Bakti</span>
            {periodFilter === 'masa_bakti' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e51c24]" />
            )}
          </button>
        </div>

        {/* Sub-selector depending on period */}
        <div className="p-3 bg-white">
          {periodFilter === 'kegiatan' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">
                Pilih Kegiatan atau Latihan:
              </label>
              <select
                value={selectedKegiatanId}
                onChange={(e) => setSelectedKegiatanId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-red-500"
              >
                {programKerjaList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.tipe} • Bulan {p.bulan})
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodFilter === 'triwulan' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">
                Pilih Periode Triwulan:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 1, label: 'Triwulan I', range: 'Jul - Sep' },
                  { id: 2, label: 'Triwulan II', range: 'Okt - Des' },
                  { id: 3, label: 'Triwulan III', range: 'Jan - Mar' },
                  { id: 4, label: 'Triwulan IV', range: 'Apr - Jun' }
                ].map((tw) => (
                  <button
                    key={tw.id}
                    onClick={() => setSelectedTriwulan(tw.id)}
                    className={`py-2 px-1 rounded-xl text-center text-xs transition-all border ${
                      selectedTriwulan === tw.id
                        ? 'bg-[#e51c24] text-white border-red-700 font-black shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    <span className="block">{tw.label}</span>
                    <span className="text-[10px] opacity-80 font-mono block">({tw.range})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {periodFilter === 'masa_bakti' && (
            <div className="flex items-center justify-between text-xs p-1">
              <span className="font-bold text-slate-700">
                Laporan Komprehensif Masa Bakti 2026/2027
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                12 Bulan Penuh (Juli - Juni)
              </span>
            </div>
          )}
        </div>
      </div>

      {periodFilter === 'triwulan' && (
        <section className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Laporan Triwulan Per Jabatan</h3>
            <p className="text-[11px] text-slate-500 mt-1">Pilih jabatan untuk menyusun laporan masing-masing. Data otomatis diambil dari aplikasi; catatan dan angka yang belum tersedia dapat diisi di sini.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TRIWULAN_ROLE_META) as TriwulanRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`rounded-xl border p-3 text-left transition-colors ${selectedRole === role ? 'bg-red-50 border-red-300 text-[#b91c1c]' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <strong className="block text-xs font-extrabold">{TRIWULAN_ROLE_META[role].label}</strong>
                <span className="block text-[10px] mt-1 opacity-80">{TRIWULAN_ROLE_META[role].subtitle}</span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 p-3 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black text-slate-900">{TRIWULAN_ROLE_META[selectedRole].label}</h4>
              <p className="text-[10px] text-slate-500">{getPeriodLabel()}</p>
            </div>

            {selectedRole === 'pradana' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Agenda Triwulan', value: quarterProgramKerja.length },
                    { label: 'Terlaksana', value: quarterProgramKerja.filter((item) => item.status === 'Terlaksana' || item.status === 'Selesai').length },
                    { label: 'Berjalan', value: quarterProgramKerja.filter((item) => item.status === 'Berjalan').length },
                    { label: 'Belum/Tidak', value: quarterProgramKerja.filter((item) => item.status === 'Direncanakan' || item.status === 'Tidak Terlaksana' || item.status === 'Belum Terlaksana').length }
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                      <strong className="block text-lg font-black text-slate-900">{item.value}</strong>
                      <span className="text-[10px] text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <strong className="text-slate-800">Rekap program kerja:</strong>
                  {quarterProgramKerja.length ? quarterProgramKerja.map((item) => (
                    <p key={item.id}>• {item.nama} — {item.status}</p>
                  )) : <p>Belum ada program kerja yang terdaftar pada triwulan ini.</p>}
                </div>
              </div>
            )}

            {selectedRole === 'pemangku_adat' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total anggota', value: allMembers.length },
                  { label: 'Putra', value: allMembers.filter((member) => member.satuan === 'Putra').length },
                  { label: 'Putri', value: allMembers.filter((member) => member.satuan === 'Putri').length },
                  { label: 'Sangga terdata', value: new Set(allMembers.map((member) => member.sangga).filter(Boolean)).size }
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-200 p-2">
                    <strong className="block text-lg font-black text-slate-900">{item.value}</strong>
                    <span className="text-[10px] text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedRole === 'sekretaris' && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                <strong className="block text-lg font-black text-slate-900">{quarterLetterArchive.length} surat tersimpan</strong>
                <span className="text-[10px] text-slate-500">Dihitung dari arsip surat pada perangkat ini untuk periode triwulan terpilih.</span>
                {quarterLetterArchive.slice(0, 8).map((letter: { id?: string; nomorSurat?: string; perihal?: string }, index: number) => (
                  <p key={letter.id || index} className="text-[11px] text-slate-700">{index + 1}. {letter.nomorSurat || 'Tanpa nomor'} — {letter.perihal || 'Tanpa perihal'}</p>
                ))}
                {quarterLetterArchive.length > 8 && <p className="text-[10px] text-slate-500">Dan {quarterLetterArchive.length - 8} surat lainnya.</p>}
              </div>
            )}

            {selectedRole === 'bendahara' && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([
                    ['saldoAwal', 'Saldo awal kas'],
                    ['pemasukan', 'Total pemasukan'],
                    ['pengeluaran', 'Total pengeluaran']
                  ] as Array<[keyof TriwulanRoleDraft, string]>).map(([field, label]) => (
                    <label key={field} className="block text-[10px] font-bold text-slate-600">
                      {label}
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={currentRoleDraft[field]}
                        onChange={(event) => updateRoleDraft(field, event.target.value)}
                        placeholder="0"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-red-400"
                      />
                    </label>
                  ))}
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <span className="block text-[10px] text-emerald-800 font-bold">Saldo akhir (perhitungan otomatis)</span>
                  <strong className="text-base font-black text-emerald-900">{hasFinancialEntries ? formatRupiah(financialClosingBalance) : 'Belum diisi'}</strong>
                </div>
                <p className="text-[10px] text-slate-500">Angka keuangan diisi oleh bendahara berdasarkan buku kas dan bukti transaksi. Aplikasi tidak membuat nominal perkiraan.</p>
              </div>
            )}

            <label className="block text-[10px] font-bold text-slate-600">
              {selectedRole === 'pradana' ? 'Uraian koordinasi dan pelaksanaan program kerja'
                : selectedRole === 'pemangku_adat' ? 'Uraian adat, ketertiban, kedisiplinan, dan pembinaan anggota'
                : selectedRole === 'sekretaris' ? 'Uraian administrasi, surat-menyurat, notulen, dan arsip'
                : 'Rincian pemasukan, pengeluaran, sumber dana, dan bukti transaksi'}
              <textarea
                rows={3}
                value={currentRoleDraft.uraian}
                onChange={(event) => updateRoleDraft('uraian', event.target.value)}
                placeholder="Tuliskan realisasi tugas selama triwulan ini..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-400"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block text-[10px] font-bold text-slate-600">
                Kendala / hal yang perlu dievaluasi
                <textarea rows={2} value={currentRoleDraft.kendala} onChange={(event) => updateRoleDraft('kendala', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-400" placeholder="Tuliskan jika ada..." />
              </label>
              <label className="block text-[10px] font-bold text-slate-600">
                Rencana tindak lanjut
                <textarea rows={2} value={currentRoleDraft.tindakLanjut} onChange={(event) => updateRoleDraft('tindakLanjut', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-red-400" placeholder="Rencana untuk triwulan berikutnya..." />
              </label>
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold">✓ Catatan tersimpan otomatis pada perangkat ini untuk jabatan dan triwulan yang dipilih.</p>
          </div>
        </section>
      )}

      {/* 3. Action Buttons: Unduh PDF & Rekap AI */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPdfPreview(true)}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#e51c24] hover:bg-red-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <span>📄</span>
          <span>Unduh Berkas Laporan Resmi (PDF)</span>
        </button>

        <button
          onClick={handleGenerateAiReport}
          disabled={isGeneratingAi}
          className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          title="Susun Ulang dengan AI"
        >
          <span>{isGeneratingAi ? '⏳' : '✨'}</span>
          <span className="hidden sm:inline">Susun AI</span>
        </button>
      </div>

      {/* 4. Rekapitulasi Narasi Laporan Hasil Susunan AI */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-red-50 text-[#e51c24] text-sm">
              ✨
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                Narasi Paragraf Laporan Resmi (AI Assistant)
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">
                Model: Gemini 3.8 Flash • Tersusun Berdasarkan Presensi & Evaluasi Riil
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            Siap Cetak
          </span>
        </div>

        {isGeneratingAi ? (
          <div className="p-6 text-center space-y-2 bg-slate-50 rounded-2xl">
            <span className="text-2xl block animate-spin">⏳</span>
            <p className="text-xs text-slate-600 font-medium">
              AI sedang menganalisis presensi, kepuasan, dan menyusun draf paragraf laporan...
            </p>
          </div>
        ) : aiNarrative ? (
          <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <strong className="text-slate-900 block font-bold">1. Deskripsi Pelaksanaan:</strong>
              <p>{aiNarrative.paragrafLatarBelakang}</p>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-200/60">
              <strong className="text-slate-900 block font-bold">2. Analisis Kehadiran & Partisipasi:</strong>
              <p>{aiNarrative.paragrafKehadiran}</p>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-200/60">
              <strong className="text-slate-900 block font-bold">3. Tingkat Kepuasan & Kelebihan:</strong>
              <p>{aiNarrative.paragrafKepuasan}</p>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-200/60">
              <strong className="text-slate-900 block font-bold">4. Evaluasi Kendala & Rekomendasi:</strong>
              <p>{aiNarrative.paragrafEvaluasiKekurangan}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* 5. Tabel Hasil Evaluasi Anggota (Kelebihan, Kekurangan, Rating) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-slate-900">
            Daftar Presensi & Evaluasi Masuk ({filteredEvaluations.length})
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {getPeriodLabel()}
          </span>
        </div>

        {filteredEvaluations.length === 0 ? (
          <div className="p-6 text-center space-y-1.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-3xl block">📋</span>
            <p className="text-xs text-slate-600 font-bold">
              Belum ada data presensi & evaluasi yang masuk untuk periode ini.
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Jalankan kegiatan di menu Kegiatan dan Latihan, lalu bagikan presensi agar anggota dapat mengisi rating dan evaluasi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEvaluations.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <strong className="text-slate-900 font-extrabold block text-xs">
                      {item.memberName}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {item.satuan} • Sangga {item.sangga} • {item.tingkat || 'Penegak'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-[#e51c24]">
                      {'⭐'.repeat(item.rating || 5)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {item.submittedAt}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60 text-[11px]">
                  <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 text-emerald-900">
                    <strong className="block text-[10px] text-emerald-700 uppercase font-mono">
                      Kelebihan:
                    </strong>
                    <p>{item.kelebihan || '-'}</p>
                  </div>
                  <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100 text-amber-900">
                    <strong className="block text-[10px] text-amber-700 uppercase font-mono">
                      Kekurangan / Kendala:
                    </strong>
                    <p>{item.kekurangan || '-'}</p>
                  </div>
                </div>

                {item.masukan && (
                  <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-200">
                    Saran: "{item.masukan}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL PREVIEW & CETAK LAPORAN RESMI (PDF FORMAT)
          ======================================================== */}
      {showPdfPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs font-sans overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
            
            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xs sm:text-sm font-black flex items-center gap-2">
                  <span>📄 Pratinjau Dokumen PDF Laporan Resmi</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Format Standar Kwarnas Gerakan Pramuka
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="px-3 py-1.5 rounded-xl bg-[#e51c24] hover:bg-red-700 text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>🖨️</span>
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setShowPdfPreview(false)}
                  className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body (Formatted like an official Scout letterhead / report) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 text-xs leading-relaxed bg-white print:p-0">
              
              {/* Kop Surat Resmi */}
              <div className="border-b-2 border-slate-900 pb-4 text-center relative flex items-center justify-between">
                <div className="w-16 h-16 shrink-0">
                  <ShiningAmbalanLogo className="w-16 h-16" />
                </div>
                <div className="flex-1 px-3 text-center">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-700 font-mono">
                    GERAKAN PRAMUKA GUGUS DEPAN 10-035 & 10-036
                  </h4>
                  <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                    AMBALAN LA SURULLAH PETTA LOPO
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Pangkalan SMPI Al-Wasi Maros • Kwartir Ranting Maros Baru
                  </p>
                </div>
                <div className="w-16 h-16 shrink-0 hidden sm:block">
                  <ShiningAmbalanLogo className="w-16 h-16" />
                </div>
              </div>

              {/* Judul Laporan */}
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-slate-950 uppercase underline tracking-wide">
                  {periodFilter === 'triwulan' ? `LAPORAN TRIWULAN - ${TRIWULAN_ROLE_META[selectedRole].label}` : 'LAPORAN HASIL EVALUASI & PRESENSI KEGIATAN'}
                </h3>
                <p className="text-[11px] font-bold text-slate-700">
                  {getPeriodLabel()}
                </p>
              </div>

              {/* Tabel Ringkasan Data */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50">
                      <td className="p-2 font-bold text-slate-700 w-1/3">Nama Agenda / Kegiatan</td>
                      <td className="p-2 font-black text-slate-950">{activeKegiatanItem?.nama}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-700">Jenis / Tipe Pelaksanaan</td>
                      <td className="p-2">{activeKegiatanItem?.tipe}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2 font-bold text-slate-700">Jadwal & Waktu</td>
                      <td className="p-2">{activeKegiatanItem?.waktuPelaksanaan}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-slate-700">Total Peserta Hadir</td>
                      <td className="p-2 font-bold text-slate-900">{totalHadir} Orang Penegak</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2 font-bold text-slate-700">Indeks Skor Kepuasan</td>
                      <td className="p-2 font-black text-[#e51c24]">⭐ {averageRating} / 5.0 Bintang</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Narasi Resmi AI */}
              {aiNarrative && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 border-b border-slate-200 pb-1">
                    I. Narasi Evaluasi Pelaksanaan
                  </h4>
                  <div className="space-y-2 text-justify text-[11px] leading-relaxed">
                    <p>{aiNarrative.paragrafLatarBelakang}</p>
                    <p>{aiNarrative.paragrafKehadiran}</p>
                    <p>{aiNarrative.paragrafKepuasan}</p>
                    <p>{aiNarrative.paragrafEvaluasiKekurangan}</p>
                  </div>
                </div>
              )}

              {periodFilter === 'triwulan' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 border-b border-slate-200 pb-1">
                    II. Pertanggungjawaban {TRIWULAN_ROLE_META[selectedRole].label}
                  </h4>
                  {selectedRole === 'pradana' && (
                    <div className="text-[11px] space-y-1">
                      <p>Jumlah agenda: {quarterProgramKerja.length}; terlaksana: {quarterProgramKerja.filter((item) => item.status === 'Terlaksana' || item.status === 'Selesai').length}; berjalan: {quarterProgramKerja.filter((item) => item.status === 'Berjalan').length}.</p>
                      {quarterProgramKerja.map((item) => <p key={item.id}>• {item.nama} — {item.status}</p>)}
                    </div>
                  )}
                  {selectedRole === 'pemangku_adat' && (
                    <p className="text-[11px]">Anggota terdata: {allMembers.length}; Putra: {allMembers.filter((member) => member.satuan === 'Putra').length}; Putri: {allMembers.filter((member) => member.satuan === 'Putri').length}; sangga terdata: {new Set(allMembers.map((member) => member.sangga).filter(Boolean)).size}.</p>
                  )}
                  {selectedRole === 'sekretaris' && (
                    <p className="text-[11px]">Surat pada arsip perangkat untuk periode ini: {quarterLetterArchive.length} dokumen.</p>
                  )}
                  {selectedRole === 'bendahara' && (
                    <div className="text-[11px] space-y-1">
                      <p>Saldo awal: {currentRoleDraft.saldoAwal ? formatRupiah(parseRupiahInput(currentRoleDraft.saldoAwal)) : 'Belum diisi'}</p>
                      <p>Pemasukan: {currentRoleDraft.pemasukan ? formatRupiah(parseRupiahInput(currentRoleDraft.pemasukan)) : 'Belum diisi'}</p>
                      <p>Pengeluaran: {currentRoleDraft.pengeluaran ? formatRupiah(parseRupiahInput(currentRoleDraft.pengeluaran)) : 'Belum diisi'}</p>
                      <p>Saldo akhir: {hasFinancialEntries ? formatRupiah(financialClosingBalance) : 'Belum diisi'}</p>
                    </div>
                  )}
                  <div className="space-y-1 text-[11px]">
                    <strong>Uraian realisasi:</strong>
                    <p className="whitespace-pre-wrap">{currentRoleDraft.uraian || 'Belum diisi.'}</p>
                    <strong>Kendala / evaluasi:</strong>
                    <p className="whitespace-pre-wrap">{currentRoleDraft.kendala || 'Belum diisi.'}</p>
                    <strong>Rencana tindak lanjut:</strong>
                    <p className="whitespace-pre-wrap">{currentRoleDraft.tindakLanjut || 'Belum diisi.'}</p>
                  </div>
                </div>
              )}

              {/* Rekap 4 Pilar Dewan Ambalan (Kegiatan, Keanggotaan, Persuratan, Keuangan) untuk Triwulan & Masa Bakti */}
              {periodFilter !== 'kegiatan' && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-900 border-b border-slate-200 pb-1">
                    II. Rekapitulasi 4 Pilar Dewan Ambalan
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 space-y-0.5">
                      <strong className="text-blue-900 block font-bold">1. Pilar Kegiatan (Pradana):</strong>
                      <p className="text-slate-700">Terlaksana {programKerjaList.filter(p => p.status === 'Terlaksana').length} dari {programKerjaList.length} agenda kegiatan & latihan rutin.</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-0.5">
                      <strong className="text-amber-900 block font-bold">2. Pilar Keanggotaan (Pemangku Adat):</strong>
                      <p className="text-slate-700">Total {allMembers.length || 20} penegak aktif terbagi rata di 5 Sangga (Perintis, Penegas, Pendobrak, Pencoba, Pelaksana).</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-0.5">
                      <strong className="text-emerald-900 block font-bold">3. Pilar Persuratan (Kerani):</strong>
                      <p className="text-slate-700">Tata naskah surat resmi aktif diterbitkan (undangan, tugas delegasi, dispensasi, izin kegiatan).</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-200 space-y-0.5">
                      <strong className="text-cyan-900 block font-bold">4. Pilar Keuangan (Bendahara):</strong>
                      <p className="text-slate-700">Iuran kas ambalan rutin Rp 10.000/anggota tercatat transparan dengan rekapitulasi tertib.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Daftar Presensi Terlampir */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900 border-b border-slate-200 pb-1">
                  {periodFilter !== 'kegiatan' ? 'III. Rekapitulasi Presensi & Evaluasi Anggota' : 'II. Rekapitulasi Presensi & Evaluasi Anggota'}
                </h4>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                      <tr>
                        <th className="p-2">No</th>
                        <th className="p-2">Nama Penegak</th>
                        <th className="p-2">Sangga</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Rating</th>
                        <th className="p-2">Kelebihan / Masukan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredEvaluations.map((ev, idx) => (
                        <tr key={ev.id}>
                          <td className="p-2 font-mono">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{ev.memberName}</td>
                          <td className="p-2">{ev.sangga}</td>
                          <td className="p-2 font-semibold">{ev.statusKehadiran}</td>
                          <td className="p-2 font-mono">⭐ {ev.rating}</td>
                          <td className="p-2 max-w-[180px] truncate">{ev.kelebihan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kolom Tanda Tangan Resmi */}
              <div className="pt-6 grid grid-cols-2 text-center text-[11px] text-slate-800">
                <div className="space-y-12">
                  <p>
                    Mengetahui,<br />
                    <strong>Pradana Ambalan</strong>
                  </p>
                  <p className="font-bold underline">
                    Muhammad Fathan
                  </p>
                </div>

                <div className="space-y-12">
                  <p>
                    Maros, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                    <strong>Pembina Gugus Depan</strong>
                  </p>
                  <p className="font-bold underline">
                    Amiruddin S., S.Pd.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
