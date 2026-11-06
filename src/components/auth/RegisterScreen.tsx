import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile, UserStatus } from '../../types/auth';
import { 
  isPrimaryAdminEmail, 
  registerAdminProfile, 
  registerMemberProfile, 
  signOutAmbalan 
} from '../../services/authService';

interface RegisterScreenProps {
  firebaseUser: FirebaseUser;
  onProfileCreated: (profile: UserProfile) => void;
  onSignOut: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  firebaseUser,
  onProfileCreated,
  onSignOut,
}) => {
  const isAdmin = isPrimaryAdminEmail(firebaseUser.email);

  const [namaLengkap, setNamaLengkap] = useState(firebaseUser.displayName || '');
  const [status, setStatus] = useState<UserStatus>('anggota_ambalan');
  const [sandiAmbalan, setSandiAmbalan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!namaLengkap.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi.');
      return;
    }

    if (!isAdmin && !sandiAmbalan.trim()) {
      setErrorMessage('Sandi Ambalan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        const profile = await registerAdminProfile({
          uid: firebaseUser.uid,
          namaLengkap,
          email: firebaseUser.email || '',
          fotoUrl: firebaseUser.photoURL || undefined,
        });
        onProfileCreated(profile);
      } else {
        const profile = await registerMemberProfile({
          uid: firebaseUser.uid,
          namaLengkap,
          email: firebaseUser.email || '',
          fotoUrl: firebaseUser.photoURL || undefined,
          status,
          inputSandi: sandiAmbalan,
        });
        onProfileCreated(profile);
      }
    } catch (err: any) {
      if (err?.message?.includes('Sandi belum tepat')) {
        setErrorMessage('Sandi belum tepat. Tanyakan kepada Dewan Ambalan ya, Kak.');
      } else {
        setErrorMessage(err?.message || 'Gagal mendaftar. Silakan coba kembali.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOutAmbalan();
    onSignOut();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between items-center p-6 text-slate-800 font-sans select-none">
      <div className="w-full max-w-sm pt-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1.5 shadow-xs flex items-center justify-center shrink-0">
            <img 
              src="/assets/pettalopo-logo.png" 
              alt="Logo" 
              className="w-9 h-9 object-contain"
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              {isAdmin ? 'Pendaftaran Admin Ambalan' : 'Pendaftaran Anggota'}
            </h1>
            <p className="text-xs text-slate-500">
              {firebaseUser.email}
            </p>
          </div>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2">
              <span className="shrink-0 text-sm">⚠️</span>
              <span className="leading-tight">{errorMessage}</span>
            </div>
          )}

          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Lengkap <span className="text-[#e51c24]">*</span>
            </label>
            <input
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e51c24] focus:bg-white transition-all"
              required
            />
          </div>

          {/* Status (Hanya untuk Non-Admin) */}
          {!isAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Status Keanggotaan <span className="text-[#e51c24]">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] focus:bg-white transition-all cursor-pointer"
              >
                <option value="anggota_ambalan">Anggota Ambalan</option>
                <option value="purna_ambalan">Purna Ambalan</option>
              </select>
            </div>
          )}

          {/* Sandi Ambalan (Hanya untuk Non-Admin) */}
          {!isAdmin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sandi Ambalan <span className="text-[#e51c24]">*</span>
              </label>
              <input
                type="text"
                value={sandiAmbalan}
                onChange={(e) => setSandiAmbalan(e.target.value)}
                placeholder="Masukkan sandi rahasia ambalan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#e51c24] focus:bg-white transition-all"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tanyakan kepada Dewan Ambalan untuk mendapatkan sandi.
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <span>Email Anda terdeteksi sebagai Admin utama Ambalan.</span>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#e51c24] hover:bg-[#c9181f] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk ke Ambalan</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tombol Kecil Keluar */}
      <div className="w-full max-w-sm pb-8 pt-4 flex justify-center">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer underline flex items-center gap-1.5"
        >
          <span>🚪</span>
          <span>Keluar dari akun</span>
        </button>
      </div>
    </div>
  );
};
