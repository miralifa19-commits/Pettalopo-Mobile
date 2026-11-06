import React, { useState } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Lock, 
  User, 
  X, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles,
  Award,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';
import { registerAmbalanUser, DEFAULT_SEED_MEMBERS } from '../../services/firebaseService';

interface AmbalanAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  allMembers: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const AmbalanAuthModal: React.FC<AmbalanAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allMembers,
  onLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign In Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [nama, setNama] = useState('');
  const [namaPanggilan, setNamaPanggilan] = useState('');
  const [ttl, setTtl] = useState('');
  const [motto, setMotto] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gudep, setGudep] = useState<'10-035' | '10-036'>('10-035');
  const [satuan, setSatuan] = useState<'Putra' | 'Putri'>('Putra');
  const [sangga, setSangga] = useState<'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana'>('Perintis');
  const [tingkat, setTingkat] = useState<'Tamu Ambalan' | 'Calon Bantara' | 'Penegak Bantara' | 'Penegak Laksana' | 'Penegak Garuda'>('Calon Bantara');
  const [nomorKta, setNomorKta] = useState('');

  if (!isOpen) return null;

  // Use real registered members or default admin account
  const memberPool = allMembers && allMembers.length > 0 ? allMembers : DEFAULT_SEED_MEMBERS;

  // Handle Sign In with internal Ambalan username & password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Harap masukkan Username dan Password Ambalan.');
      return;
    }

    setIsLoading(true);

    try {
      // Find matching user from pool
      const found = memberPool.find(
        (m) => m.username?.toLowerCase() === cleanUser && (m.password === cleanPass || !m.password)
      );

      if (found) {
        setSuccessMessage(`Selamat datang kembali, Kak ${found.nama}!`);
        setTimeout(() => {
          onLoginSuccess(found);
          onClose();
          setIsLoading(false);
        }, 500);
      } else {
        // Check if username exists but password incorrect
        const userExists = memberPool.find(m => m.username?.toLowerCase() === cleanUser);
        if (userExists) {
          setErrorMessage('Password yang Anda masukkan salah. Hubungi Pembina (Admin) untuk melihat/mereset password.');
        } else {
          setErrorMessage(`Username "${cleanUser}" belum terdaftar. Silakan daftar di tab "Daftar Anggota Baru".`);
        }
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat masuk akun.');
      setIsLoading(false);
    }
  };

  // Quick login helper for master admin
  const handleAdminQuickLogin = () => {
    const adminUser = memberPool.find(m => m.username === 'admin') || DEFAULT_SEED_MEMBERS[0];
    setSuccessMessage(`Masuk sebagai Pembina / Admin Utama`);
    setTimeout(() => {
      onLoginSuccess(adminUser);
      onClose();
    }, 400);
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPass = password.trim();

    if (!nama.trim()) {
      setErrorMessage('Harap isi Nama Lengkap anggota.');
      return;
    }

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username minimal 3 karakter tanpa spasi.');
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setErrorMessage('Password minimal 4 karakter.');
      return;
    }

    // Check if username already taken
    const existing = memberPool.find(m => m.username?.toLowerCase() === cleanUser);
    if (existing) {
      setErrorMessage(`Username "${cleanUser}" sudah digunakan anggota lain. Pilih username lain.`);
      return;
    }

    setIsLoading(true);

    const generatedKta = nomorKta.trim() || `${gudep}.${new Date().getFullYear()}.${Math.floor(100 + Math.random() * 900)}`;

    const newAccountData: UserAccount = {
      username: cleanUser,
      password: cleanPass,
      nama: nama.trim(),
      namaPanggilan: namaPanggilan.trim() || nama.trim().split(' ')[0],
      ttl: ttl.trim() || 'Maros, 12 Juli 2009',
      motto: motto.trim() || 'Satyaku Kudarmakan, Darmaku Kubaktikan',
      role: 'anggota',
      isDewan: false,
      gudep: gudep,
      satuan: satuan,
      sangga: sangga,
      tingkat: tingkat,
      jabatan: 'Anggota Sangga',
      nomorKta: generatedKta,
      keaktifan: 'Aktif',
      progresSku: '0/23 Butir SKU Penegak',
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      const savedUser = await registerAmbalanUser(newAccountData);
      setSuccessMessage(`Akun Ambalan berhasil dibuat! Selamat bergabung, Kak ${savedUser.nama}.`);
      setTimeout(() => {
        onLoginSuccess(savedUser);
        onClose();
        setIsLoading(false);
      }, 700);
    } catch {
      // Fallback local registration
      onLoginSuccess(newAccountData);
      onClose();
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-[#f7f7f8] p-0 sm:p-4">
      <section className="relative flex min-h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-white sm:min-h-[min(760px,92dvh)] sm:rounded-[28px] sm:shadow-2xl">
        <div className="relative flex min-h-[43vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#c81e28] via-[#df252e] to-[#a9141d] px-7 pb-12 pt-12 text-center text-white">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full border border-white/10" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup halaman masuk"
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative mb-5 grid h-28 w-28 place-items-center rounded-full bg-white/10 p-3 ring-1 ring-white/25">
            <img src={LOGO_IMAGE_PATH} alt="Logo Ambalan La Surullah Petta Lopo" className="h-full w-full object-contain drop-shadow-lg" />
          </div>
          <p className="relative text-[10px] font-extrabold uppercase tracking-[.24em] text-white/75">Selamat Datang</p>
          <h1 className="relative mt-2 text-[26px] font-black leading-tight tracking-tight">Pettalopo Mobile</h1>
          <p className="relative mt-2 max-w-xs text-sm leading-relaxed text-white/85">Satu akun untuk terhubung dengan kegiatan dan keluarga besar Ambalan.</p>
          <div className="absolute bottom-0 left-0 h-10 w-full rounded-t-[50%] bg-[#f7f7f8]" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center bg-[#f7f7f8] px-6 pb-10 pt-3 sm:px-9">
          <div className="w-full max-w-sm rounded-[24px] border border-slate-100 bg-white px-5 py-7 shadow-[0_12px_35px_rgba(30,35,45,0.06)] sm:px-7">
            <div className="text-center">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Masuk ke Ambalan</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Gunakan akun Google untuk melanjutkan ke Pettalopo Mobile.</p>
            </div>

            {errorMessage && (
              <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={() => setErrorMessage('Login Google belum dihubungkan pada tahap desain ini.')}
              className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.06 13.22l7.98 6.19C12.93 13.72 18.02 9.5 24 9.5Z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.72 7.18l7.62 5.91c4.45-4.1 7.14-10.14 7.14-17.56Z" />
                <path fill="#FBBC05" d="M11.04 28.59A14.4 14.4 0 0 1 10.27 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 .5 24c0 3.87.93 7.52 2.56 10.78l7.98-6.19Z" />
                <path fill="#34A853" d="M24 48c6.47 0 11.91-2.13 15.88-5.89l-7.62-5.91c-2.12 1.42-4.83 2.27-8.26 2.27-5.98 0-11.07-4.22-12.96-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z" />
              </svg>
              <span>Masuk dengan Google</span>
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-[#c81e28]" />
              <span>Akses akun yang aman dan praktis</span>
            </div>
          </div>
          <p className="mt-6 max-w-xs text-center text-[10px] leading-relaxed text-slate-400">Dengan masuk, Anda akan terhubung ke lingkungan digital Ambalan La Surullah Petta Lopo.</p>
        </div>
      </section>
    </div>
  );
};
