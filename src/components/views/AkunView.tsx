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

  return (
    <div className="space-y-4 pb-24 font-sans select-none">
      {/* Header Halaman */}
      <MenuHeaderCard
        title="Akun Saya"
        subtitle="Profil pengguna Pettalopo"
        onBack={onBack || (() => {})}
      />

      {/* Kartu Akun: Hanya Foto, Nama, dan Aksi Logout */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center flex flex-col items-center">
        {/* Foto Profil */}
        <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center shadow-xs">
          {photoUrl ? (
            <img 
              src={photoUrl} 
              alt={user.nama || 'Foto Profil'} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <ShiningAmbalanLogo className="w-16 h-16" alt="Logo Ambalan" />
          )}
        </div>

        {/* Nama Pengguna */}
        <h1 className="text-lg font-bold text-slate-900 tracking-tight mb-8">
          {user.nama || 'Anggota Ambalan'}
        </h1>

        {/* Aksi Logout */}
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
