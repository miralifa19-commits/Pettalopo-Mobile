import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  X, 
  Flame, 
  MapPin, 
  Shirt, 
  Check, 
  ArrowUpDown,
  History,
  Edit3
} from 'lucide-react';
import { ProgramKerjaItem, ProgramKerjaStatus } from '../../types';
import { BULAN_LIST } from '../PetaPerjalananProker';

interface ProgramKerjaViewProps {
  programKerjaList: ProgramKerjaItem[];
  onUpdateList: (list: ProgramKerjaItem[]) => void;
  isAdmin?: boolean;
}

export const ProgramKerjaView: React.FC<ProgramKerjaViewProps> = ({
  programKerjaList,
  onUpdateList,
  isAdmin = true
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramKerjaItem | null>(null);
  const [filterTipe, setFilterTipe] = useState<'Semua' | 'Kegiatan' | 'Latihan Rutin'>('Semua');
  
  // FITUR URUTKAN: 'bulan' vs 'tanggal_diubah'
  const [sortBy, setSortBy] = useState<'bulan' | 'tanggal_diubah'>('bulan');

  // Form State (Shared for Add & Edit)
  const [tipe, setTipe] = useState<'Kegiatan' | 'Latihan Rutin'>('Kegiatan');
  const [nama, setNama] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('Juli');
  const [waktu, setWaktu] = useState('');
  const [sasaran, setSasaran] = useState('Seluruh Penegak Ambalan');
  const [penanggungJawab, setPenanggungJawab] = useState('Pradana & Dewan Ambalan');
  const [anggaran, setAnggaran] = useState('');
  const [status, setStatus] = useState<ProgramKerjaStatus>('Direncanakan');
  const [deskripsi, setDeskripsi] = useState('');
  const [tempat, setTempat] = useState('');
  const [seragam, setSeragam] = useState('');

  const now = Date.now();

  const resetForm = () => {
    setNama('');
    setWaktu('');
    setDeskripsi('');
    setAnggaran('');
    setTempat('');
    setSeragam('');
    setTipe('Kegiatan');
    setSelectedBulan('Juli');
    setStatus('Direncanakan');
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (item: ProgramKerjaItem) => {
    setEditingItem(item);
    setTipe(item.tipe || 'Kegiatan');
    setNama(item.nama);
    setSelectedBulan(item.bulan || 'Juli');
    setWaktu(item.waktuPelaksanaan);
    setSasaran(item.sasaran);
    setPenanggungJawab(item.penanggungJawab);
    setAnggaran(item.anggaran || '');
    setStatus(item.status);
    setDeskripsi(item.deskripsi);
    setTempat(item.tempat || '');
    setSeragam(item.seragam || '');
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const bulanData = BULAN_LIST.find(b => b.nama === selectedBulan) || BULAN_LIST[0];

    if (editingItem) {
      // EDIT MODE
      const updated = programKerjaList.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            tipe,
            nama: nama.trim(),
            bulan: selectedBulan,
            bulanUrutan: bulanData.urutan,
            waktuPelaksanaan: waktu.trim() || `Bulan ${selectedBulan}`,
            sasaran: sasaran.trim(),
            penanggungJawab: penanggungJawab.trim(),
            anggaran: anggaran.trim() || undefined,
            status,
            deskripsi: deskripsi.trim() || (tipe === 'Kegiatan' ? 'Agenda kegiatan ambalan.' : 'Materi latihan rutin mingguan.'),
            tempat: tempat.trim() || (tipe === 'Latihan Rutin' ? 'Sanggar Pramuka / Lapangan' : undefined),
            seragam: seragam.trim() || (tipe === 'Latihan Rutin' ? 'Seragam Pramuka Lengkap' : undefined),
            updatedAt: Date.now()
          };
        }
        return item;
      });

      onUpdateList(updated);
      resetForm();
    } else {
      // ADD MODE
      const newItem: ProgramKerjaItem = {
        id: `proker-${now}`,
        tipe,
        nama: nama.trim(),
        bulan: selectedBulan,
        bulanUrutan: bulanData.urutan,
        waktuPelaksanaan: waktu.trim() || `Bulan ${selectedBulan}`,
        sasaran: sasaran.trim(),
        penanggungJawab: penanggungJawab.trim(),
        anggaran: anggaran.trim() || undefined,
        status,
        deskripsi: deskripsi.trim() || (tipe === 'Kegiatan' ? 'Agenda kegiatan ambalan.' : 'Materi latihan rutin mingguan.'),
        tempat: tempat.trim() || (tipe === 'Latihan Rutin' ? 'Sanggar Pramuka / Lapangan' : undefined),
        seragam: seragam.trim() || (tipe === 'Latihan Rutin' ? 'Seragam Pramuka Lengkap' : undefined),
        createdAt: now,
        updatedAt: now
      };

      const updated = [newItem, ...programKerjaList];
      onUpdateList(updated);
      resetForm();
    }
  };

  const handleDelete = (id: string) => {
    onUpdateList(programKerjaList.filter(item => item.id !== id));
  };

  // Set status directly to Terlaksana / Tidak Terlaksana / Direncanakan
  const handleSetStatus = (id: string, newStatus: 'Direncanakan' | 'Berjalan' | 'Terlaksana' | 'Tidak Terlaksana') => {
    const updated = programKerjaList.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          status: newStatus,
          updatedAt: Date.now() 
        };
      }
      return item;
    });
    onUpdateList(updated);
  };

  // 1. Filter Kategori
  const filteredItems = programKerjaList.filter(item => {
    if (filterTipe === 'Semua') return true;
    return (item.tipe || 'Kegiatan') === filterTipe;
  });

  // 2. Terapkan Urutan: Berdasarkan Bulan (Juli ke Juni) atau Berdasarkan Tanggal Diubah (Terbaru)
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'bulan') {
      return (a.bulanUrutan || 1) - (b.bulanUrutan || 1);
    } else {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    }
  });

  return (
    <div className="space-y-4 pb-24">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
            Perencanaan & Evaluasi
          </span>
          <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1">
            Program Kerja (1 Tahun)
          </h1>
          <p className="text-xs text-slate-500">
            Kelola, edit isi kegiatan, dan tentukan jadwal pelaksanaan
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-[#e51c24] hover:bg-[#c9141b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm border border-amber-400 active:scale-95 transition-transform shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        ) : (
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shrink-0">
            Mode Anggota (Viewer)
          </span>
        )}
      </div>

      {/* FILTER & FITUR URUTKAN */}
      <div className="bg-white rounded-2xl p-3 border-2 border-slate-100 shadow-xs space-y-2.5">
        
        {/* Baris Fitur Urutkan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <ArrowUpDown className="w-4 h-4 text-[#e51c24]" />
            <span>Urutkan Berdasarkan:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSortBy('bulan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sortBy === 'bulan'
                  ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Berdasarkan Bulan (Juli - Juni)</span>
            </button>

            <button
              onClick={() => setSortBy('tanggal_diubah')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sortBy === 'tanggal_diubah'
                  ? 'bg-[#e51c24] text-white border border-red-600 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Tanggal Diubah</span>
            </button>
          </div>
        </div>

        {/* Filter Kategori: Semua / Kegiatan / Latihan Rutin */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
          {(['Semua', 'Kegiatan', 'Latihan Rutin'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterTipe(cat)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTipe === cat
                  ? cat === 'Latihan Rutin'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-[#e51c24] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Program List */}
      <div className="space-y-3">
        {sortedItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {filterTipe === 'Semua' 
                  ? 'Belum Ada Program Kerja' 
                  : `Belum Ada Data ${filterTipe}`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                Tambahkan rencana program kerja dengan memilih jenis <strong>Kegiatan</strong> atau <strong>Latihan Rutin</strong>.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-xs hover:bg-amber-300 transition-colors"
            >
              + Tambah Program Kerja Baru
            </button>
          </div>
        ) : (
          sortedItems.map((item, index) => {
            const isLatihan = item.tipe === 'Latihan Rutin';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border-2 transition-all shadow-xs space-y-2.5 ${
                  isLatihan ? 'border-amber-300 hover:border-amber-400' : 'border-slate-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border ${
                      isLatihan
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-red-50 text-[#e51c24] border-red-200'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      {/* BULAN NAIK KE ATAS & BOLD */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[11px] font-black uppercase text-slate-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 font-mono tracking-wider shadow-xs">
                          BULAN {item.bulan || 'JULI'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLatihan ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-[#e51c24]'
                        }`}>
                          {item.tipe || 'Kegiatan'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          ({item.waktuPelaksanaan})
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {item.nama}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                    item.status === 'Terlaksana'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : item.status === 'Tidak Terlaksana'
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : item.status === 'Berjalan'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal pl-8">
                  {item.deskripsi}
                </p>

                {/* Info khusus Latihan Rutin */}
                {isLatihan && (item.tempat || item.seragam) && (
                  <div className="ml-8 p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 flex flex-wrap gap-3">
                    {item.tempat && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#e51c24]" />
                        <span>Lokasi: {item.tempat}</span>
                      </span>
                    )}
                    {item.seragam && (
                      <span className="flex items-center gap-1">
                        <Shirt className="w-3 h-3 text-amber-700" />
                        <span>Pakaian: {item.seragam}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Quick Status Setter (Admin Only) */}
                {isAdmin && (
                  <div className="ml-8 p-2 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500">Stel Status:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSetStatus(item.id, 'Terlaksana')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          item.status === 'Terlaksana'
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        ✓ Terlaksana
                      </button>
                      <button
                        onClick={() => handleSetStatus(item.id, 'Tidak Terlaksana')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          item.status === 'Tidak Terlaksana'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                        }`}
                      >
                        ✕ Tidak Terlaksana
                      </button>
                      <button
                        onClick={() => handleSetStatus(item.id, 'Direncanakan')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          item.status === 'Direncanakan'
                            ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Direncanakan
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer info: Sasaran, PJ, & ACTION BUTTONS (EDIT & HAPUS Admin Only) */}
                <div className="pt-2 border-t border-slate-100 pl-8 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <div className="space-x-2">
                    <span>Sasaran: <strong className="text-slate-700">{item.sasaran}</strong></span>
                    <span>•</span>
                    <span>PJ: <strong className="text-slate-700">{item.penanggungJawab}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.updatedAt && (
                      <span className="text-[9px] text-slate-400 font-mono">
                        Diubah: {new Date(item.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                    {/* TOMBOL EDIT & HAPUS (Admin Only) */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1 shadow-xs active:scale-95"
                          title="Ubah / Edit Kegiatan"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus Program Kerja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL FORM (UNTUK TAMBAH MAUPUN EDIT) */}
      {(isAdding || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border-2 border-amber-400 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {editingItem ? (
                  <>
                    <Edit3 className="w-4 h-4 text-[#e51c24]" />
                    <h2 className="text-sm font-black text-slate-900">Edit {tipe}</h2>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#e51c24]" />
                    <h2 className="text-sm font-black text-slate-900">Tambah Program Kerja</h2>
                  </>
                )}
              </div>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="mt-3 space-y-3">
              
              {/* KATEGORI */}
              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">
                  Kategori: *
                </label>
                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value as 'Kegiatan' | 'Latihan Rutin')}
                  className="w-full px-3 py-2.5 border-2 border-amber-400 bg-amber-50/50 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  <option value="Kegiatan">📅 Kegiatan (Perkemahan, Bakti, Lomba, Pelantikan)</option>
                  <option value="Latihan Rutin">🔥 Latihan Rutin (Materi Mingguan, Sandi, Pionering)</option>
                </select>
              </div>

              {/* PILIHAN BULAN (Dimulai dari Juli) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Bulan Pelaksanaan: *
                  </label>
                  <select
                    value={selectedBulan}
                    onChange={(e) => setSelectedBulan(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400"
                  >
                    {BULAN_LIST.map((b) => (
                      <option key={b.urutan} value={b.nama}>
                        Bulan {b.nama} (Urutan ke-{b.urutan})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Status Pelaksanaan: *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Direncanakan">Direncanakan</option>
                    <option value="Berjalan">Sedang Berjalan</option>
                    <option value="Terlaksana">✓ Terlaksana</option>
                    <option value="Tidak Terlaksana">✕ Tidak Terlaksana</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama {tipe === 'Kegiatan' ? 'Kegiatan' : 'Latihan Rutin'}: *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder={tipe === 'Kegiatan' ? "Contoh: Penerimaan Tamu Ambalan (PTA)" : "Contoh: Latihan Rutin Sandi Morse & Isyarat Peluit"}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Rincian Waktu / Tanggal:
                </label>
                <input
                  type="text"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  placeholder="Contoh: Minggu ke-2 Juli / Sabtu, 15:30 WITA"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              {tipe === 'Latihan Rutin' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Lokasi / Tempat Latihan:
                    </label>
                    <input
                      type="text"
                      value={tempat}
                      onChange={(e) => setTempat(e.target.value)}
                      placeholder="Contoh: Sanggar Pramuka"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Ketentuan Seragam / Baju:
                    </label>
                    <input
                      type="text"
                      value={seragam}
                      onChange={(e) => setSeragam(e.target.value)}
                      placeholder="Contoh: Seragam Pramuka Lengkap"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Sasaran Peserta:
                    </label>
                    <input
                      type="text"
                      value={sasaran}
                      onChange={(e) => setSasaran(e.target.value)}
                      placeholder="Contoh: Seluruh Calon Bantara"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Estimasi Anggaran (Opsional):
                    </label>
                    <input
                      type="text"
                      value={anggaran}
                      onChange={(e) => setAnggaran(e.target.value)}
                      placeholder="Contoh: Kas Ambalan / Swadaya"
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Penanggung Jawab:
                </label>
                <input
                  type="text"
                  value={penanggungJawab}
                  onChange={(e) => setPenanggungJawab(e.target.value)}
                  placeholder="Contoh: Pradana & Seksi Kegiatan"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Deskripsi / Rincian Materi:
                </label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder={tipe === 'Kegiatan' ? "Jelaskan tujuan kegiatan, lokasi dan persiapan..." : "Rincian materi yang diajarkan, perlengkapan yang wajib dibawa..."}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-bold border border-amber-400 hover:bg-[#c9141b] transition-colors"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Program Kerja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
