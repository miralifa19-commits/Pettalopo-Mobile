import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { 
  UserProfile, 
  UserPeran, 
  AdminEmailRecord 
} from '../../types/auth';
import { 
  updateSandiAmbalan, 
  subscribeAllUsers, 
  updateUserPeran, 
  toggleUserDisabled, 
  subscribeAdminEmails, 
  addAdminEmail,
  PRIMARY_ADMIN_EMAIL
} from '../../services/authService';

interface AdminMenuViewProps {
  onBack: () => void;
}

type AdminTab = 'sandi' | 'anggota' | 'admin_list';

export const AdminMenuView: React.FC<AdminMenuViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('sandi');
  
  // State Ganti Sandi
  const [newSandi, setNewSandi] = useState('');
  const [confirmSandi, setConfirmSandi] = useState('');
  const [sandiStatus, setSandiStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavingSandi, setIsSavingSandi] = useState(false);

  // State Manajemen Anggota
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'anggota' | 'dewan' | 'admin'>('all');
  const [userActionMessage, setUserActionMessage] = useState<string | null>(null);

  // State Kelola Email Admin
  const [adminEmails, setAdminEmails] = useState<AdminEmailRecord[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminStatus, setAdminStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Subscribe users
  useEffect(() => {
    const unsub = subscribeAllUsers((list) => {
      setUsers(list);
    });
    return () => unsub();
  }, []);

  // Subscribe admin emails
  useEffect(() => {
    const unsub = subscribeAdminEmails((list) => {
      setAdminEmails(list);
    });
    return () => unsub();
  }, []);

  // Handle Simpan Sandi
  const handleSaveSandi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSandiStatus(null);

    if (!newSandi.trim()) {
      setSandiStatus({ type: 'error', message: 'Sandi baru tidak boleh kosong.' });
      return;
    }

    if (newSandi.trim() !== confirmSandi.trim()) {
      setSandiStatus({ type: 'error', message: 'Konfirmasi sandi tidak sesuai.' });
      return;
    }

    setIsSavingSandi(true);
    try {
      const currentAdminUid = auth.currentUser?.uid || 'admin';
      await updateSandiAmbalan(newSandi, currentAdminUid);
      setSandiStatus({ type: 'success', message: 'Sandi Ambalan berhasil diperbarui di Firestore!' });
      setNewSandi('');
      setConfirmSandi('');
    } catch (err: any) {
      setSandiStatus({ type: 'error', message: err?.message || 'Gagal memperbarui sandi.' });
    } finally {
      setIsSavingSandi(false);
    }
  };

  // Handle Ubah Peran
  const handleTogglePeran = async (targetUser: UserProfile) => {
    if (targetUser.peran === 'admin') {
      alert('Peran Admin utama tidak dapat diubah.');
      return;
    }

    const nextPeran: UserPeran = targetUser.peran === 'dewan' ? 'anggota' : 'dewan';
    const konfirmasi = window.confirm(
      `Ubah peran ${targetUser.namaLengkap} menjadi "${nextPeran === 'dewan' ? 'Dewan Ambalan' : 'Anggota Ambalan'}"?`
    );
    if (!konfirmasi) return;

    try {
      await updateUserPeran(targetUser.uid, nextPeran);
      setUserActionMessage(`Berhasil mengubah peran ${targetUser.namaLengkap}.`);
      setTimeout(() => setUserActionMessage(null), 3000);
    } catch (err: any) {
      alert('Gagal mengubah peran: ' + err.message);
    }
  };

  // Handle Nonaktifkan Akun
  const handleToggleDisabled = async (targetUser: UserProfile) => {
    if (targetUser.peran === 'admin') {
      alert('Akun Admin tidak dapat dinonaktifkan.');
      return;
    }

    const newDisabledState = !targetUser.nonaktif;
    const konfirmasi = window.confirm(
      `Apakah Anda yakin ingin ${newDisabledState ? 'menonaktifkan' : 'mengaktifkan kembali'} akun ${targetUser.namaLengkap}?`
    );
    if (!konfirmasi) return;

    try {
      await toggleUserDisabled(targetUser.uid, newDisabledState);
      setUserActionMessage(`Status akun ${targetUser.namaLengkap} berhasil diperbarui.`);
      setTimeout(() => setUserActionMessage(null), 3000);
    } catch (err: any) {
      alert('Gagal memperbarui status akun: ' + err.message);
    }
  };

  // Handle Tambah Email Admin
  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatus(null);

    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setAdminStatus({ type: 'error', message: 'Format alamat email tidak valid.' });
      return;
    }

    setIsAddingAdmin(true);
    try {
      const currentAdminUid = auth.currentUser?.uid || 'admin';
      await addAdminEmail(newAdminEmail, currentAdminUid);
      setAdminStatus({ type: 'success', message: `Email ${newAdminEmail} berhasil ditambahkan sebagai admin!` });
      setNewAdminEmail('');
    } catch (err: any) {
      setAdminStatus({ type: 'error', message: err?.message || 'Gagal menambahkan admin.' });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  // Filter Users
  const filteredUsers = users.filter((u) => {
    const matchSearch = (u.namaLengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = selectedRoleFilter === 'all' ? true : u.peran === selectedRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ←
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Menu Admin Ambalan</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Kontrol sandi, otorisasi peran, dan anggota ambalan
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 mt-4 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('sandi')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'sandi' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔑 Sandi Ambalan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('anggota')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'anggota' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👥 Anggota ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin_list')}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'admin_list' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛡️ Admin
          </button>
        </div>
      </div>

      {/* TAB 1: GANTI SANDI AMBALAN */}
      {activeTab === 'sandi' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>🔑</span>
              <span>Ganti Sandi Akses Ambalan</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Sandi ini digunakan calon anggota saat pertama kali mendaftar ke aplikasi. Sandi disimpan secara aman di Firestore (dokumen config/akses) tanpa ditulis di kode aplikasi.
            </p>
          </div>

          {sandiStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              sandiStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <span>{sandiStatus.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{sandiStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveSandi} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sandi Baru
              </label>
              <input
                type="text"
                value={newSandi}
                onChange={(e) => setNewSandi(e.target.value)}
                placeholder="Contoh: La Surullah Petta Lopo"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] focus:bg-white"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Sandi otomatis dinormalisasi (huruf kecil & spasi tunggal).
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Konfirmasi Sandi Baru
              </label>
              <input
                type="text"
                value={confirmSandi}
                onChange={(e) => setConfirmSandi(e.target.value)}
                placeholder="Ketik ulang sandi baru"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] focus:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSandi}
              className="w-full py-2.5 bg-[#e51c24] hover:bg-[#c9181f] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSavingSandi ? 'Menyimpan...' : 'Simpan Sandi Ambalan'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MANAJEMEN ANGGOTA */}
      {activeTab === 'anggota' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>👥</span>
                <span>Daftar Anggota Terdaftar</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Kelola hak akses dewan dan status aktif/nonaktif akun
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredUsers.length} Orang
            </span>
          </div>

          {userActionMessage && (
            <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-2">
              <span>✅</span>
              <span>{userActionMessage}</span>
            </div>
          )}

          {/* Search & Filter */}
          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] focus:bg-white"
            />
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {(['all', 'dewan', 'anggota', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedRoleFilter === r
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? 'Semua' : r === 'dewan' ? 'Dewan' : r === 'admin' ? 'Admin' : 'Anggota'}
                </button>
              ))}
            </div>
          </div>

          {/* List Users */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Tidak ada anggota yang cocok dengan pencarian.
              </p>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`p-3 rounded-xl border transition-all ${
                    u.nonaktif 
                      ? 'bg-slate-50 border-slate-200 opacity-60' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs text-slate-900 truncate block">
                          {u.namaLengkap}
                        </strong>
                        {u.nonaktif && (
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] font-bold rounded">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {u.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          u.peran === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.peran === 'dewan'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.peran === 'admin' ? '🛡️ Admin' : u.peran === 'dewan' ? '⭐ Dewan' : '👤 Anggota'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {u.status === 'purna_ambalan' ? 'Purna Ambalan' : 'Anggota Ambalan'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {u.peran !== 'admin' && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePeran(u)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer transition-all"
                        >
                          {u.peran === 'dewan' ? 'Jadikan Anggota' : 'Jadikan Dewan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDisabled(u)}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            u.nonaktif 
                              ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                              : 'bg-red-50 hover:bg-red-100 text-red-600'
                          }`}
                        >
                          {u.nonaktif ? 'Aktifkan Akun' : 'Nonaktifkan'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR ADMIN */}
      {activeTab === 'admin_list' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Daftar Email Admin Ambalan</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Email yang terdaftar di koleksi <code>admins</code> akan otomatis mendapatkan hak akses Admin saat mendaftar.
            </p>
          </div>

          {adminStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              adminStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <span>{adminStatus.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{adminStatus.message}</span>
            </div>
          )}

          {/* Form Tambah Admin */}
          <form onSubmit={handleAddAdminEmail} className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700">
              Tambah Email Admin Baru
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="nama@gmail.com"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] focus:bg-white"
                required
              />
              <button
                type="submit"
                disabled={isAddingAdmin}
                className="px-4 py-2 bg-[#e51c24] hover:bg-[#c9181f] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isAddingAdmin ? '...' : '+ Tambah'}
              </button>
            </div>
          </form>

          {/* Admin List */}
          <div className="space-y-2 pt-2">
            <h3 className="text-[11px] font-bold text-slate-600">
              Admin Terdaftar:
            </h3>
            
            {/* Primary Admin Badge */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
              <div>
                <strong className="text-xs text-purple-900 block">
                  {PRIMARY_ADMIN_EMAIL}
                </strong>
                <span className="text-[10px] text-purple-600">
                  Admin Utama (Bawaan Sistem)
                </span>
              </div>
              <span className="text-sm">👑</span>
            </div>

            {/* Additional Admins */}
            {adminEmails
              .filter((a) => a.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase())
              .map((admin) => (
                <div 
                  key={admin.id || admin.email} 
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <strong className="text-xs text-slate-800 block">
                      {admin.email}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      Ditambahkan oleh Admin
                    </span>
                  </div>
                  <span className="text-xs">🛡️</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
