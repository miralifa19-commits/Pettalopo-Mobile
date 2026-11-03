import React, { useState, useMemo } from 'react';
import { UserAccount } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';

interface SanggaViewProps {
  currentUser: UserAccount;
  allMembers?: UserAccount[];
  onBack?: () => void;
}

type SanggaName = 'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana';

const SANGGA_LIST: SanggaName[] = ['Perintis', 'Penegas', 'Pendobrak', 'Pencoba', 'Pelaksana'];

/**
 * Mengurutkan anggota sangga:
 * 1. Pimpinan Sangga (Pinsang) di urutan PALING ATAS
 * 2. Anggota Biasa di bagian tengah
 * 3. Wakil Pimpinan Sangga (Wapinsang) di urutan PALING BAWAH
 */
function sortMembersPinsangWapinsang(members: UserAccount[]): UserAccount[] {
  if (members.length <= 1) return members;

  const pinsang = members.find((m) => {
    const jab = (m.jabatan || '').toLowerCase();
    return jab.includes('pinsang') || jab.includes('pemimpin sangga') || jab.includes('pimpinan sangga');
  });

  const wapinsang = members.find((m) => {
    if (m === pinsang) return false;
    const jab = (m.jabatan || '').toLowerCase();
    return jab.includes('wapinsang') || jab.includes('wakil');
  });

  const regulars = members.filter((m) => m !== pinsang && m !== wapinsang);

  const result: UserAccount[] = [];
  if (pinsang) result.push(pinsang);
  result.push(...regulars);
  if (wapinsang) result.push(wapinsang);

  return result;
}

export const SanggaView: React.FC<SanggaViewProps> = ({ currentUser, allMembers = [], onBack }) => {
  // Pilihan Satuan: Sangga Putra vs Sangga Putri (Tanpa icon)
  const [selectedSatuan, setSelectedSatuan] = useState<'Putra' | 'Putri'>(
    currentUser.satuan === 'Putri' ? 'Putri' : 'Putra'
  );

  // Selected Sangga
  const [selectedSangga, setSelectedSangga] = useState<SanggaName>('Perintis');

  // Anggota sangga yang dipilih (Pinsang atas, Wapinsang bawah)
  const currentSanggaMembers = useMemo(() => {
    const list = allMembers.filter(
      (m) => m.satuan === selectedSatuan && m.sangga === selectedSangga
    );
    return sortMembersPinsangWapinsang(list);
  }, [allMembers, selectedSatuan, selectedSangga]);

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* Header Card Sangga dengan Tombol Kembali Melingkar */}
      <MenuHeaderCard
        title="Sangga Penegak"
        subtitle="Struktur sangga ambalan putra & putri"
        onBack={onBack || (() => {})}
      />
      
      {/* 1. Pemilihan Satuan Putra / Putri (Tanpa icon) */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedSatuan('Putra')}
            className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
              selectedSatuan === 'Putra'
                ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium'
            }`}
          >
            <span className="text-xs sm:text-sm block">Sangga Putra</span>
            <span className={`text-[10px] block mt-0.5 ${selectedSatuan === 'Putra' ? 'text-slate-300' : 'text-slate-500'}`}>
              Gudep 10-035
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedSatuan('Putri')}
            className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
              selectedSatuan === 'Putri'
                ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 font-medium'
            }`}
          >
            <span className="text-xs sm:text-sm block">Sangga Putri</span>
            <span className={`text-[10px] block mt-0.5 ${selectedSatuan === 'Putri' ? 'text-slate-300' : 'text-slate-500'}`}>
              Gudep 10-036
            </span>
          </button>
        </div>
      </div>

      {/* 2. Tombol Pilihan 5 Sangga (Tanpa Icon) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-5 gap-1 text-center">
          {SANGGA_LIST.map((nama) => {
            const isSelected = selectedSangga === nama;
            return (
              <button
                key={nama}
                onClick={() => setSelectedSangga(nama)}
                className={`py-2 px-1 rounded-xl text-center text-xs transition-all ${
                  isSelected
                    ? 'bg-[#e51c24] text-white font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium'
                }`}
              >
                <span className="block truncate">{nama}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Menampilkan Nama Sangga & Anggotanya Langsung (Pinsang atas, Wapinsang bawah, hanya list nama) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Sangga {selectedSangga} ({selectedSatuan})
          </h2>
          <span className="text-xs text-slate-500">
            {currentSanggaMembers.length} Anggota
          </span>
        </div>

        {/* List Nama Anggota (Hanya nama, 1 baris per nama) */}
        {currentSanggaMembers.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Belum ada anggota di Sangga {selectedSangga} {selectedSatuan}.
          </div>
        ) : (
          <div className="space-y-1.5">
            {currentSanggaMembers.map((m) => (
              <div
                key={m.uid || m.username || m.nama}
                className="bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200"
              >
                <span className="text-xs sm:text-sm font-medium text-slate-800 block truncate">
                  {m.nama}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Daftar Lengkap Seluruh 5 Sangga Langsung (Tanpa Icon) */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide px-1">
          Semua Sangga {selectedSatuan}
        </div>

        {SANGGA_LIST.map((namaSangga) => {
          const members = sortMembersPinsangWapinsang(
            allMembers.filter((m) => m.satuan === selectedSatuan && m.sangga === namaSangga)
          );

          return (
            <div
              key={namaSangga}
              className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  Sangga {namaSangga}
                </span>
                <span className="text-xs text-slate-400">
                  {members.length} Anggota
                </span>
              </div>

              {/* List Nama Anggota (Hanya Nama) */}
              <div className="space-y-1">
                {members.length === 0 ? (
                  <span className="text-xs text-slate-400 block py-1">
                    Belum ada anggota.
                  </span>
                ) : (
                  members.map((m) => (
                    <div
                      key={m.uid || m.username || m.nama}
                      className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-xs font-medium text-slate-800 truncate"
                    >
                      {m.nama}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
