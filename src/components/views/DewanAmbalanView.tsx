import React, { useState, useMemo, useEffect } from 'react';
import { UserAccount, ProgramKerjaItem, ActiveKegiatanSession, AmbalanNotificationItem } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { ProgramKerjaView } from './ProgramKerjaView';
import { CalendarDays, Dumbbell, ChevronRight, Crown, Users, Settings, RotateCcw, Check } from 'lucide-react';
import { registerAmbalanUser } from '../../services/firebaseService';
import { 
  get8DewanPositions, 
  save8DewanPositions, 
  Dewan8Position 
} from '../../data/dewanStructure';
import { PersuratanAmbalanView } from './PersuratanAmbalanView';
import { ComingSoonView } from './ComingSoonView';

interface DewanAmbalanViewProps {
  currentUser?: UserAccount;
  allMembers?: UserAccount[];
  programKerjaList?: ProgramKerjaItem[];
  onNavigateMenu?: (menu: string) => void;
  onBack?: () => void;
  activeKegiatan?: ActiveKegiatanSession | null;
  onStartKegiatan?: (item: ProgramKerjaItem) => void;
  onStopKegiatan?: () => void;
  onSharePresensi?: (item: ProgramKerjaItem) => void;
  onUpdateProgramKerjaList?: (items: ProgramKerjaItem[]) => void;
}

type DewanMenuId = 'proker' | 'anggota_sangga' | 'persuratan' | 'keuangan' | 'laporan';

interface SuratKeluarItem {
  id: string;
  nomorSurat: string;
  jenis: 'Undangan' | 'Tugas' | 'Dispensasi' | 'Peminjaman' | 'Keterangan';
  perihal: string;
  penerima: string;
  tanggalSurat: string;
  tanggalKegiatan?: string;
  tempat?: string;
  anggotaTerlibat?: string;
  keperluan?: string;
}

interface IuranRecord {
  memberUid: string;
  nama: string;
  satuan: 'Putra' | 'Putri';
  sangga: string;
  nominal: number;
  isLunas: boolean;
  bulan: string;
}

export const DewanAmbalanView: React.FC<DewanAmbalanViewProps> = ({
  currentUser,
  allMembers = [],
  programKerjaList = [],
  onNavigateMenu,
  onBack,
  activeKegiatan,
  onStartKegiatan,
  onStopKegiatan,
  onSharePresensi,
  onUpdateProgramKerjaList
}) => {
  // Navigation State: 'menu' (tampilan utama 5 menu dewan) atau salah satu menu terpilih
  const [activeMenu, setActiveMenu] = useState<DewanMenuId | 'menu'>('menu');
  const [selectedProkerType, setSelectedProkerType] = useState<'Kegiatan' | 'Latihan Rutin' | null>(null);

  // 8 Roda Dewan Kepengurusan State
  const [dewan8List, setDewan8List] = useState<Dewan8Position[]>(() => get8DewanPositions());
  const [showManageDewanModal, setShowManageDewanModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Dewan8Position | null>(null);

  const handleUpdateDewanMember = async (positionId: string, memberUidOrName: string) => {
    const selected = allMembers.find(m => (m.uid && m.uid === memberUidOrName) || m.nama === memberUidOrName);
    const targetPos = dewan8List.find(p => p.id === positionId);
    if (!targetPos) return;

    const newName = selected ? selected.nama : memberUidOrName;
    const newUid = selected?.uid;
    const newSangga = selected?.sangga;

    const updated = dewan8List.map(p => {
      if (p.id === positionId) {
        return {
          ...p,
          memberUid: newUid,
          memberName: newName,
          sangga: newSangga
        };
      }
      return p;
    });

    setDewan8List(updated);
    save8DewanPositions(updated);

    if (selected) {
      await registerAmbalanUser({
        ...selected,
        role: 'dewan',
        isDewan: true,
        dewanJabatan: targetPos.jabatan,
        jabatan: targetPos.jabatan
      });
    }
  };

  // ==========================================
  // 1. KELOLA PROGRAM KERJA STATE
  // ==========================================
  const [prokerTab, setProkerTab] = useState<'rencana' | 'jalankan' | 'evaluasi'>('rencana');
  const [prokers, setProkers] = useState<ProgramKerjaItem[]>(() => {
    return programKerjaList;
  });

  useEffect(() => {
    setProkers(programKerjaList);
  }, [programKerjaList]);

  // Filter untuk Menjalankan Kegiatan & Latihan
  const [jalankanFilterTipe, setJalankanFilterTipe] = useState<'Semua' | 'Kegiatan' | 'Latihan Rutin'>('Semua');
  const [jalankanFilterBulan, setJalankanFilterBulan] = useState<string>('Semua');

  // Form Tambah Program Kerja
  const [isAddingProker, setIsAddingProker] = useState(false);
  const [newProkerNama, setNewProkerNama] = useState('');
  const [newProkerTipe, setNewProkerTipe] = useState<'Kegiatan' | 'Latihan Rutin'>('Kegiatan');
  const [newProkerBulan, setNewProkerBulan] = useState('Oktober');
  const [newProkerWaktu, setNewProkerWaktu] = useState('');
  const [newProkerSasaran, setNewProkerSasaran] = useState('Seluruh Penegak Ambalan');
  const [newProkerAnggaran, setNewProkerAnggaran] = useState('');

  const handleAddProker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProkerNama.trim()) return;

    const newItem: ProgramKerjaItem = {
      id: `proker_dewan_${Date.now()}`,
      nama: newProkerNama.trim(),
      tipe: newProkerTipe,
      bulan: newProkerBulan,
      bulanUrutan: 4,
      waktuPelaksanaan: newProkerWaktu.trim() || `Bulan ${newProkerBulan}`,
      sasaran: newProkerSasaran.trim(),
      anggaran: newProkerAnggaran.trim() || undefined,
      penanggungJawab: 'Dewan Ambalan La Surullah',
      status: 'Direncanakan',
      deskripsi: 'Program kerja hasil perencanaan Dewan Ambalan.'
    };

    setProkers([newItem, ...prokers]);
    setIsAddingProker(false);
    setNewProkerNama('');
    setNewProkerWaktu('');
    setNewProkerAnggaran('');
  };

  // ==========================================
  // 2. KELOLA ANGGOTA DAN SANGGA STATE
  // ==========================================
  const [selectedMember, setSelectedMember] = useState<UserAccount | null>(null);
  const [anggotaSatuanFilter, setAnggotaSatuanFilter] = useState<'Semua' | 'Putra' | 'Putri'>('Semua');

  const filteredMembers = useMemo(() => {
    if (anggotaSatuanFilter === 'Semua') return allMembers;
    return allMembers.filter((m) => m.satuan === anggotaSatuanFilter);
  }, [allMembers, anggotaSatuanFilter]);

  // ==========================================
  // 3. KELOLA PERSURATAN (SURAT OTOMATIS) STATE
  // ==========================================
  const [suratList, setSuratList] = useState<SuratKeluarItem[]>(() => {
    const saved = localStorage.getItem('pettalopo_surat_keluar_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'surat_01',
        nomorSurat: '010/10.035-10.036/C/2026',
        jenis: 'Undangan',
        perihal: 'Undangan Rapat Kerja Dewan Ambalan',
        penerima: 'Seluruh Anggota Dewan Ambalan',
        tanggalSurat: '15 Oktober 2026',
        tanggalKegiatan: '18 Oktober 2026',
        tempat: 'Sanggar Pramuka SMPI Al-Wasi Maros',
        keperluan: 'Koordinasi pemantapan agenda dan latihan rutin penegak'
      },
      {
        id: 'surat_02',
        nomorSurat: '011/10.035-10.036/C/2026',
        jenis: 'Tugas',
        perihal: 'Surat Tugas Delegasi Temu Penegak',
        penerima: 'Delegasi Terpilih Anggota Ambalan',
        tanggalSurat: '20 Oktober 2026',
        tanggalKegiatan: '24-25 Oktober 2026',
        tempat: 'Bumi Perkemahan Maros Baru',
        keperluan: 'Mengikuti perkemahan perwakilan ambalan'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('pettalopo_surat_keluar_v2', JSON.stringify(suratList));
  }, [suratList]);

  const [isCreatingSurat, setIsCreatingSurat] = useState(false);
  const [suratJenis, setSuratJenis] = useState<'Undangan' | 'Tugas' | 'Dispensasi' | 'Peminjaman' | 'Keterangan'>('Undangan');
  const [suratPerihal, setSuratPerihal] = useState('');
  const [suratPenerima, setSuratPenerima] = useState('');
  const [suratTanggalKegiatan, setSuratTanggalKegiatan] = useState('');
  const [suratTempat, setSuratTempat] = useState('Sanggar Pramuka SMPI Al-Wasi Maros');
  const [suratKeperluan, setSuratKeperluan] = useState('');
  const [suratMemberTerkait, setSuratMemberTerkait] = useState('');
  const [previewSurat, setPreviewSurat] = useState<SuratKeluarItem | null>(null);

  const handleCreateSurat = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNomor = (suratList.length + 12).toString().padStart(3, '0');
    const autoNomor = `${nextNomor}/10.035-10.036/C/2026`;
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let finalPerihal = suratPerihal.trim();
    if (!finalPerihal) {
      if (suratJenis === 'Undangan') finalPerihal = 'Undangan Rapat Koordinasi Dewan Ambalan';
      else if (suratJenis === 'Tugas') finalPerihal = 'Surat Tugas Mandat Peserta Kegiatan';
      else if (suratJenis === 'Dispensasi') finalPerihal = 'Permohonan Dispensasi Izin Belajar Siswa';
      else if (suratJenis === 'Peminjaman') finalPerihal = 'Permohonan Peminjaman Ruang dan Sarana';
      else finalPerihal = 'Surat Keterangan Aktif Pramuka Penegak';
    }

    const item: SuratKeluarItem = {
      id: `surat_${Date.now()}`,
      nomorSurat: autoNomor,
      jenis: suratJenis,
      perihal: finalPerihal,
      penerima: suratPenerima.trim() || 'Yth. Yang Bersangkutan',
      tanggalSurat: todayStr,
      tanggalKegiatan: suratTanggalKegiatan.trim() || 'Sesuai Jadwal Kegiatan',
      tempat: suratTempat.trim() || 'Sanggar Pramuka SMPI Al-Wasi Maros',
      anggotaTerlibat: suratMemberTerkait || undefined,
      keperluan: suratKeperluan.trim() || 'Menjalankan tugas kepramukaan ambalan.'
    };

    setSuratList([item, ...suratList]);
    setPreviewSurat(item);
    setIsCreatingSurat(false);
    setSuratPerihal('');
    setSuratPenerima('');
    setSuratTanggalKegiatan('');
    setSuratKeperluan('');
  };

  // ==========================================
  // 4. KELOLA KEUANGAN STATE
  // ==========================================
  const [iuranData, setIuranData] = useState<IuranRecord[]>(() => {
    const saved = localStorage.getItem('pettalopo_iuran_anggota_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return allMembers.map((m, idx) => ({
      memberUid: m.uid || `member_${idx}`,
      nama: m.nama,
      satuan: m.satuan,
      sangga: m.sangga || 'Perintis',
      nominal: 10000,
      isLunas: idx % 2 === 0,
      bulan: 'Oktober 2026'
    }));
  });

  useEffect(() => {
    localStorage.setItem('pettalopo_iuran_anggota_v2', JSON.stringify(iuranData));
  }, [iuranData]);

  const handleToggleIuran = (memberUid: string) => {
    setIuranData((prev) =>
      prev.map((item) =>
        item.memberUid === memberUid ? { ...item, isLunas: !item.isLunas } : item
      )
    );
  };

  const totalKasTerkumpul = useMemo(() => {
    return iuranData.filter((i) => i.isLunas).reduce((sum, curr) => sum + curr.nominal, 0);
  }, [iuranData]);

  const totalAnggotaLunas = useMemo(() => iuranData.filter((i) => i.isLunas).length, [iuranData]);

  // ==========================================
  // 5. KELOLA LAPORAN STATE
  // ==========================================
  const [laporanPeriode, setLaporanPeriode] = useState<'perkegiatan' | 'pertriwulan' | 'masa_bakti'>('pertriwulan');
  const [selectedTriwulan, setSelectedTriwulan] = useState<number>(2);
  const [selectedProkerForLaporan, setSelectedProkerForLaporan] = useState<string>(prokers[0]?.id || '');

  return (
    <div className="space-y-4 pb-24 font-sans">

      {/* Header Card Dewan Ambalan dengan Tombol Kembali Melingkar */}
      {activeMenu !== 'proker' && activeMenu !== 'persuratan' && (
        <MenuHeaderCard
          title="Ruang Kerja Dewan Ambalan"
          subtitle={
            activeMenu === 'menu'
              ? 'Pengelolaan & administrasi masa bakti'
              : activeMenu === 'anggota_sangga'
              ? 'Kelola Anggota & Sangga Penegak'
              : activeMenu === 'keuangan'
              ? 'Kelola Kas & Iuran Ambalan'
              : 'Kelola Rekap Laporan Dewan'
          }
          onBack={() => {
            if (activeMenu !== 'menu') {
              setActiveMenu('menu');
              setSelectedProkerType(null);
            } else if (onBack) {
              onBack();
            }
          }}
        />
      )}

      {/* ========================================================
          TAMPILAN MENU UTAMA (5 MENU DEWAN AMBALAN)
          ======================================================== */}
      {activeMenu === 'menu' && (
        <div className="space-y-4">
          
          {/* 5 Menu Dewan Ambalan */}
          <div className="space-y-2.5">
            {/* 1. Kelola Program Kerja */}
            <button
              type="button"
              onClick={() => { setSelectedProkerType(null); setActiveMenu('proker'); }}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left hover:border-red-300 active:bg-slate-50 transition-all cursor-pointer shadow-2xs dewan-menu-banner"
            >
              <span className="shrink-0 text-sm font-extrabold text-[#e51c24]">1.</span>
              <span className="shrink-0 text-sm font-bold text-slate-900">Kelola Program Kerja</span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">Rencana, pelaksanaan, dan evaluasi program</span>
            </button>
            {/* 2. Kelola Anggota dan Sangga */}
            <button
              type="button"
              onClick={() => setActiveMenu('anggota_sangga')}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left hover:border-red-300 active:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <span className="shrink-0 text-sm font-extrabold text-[#e51c24]">2.</span>
              <span className="shrink-0 text-sm font-bold text-slate-900">Kelola Anggota dan Sangga</span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">Data anggota, tingkatan, SKU, dan sangga</span>
            </button>
            {/* 3. Kelola Persuratan */}
            <button
              type="button"
              onClick={() => setActiveMenu('persuratan')}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left hover:border-red-300 active:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <span className="shrink-0 text-sm font-extrabold text-[#e51c24]">3.</span>
              <span className="shrink-0 text-sm font-bold text-slate-900">Kelola Persuratan</span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">Surat resmi dan arsip ambalan</span>
            </button>
            {/* 4. Kelola Keuangan */}
            <button
              type="button"
              onClick={() => setActiveMenu('keuangan')}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left hover:border-red-300 active:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <span className="shrink-0 text-sm font-extrabold text-[#e51c24]">4.</span>
              <span className="shrink-0 text-sm font-bold text-slate-900">Kelola Keuangan</span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">Kas dan iuran anggota</span>
            </button>
            {/* 5. Kelola Laporan */}
            <button
              type="button"
              onClick={() => setActiveMenu('laporan')}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left hover:border-red-300 active:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <span className="shrink-0 text-sm font-extrabold text-[#e51c24]">5.</span>
              <span className="shrink-0 text-sm font-bold text-slate-900">Kelola Laporan</span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">Rekap kegiatan dan laporan masa bakti</span>
            </button>
          </div>

        </div>
      )}

      {/* ========================================================
          HALAMAN KELOLA PROGRAM KERJA
          ======================================================== */}
      {activeMenu === 'proker' && !selectedProkerType && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setSelectedProkerType('Kegiatan')}
            className="w-full min-h-[116px] bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#e51c24] active:scale-[0.99] transition-all text-left flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#e51c24] flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-slate-900">Kegiatan</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Kelola daftar program kegiatan ambalan.</p>
                <p className="text-[11px] font-bold text-slate-500 mt-2">{prokers.filter((item) => (item.tipe || 'Kegiatan') === 'Kegiatan').length} program terdaftar</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setSelectedProkerType('Latihan Rutin')}
            className="w-full min-h-[116px] bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#e51c24] active:scale-[0.99] transition-all text-left flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-slate-900">Latihan Rutin</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Kelola daftar program latihan rutin ambalan.</p>
                <p className="text-[11px] font-bold text-slate-500 mt-2">{prokers.filter((item) => item.tipe === 'Latihan Rutin').length} program terdaftar</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </button>
        </div>
      )}

      {activeMenu === 'proker' && selectedProkerType && (
        <ProgramKerjaView
          programKerjaList={prokers.filter((item) =>
            selectedProkerType === 'Kegiatan'
              ? (item.tipe || 'Kegiatan') === 'Kegiatan'
              : item.tipe === 'Latihan Rutin'
          )}
          onUpdateList={(updatedItems) => {
            const mergedItems = [
              ...prokers.filter((item) =>
                selectedProkerType === 'Kegiatan'
                  ? (item.tipe || 'Kegiatan') !== 'Kegiatan'
                  : item.tipe !== 'Latihan Rutin'
              ),
              ...updatedItems
            ];
            setProkers(mergedItems);
            onUpdateProgramKerjaList?.(mergedItems);
          }}
          isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'dewan' || !!currentUser?.isDewan}
          fixedTipe={selectedProkerType}
          headerTitle={selectedProkerType}
          onBack={() => setSelectedProkerType(null)}
        />
      )}

      {/* ========================================================
          2. HALAMAN KELOLA ANGGOTA DAN SANGGA
          ======================================================== */}
      {activeMenu === 'anggota_sangga' && (
        <div className="space-y-3">
          
          {/* Filter Satuan Putra/Putri */}
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold px-2">Filter Anggota:</span>
            <div className="flex gap-1">
              {(['Semua', 'Putra', 'Putri'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setAnggotaSatuanFilter(s)}
                  className={`py-1 px-3 rounded-xl text-xs font-bold transition-all ${
                    anggotaSatuanFilter === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* List Semua Anggota (Klik nama untuk melihat rincian) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase">
                Data Anggota ({filteredMembers.length} Orang)
              </h3>
              <span className="text-[10px] text-slate-400">Klik nama untuk rincian lengkap</span>
            </div>

            <div className="space-y-1.5">
              {filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada anggota terdaftar di satuan ini.
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const isDewan = m.role === 'dewan' || m.role === 'admin' || Boolean(m.isDewan);
                  return (
                    <div
                      key={m.uid || m.nama}
                      onClick={() => setSelectedMember(m)}
                      className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">{m.nama}</span>
                          {isDewan && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-[#e51c24] border border-red-200">
                              🏛️ {m.dewanJabatan || m.jabatan || 'Dewan Ambalan'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {m.satuan} • Sangga {m.sangga} • {m.tingkat}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs font-bold">Rincian →</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* MODAL / PANEL RINCIAN ANGGOTA */}
          {selectedMember && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
              <div className="bg-white w-full max-w-md rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Rincian Data Anggota</h3>
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</span>
                    <p className="text-sm font-bold text-slate-900">{selectedMember.nama}</p>
                  </div>

                  {/* KELOLA STATUS DEWAN AMBALAN */}
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-900 uppercase">Status Kepengurusan Dewan</span>
                        <p className="font-bold text-slate-900 text-xs">
                          {(selectedMember.role === 'dewan' || Boolean(selectedMember.isDewan))
                            ? `🏛️ ${selectedMember.dewanJabatan || selectedMember.jabatan || 'Pengurus Dewan'}`
                            : '⚜️ Anggota Sangga'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const isDewanNow = selectedMember.role === 'dewan' || Boolean(selectedMember.isDewan);
                          if (isDewanNow) {
                            const ok = window.confirm(`Lepaskan Kak ${selectedMember.nama} dari status Dewan Ambalan?`);
                            if (!ok) return;
                            const updated: UserAccount = {
                              ...selectedMember,
                              role: selectedMember.role === 'admin' ? 'admin' : 'anggota',
                              isDewan: false,
                              dewanJabatan: undefined,
                              jabatan: 'Anggota Sangga'
                            };
                            setSelectedMember(updated);
                            await registerAmbalanUser(updated);
                          } else {
                            const defaultTitle = selectedMember.satuan === 'Putri' ? 'Pradana Putri' : 'Pradana Putra';
                            const updated: UserAccount = {
                              ...selectedMember,
                              role: 'dewan',
                              isDewan: true,
                              dewanJabatan: defaultTitle,
                              jabatan: defaultTitle
                            };
                            setSelectedMember(updated);
                            await registerAmbalanUser(updated);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer ${
                          (selectedMember.role === 'dewan' || Boolean(selectedMember.isDewan))
                            ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
                            : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
                        }`}
                      >
                        {(selectedMember.role === 'dewan' || Boolean(selectedMember.isDewan))
                          ? 'Cabut dari Dewan'
                          : '👑 Jadikan Dewan Ambalan'}
                      </button>
                    </div>

                    {(selectedMember.role === 'dewan' || Boolean(selectedMember.isDewan)) && (
                      <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-600 shrink-0">Pilih Jabatan:</span>
                        <select
                          value={selectedMember.dewanJabatan || selectedMember.jabatan || 'Pradana Putra'}
                          onChange={async (e) => {
                            const newJabatan = e.target.value;
                            const updated: UserAccount = {
                              ...selectedMember,
                              role: 'dewan',
                              isDewan: true,
                              dewanJabatan: newJabatan,
                              jabatan: newJabatan
                            };
                            setSelectedMember(updated);
                            await registerAmbalanUser(updated);
                          }}
                          className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white border border-amber-300 text-slate-900 focus:outline-none flex-1"
                        >
                          {[
                            'Pradana Putra',
                            'Pradana Putri',
                            'Pemangku Adat Putra',
                            'Pemangku Adat Putri',
                            'Kerani (Sekretaris)',
                            'Hartaka (Bendahara)',
                            'Sie Kegiatan & Operasional',
                            'Sie Penelitian & Pengembangan',
                            'Sie Hubungan Masyarakat',
                            'Anggota Dewan Ambalan'
                          ].map((title) => (
                            <option key={title} value={title}>{title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Panggilan</span>
                      <p className="font-bold text-slate-900">{selectedMember.namaPanggilan || selectedMember.nama.split(' ')[0]}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tempat, Tanggal Lahir</span>
                      <p className="font-bold text-slate-900">{selectedMember.ttl || 'Maros, 12 Juli 2009'}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Motto Hidup</span>
                    <p className="italic text-slate-800">&ldquo;{selectedMember.motto || 'Ikhlas Bakti Bina Bangsa, Berbudi Bawa Laksana'}&rdquo;</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tingkatan</span>
                      <p className="font-bold text-slate-900">{selectedMember.tingkat}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sangga & Satuan</span>
                      <p className="font-bold text-slate-900">Sangga {selectedMember.sangga} ({selectedMember.satuan})</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Progres Pengujian SKU Bantara / Laksana</span>
                    <p className="font-bold text-emerald-950">{selectedMember.progresSku || '0/23 Butir SKU Penegak'}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 space-y-0.5">
                    <span className="text-[10px] font-bold text-blue-800 uppercase">Keaktifan (Berdasarkan Absensi)</span>
                    <p className="font-bold text-blue-950">{selectedMember.keaktifan || 'Aktif'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          3. HALAMAN KELOLA PERSURATAN RESMI AMBALAN
          ======================================================== */}
      {activeMenu === 'persuratan' && (
        <PersuratanAmbalanView
          currentUser={currentUser}
          allMembers={allMembers}
          programKerjaList={prokers}
          onBack={() => setActiveMenu('menu')}
        />
      )}

      {/* ========================================================
          4. HALAMAN KELOLA KEUANGAN
          ======================================================== */}
      {activeMenu === 'keuangan' && (
        <ComingSoonView title="Kelola Keuangan" subtitle="Pengelolaan kas dan iuran anggota sedang disiapkan." icon="💰" onBackToDashboard={() => setActiveMenu('menu')} />
      )}
      {activeMenu === 'keuangan' && false && (
        <div className="space-y-3">
          
          {/* Ringkasan Kas Keuangan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Rekapitulasi Keuangan Ambalan</h3>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Kas Terkumpul</span>
                <strong className="text-sm font-bold text-slate-900">
                  Rp {totalKasTerkumpul.toLocaleString('id-ID')}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Anggota Lunas</span>
                <strong className="text-sm font-bold text-emerald-800">
                  {totalAnggotaLunas} / {iuranData.length}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Iuran Per Anggota</span>
                <strong className="text-sm font-bold text-slate-900">Rp 10.000 / bln</strong>
              </div>
            </div>
          </div>

          {/* Daftar Iuran & Update Status Bayar Anggota */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase">
                Data Iuran Anggota (Klik untuk update)
              </h3>
              <span className="text-[10px] text-slate-400">Oktober 2026</span>
            </div>

            <div className="space-y-1.5">
              {iuranData.map((item) => (
                <div
                  key={item.memberUid}
                  className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">{item.nama}</span>
                    <span className="text-[10px] text-slate-500">{item.satuan} • Sangga {item.sangga} • Rp {item.nominal.toLocaleString('id-ID')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleIuran(item.memberUid)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      item.isLunas
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-red-100 text-red-900 border border-red-300'
                    }`}
                  >
                    {item.isLunas ? 'Lunas' : 'Belum Bayar'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          5. HALAMAN KELOLA LAPORAN (REKAP 4 MENU)
          ======================================================== */}
      {activeMenu === 'laporan' && (
        <ComingSoonView title="Kelola Laporan" subtitle="Rekap kegiatan dan laporan masa bakti sedang disiapkan." icon="📊" onBackToDashboard={() => setActiveMenu('menu')} />
      )}
      {activeMenu === 'laporan' && false && (
        <div className="space-y-3">
          
          {/* Pilihan Periode Laporan */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex text-xs font-bold">
            <button
              onClick={() => setLaporanPeriode('perkegiatan')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                laporanPeriode === 'perkegiatan' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Perkegiatan
            </button>
            <button
              onClick={() => setLaporanPeriode('pertriwulan')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                laporanPeriode === 'pertriwulan' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pertriwulan
            </button>
            <button
              onClick={() => setLaporanPeriode('masa_bakti')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                laporanPeriode === 'masa_bakti' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Satu Masa Bakti
            </button>
          </div>

          {/* Sub-Selector Periode */}
          {laporanPeriode === 'perkegiatan' && (
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">Pilih Kegiatan:</label>
              <select
                value={selectedProkerForLaporan}
                onChange={(e) => setSelectedProkerForLaporan(e.target.value)}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
              >
                {prokers.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama} ({p.waktuPelaksanaan})</option>
                ))}
              </select>
            </div>
          )}

          {laporanPeriode === 'pertriwulan' && (
            <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-xs grid grid-cols-4 gap-1 text-center text-xs font-bold">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedTriwulan(num)}
                  className={`py-1.5 rounded-lg ${
                    selectedTriwulan === num ? 'bg-[#e51c24] text-white' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Triwulan {num}
                </button>
              ))}
            </div>
          )}

          {/* DOKUMEN REKAPITULASI DARI KEEMPAT MENU */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-3 text-center space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                {laporanPeriode === 'perkegiatan' && 'Laporan Realisasi Perkegiatan'}
                {laporanPeriode === 'pertriwulan' && `Laporan Triwulan ${selectedTriwulan} Dewan Ambalan`}
                {laporanPeriode === 'masa_bakti' && 'Laporan Pertanggungjawaban Akhir Masa Bakti (LPJ)'}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Rekapitulasi Dewan Ambalan La Surullah Petta Lopo
              </h3>
              <p className="text-[11px] text-slate-500">Gudep 10-035 & 10-036 SMPI Al-Wasi Maros</p>
            </div>

            {/* 1. Rekap Program Kerja */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">1. Rekapitulasi Program Kerja</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Tercatat sebanyak <strong>{prokers.length} program kerja</strong> telah direncanakan dan dijadwalkan secara tertib. Keterlaksanaan kegiatan berjalan sesuai target ambalan dengan dukungan penuh seluruh sangga penegak.
              </p>
            </div>

            {/* 2. Rekap Anggota & Sangga */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">2. Rekapitulasi Keanggotaan & Sangga</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Total keanggotaan aktif berjumlah <strong>{allMembers.length} penegak</strong>, terbagi dalam 5 Sangga (Perintis, Penegas, Pendobrak, Pencoba, Pelaksana) di Gugus Depan 10-035 Putra dan 10-036 Putri. Seluruh anggota terpantau aktif dan berdisiplin tinggi.
              </p>
            </div>

            {/* 3. Rekap Persuratan */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">3. Rekapitulasi Persuratan Resmi</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Telah diterbitkan sebanyak <strong>{suratList.length} surat resmi keluar</strong>, meliputi surat undangan rapat pleno, surat tugas delegasi kegiatan, surat dispensasi belajar, dan surat keterangan aktif ambalan.
              </p>
            </div>

            {/* 4. Rekap Keuangan */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">4. Rekapitulasi Keuangan & Iuran</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Penerimaan kas iuran anggota ambalan mencapai <strong>Rp {totalKasTerkumpul.toLocaleString('id-ID')}</strong> dengan tingkat pelunasan sebesar <strong>{iuranData.length > 0 ? Math.round((totalAnggotaLunas / iuranData.length) * 100) : 0}%</strong>. Pembukuan kas dikelola secara tertib, transparan, dan dapat dipertanggungjawabkan.
              </p>
            </div>

            {/* Tombol Aksi Cetak PDF */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
              >
                Cetak / Unduh PDF Laporan
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
