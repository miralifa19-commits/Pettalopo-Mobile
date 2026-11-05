import React, { useState, useEffect } from 'react';
import { UserAccount } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { getMabigusOfficials, saveMabigusOfficials, MabigusOfficials } from '../../data/mabigusData';

interface Props {
  currentUser?: UserAccount;
  allMembers?: UserAccount[];
  onBack?: () => void;
}

export const MabigusView: React.FC<Props> = ({ currentUser, onBack }) => {
  const [officials, setOfficials] = useState<MabigusOfficials>(getMabigusOfficials());
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<MabigusOfficials>(officials);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const data = getMabigusOfficials();
    setOfficials(data);
    setFormData(data);
  }, []);

  const handleSave = () => {
    saveMabigusOfficials(formData);
    setOfficials(formData);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const positions = [
    { key: 'ketuaGudep', label: 'Ketua Gugus Depan', sub: 'Pangkalan SMA Negeri 9 Maros' },
    { key: 'ketuaGudepJabatan', label: 'Jabatan Ketua Mabigus', sub: 'Ditampilkan pada tanda tangan surat' },
    { key: 'pembinaPutra', label: 'Pembina Putra', sub: 'Gugus Depan 10.035' },
    { key: 'pembinaPutri', label: 'Pembina Putri', sub: 'Gugus Depan 10.036' },
    { key: 'pembantuPembinaPutra', label: 'Pembantu Pembina Putra', sub: 'Gugus Depan 10.035' },
    { key: 'pembantuPembinaPutri', label: 'Pembantu Pembina Putri', sub: 'Gugus Depan 10.036' },
  ] as const;

  return (
    <div className="space-y-4 pb-28 font-sans">
      <MenuHeaderCard
        title="Mabigus & Pembina"
        subtitle="Struktur Pembina Gugus Depan 10.035 - 10.036"
        onBack={onBack || (() => {})}
      />

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
          <span>✅ Perubahan data Pembina & Mabigus berhasil disimpan!</span>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-600">Daftar Pembina & Pimpinan</span>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#c81e28] text-white hover:bg-[#a91b24] transition-all cursor-pointer"
          >
            ✏️ Edit Data
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(officials);
                setIsEditing(false);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
            >
              Simpan
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {positions.map((pos) => {
          const val = isEditing ? formData[pos.key] : officials[pos.key];
          return (
            <div
              key={pos.key}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#c81e28] uppercase tracking-wide">
                  {pos.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{pos.sub}</span>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={formData[pos.key]}
                  onChange={(e) => setFormData({ ...formData, [pos.key]: e.target.value })}
                  className="w-full text-sm font-semibold p-2 border border-slate-300 rounded-xl focus:border-[#c81e28] focus:outline-none"
                />
              ) : (
                <p className="text-sm font-bold text-slate-900">{val || 'Belum diisi'}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
