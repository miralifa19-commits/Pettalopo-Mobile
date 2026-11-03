import React, { useState } from 'react';
import { ProgramKerjaItem } from '../../types';
import { BANK_CONTOH_KEGIATAN, ContohKegiatanTemplate } from '../../data/contohKegiatanData';

interface SusunKegiatanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKegiatan: (item: ProgramKerjaItem) => void;
}

const BULAN_OPTIONS = [
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

export const SusunKegiatanModal: React.FC<SusunKegiatanModalProps> = ({
  isOpen,
  onClose,
  onAddKegiatan
}) => {
  const [filterTipe, setFilterTipe] = useState<'Semua' | 'Kegiatan' | 'Latihan Rutin'>('Semua');
  const [selectedTemplate, setSelectedTemplate] = useState<ContohKegiatanTemplate | null>(null);

  // Editable fields before submitting
  const [customNama, setCustomNama] = useState('');
  const [customBulan, setCustomBulan] = useState('Oktober');
  const [customWaktu, setCustomWaktu] = useState('');
  const [customTempat, setCustomTempat] = useState('');
  const [customAnggaran, setCustomAnggaran] = useState('');
  const [customSasaran, setCustomSasaran] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const filteredTemplates = BANK_CONTOH_KEGIATAN.filter(t => {
    if (filterTipe === 'Semua') return true;
    return t.tipe === filterTipe;
  });

  const handleSelectTemplate = (tpl: ContohKegiatanTemplate) => {
    setSelectedTemplate(tpl);
    setCustomNama(tpl.nama);
    setCustomBulan(tpl.bulan);
    setCustomWaktu(tpl.waktuPelaksanaan);
    setCustomTempat(tpl.tempat);
    setCustomAnggaran(tpl.anggaran);
    setCustomSasaran(tpl.sasaran);
  };

  const handleMasukanKegiatan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const bulanObj = BULAN_OPTIONS.find(b => b.nama.toLowerCase() === customBulan.toLowerCase()) || { nama: customBulan, urutan: 1 };
    const newId = `proker_custom_${Date.now()}`;

    const newKegiatan: ProgramKerjaItem = {
      id: newId,
      nama: customNama.trim() || selectedTemplate.nama,
      tipe: selectedTemplate.tipe,
      bulan: bulanObj.nama,
      bulanUrutan: bulanObj.urutan,
      waktuPelaksanaan: customWaktu.trim() || selectedTemplate.waktuPelaksanaan,
      tempat: customTempat.trim() || selectedTemplate.tempat,
      anggaran: customAnggaran.trim() || selectedTemplate.anggaran,
      sasaran: customSasaran.trim() || selectedTemplate.sasaran,
      seragam: selectedTemplate.seragam,
      penanggungJawab: selectedTemplate.penanggungJawab,
      deskripsi: selectedTemplate.deskripsi,
      status: 'Direncanakan',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onAddKegiatan(newKegiatan);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setSelectedTemplate(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white w-full max-w-lg rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">✨</span>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Susun Kegiatan dari Contoh
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pilih contoh kegiatan pramuka terstandar dan masukkan ke agenda kegiatan & latihan.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          
          {isSuccess ? (
            <div className="py-12 text-center space-y-2">
              <span className="text-4xl block">🎉</span>
              <h4 className="text-sm font-bold text-slate-900">
                Kegiatan Berhasil Dimasukkan!
              </h4>
              <p className="text-xs text-slate-500">
                Agenda telah ditambahkan ke daftar Kegiatan dan Latihan Ambalan.
              </p>
            </div>
          ) : !selectedTemplate ? (
            /* Langkah 1: Pilih Contoh Kegiatan */
            <div className="space-y-3">
              {/* Filter Tipe */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterTipe('Semua')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    filterTipe === 'Semua' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semua ({BANK_CONTOH_KEGIATAN.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTipe('Kegiatan')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    filterTipe === 'Kegiatan' ? 'bg-white text-[#e51c24] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  🏕️ Kegiatan
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTipe('Latihan Rutin')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    filterTipe === 'Latihan Rutin' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ⚡ Latihan Rutin
                </button>
              </div>

              {/* List Contoh Kegiatan */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                  Pilih salah satu contoh kegiatan di bawah:
                </span>

                {filteredTemplates.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectTemplate(item)}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-400 transition-all cursor-pointer space-y-1.5 text-xs group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {item.kategoriLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        item.tipe === 'Kegiatan' 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {item.tipe}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 group-hover:text-[#e51c24] transition-colors leading-snug">
                      {item.nama}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {item.deskripsi}
                    </p>

                    <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                      <span>🗓️ Bulan {item.bulan}</span>
                      <span>💰 {item.anggaran}</span>
                      <span className="text-red-600 font-bold group-hover:underline">Pilih Contoh →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Langkah 2: Review & Sesuaikan Kegiatan sebelum dimasukkan */
            <form onSubmit={handleMasukanKegiatan} className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1"
                >
                  ← Ganti Contoh Lain
                </button>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  selectedTemplate.tipe === 'Kegiatan' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedTemplate.tipe}
                </span>
              </div>

              {/* Nama Kegiatan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Nama Kegiatan / Latihan:
                </label>
                <input
                  type="text"
                  required
                  value={customNama}
                  onChange={(e) => setCustomNama(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Bulan & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Bulan Pelaksanaan:
                  </label>
                  <select
                    value={customBulan}
                    onChange={(e) => setCustomBulan(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
                  >
                    {BULAN_OPTIONS.map((b) => (
                      <option key={b.nama} value={b.nama}>{b.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Estimasi Tanggal / Waktu:
                  </label>
                  <input
                    type="text"
                    required
                    value={customWaktu}
                    onChange={(e) => setCustomWaktu(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tempat & Anggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Lokasi / Tempat:
                  </label>
                  <input
                    type="text"
                    value={customTempat}
                    onChange={(e) => setCustomTempat(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Estimasi Anggaran:
                  </label>
                  <input
                    type="text"
                    value={customAnggaran}
                    onChange={(e) => setCustomAnggaran(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sasaran */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Sasaran Peserta:
                </label>
                <input
                  type="text"
                  value={customSasaran}
                  onChange={(e) => setCustomSasaran(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              {/* Ringkasan Template */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Deskripsi Kegiatan:</span>
                <p className="leading-relaxed">{selectedTemplate.deskripsi}</p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-[#e51c24] text-white font-extrabold hover:bg-red-700 transition-colors shadow-xs"
                >
                  ➕ Masukkan ke Kegiatan dan Latihan
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
