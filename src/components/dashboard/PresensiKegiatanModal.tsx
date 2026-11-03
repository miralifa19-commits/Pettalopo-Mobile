import React, { useState } from 'react';
import { UserAccount, ActiveKegiatanSession, KegiatanEvaluation } from '../../types';
import { saveKegiatanEvaluation } from '../../services/firebaseService';

interface PresensiKegiatanModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKegiatan: ActiveKegiatanSession;
  allMembers: UserAccount[];
  currentUser: UserAccount;
  onSuccess?: () => void;
}

export const PresensiKegiatanModal: React.FC<PresensiKegiatanModalProps> = ({
  isOpen,
  onClose,
  activeKegiatan,
  allMembers,
  currentUser,
  onSuccess
}) => {
  if (!isOpen) return null;

  // Selected member
  const [selectedMemberName, setSelectedMemberName] = useState<string>(currentUser.nama || '');
  const [statusKehadiran, setStatusKehadiran] = useState<'Hadir' | 'Izin' | 'Sakit'>('Hadir');
  const [rating, setRating] = useState<number>(5);
  const [kelebihan, setKelebihan] = useState<string>('');
  const [kekurangan, setKekurangan] = useState<string>('');
  const [masukan, setMasukan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected member object
  const selectedMember = allMembers.find((m) => m.nama === selectedMemberName) || currentUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberName.trim()) {
      setErrorMessage('Silakan pilih nama anggota terlebih dahulu.');
      return;
    }
    if (!kelebihan.trim()) {
      setErrorMessage('Wajib mengisi evaluasi kelebihan kegiatan.');
      return;
    }
    if (!kekurangan.trim()) {
      setErrorMessage('Wajib mengisi evaluasi kekurangan kegiatan.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const evaluationRecord: KegiatanEvaluation = {
        id: `eval_${activeKegiatan.kegiatanId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        kegiatanId: activeKegiatan.kegiatanId,
        kegiatanNama: activeKegiatan.kegiatanNama,
        kegiatanTipe: activeKegiatan.tipe,
        memberUid: selectedMember.uid || selectedMember.username,
        memberName: selectedMember.nama,
        satuan: selectedMember.satuan || 'Putra',
        sangga: selectedMember.sangga || 'Perintis',
        tingkat: selectedMember.tingkat || 'Penegak Bantara',
        statusKehadiran,
        rating,
        kelebihan: kelebihan.trim(),
        kekurangan: kekurangan.trim(),
        masukan: masukan.trim(),
        submittedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
        timestamp: Date.now()
      };

      await saveKegiatanEvaluation(evaluationRecord);

      setIsSubmitting(false);
      setSuccessMessage(true);

      setTimeout(() => {
        setSuccessMessage(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Gagal menyimpan presensi dan evaluasi:', err);
      setIsSubmitting(false);
      setErrorMessage('Terjadi kendala saat menyimpan. Mohon coba kembali.');
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1: return 'Sangat Kurang';
      case 2: return 'Kurang';
      case 3: return 'Cukup Baik';
      case 4: return 'Sangat Baik';
      case 5: return 'Luar Biasa / Sempurna';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/60 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-red-200 space-y-4 my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-[#e51c24] font-mono tracking-wider">
                Kegiatan Sedang Berlangsung
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 mt-0.5 leading-tight">
              Presensi & Evaluasi Kegiatan
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {activeKegiatan.kegiatanNama}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {successMessage ? (
          <div className="py-8 text-center space-y-2">
            <span className="text-4xl block">✅</span>
            <h4 className="text-sm font-black text-slate-900">
              Presensi & Evaluasi Tersimpan!
            </h4>
            <p className="text-xs text-slate-600">
              Terima kasih atas partisipasi dan masukan evaluasi Anda. Data telah masuk ke rekap laporan ambalan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto pr-1 text-xs">
            
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* 1. Dropdown Nama Anggota */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pilih Nama Anggota Pramuka: <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedMemberName}
                onChange={(e) => setSelectedMemberName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-red-500"
              >
                <option value="">-- Pilih Nama dari Daftar Anggota --</option>
                {allMembers.map((m) => (
                  <option key={m.uid || m.username || m.nama} value={m.nama}>
                    {m.nama} ({m.satuan} • Sangga {m.sangga} • {m.tingkat})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Kehadiran */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Status Kehadiran:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Hadir', 'Izin', 'Sakit'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusKehadiran(st)}
                    className={`py-2 rounded-xl font-bold text-xs transition-all border ${
                      statusKehadiran === st
                        ? 'bg-[#e51c24] text-white border-red-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'Hadir' ? '🟢 Hadir' : st === 'Izin' ? '🟡 Izin' : '⚪ Sakit'}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Rating Kegiatan (1-5 Bintang) - WAJIB */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800">
                  1. Rating Kepuasan Kegiatan: <span className="text-red-600">*</span>
                </label>
                <span className="text-[10px] font-extrabold text-[#e51c24] bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  {getRatingLabel(rating)}
                </span>
              </div>

              {/* Star Selector */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl transition-transform active:scale-125 hover:scale-110 focus:outline-none"
                    title={`${star} Bintang`}
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-center text-slate-500">
                Ketuk bintang untuk memberi penilaian mutu dan manfaat kegiatan
              </p>
            </div>

            {/* 3. Evaluasi Kelebihan Kegiatan - WAJIB */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                2. Evaluasi: Kelebihan Kegiatan <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                value={kelebihan}
                onChange={(e) => setKelebihan(e.target.value)}
                placeholder="Tuliskan hal-hal positif, kelancaran acara, materi bermanfaat, atau kekompakan sangga..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* 4. Evaluasi Kekurangan Kegiatan - WAJIB */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                3. Evaluasi: Kekurangan / Kendala <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                value={kekurangan}
                onChange={(e) => setKekurangan(e.target.value)}
                placeholder="Tuliskan kendala waktu, perlengkapan, kedisiplinan, atau hal yang perlu diperbaiki..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* 5. Catatan Masukan Tambahan (Opsional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Saran & Masukan Lanjutan (Opsional):
              </label>
              <input
                type="text"
                value={masukan}
                onChange={(e) => setMasukan(e.target.value)}
                placeholder="Rekomendasi untuk latihan / kegiatan berikutnya..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 shrink-0">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#e51c24] hover:bg-red-700 text-white font-black text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <span>{isSubmitting ? '⏳' : '💾'}</span>
                <span>{isSubmitting ? 'Menyimpan Presensi & Evaluasi...' : 'Kirim Presensi & Evaluasi'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
