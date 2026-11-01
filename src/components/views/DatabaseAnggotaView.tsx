import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Users, 
  Lock, 
  Download, 
  X, 
  KeyRound,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { UserAccount, UserRole } from '../../types';
import { 
  registerAmbalanUser, 
  deleteUserAccount, 
  syncUserProfile, 
  DEFAULT_SEED_MEMBERS 
} from '../../services/firebaseService';

interface DatabaseAnggotaViewProps {
  allMembers: UserAccount[];
  currentUser: UserAccount;
  onRefreshMembers?: () => void;
  onSelectUserForTesting?: (user: UserAccount) => void;
}

export const DatabaseAnggotaView: React.FC<DatabaseAnggotaViewProps> = ({
  allMembers,
  currentUser,
  onRefreshMembers,
  onSelectUserForTesting
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGudep, setFilterGudep] = useState<'all' | '10-035' | '10-036'>('all');
  const [filterSangga, setFilterSangga] = useState<string>('all');
  const [showAllPasswords, setShowAllPasswords] = useState(true); // Default true so Pembina can immediately see credentials as requested
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for adding/editing member
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [formNama, setFormNama] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('anggota');
  const [formGudep, setFormGudep] = useState<'10-035' | '10-036'>('10-035');
  const [formSatuan, setFormSatuan] = useState<'Putra' | 'Putri'>('Putra');
  const [formSangga, setFormSangga] = useState<'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana'>('Perintis');
  const [formTingkat, setFormTingkat] = useState<'Tamu Ambalan' | 'Calon Bantara' | 'Penegak Bantara' | 'Penegak Laksana' | 'Penegak Garuda'>('Penegak Bantara');
  const [formJabatan, setFormJabatan] = useState('Anggota Sangga');
  const [formNomorKta, setFormNomorKta] = useState('');
  const [formNotification, setFormNotification] = useState('');

  const memberList = allMembers && allMembers.length > 0 ? allMembers : DEFAULT_SEED_MEMBERS;

  // Filter members
  const filteredList = memberList.filter((m) => {
    const matchSearch = 
      m.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nomorKta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sangga?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchGudep = filterGudep === 'all' || m.gudep === filterGudep;
    const matchSangga = filterSangga === 'all' || m.sangga === filterSangga;

    return matchSearch && matchGudep && matchSangga;
  });

  // Toggle individual password visibility
  const toggleSinglePassword = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Copy credential helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Open Edit/Add Modal
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormNama('');
    setFormUsername('');
    setFormPassword('ambalan10035');
    setFormRole('anggota');
    setFormGudep('10-035');
    setFormSatuan('Putra');
    setFormSangga('Perintis');
    setFormTingkat('Calon Bantara');
    setFormJabatan('Anggota Sangga');
    setFormNomorKta('');
    setFormNotification('');
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormNama(user.nama);
    setFormUsername(user.username);
    setFormPassword(user.password || 'ambalan10035');
    setFormRole(user.role);
    setFormGudep(user.gudep);
    setFormSatuan(user.satuan);
    setFormSangga(user.sangga);
    setFormTingkat(user.tingkat);
    setFormJabatan(user.jabatan);
    setFormNomorKta(user.nomorKta);
    setFormNotification('');
    setIsEditModalOpen(true);
  };

  // Save changes
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formUsername.trim()) return;

    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const uid = editingUser?.uid || `user_${cleanUsername}_${Date.now()}`;

    const updatedAccount: UserAccount = {
      uid,
      username: cleanUsername,
      password: formPassword.trim() || 'ambalan10035',
      nama: formNama.trim(),
      role: formRole,
      gudep: formGudep,
      satuan: formSatuan,
      sangga: formSangga,
      tingkat: formTingkat,
      jabatan: formJabatan.trim() || 'Anggota Sangga',
      nomorKta: formNomorKta.trim() || `${formGudep}.2026.${Math.floor(100 + Math.random() * 900)}`,
      createdAt: editingUser?.createdAt || new Date().toISOString().split('T')[0]
    };

    try {
      await registerAmbalanUser(updatedAccount);
      setFormNotification('Data anggota berhasil disimpan ke database!');
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 700);
    } catch {
      setFormNotification('Gagal menyimpan data ke database.');
    }
  };

  // Delete user
  const handleDeleteUser = async (userToDelete: UserAccount) => {
    if (userToDelete.uid === currentUser.uid) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
      return;
    }
    const confirmDelete = window.confirm(
      `Apakah Kakak yakin ingin menghapus akun anggota "${userToDelete.nama}" (@${userToDelete.username})?`
    );
    if (!confirmDelete) return;

    if (userToDelete.uid) {
      await deleteUserAccount(userToDelete.uid);
    }
  };

  // Stats calculation
  const totalAnggota = memberList.length;
  const totalPutra = memberList.filter(m => m.gudep === '10-035').length;
  const totalPutri = memberList.filter(m => m.gudep === '10-036').length;
  const totalAdmin = memberList.filter(m => m.role === 'admin').length;

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 border-2 border-amber-400 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#e51c24] flex items-center justify-center border-2 border-amber-300 shadow-xs shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Panel Khusus Admin
                </span>
                <span className="text-[10px] font-bold text-slate-500 font-mono">
                  Gudep 10-035 & 10-036
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                Database Akun & Anggota
              </h1>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-black shadow-xs border-2 border-amber-400 hover:bg-[#c9141b] transition-all flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Anggota</span>
          </button>
        </div>

        {/* Info strip regarding username & password visibility */}
        <div className="mt-4 p-3 bg-red-50/70 rounded-2xl border border-red-200 text-xs text-slate-700 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#e51c24] shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed text-[11px]">
            <strong className="text-[#e51c24] block font-bold">Akses Kredensial Pembina:</strong>
            <span>
              Sebagai Admin Pembina, Anda dapat melihat seluruh <strong>Username</strong> dan <strong>Password</strong> akun anggota di bawah ini untuk kemudahan administrasi, pendataan, dan pemulihan akun pangkalan.
            </span>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block">Total</span>
            <span className="text-lg font-black text-slate-900">{totalAnggota}</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-[10px] text-blue-700 font-bold block">Putra (035)</span>
            <span className="text-lg font-black text-blue-950">{totalPutra}</span>
          </div>
          <div className="p-2 rounded-xl bg-pink-50/60 border border-pink-200">
            <span className="text-[10px] text-pink-700 font-bold block">Putri (036)</span>
            <span className="text-lg font-black text-pink-950">{totalPutri}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-300">
            <span className="text-[10px] text-amber-900 font-bold block">Pembina</span>
            <span className="text-lg font-black text-amber-950">{totalAdmin}</span>
          </div>
        </div>
      </div>

      {/* Filter and Password Visibility Toolbar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, username, atau KTA..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#e51c24]"
            />
          </div>

          {/* Toggle All Passwords View */}
          <button
            onClick={() => setShowAllPasswords(!showAllPasswords)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              showAllPasswords
                ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {showAllPasswords ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                <span>Sembunyikan Sandi</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#e51c24]" />
                <span>Lihat Semua Sandi</span>
              </>
            )}
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono shrink-0">Filter:</span>
          
          <button
            onClick={() => setFilterGudep('all')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
              filterGudep === 'all'
                ? 'bg-[#e51c24] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Satuan
          </button>

          <button
            onClick={() => setFilterGudep('10-035')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
              filterGudep === '10-035'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Gudep 10-035 (Putra)
          </button>

          <button
            onClick={() => setFilterGudep('10-036')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
              filterGudep === '10-036'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Gudep 10-036 (Putri)
          </button>

          <select
            value={filterSangga}
            onChange={(e) => setFilterSangga(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 focus:outline-none shrink-0"
          >
            <option value="all">Semua Sangga</option>
            <option value="Perintis">Sangga Perintis</option>
            <option value="Penegas">Sangga Penegas</option>
            <option value="Pendobrak">Sangga Pendobrak</option>
            <option value="Pencoba">Sangga Pencoba</option>
            <option value="Pelaksana">Sangga Pelaksana</option>
          </select>
        </div>
      </div>

      {/* Member Cards / Records */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada anggota yang cocok</h3>
            <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter.</p>
          </div>
        ) : (
          filteredList.map((member, index) => {
            const isPasswordVisible = showAllPasswords || visiblePasswords[member.uid || member.username];
            const isCurrentActive = member.uid === currentUser.uid;

            return (
              <div
                key={member.uid || member.username || index}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs space-y-3 relative overflow-hidden ${
                  member.role === 'admin'
                    ? 'border-l-4 border-l-amber-500 border-amber-300/80 bg-gradient-to-r from-amber-50/20 to-white'
                    : 'border-l-4 border-l-[#e51c24] border-slate-200 hover:border-amber-300'
                }`}
              >
                {/* Header Row: Nama & Role */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {member.nama}
                      </h3>
                      {isCurrentActive && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          (Akun Anda)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {member.jabatan} • Gudep <strong>{member.gudep}</strong> ({member.satuan})
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      member.role === 'admin'
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {member.role === 'admin' ? '👑 Pembina/Admin' : 'Anggota'}
                    </span>
                  </div>
                </div>

                {/* KREDENSIAL LOGIN: USERNAME & PASSWORD BOX */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <span>Kredensial Masuk Ambalan:</span>
                    <span className="text-[9px] text-[#e51c24] lowercase font-sans">
                      *hanya terlihat oleh Pembina
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Username */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-400 text-[11px]">User:</span>
                        <strong className="font-mono text-slate-900 truncate">
                          {member.username}
                        </strong>
                      </div>
                      <button
                        onClick={() => handleCopy(member.username, `user_${member.uid || member.username}`)}
                        title="Salin Username"
                        className="p-1 text-slate-400 hover:text-slate-700 ml-1 shrink-0"
                      >
                        {copiedId === `user_${member.uid || member.username}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="text-slate-400 text-[11px]">Pass:</span>
                        <strong className="font-mono text-amber-900 truncate">
                          {isPasswordVisible ? (member.password || 'ambalan10035') : '••••••••'}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          onClick={() => toggleSinglePassword(member.uid || member.username)}
                          title="Tampilkan / Sembunyikan Sandi"
                          className="p-1 text-slate-400 hover:text-amber-800"
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(member.password || 'ambalan10035', `pass_${member.uid || member.username}`)}
                          title="Salin Password"
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          {copiedId === `pass_${member.uid || member.username}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scout Profile Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
                      {member.sangga}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {member.tingkat}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      KTA: {member.nomorKta || '-'}
                    </span>
                  </div>

                  {/* Action buttons: Edit, Switch Account, Delete */}
                  <div className="flex items-center gap-1.5">
                    {onSelectUserForTesting && (
                      <button
                        onClick={() => onSelectUserForTesting(member)}
                        title="Beralih ke akun ini untuk pengujian"
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[10px] font-bold border border-slate-200 transition-colors"
                      >
                        Beralih Akun
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Edit Data & Password"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteUser(member)}
                      disabled={isCurrentActive}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isCurrentActive
                          ? 'opacity-30 cursor-not-allowed text-slate-300'
                          : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                      title="Hapus Akun Anggota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* EDIT / ADD MEMBER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-amber-400 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#e51c24] to-[#c9141b] text-white p-4 border-b-4 border-amber-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-black">
                  {editingUser ? 'Ubah Data & Password Anggota' : 'Tambah Anggota Baru ke Database'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full bg-black/20 hover:bg-black/30 text-amber-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveUser} className="p-5 max-h-[80vh] overflow-y-auto space-y-3.5 text-xs">
              
              {formNotification && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formNotification}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Anggota *
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Muhammad Fajrin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#e51c24]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="fajrin_pramuka"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="ambalan10035"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gudep
                  </label>
                  <select
                    value={formGudep}
                    onChange={(e) => {
                      const val = e.target.value as '10-035' | '10-036';
                      setFormGudep(val);
                      setFormSatuan(val === '10-035' ? 'Putra' : 'Putri');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="10-035">10-035 (Putra)</option>
                    <option value="10-036">10-036 (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <select
                    value={formSatuan}
                    onChange={(e) => setFormSatuan(e.target.value as 'Putra' | 'Putri')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Putra">Putra</option>
                    <option value="Putri">Putri</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sangga
                  </label>
                  <select
                    value={formSangga}
                    onChange={(e) => setFormSangga(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Perintis">Sangga Perintis</option>
                    <option value="Penegas">Sangga Penegas</option>
                    <option value="Pendobrak">Sangga Pendobrak</option>
                    <option value="Pencoba">Sangga Pencoba</option>
                    <option value="Pelaksana">Sangga Pelaksana</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat
                  </label>
                  <select
                    value={formTingkat}
                    onChange={(e) => setFormTingkat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    placeholder="Anggota / Pradana"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Role Akun
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="anggota">Anggota (Viewer)</option>
                    <option value="admin">Pembina / Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor KTA
                </label>
                <input
                  type="text"
                  value={formNomorKta}
                  onChange={(e) => setFormNomorKta(e.target.value)}
                  placeholder="Contoh: 10.035.2026.012"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#e51c24] text-white font-black shadow-xs border border-amber-400 hover:bg-[#c9141b]"
                >
                  Simpan ke Database
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
