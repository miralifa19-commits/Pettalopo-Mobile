import React from 'react';
import { UserAccount } from '../../types';
import { ShiningAmbalanLogo } from '../common/ShiningAmbalanLogo';
import { MenuHeaderCard } from '../common/MenuHeaderCard';

interface AkunViewProps {
  user: UserAccount;
  onUpdateUser?: (updated: UserAccount) => void;
  onNavigateToDatabase?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onBack?: () => void;
}

export function formatBirthDate(birthStr?: string): string {
  if (!birthStr) return '-';
  const d = new Date(birthStr.includes('T') ? birthStr : `${birthStr}T00:00:00`);
  if (isNaN(d.getTime())) return birthStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getScoutMemberStatus(user?: UserAccount | null): string {
  if (!user) return 'Calon Anggota';
  if (user.role === 'admin' || user.email?.toLowerCase() === 'miralifa19@gmail.com') {
    return 'Pembina / Admin';
  }
  const birthStr = (user as any).tanggalLahir || user.ttl;
  let years = user.usia ?? (user as any).usiaTahun;
  if (birthStr) {
    const birth = new Date(`${birthStr}T00:00:00`);
    if (!isNaN(birth.getTime())) {
      const now = new Date();
      years = now.getFullYear() - birth.getFullYear();
      const beforeBirthday = now.getMonth() < birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
      if (beforeBirthday) years--;
    }
  }
  if (typeof years === 'number') {
    return years >= 21 ? 'Purna Ambalan' : 'Calon Anggota';
  }
  return 'Calon Anggota';
}

export const AkunView: React.FC<AkunViewProps> = ({ 
  user, 
  onLogout,
  onBack
}) => {
  const photoUrl = user.foto || 
    (user as any).fotoUrl || 
    (user as any).photoURL || 
    (user as any).photo || 
    (user as any).avatarUrl;

  const birthDateFormatted = formatBirthDate((user as any).tanggalLahir || user.ttl);
  const statusAnggota = getScoutMemberStatus(user);

  return (
    <div className="space-y-4 pb-24 font-sans select-none">
      {/* Header Halaman */}
      <MenuHeaderCard
        title="Akun Saya"
        subtitle="Profil pengguna Pettalopo"
        onBack={onBack || (() => {})}
      />

      {/* Kartu Profil Utama: Foto Besar, Nama, Tanggal Lahir, Status Anggota */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs text-center flex flex-col items-center">
        {/* 1. Foto Besar */}
        <div className="w-32 h-32 sm:w-36 sm:h-36 mb-5 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 flex items-center justify-center shadow-sm">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={user.nama || 'Foto Profil'} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <ShiningAmbalanLogo className="w-20 h-20" alt="Logo Ambalan" />
          )}
        </div>

        {/* 2. Nama Pengguna */}
        <h1 className="text-xl font-black text-slate-900 tracking-tight mb-4">
          {user.nama || 'Anggota Ambalan'}
        </h1>

        {/* Informasi Ringkas: Tanggal Lahir & Status Anggota */}
        <div className="w-full max-w-xs space-y-2.5 mb-8">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <span>🗓️</span>
              <span>Tanggal Lahir</span>
            </span>
            <span className="font-bold text-slate-900 font-mono">
              {birthDateFormatted}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <span>⚜️</span>
              <span>Status Anggota</span>
            </span>
            <span className="font-black text-[#e51c24]">
              {statusAnggota}
            </span>
          </div>
        </div>

        {/* 3. Aksi Logout */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full max-w-xs py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 text-[#e51c24] text-xs font-bold border border-red-200 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>Keluar dari Akun</span>
          </button>
        )}
      </div>
    </div>
  );
};
