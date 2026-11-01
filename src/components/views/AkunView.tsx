import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Award, 
  Edit3, 
  Check, 
  Sparkles, 
  UserPlus, 
  Users, 
  KeyRound, 
  CheckCircle2,
  Crown,
  LogIn,
  LogOut,
  Database,
  Lock,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { UserAccount } from '../../types';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';
import { syncUserProfile, subscribeToAllMembers, DEFAULT_SEED_MEMBERS } from '../../services/firebaseService';

interface AkunViewProps {
  user: UserAccount;
  onUpdateUser: (updated: UserAccount) => void;
  onNavigateToDatabase?: () => void;
  onOpenAuthModal?: () => void;
}

export const AkunView: React.FC<AkunViewProps> = ({ 
  user, 
  onUpdateUser,
  onNavigateToDatabase,
  onOpenAuthModal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [registeredMembers, setRegisteredMembers] = useState<UserAccount[]>([]);
  const [showMyPassword, setShowMyPassword] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Edit State
  const [nama, setNama] = useState(user.nama);
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState(user.password || '');
  const [gudep, setGudep] = useState(user.gudep);
  const [satuan, setSatuan] = useState(user.satuan);
  const [tingkat, setTingkat] = useState(user.tingkat);
  const [sangga, setSangga] = useState(user.sangga);
  const [jabatan, setJabatan] = useState(user.jabatan);
  const [nomorKta, setNomorKta] = useState(user.nomorKta);

  // Subscribe to all members in Ambalan
  useEffect(() => {
    const unsubscribe = subscribeToAllMembers((members) => {
      setRegisteredMembers(members);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_') || user.username;
    const updated: UserAccount = {
      ...user,
      nama,
      username: cleanUsername,
      password: password.trim() || user.password || 'ambalan10035',
      gudep,
      satuan,
      tingkat,
      sangga,
      jabatan,
      nomorKta
    };
    onUpdateUser(updated);
    try {
      await syncUserProfile(updated);
    } catch {}
    setIsEditing(false);
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(user.username);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 1500);
  };

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* 1. Header Profile Card with Role Badge */}
      <div className="bg-white rounded-3xl p-5 border-2 border-amber-400 shadow-xs text-center relative overflow-hidden">
        
        {/* Role Watermark/Pill */}
        <div className="flex justify-center mb-2">
          {user.role === 'admin' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-black shadow-xs border border-amber-300">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>AKUN PEMBINA / ADMIN UTAMA</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>AKUN ANGGOTA PENEGAK (VIEWER)</span>
            </span>
          )}
        </div>

        {/* Logo without frame box */}
        <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
          <img
            src={LOGO_IMAGE_PATH}
            alt="Logo Ambalan"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>

        <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1">
          {user.nama}
        </h1>
        <p className="text-xs text-[#e51c24] font-bold">
          {user.jabatan} • {user.satuan}
        </p>

        {/* Credentials Pill Box */}
        <div className="mt-3 max-w-xs mx-auto p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Username:</span>
            <div className="flex items-center gap-1">
              <strong className="font-mono text-slate-900 font-bold">@{user.username}</strong>
              <button 
                onClick={handleCopyUsername}
                className="text-slate-400 hover:text-slate-700 ml-1"
                title="Salin username"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Password:</span>
            <div className="flex items-center gap-1.5">
              <strong className="font-mono text-amber-900 font-bold">
                {showMyPassword ? (user.password || 'ambalan10035') : '••••••••'}
              </strong>
              <button
                onClick={() => setShowMyPassword(!showMyPassword)}
                className="text-slate-400 hover:text-slate-700"
                title="Tampilkan / Sembunyikan"
              >
                {showMyPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300 font-mono">
            Gudep {user.gudep}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[#e51c24] text-[10px] font-bold border border-red-200">
            {user.tingkat}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-300">
            Sangga {user.sangga}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNama(user.nama);
              setUsername(user.username || '');
              setPassword(user.password || '');
              setGudep(user.gudep);
              setSatuan(user.satuan);
              setTingkat(user.tingkat);
              setSangga(user.sangga);
              setJabatan(user.jabatan);
              setNomorKta(user.nomorKta);
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profil</span>
          </button>

          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-bold hover:bg-[#c9141b] border border-amber-400 shadow-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ganti / Masuk Akun</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ADMIN ONLY SHORTCUT: MENU DATABASE */}
      {user.role === 'admin' && onNavigateToDatabase && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-5 text-slate-950 shadow-md border-2 border-amber-300 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-950" />
              <span className="text-[10px] font-black uppercase font-mono tracking-wider bg-black/10 px-2 py-0.5 rounded-full">
                Khusus Admin Pembina
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-950">
              Database Akun Seluruh Anggota
            </h3>
            <p className="text-xs text-slate-900 font-medium leading-relaxed">
              Lihat username dan password semua anggota ambalan untuk arsip pangkalan.
            </p>
          </div>

          <button
            onClick={onNavigateToDatabase}
            className="px-4 py-2.5 rounded-2xl bg-slate-950 text-white text-xs font-black shadow-md hover:bg-slate-900 transition-all shrink-0"
          >
            Buka Database →
          </button>
        </div>
      )}

      {/* 3. DETAIL IDENTITAS KEANGGOTAAN */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">
          Identitas Keanggotaan Lengkap
        </h2>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">Nomor KTA / Registrasi</span>
            <span className="font-mono font-bold text-slate-900">{user.nomorKta || '-'}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">Pangkalan Gugus Depan</span>
            <span className="font-bold text-slate-900">La Surullah Petta Lopo</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">Satuan Penegak</span>
            <span className="font-bold text-[#e51c24]">{user.satuan} ({user.gudep})</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">Tingkatan Kecakapan</span>
            <span className="font-bold text-slate-900">{user.tingkat}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">Sangga Tugas</span>
            <span className="font-bold text-slate-900">Sangga {user.sangga}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500 font-medium">Hak Akses</span>
            <span className="font-bold text-slate-900">
              {user.role === 'admin' ? '👑 Admin (Bisa edit proker & buka absen)' : '⚜️ Anggota (Viewer & Absensi mandiri)'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. MODAL EDIT BIODATA */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border-2 border-amber-400 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
              Ubah Data Akun
            </h2>

            <form onSubmit={handleSaveEdit} className="mt-3 space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Username:</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Password:</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Gudep:</label>
                  <select
                    value={gudep}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setGudep(val);
                      setSatuan(val === '10-035' ? 'Putra' : 'Putri');
                    }}
                    className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="10-035">10-035 (Putra)</option>
                    <option value="10-036">10-036 (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Sangga:</label>
                  <select
                    value={sangga}
                    onChange={(e) => setSangga(e.target.value as any)}
                    className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Perintis">Perintis</option>
                    <option value="Penegas">Penegas</option>
                    <option value="Pendobrak">Pendobrak</option>
                    <option value="Pencoba">Pencoba</option>
                    <option value="Pelaksana">Pelaksana</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Tingkat Penegak:</label>
                <select
                  value={tingkat}
                  onChange={(e) => setTingkat(e.target.value as any)}
                  className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs focus:border-amber-400 focus:outline-none"
                >
                  <option value="Tamu Ambalan">Tamu Ambalan</option>
                  <option value="Calon Bantara">Calon Bantara</option>
                  <option value="Penegak Bantara">Penegak Bantara</option>
                  <option value="Penegak Laksana">Penegak Laksana</option>
                  <option value="Penegak Garuda">Penegak Garuda</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">Jabatan:</label>
                <input
                  type="text"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-slate-200 rounded-xl text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#e51c24] text-white text-xs font-bold border border-amber-400"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
