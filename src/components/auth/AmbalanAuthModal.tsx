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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('anggota');
  const [gudep, setGudep] = useState<'10-035' | '10-036'>('10-035');
  const [satuan, setSatuan] = useState<'Putra' | 'Putri'>('Putra');
  const [sangga, setSangga] = useState<'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana'>('Perintis');
  const [tingkat, setTingkat] = useState<'Tamu Ambalan' | 'Calon Bantara' | 'Penegak Bantara' | 'Penegak Laksana' | 'Penegak Garuda'>('Calon Bantara');
  const [jabatan, setJabatan] = useState('Anggota Sangga');
  const [nomorKta, setNomorKta] = useState('');

  if (!isOpen) return null;

  // Combine live members with default seed members
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
          setErrorMessage(`Username "${cleanUser}" belum terdaftar. Silakan lakukan pendaftaran akun Ambalan di tab Daftar.`);
        }
        setIsLoading(false);
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat masuk akun.');
      setIsLoading(false);
    }
  };

  // Quick switch for sample accounts / demo
  const handleQuickLogin = (selectedUser: UserAccount) => {
    setSuccessMessage(`Beralih ke akun ${selectedUser.nama} (${selectedUser.role === 'admin' ? 'Pembina/Admin' : 'Anggota'})`);
    setTimeout(() => {
      onLoginSuccess(selectedUser);
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

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username minimal 3 karakter tanpa spasi.');
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setErrorMessage('Password minimal 4 karakter.');
      return;
    }

    if (!nama.trim()) {
      setErrorMessage('Harap isi Nama Lengkap anggota.');
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
      role: role,
      gudep: gudep,
      satuan: satuan,
      sangga: sangga,
      tingkat: tingkat,
      jabatan: jabatan.trim() || 'Anggota Sangga',
      nomorKta: generatedKta,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-amber-400 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header: Pure Red with Logo without frame box */}
        <div className="bg-gradient-to-r from-[#e51c24] to-[#b30e15] text-white p-5 relative border-b-4 border-amber-400">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-amber-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 flex items-center justify-center">
              <img
                src={LOGO_IMAGE_PATH}
                alt="Logo Ambalan"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                Sistem Akun Ambalan
              </span>
              <h2 className="text-base font-black leading-tight mt-1">
                La Surullah Petta Lopo
              </h2>
              <p className="text-xs text-amber-200 font-medium">
                Gugus Depan 10-035 / 10-036
              </p>
            </div>
          </div>

          {/* Current Logged In Banner */}
          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px]">
            <span className="text-white/80">
              Akun Aktif: <strong className="text-white font-bold">{currentUser.nama}</strong>
            </span>
            <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
              currentUser.role === 'admin'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white text-[#e51c24]'
            }`}>
              {currentUser.role === 'admin' ? '👑 Admin/Pembina' : 'Anggota'}
            </span>
          </div>
        </div>

        {/* Tab Switcher: Masuk vs Daftar Akun */}
        <div className="flex bg-slate-100 p-1.5 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signin'
                ? 'bg-white text-[#e51c24] shadow-sm border border-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Masuk Akun Ambalan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'signup'
                ? 'bg-white text-[#e51c24] shadow-sm border border-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Anggota Baru</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          
          {/* Notification Messages */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs font-medium flex items-start gap-2">
              <span className="font-bold text-red-600 shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: MASUK AKUN AMBALAN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Ambalan
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Contoh: admin atau muh_fadli"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#e51c24] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan password akun"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#e51c24] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-[#e51c24] text-white font-black text-xs shadow-md border-2 border-amber-400 hover:bg-[#c9141b] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Memverifikasi...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Masuk ke Aplikasi</span>
                  </>
                )}
              </button>

              {/* Quick Select for Fast Testing / Demo */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  ⚡ Masuk Cepat (Akun Uji / Terdaftar):
                </span>
                <div className="space-y-1.5">
                  {memberPool.slice(0, 4).map((m) => (
                    <button
                      key={m.uid || m.username}
                      type="button"
                      onClick={() => handleQuickLogin(m)}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between text-xs group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 block truncate group-hover:text-[#e51c24]">
                          {m.nama}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          user: <strong>{m.username}</strong> • pass: <strong>{m.password || 'ambalan10035'}</strong>
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                        m.role === 'admin'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.role === 'admin' ? 'Pembina' : m.sangga}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: DAFTAR ANGGOTA BARU */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Setiap anggota Ambalan membuat akun dengan username & password sendiri. Akun ini digunakan untuk absensi dan melihat program kerja.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Anggota *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Andi Muhammad Ihsan"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#e51c24] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: ihsan_pramuka"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#e51c24] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 4 digit"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#e51c24] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gugus Depan
                  </label>
                  <select
                    value={gudep}
                    onChange={(e) => {
                      const val = e.target.value as '10-035' | '10-036';
                      setGudep(val);
                      setSatuan(val === '10-035' ? 'Putra' : 'Putri');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="10-035">10-035 (Putra)</option>
                    <option value="10-036">10-036 (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <select
                    value={satuan}
                    onChange={(e) => setSatuan(e.target.value as 'Putra' | 'Putri')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sangga
                  </label>
                  <select
                    value={sangga}
                    onChange={(e) => setSangga(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="Perintis">Sangga Perintis</option>
                    <option value="Penegas">Sangga Penegas</option>
                    <option value="Pendobrak">Sangga Pendobrak</option>
                    <option value="Pencoba">Sangga Pencoba</option>
                    <option value="Pelaksana">Sangga Pelaksana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Kecakapan
                  </label>
                  <select
                    value={tingkat}
                    onChange={(e) => setTingkat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="Tamu Ambalan">Tamu Ambalan</option>
                    <option value="Calon Bantara">Calon Bantara</option>
                    <option value="Penegak Bantara">Penegak Bantara</option>
                    <option value="Penegak Laksana">Penegak Laksana</option>
                    <option value="Penegak Garuda">Penegak Garuda</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan Ambalan
                  </label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Anggota / Pradana / Kerani"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran Akun
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none font-bold"
                  >
                    <option value="anggota">Anggota Biasa (Viewer)</option>
                    <option value="admin">Pembina / Admin (Pengelola)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor KTA Pramuka (Opsional)
                </label>
                <input
                  type="text"
                  value={nomorKta}
                  onChange={(e) => setNomorKta(e.target.value)}
                  placeholder="Contoh: 10.035.2026.089 (otomatis jika kosong)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-[#e51c24] text-white font-black text-xs shadow-md border-2 border-amber-400 hover:bg-[#c9141b] transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span>Mendaftarkan...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftarkan Akun Ambalan</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
