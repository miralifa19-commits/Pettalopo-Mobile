import React, { useState, useMemo, useEffect } from 'react';
import { UserAccount, ProgramKerjaItem, ActiveKegiatanSession, AmbalanNotificationItem } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { registerAmbalanUser } from '../../services/firebaseService';

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
  onSharePresensi
}) => {
  // Navigation State: 'menu' (tampilan utama 5 menu dewan) atau salah satu menu terpilih
  const [activeMenu, setActiveMenu] = useState<DewanMenuId | 'menu'>('menu');

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
      <MenuHeaderCard
        title="Dewan Ambalan"
        subtitle={
          activeMenu === 'menu'
            ? 'Pengelolaan & administrasi masa bakti'
            : activeMenu === 'proker'
            ? 'Kelola Program Kerja Ambalan'
            : activeMenu === 'anggota_sangga'
            ? 'Kelola Anggota & Sangga Penegak'
            : activeMenu === 'persuratan'
            ? 'Kelola Persuratan Resmi Ambalan'
            : activeMenu === 'keuangan'
            ? 'Kelola Kas & Iuran Ambalan'
            : 'Kelola Rekap Laporan Dewan'
        }
        onBack={() => {
          if (activeMenu !== 'menu') {
            setActiveMenu('menu');
          } else if (onBack) {
            onBack();
          }
        }}
      />

      {/* ========================================================
          TAMPILAN MENU UTAMA (5 MENU DEWAN AMBALAN)
          ======================================================== */}
      {activeMenu === 'menu' && (
        <div className="space-y-3">
          
          {/* 1. Kelola Program Kerja */}
          <div
            onClick={() => setActiveMenu('proker')}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#e51c24] cursor-pointer transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                1. Kelola Program Kerja
              </h2>
              <span className="text-xs font-bold text-slate-400">Buka →</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Merencanakan program kerja, menjalankan program kerja secara langsung, dan mengevaluasi hasil keterlaksanaan program kerja.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
              <span>{prokers.length} Agenda Terdaftar</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{prokers.filter((p) => p.status === 'Terlaksana').length} Terlaksana</span>
            </div>
          </div>

          {/* 2. Kelola Anggota dan Sangga */}
          <div
            onClick={() => setActiveMenu('anggota_sangga')}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#e51c24] cursor-pointer transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                2. Kelola Anggota dan Sangga
              </h2>
              <span className="text-xs font-bold text-slate-400">Buka →</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menampilkan data semua anggota ambalan beserta rincian lengkap ketika diklik (nama lengkap, nama panggilan, TTL, motto, tingkatan, progres SKU, dan keaktifan).
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
              <span>{allMembers.length} Anggota</span>
              <span>•</span>
              <span>5 Sangga Putra & Putri</span>
            </div>
          </div>

          {/* 3. Kelola Persuratan */}
          <div
            onClick={() => setActiveMenu('persuratan')}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#e51c24] cursor-pointer transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                3. Kelola Persuratan
              </h2>
              <span className="text-xs font-bold text-slate-400">Buka →</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Membuat surat otomatis resmi ambalan (undangan, tugas, dispensasi, peminjaman, keterangan aktif) dengan kop resmi Gugus Depan 10-035 & 10-036.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
              <span>{suratList.length} Arsip Surat Keluar</span>
              <span>•</span>
              <span>Format Standar Kwarnas</span>
            </div>
          </div>

          {/* 4. Kelola Keuangan */}
          <div
            onClick={() => setActiveMenu('keuangan')}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#e51c24] cursor-pointer transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                4. Kelola Keuangan
              </h2>
              <span className="text-xs font-bold text-slate-400">Buka →</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keuangan kas ambalan, data iuran anggota, dan mengupdate status anggota yang telah membayar iuran.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
              <span>Kas: Rp {totalKasTerkumpul.toLocaleString('id-ID')}</span>
              <span>•</span>
              <span>{totalAnggotaLunas} / {iuranData.length} Lunas</span>
            </div>
          </div>

          {/* 5. Kelola Laporan */}
          <div
            onClick={() => setActiveMenu('laporan')}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#e51c24] cursor-pointer transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                5. Kelola Laporan
              </h2>
              <span className="text-xs font-bold text-slate-400">Buka →</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Merekap laporan terpadu dari keempat menu dewan. Tersedia pilihan perkegiatan, pertriwulan, ataupun satu masa bakti (LPJ) dalam format PDF.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
              <span>Rekap 4 Pilar Dewan</span>
              <span>•</span>
              <span>Siap Cetak PDF</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          BAR NAVIGASI SUB-MENU KETIKA DI DALAM SALAH SATU MENU
          ======================================================== */}
      {activeMenu !== 'menu' && (
        <div className="space-y-2">
          {/* Tombol Kembali ke Daftar 5 Menu */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveMenu('menu')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
            >
              ← Kembali ke Menu Dewan
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {activeMenu === 'proker' && 'Kelola Program Kerja'}
              {activeMenu === 'anggota_sangga' && 'Kelola Anggota & Sangga'}
              {activeMenu === 'persuratan' && 'Kelola Persuratan'}
              {activeMenu === 'keuangan' && 'Kelola Keuangan'}
              {activeMenu === 'laporan' && 'Kelola Laporan'}
            </span>
          </div>

          {/* Tab Bar Cepat 5 Menu */}
          <div className="bg-white rounded-xl p-1 border border-slate-200 shadow-xs flex items-center justify-between text-[11px] font-bold overflow-x-auto">
            <button
              onClick={() => setActiveMenu('proker')}
              className={`py-1.5 px-2 rounded-lg transition-all shrink-0 ${
                activeMenu === 'proker' ? 'bg-[#e51c24] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Proker
            </button>
            <button
              onClick={() => setActiveMenu('anggota_sangga')}
              className={`py-1.5 px-2 rounded-lg transition-all shrink-0 ${
                activeMenu === 'anggota_sangga' ? 'bg-[#e51c24] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Anggota & Sangga
            </button>
            <button
              onClick={() => setActiveMenu('persuratan')}
              className={`py-1.5 px-2 rounded-lg transition-all shrink-0 ${
                activeMenu === 'persuratan' ? 'bg-[#e51c24] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Persuratan
            </button>
            <button
              onClick={() => setActiveMenu('keuangan')}
              className={`py-1.5 px-2 rounded-lg transition-all shrink-0 ${
                activeMenu === 'keuangan' ? 'bg-[#e51c24] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Keuangan
            </button>
            <button
              onClick={() => setActiveMenu('laporan')}
              className={`py-1.5 px-2 rounded-lg transition-all shrink-0 ${
                activeMenu === 'laporan' ? 'bg-[#e51c24] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Laporan
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          1. HALAMAN KELOLA PROGRAM KERJA
          ======================================================== */}
      {activeMenu === 'proker' && (
        <div className="space-y-3">
          
          {/* Sub-tab: Merencanakan, Menjalankan, Mengevaluasi */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex text-xs font-bold">
            <button
              onClick={() => setProkerTab('rencana')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                prokerTab === 'rencana' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Merencanakan
            </button>
            <button
              onClick={() => setProkerTab('jalankan')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                prokerTab === 'jalankan' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Menjalankan
            </button>
            <button
              onClick={() => setProkerTab('evaluasi')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                prokerTab === 'evaluasi' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mengevaluasi
            </button>
          </div>

          {/* TAB: MERENCANAKAN */}
          {prokerTab === 'rencana' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Daftar Rencana Agenda</span>
                <button
                  type="button"
                  onClick={() => setIsAddingProker(!isAddingProker)}
                  className="px-3 py-1.5 rounded-xl bg-[#e51c24] text-white text-xs font-bold shadow-xs transition-all"
                >
                  {isAddingProker ? 'Tutup Form' : '+ Tambah Rencana'}
                </button>
              </div>

              {/* Form Tambah Program Kerja */}
              {isAddingProker && (
                <form onSubmit={handleAddProker} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-900">Rencanakan Agenda Baru</h3>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Kegiatan / Agenda:</label>
                    <input
                      type="text"
                      required
                      value={newProkerNama}
                      onChange={(e) => setNewProkerNama(e.target.value)}
                      placeholder="Contoh: Gladi Tanggap Bencana Penegak"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipe:</label>
                      <select
                        value={newProkerTipe}
                        onChange={(e) => setNewProkerTipe(e.target.value as 'Kegiatan' | 'Latihan Rutin')}
                        className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                      >
                        <option value="Kegiatan">Kegiatan</option>
                        <option value="Latihan Rutin">Latihan Rutin</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Bulan:</label>
                      <input
                        type="text"
                        value={newProkerBulan}
                        onChange={(e) => setNewProkerBulan(e.target.value)}
                        placeholder="Contoh: Oktober"
                        className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Waktu Pelaksanaan:</label>
                      <input
                        type="text"
                        value={newProkerWaktu}
                        onChange={(e) => setNewProkerWaktu(e.target.value)}
                        placeholder="Contoh: 24 Oktober 2026"
                        className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Estimasi Anggaran:</label>
                      <input
                        type="text"
                        value={newProkerAnggaran}
                        onChange={(e) => setNewProkerAnggaran(e.target.value)}
                        placeholder="Rp 500.000"
                        className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Simpan Rencana Kegiatan
                  </button>
                </form>
              )}

              {/* List Rencana Proker */}
              <div className="space-y-1.5">
                {prokers.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">{item.nama}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{item.waktuPelaksanaan} • {item.tipe}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'Terlaksana' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MENJALANKAN */}
          {prokerTab === 'jalankan' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Pusat Pengaktifan Kegiatan & Latihan Ambalan</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hanya Dewan Ambalan yang berwenang mengaktifkan sesi kegiatan atau latihan rutin. Saat diaktifkan, sesi presensi digital akan dibuka untuk seluruh anggota.
                  </p>
                </div>

                {/* Sesi Live yang sedang berjalan */}
                {activeKegiatan && activeKegiatan.isRunning && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-[#e51c24] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-xs font-black uppercase text-[#e51c24] tracking-wide">
                          Sesi Sedang Berjalan (LIVE)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#e51c24] text-white">
                        AKTIF
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{activeKegiatan.kegiatanNama}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {activeKegiatan.waktuPelaksanaan} • {activeKegiatan.tipe} {activeKegiatan.tempat ? `• ${activeKegiatan.tempat}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {onSharePresensi && (
                        <button
                          type="button"
                          onClick={() => {
                            const p = prokers.find((x) => x.id === activeKegiatan.kegiatanId);
                            if (p) onSharePresensi(p);
                            else {
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
                          className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>📢</span>
                          <span>Bagikan Presensi</span>
                        </button>
                      )}

                      {onStopKegiatan && (
                        <button
                          type="button"
                          onClick={onStopKegiatan}
                          className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                        >
                          <span>⏹️</span>
                          <span>Hentikan Sesi</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Filter Tipe & Bulan */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-700">Pilih Kegiatan / Latihan untuk Dijalankan:</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                      {(['Semua', 'Kegiatan', 'Latihan Rutin'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setJalankanFilterTipe(t)}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            jalankanFilterTipe === t ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Bulan Cepat */}
                  <div className="flex items-center gap-1 overflow-x-auto py-1 text-[10px] font-bold scrollbar-none">
                    {['Semua', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((bln) => (
                      <button
                        key={bln}
                        type="button"
                        onClick={() => setJalankanFilterBulan(bln)}
                        className={`px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                          jalankanFilterBulan === bln
                            ? 'bg-[#e51c24] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {bln}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daftar Semua Kegiatan & Latihan */}
                <div className="space-y-2 pt-1 max-h-[380px] overflow-y-auto pr-0.5">
                  {prokers
                    .filter((p) => {
                      const matchTipe = jalankanFilterTipe === 'Semua' || p.tipe === jalankanFilterTipe;
                      const matchBulan = jalankanFilterBulan === 'Semua' || (p.bulan || '').toLowerCase() === jalankanFilterBulan.toLowerCase();
                      return matchTipe && matchBulan;
                    })
                    .map((p) => {
                      const isItemRunning = activeKegiatan?.kegiatanId === p.id && activeKegiatan.isRunning;

                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isItemRunning
                              ? 'bg-red-50/80 border-[#e51c24]'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {p.nama}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                p.tipe === 'Latihan Rutin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {p.tipe}
                              </span>
                              {p.bulan && (
                                <span className="text-[9px] font-mono text-slate-500">
                                  {p.bulan}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {p.waktuPelaksanaan} • Sasaran: {p.sasaran || 'Semua Penegak'}
                            </span>
                          </div>

                          <div className="shrink-0">
                            {isItemRunning ? (
                              <span className="px-2.5 py-1 rounded-xl bg-red-600 text-white font-black text-[10px] inline-flex items-center gap-1 animate-pulse">
                                <span>🔴</span>
                                <span>Berjalan</span>
                              </span>
                            ) : (
                              onStartKegiatan && (
                                <button
                                  type="button"
                                  onClick={() => onStartKegiatan(p)}
                                  className="px-3 py-1.5 rounded-xl bg-[#e51c24] hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                                  title={`Jalankan ${p.tipe}: ${p.nama}`}
                                >
                                  <span>▶️</span>
                                  <span>Jalankan</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {prokers.filter((p) => {
                    const matchTipe = jalankanFilterTipe === 'Semua' || p.tipe === jalankanFilterTipe;
                    const matchBulan = jalankanFilterBulan === 'Semua' || (p.bulan || '').toLowerCase() === jalankanFilterBulan.toLowerCase();
                    return matchTipe && matchBulan;
                  }).length === 0 && (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      Tidak ada kegiatan atau latihan yang sesuai filter.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MENGEVALUASI */}
          {prokerTab === 'evaluasi' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-slate-900">Evaluasi & Keterlaksanaan Program Kerja</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menilai efektivitas setiap kegiatan berdasarkan kehadiran anggota, skor rating kepuasan, masukan kelebihan, serta catatan kendala untuk penyempurnaan di kegiatan berikutnya.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Ketercapaian Program</span>
                    <strong className="text-sm font-bold text-slate-900">
                      {prokers.length > 0 ? Math.round((prokers.filter((p) => p.status === 'Terlaksana').length / prokers.length) * 100) : 0}%
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Indeks Kepuasan Rata-rata</span>
                    <strong className="text-sm font-bold text-emerald-800">4.8 / 5.0</strong>
                  </div>
                </div>

                {onNavigateMenu && (
                  <button
                    type="button"
                    onClick={() => onNavigateMenu('laporan')}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Buka Rekap Evaluasi Lengkap
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
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
          3. HALAMAN KELOLA PERSURATAN (SURAT OTOMATIS)
          ======================================================== */}
      {activeMenu === 'persuratan' && (
        <div className="space-y-3">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Persuratan Ambalan</span>
            <button
              type="button"
              onClick={() => setIsCreatingSurat(!isCreatingSurat)}
              className="px-3 py-1.5 rounded-xl bg-[#e51c24] text-white text-xs font-bold shadow-xs transition-all"
            >
              {isCreatingSurat ? 'Tutup Form' : 'Buat Surat Otomatis'}
            </button>
          </div>

          {/* Form Pembuatan Surat Otomatis */}
          {isCreatingSurat && (
            <form onSubmit={handleCreateSurat} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900">Form Surat Otomatis Resmi</h3>
              
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Jenis Surat:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Undangan', 'Tugas', 'Dispensasi', 'Peminjaman', 'Keterangan'] as const).map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setSuratJenis(j)}
                      className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold ${
                        suratJenis === j ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Perihal / Judul Surat:</label>
                <input
                  type="text"
                  value={suratPerihal}
                  onChange={(e) => setSuratPerihal(e.target.value)}
                  placeholder="Contoh: Undangan Rapat Pleno Dewan Ambalan"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tujuan / Penerima:</label>
                <input
                  type="text"
                  value={suratPenerima}
                  onChange={(e) => setSuratPenerima(e.target.value)}
                  placeholder="Contoh: Yth. Kepala SMPI Al-Wasi Maros"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pilih Anggota Terkait (Opsional):</label>
                <select
                  value={suratMemberTerkait}
                  onChange={(e) => setSuratMemberTerkait(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                >
                  <option value="">-- Pilih Anggota Ambalan --</option>
                  {allMembers.map((m) => (
                    <option key={m.uid || m.nama} value={m.nama}>
                      {m.nama} ({m.satuan} - Sangga {m.sangga})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tanggal Kegiatan:</label>
                  <input
                    type="text"
                    value={suratTanggalKegiatan}
                    onChange={(e) => setSuratTanggalKegiatan(e.target.value)}
                    placeholder="Contoh: 24 Oktober 2026"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tempat:</label>
                  <input
                    type="text"
                    value={suratTempat}
                    onChange={(e) => setSuratTempat(e.target.value)}
                    placeholder="Sanggar Ambalan"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Keperluan / Keterangan Singkat:</label>
                <textarea
                  rows={2}
                  value={suratKeperluan}
                  onChange={(e) => setSuratKeperluan(e.target.value)}
                  placeholder="Uraian ringkas tujuan pembuatan surat..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#e51c24] text-white text-xs font-bold transition-all shadow-xs"
              >
                Terbitkan & Buat Surat Otomatis
              </button>
            </form>
          )}

          {/* Modal Pratinjau Surat */}
          {previewSurat && (
            <div className="bg-white rounded-2xl p-4 border border-slate-300 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Pratinjau Surat Otomatis</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold"
                  >
                    Cetak / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSurat(null)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Teks Surat Resmi */}
              <div className="border border-slate-300 p-4 rounded-xl bg-white space-y-2 text-slate-900 text-xs">
                <div className="text-center border-b-2 border-slate-900 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">GERAKAN PRAMUKA GUGUS DEPAN 10-035 & 10-036</p>
                  <h4 className="text-xs font-bold uppercase">AMBALAN LA SURULLAH PETTA LOPO</h4>
                  <p className="text-[10px] text-slate-500">Pangkalan SMPI Al-Wasi Maros • Kwartir Ranting Maros Baru</p>
                </div>

                <div className="flex justify-between text-[11px] pt-1">
                  <div>
                    <p>Nomor : {previewSurat.nomorSurat}</p>
                    <p>Perihal : <strong>{previewSurat.perihal}</strong></p>
                  </div>
                  <p>Maros, {previewSurat.tanggalSurat}</p>
                </div>

                <div className="pt-1">
                  <p>Kepada Yth.</p>
                  <p className="font-bold">{previewSurat.penerima}</p>
                  <p>di Tempat</p>
                </div>

                <p className="pt-1 leading-relaxed">
                  Dengan hormat, sehubungan dengan agenda Gerakan Pramuka Ambalan La Surullah Petta Lopo, disampaikan bahwa:
                </p>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-0.5 font-mono">
                  <p>• Jenis Surat : {previewSurat.jenis}</p>
                  {previewSurat.anggotaTerlibat && <p>• Anggota Terkait : {previewSurat.anggotaTerlibat}</p>}
                  <p>• Hari / Tanggal : {previewSurat.tanggalKegiatan}</p>
                  <p>• Tempat : {previewSurat.tempat}</p>
                  <p>• Keperluan : {previewSurat.keperluan}</p>
                </div>

                <p className="pt-1 leading-relaxed">
                  Demikian surat ini disampaikan untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerjasamanya diucapkan terima kasih.
                </p>

                <div className="pt-4 grid grid-cols-2 text-center text-[11px]">
                  <div>
                    <p>Pradana Ambalan,</p>
                    <p className="mt-8 font-bold underline">Muhammad Fadli Pratama</p>
                  </div>
                  <div>
                    <p>Kerani (Sekretaris),</p>
                    <p className="mt-8 font-bold underline">Andi Tenri Sumpala</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daftar Arsip Surat Keluar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase pb-1 border-b border-slate-100">
              Daftar Arsip Surat Keluar ({suratList.length})
            </h3>
            <div className="space-y-1.5">
              {suratList.map((surat) => (
                <div key={surat.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-slate-500 font-bold block">{surat.nomorSurat}</span>
                    <span className="text-xs font-bold text-slate-900 block truncate">{surat.perihal}</span>
                    <span className="text-[10px] text-slate-500">{surat.tanggalSurat} • Tujuan: {surat.penerima}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewSurat(surat)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold shrink-0"
                  >
                    Buka
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          4. HALAMAN KELOLA KEUANGAN
          ======================================================== */}
      {activeMenu === 'keuangan' && (
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
