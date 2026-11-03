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
import { MenuHeaderCard } from '../common/MenuHeaderCard';

const DEWAN_JABATAN_OPTIONS = [
  'Pradana Putra',
  'Pradana Putri',
  'Pemangku Adat Putra',
  'Pemangku Adat Putri',
  'Kerani (Sekretaris)',
  'Hartaka (Bendahara)',
  'Sie Kegiatan & Operasional',
  'Sie Penelitian & Pengembangan',
  'Sie Hubungan Masyarakat',
  'Anggota Dewan Ambalan'
];

interface DatabaseAnggotaViewProps {
  allMembers: UserAccount[];
  currentUser: UserAccount;
  onRefreshMembers?: () => void;
  onSelectUserForTesting?: (user: UserAccount) => void;
  onBack?: () => void;
}

export const DatabaseAnggotaView: React.FC<DatabaseAnggotaViewProps> = ({
  allMembers,
  currentUser,
  onRefreshMembers,
  onSelectUserForTesting,
  onBack
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
  const [formIsDewan, setFormIsDewan] = useState(false);
  const [formDewanJabatan, setFormDewanJabatan] = useState('Pradana Putra');
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

  // Quick toggle Dewan Ambalan status
  const handleQuickToggleDewan = async (targetUser: UserAccount) => {
    const isDewanNow = targetUser.role === 'dewan' || Boolean(targetUser.isDewan);
    if (isDewanNow) {
      const confirmRemove = window.confirm(`Lepaskan Kak ${targetUser.nama} dari status Dewan Ambalan?`);
      if (!confirmRemove) return;
      const updated: UserAccount = {
        ...targetUser,
        role: targetUser.role === 'admin' ? 'admin' : 'anggota',
        isDewan: false,
        dewanJabatan: undefined,
        jabatan: 'Anggota Sangga'
      };
      await registerAmbalanUser(updated);
    } else {
      const defaultPos = targetUser.satuan === 'Putri' ? 'Pradana Putri' : 'Pradana Putra';
      const updated: UserAccount = {
        ...targetUser,
        role: 'dewan',
        isDewan: true,
        dewanJabatan: defaultPos,
        jabatan: defaultPos
      };
      await registerAmbalanUser(updated);
    }
  };

  // Open Edit/Add Modal
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormNama('');
    setFormUsername('');
    setFormPassword('ambalan10035');
    setFormRole('anggota');
    setFormIsDewan(false);
    setFormDewanJabatan('Pradana Putra');
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
    const isUserDewan = user.role === 'dewan' || Boolean(user.isDewan);
    setFormIsDewan(isUserDewan);
    setFormDewanJabatan(user.dewanJabatan || user.jabatan || (user.satuan === 'Putri' ? 'Pradana Putri' : 'Pradana Putra'));
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

    const isDewan = formIsDewan;
    const finalRole: UserRole = formRole === 'admin' ? 'admin' : (isDewan ? 'dewan' : 'anggota');
    const finalDewanJabatan = isDewan ? formDewanJabatan : undefined;
    const finalJabatan = isDewan ? formDewanJabatan : (formJabatan.trim() || 'Anggota Sangga');

    const updatedAccount: UserAccount = {
      uid,
      username: cleanUsername,
      password: formPassword.trim() || 'ambalan10035',
      nama: formNama.trim(),
      role: finalRole,
      isDewan: isDewan,
      dewanJabatan: finalDewanJabatan,
      gudep: formGudep,
      satuan: formSatuan,
      sangga: formSangga,
      tingkat: formTingkat,
      jabatan: finalJabatan,
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
      
      {/* Header Card Database Anggota dengan Tombol Kembali Melingkar */}
      <MenuHeaderCard
        title="Database Anggota"
        subtitle="Data & akun penegak Gudep 10-035/036"
        onBack={onBack || (() => {})}
        actionRight={
          <button
            onClick={handleOpenAddModal}
            className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-[#e51c24] text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Tambah</span>
          </button>
        }
      />

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
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Anggota Terdaftar</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Anggota baru dapat mendaftar langsung di aplikasi atau ditambahkan oleh Admin melalui tombol &ldquo;+ Tambah&rdquo;.
            </p>
          </div>
        ) : (
          filteredList.map((member, index) => {
            const isPasswordVisible = showAllPasswords || visiblePasswords[member.uid || member.username];
            const isCurrentActive = member.uid === currentUser.uid;
            const isDewan = member.role === 'dewan' || Boolean(member.isDewan);

            return (
              <div
                key={member.uid || member.username || index}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs space-y-3 relative overflow-hidden ${
                  member.role === 'admin'
                    ? 'border-l-4 border-l-amber-500 border-amber-300/80 bg-gradient-to-r from-amber-50/20 to-white'
                    : isDewan
                    ? 'border-l-4 border-l-[#e51c24] border-red-200 bg-red-50/10'
                    : 'border-l-4 border-l-slate-300 border-slate-200 hover:border-slate-300'
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
                      {member.dewanJabatan || member.jabatan} • Gudep <strong>{member.gudep}</strong> ({member.satuan})
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {member.role === 'admin' ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 border border-amber-500 shadow-xs">
                        👑 Pembina/Admin
                      </span>
                    ) : isDewan ? (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-300 shadow-xs">
                        🏛️ Dewan: {member.dewanJabatan || member.jabatan || 'Pengurus'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                        Anggota Sangga
                      </span>
                    )}
                  </div>
                </div>

                {/* KREDENSIAL LOGIN: USERNAME & PASSWORD BOX */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <span>Kredensial Masuk Ambalan:</span>
                    <span className="text-[9px] text-[#e51c24] lowercase font-sans">
                      *hanya terlihat oleh Pembina/Dewan
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
                        className="p-1 text-slate-400 hover:text-slate-700 ml-1 shrink-0 cursor-pointer"
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
                          className="p-1 text-slate-400 hover:text-amber-800 cursor-pointer"
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(member.password || 'ambalan10035', `pass_${member.uid || member.username}`)}
                          title="Salin Password"
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
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

                  {/* Action buttons: Jadikan Dewan, Edit, Switch Account, Delete */}
                  <div className="flex items-center gap-1.5">
                    {member.role !== 'admin' && (
                      <button
                        onClick={() => handleQuickToggleDewan(member)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          isDewan
                            ? 'bg-red-50 text-[#e51c24] border-red-200 hover:bg-red-100'
                            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                        title={isDewan ? 'Lepaskan dari Dewan Ambalan' : 'Jadikan Dewan Ambalan'}
                      >
                        {isDewan ? 'Cabut Dewan' : '+ Jadi Dewan'}
                      </button>
                    )}

                    {onSelectUserForTesting && (
                      <button
                        onClick={() => onSelectUserForTesting(member)}
                        title="Beralih ke akun ini untuk pengujian"
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        Beralih
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Edit Data & Password"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteUser(member)}
                      disabled={isCurrentActive}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
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

              {/* PENGATURAN STATUS DEWAN AMBALAN */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-slate-800 text-xs">Jadikan Dewan Ambalan</span>
                    <span className="text-[10px] text-slate-500">Mendapatkan hak akses penuh setara Admin</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsDewan}
                    onChange={(e) => setFormIsDewan(e.target.checked)}
                    className="w-4 h-4 text-[#e51c24] rounded accent-[#e51c24] cursor-pointer"
                  />
                </div>

                {formIsDewan && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block font-bold text-slate-700 mb-1">
                      Jabatan di Dewan Ambalan:
                    </label>
                    <select
                      value={formDewanJabatan}
                      onChange={(e) => setFormDewanJabatan(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                    >
                      {DEWAN_JABATAN_OPTIONS.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan Biasa
                  </label>
                  <input
                    type="text"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    placeholder="Anggota Sangga"
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
                    <option value="anggota">Anggota Biasa</option>
                    <option value="admin">Pembina / Admin Utama</option>
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
