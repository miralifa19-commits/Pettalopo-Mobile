import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth } from '../../firebase/config';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { UserAccount } from '../../types';
import { DEFAULT_8_DEWAN, Dewan8Position, subscribeTo8DewanPositions } from '../../data/dewanStructure';

interface KelolaAplikasiViewProps {
  currentUser: UserAccount;
  onBack: () => void;
  onTriggerReLogin?: () => void;
}

export const KelolaAplikasiView: React.FC<KelolaAplikasiViewProps> = ({
  currentUser,
  onBack,
  onTriggerReLogin
}) => {
  const [activeTab, setActiveTab] = useState<'pengguna' | 'dewan' | 'versi'>('pengguna');
  const [dewanPositions, setDewanPositions] = useState<Dewan8Position[]>(DEFAULT_8_DEWAN);
  const [pendingDewanPositions, setPendingDewanPositions] = useState<Dewan8Position[]>(DEFAULT_8_DEWAN);
  const [savingDewan, setSavingDewan] = useState(false);
  const isMainAdmin = currentUser.role === 'admin' && (currentUser.email?.toLowerCase() === 'miralifa19@gmail.com' || auth.currentUser?.email?.toLowerCase() === 'miralifa19@gmail.com');
  const [userList, setUserList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const functions = getFunctions();

  // Subscribe ke koleksi users di Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() });
      });
      setUserList(items);
      setLoading(false);
    }, (error) => {
      console.warn('Gagal memuat pengguna:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeTo8DewanPositions((positions) => {
      setDewanPositions(positions);
      setPendingDewanPositions(positions);
    });
    return () => unsub();
  }, []);

  const handleSaveDewanAssignments = async () => {
    if (!isMainAdmin || savingDewan) return;
    const assigned = pendingDewanPositions.filter((position) => position.memberUid);
    const assignedIds = assigned.map((position) => position.memberUid as string);
    if (new Set(assignedIds).size !== assignedIds.length) {
      alert('Satu anggota hanya dapat mengisi satu posisi Dewan Ambalan.');
      return;
    }
    const invalidAssignment = assigned.find((position) => {
      const member = userList.find((item) => item.id === position.memberUid || item.uid === position.memberUid);
      return !isEligibleDewanCandidate(member);
    });
    if (invalidAssignment) {
      alert('Anggota Purna, akun blacklist, atau anggota yang belum dapat diverifikasi usianya tidak boleh dilantik. Hapus pilihan tersebut terlebih dahulu.');
      return;
    }

    setSavingDewan(true);
    try {
      const batch = writeBatch(db);
      const previousIds = new Set<string>([
        ...dewanPositions.map((position) => position.memberUid).filter(Boolean) as string[],
        ...userList
          .filter((item) => item.role === 'dewan' || item.isDewan === true)
          .map((item) => item.id || item.uid)
          .filter((uid): uid is string => Boolean(uid))
      ]);
      const nextIds = new Set(assignedIds);

      previousIds.forEach((uid) => {
        if (!nextIds.has(uid) && userList.some((item) => item.id === uid || item.uid === uid)) {
          batch.update(doc(db, 'users', uid), { role: 'anggota', isDewan: false, dewanJabatan: '' });
        }
      });

      pendingDewanPositions.forEach((position) => {
        if (!position.memberUid) return;
        const member = userList.find((item) => item.id === position.memberUid || item.uid === position.memberUid);
        if (member) {
          batch.update(doc(db, 'users', position.memberUid), {
            role: 'dewan',
            isDewan: true,
            dewanJabatan: position.jabatan,
            jabatan: position.jabatan
          });
        }
      });

      const positionsForFirestore = pendingDewanPositions.map((position) => ({
        id: position.id,
        jabatan: position.jabatan,
        satuan: position.satuan,
        memberName: position.memberName,
        ...(position.memberUid ? { memberUid: position.memberUid } : {}),
        ...(position.sangga ? { sangga: position.sangga } : {})
      }));
      batch.set(doc(db, 'config', 'dewan_kepengurusan'), {
        positions: positionsForFirestore,
        updatedAt: Date.now(),
        updatedBy: currentUser.email || currentUser.nama
      }, { merge: true });
      await batch.commit();
      setDewanPositions(pendingDewanPositions);
      setActionNotice('Susunan 8 Roda Dewan Ambalan berhasil disimpan dan disinkronkan ke semua perangkat.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan susunan Dewan Ambalan: ' + (err?.message || 'Periksa koneksi internet.'));
    } finally {
      setSavingDewan(false);
    }
  };

  // Format nomor WhatsApp agar bisa langsung membuka aplikasi WA
  const formatWaUrl = (waNumber?: string) => {
    if (!waNumber) return null;
    let clean = waNumber.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return `https://wa.me/${clean}`;
  };

  // Fungsi reset akun google agar bisa login ulang
  const handleResetGoogleAccount = async (targetUser: any) => {
    if (!isMainAdmin || targetUser.role === 'admin' || targetUser.email?.toLowerCase() === 'miralifa19@gmail.com') {
      alert('Akun Admin tidak dapat direset dari panel Kelola User.');
      return;
    }
    const confirm = window.confirm(
      `Yakin ingin mereset akun Google milik "${targetUser.nama || targetUser.namaLengkap || targetUser.email}"?\n\nSetelah direset, data login Google akan diatur ulang sehingga pengguna dapat masuk atau mengisi profil kembali.`
    );
    if (!confirm) return;

    try {
      const targetUid = targetUser.id || targetUser.uid;
      if (!targetUid) throw new Error('ID akun tidak ditemukan.');
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, {
        googleAuth: false,
        onboardingSelesai: false,
        accountStatus: 'reset',
        accountResetAt: Date.now(),
        accountResetBy: auth.currentUser?.uid || currentUser.uid || '',
        role: 'anggota',
        isDewan: false,
        dewanJabatan: '',
        updatedAt: Date.now()
      });

      // Lepaskan akun dari susunan 8 Roda Dewan bila sebelumnya dilantik.
      const dewanConfigRef = doc(db, 'config', 'dewan_kepengurusan');
      const dewanConfig = await getDoc(dewanConfigRef);
      if (dewanConfig.exists()) {
        const configData = dewanConfig.data();
        const positions = Array.isArray(configData.positions) ? configData.positions : [];
        const cleanedPositions = positions.map((position: any) =>
          position.memberUid === targetUid
            ? { ...position, memberUid: null, memberName: 'Belum ditetapkan' }
            : position
        );
        if (positions.some((position: any) => position.memberUid === targetUid)) {
          await updateDoc(dewanConfigRef, { positions: cleanedPositions, updatedAt: Date.now() });
        }
      }

      setActionNotice(`Akun ${targetUser.nama || targetUser.email} berhasil direset. Akun sekarang dapat dihapus oleh Admin Utama.`);
      setTimeout(() => setActionNotice(null), 3500);

      // Jika mereset akun diri sendiri, berikan opsi login ulang langsung
      if (auth.currentUser && auth.currentUser.uid === targetUser.id) {
        if (window.confirm('Anda mereset akun sendiri. Ingin langsung login ulang sekarang?')) {
          onTriggerReLogin?.();
        }
      }
    } catch (err: any) {
      alert('Gagal mereset akun: ' + (err?.message || 'Periksa koneksi.'));
    }
  };

  // Hapus permanen hanya untuk akun yang sudah direset. Cloud Function juga memblokir email agar tidak dapat mendaftar ulang.
  const handleDeleteAccount = async (targetUser: any) => {
    const targetUid = targetUser.id || targetUser.uid;
    const label = targetUser.nama || targetUser.namaLengkap || targetUser.email || targetUid;
    if (!isMainAdmin || !targetUid || targetUser.role === 'admin' || targetUser.email?.toLowerCase() === 'miralifa19@gmail.com') {
      alert('Akun Admin Utama tidak dapat dihapus.');
      return;
    }
    if (!targetUser.accountResetAt || targetUser.accountStatus !== 'reset' || targetUser.googleAuth === true) {
      alert('Akun harus direset terlebih dahulu sebelum dapat dihapus.');
      return;
    }
    if (!window.confirm(`HAPUS PERMANEN akun "${label}"?\n\nAkun Firebase dan profilnya akan dihapus. Email ini akan diblokir agar tidak dapat membuat akun Pettalopo baru untuk spam. Tindakan ini tidak dapat dibatalkan.`)) return;

    setBusyUserId(targetUid);
    try {
      const deleteResetAccount = httpsCallable(functions, 'deleteResetAccount');
      await deleteResetAccount({ targetUid });
      setActionNotice(`Akun ${label} berhasil dihapus dan emailnya diblokir dari pendaftaran ulang.`);
    } catch (err: any) {
      alert('Gagal menghapus akun: ' + (err?.message || 'Pastikan Firebase Cloud Function deleteResetAccount sudah diterapkan.'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleBlacklist = async (targetUser: any) => {
    const targetUid = targetUser.id || targetUser.uid;
    if (!isMainAdmin || !targetUid || targetUser.role === 'admin' || targetUser.email?.toLowerCase() === 'miralifa19@gmail.com' || targetUid === auth.currentUser?.uid) {
      alert('Akun Admin Utama tidak dapat dimasukkan ke daftar blacklist.');
      return;
    }
    const nextBlacklisted = targetUser.blacklisted !== true;
    const label = targetUser.nama || targetUser.namaLengkap || targetUser.email || 'pengguna';
    if (!window.confirm(nextBlacklisted
      ? `Masukkan akun "${label}" ke blacklist? Pengguna tidak dapat masuk ke Pettalopo Mobile sampai akses dipulihkan.`
      : `Pulihkan akses akun "${label}"?`)) return;

    setBusyUserId(targetUid);
    try {
      await updateDoc(doc(db, 'users', targetUid), {
        blacklisted: nextBlacklisted,
        blacklistUpdatedAt: Date.now(),
        blacklistUpdatedBy: auth.currentUser?.uid || currentUser.uid || ''
      });
      setActionNotice(nextBlacklisted
        ? `Akun ${label} masuk blacklist.`
        : `Akses akun ${label} telah dipulihkan.`);
    } catch (err: any) {
      alert('Gagal memperbarui blacklist: ' + (err?.message || 'Periksa koneksi.'));
    } finally {
      setBusyUserId(null);
    }
  };

  // Hitung usia dari tanggal lahir
  const formatBirthInfo = (birthDateStr?: string) => {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) {
      return {
        dateFormatted: birthDateStr,
        ageText: '-',
        isPurna: false
      };
    }

    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const dateFormatted = birth.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      dateFormatted,
      ageText: `${years} tahun ${months} bulan`,
      isPurna: years >= 21
    };
  };

  const isEligibleDewanCandidate = (item: any) => {
    if (!item || item.blacklisted === true) return false;
    if (item.status === 'purna_ambalan' || item.statusKeanggotaan === 'purna_ambalan') return false;
    const birth = item.tanggalLahir || item.ttl;
    const birthInfo = birth ? formatBirthInfo(birth) : null;
    const age = birthInfo ? Number.parseInt(birthInfo.ageText, 10) : Number(item.usiaTahun ?? item.usia);
    return Number.isFinite(age) && age >= 14 && age < 21;
  };

  const filteredUsers = userList.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.nama || u.namaLengkap || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const waMatch = (u.nomorWhatsApp || u.wa || '').includes(q);
    return nameMatch || emailMatch || waMatch;
  });

  if (!isMainAdmin) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-6 text-center space-y-3">
        <div className="text-3xl">🔒</div>
        <h2 className="text-sm font-black text-slate-900">Akses Ditolak</h2>
        <p className="text-xs text-slate-500">Kelola Aplikasi hanya dapat dibuka oleh Admin Utama.</p>
        <button type="button" onClick={onBack} className="rounded-xl bg-[#e51c24] px-4 py-2.5 text-xs font-bold text-white">Kembali</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 font-sans select-none">
      {/* Header Halaman */}
      <MenuHeaderCard
        title="Kelola Aplikasi"
        subtitle="Panel Admin Utama (miralifa19@gmail.com)"
        onBack={onBack}
      />

      {/* Tab Switcher */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('pengguna')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'pengguna'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>👥</span>
          <span>Pengguna ({userList.length})</span>
        </button>

        {isMainAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('dewan')}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'dewan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>⚜️</span>
            <span>Kelola Dewan</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('versi')}
          className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'versi'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>📱</span>
          <span>Versi APK</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <span>✅</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 1: PENGGUNA */}
      {activeTab === 'pengguna' && (
        <div className="space-y-3">
          {/* Pencarian */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama asli, email, atau nomor WA..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] focus:bg-white"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-[#e51c24] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat data pengguna...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
              Tidak ada pengguna yang cocok.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((item) => {
                const birthInfo = formatBirthInfo(item.tanggalLahir || item.ttl);
                const waUrl = formatWaUrl(item.nomorWhatsApp || item.wa);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-400 text-sm">
                          {item.foto || item.fotoUrl || item.photoURL ? (
                            <img
                              src={item.foto || item.fotoUrl || item.photoURL}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{(item.nama || item.namaLengkap || 'A').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="text-xs text-slate-900 block truncate">
                            {item.nama || item.namaLengkap || 'Tanpa Nama'}
                          </strong>
                          <p className="text-[11px] text-slate-500 truncate">
                            {item.email || '-'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {item.blacklisted && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-700 text-white">⛔ Blacklist</span>}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.email?.toLowerCase() === 'miralifa19@gmail.com' || item.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : (item.role === 'dewan' || item.isDewan === true)
                                ? 'bg-red-100 text-red-700'
                                : (item.status === 'purna_ambalan' || item.statusKeanggotaan === 'purna_ambalan')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.email?.toLowerCase() === 'miralifa19@gmail.com'
                                ? '🛡️ Admin Utama'
                                : (item.role === 'dewan' || item.isDewan === true)
                                ? `⚜️ ${item.dewanJabatan || 'Dewan Ambalan'}`
                                : (item.status === 'purna_ambalan' || item.statusKeanggotaan === 'purna_ambalan')
                                ? '🎖️ Purna Ambalan'
                                : `⚜️ ${item.tingkat || 'Calon Penegak'}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResetGoogleAccount(item)}
                          disabled={busyUserId === (item.id || item.uid)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#e51c24] text-[10px] font-bold border border-red-200 disabled:opacity-50"
                          title="Reset status login Google pengguna"
                        >
                          🔄 Reset Akun
                        </button>
                        {isMainAdmin && item.email?.toLowerCase() !== 'miralifa19@gmail.com' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(item)}
                            disabled={busyUserId === (item.id || item.uid) || item.accountStatus !== 'reset' || !item.accountResetAt || item.googleAuth === true}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-bold border border-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={item.accountStatus === 'reset' ? 'Hapus akun yang sudah direset' : 'Reset akun terlebih dahulu'}
                          >
                            {busyUserId === (item.id || item.uid) ? 'Memproses…' : '🗑️ Hapus Akun'}
                          </button>
                        )}
                        {isMainAdmin && item.email?.toLowerCase() !== 'miralifa19@gmail.com' && (
                          <button
                            type="button"
                            onClick={() => handleToggleBlacklist(item)}
                            disabled={busyUserId === (item.id || item.uid)}
                            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border disabled:opacity-50 ${item.blacklisted ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-red-700 text-white border-red-700'}`}
                          >
                            {busyUserId === (item.id || item.uid) ? 'Memproses…' : item.blacklisted ? 'Pulihkan Akses' : 'Blacklist'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Informasi Detail */}
                    <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1.5">
                      {/* Tanggal Lahir & Usia */}
                      {birthInfo && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span>📅 Tanggal Lahir:</span>
                          <span className="font-semibold text-slate-800">
                            {birthInfo.dateFormatted} ({birthInfo.ageText})
                          </span>
                        </div>
                      )}

                      {/* Nomor WhatsApp dengan aksi langsung buka aplikasi WA */}
                      {(item.nomorWhatsApp || item.wa) && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span>💬 WhatsApp:</span>
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                            >
                              <span>📱</span>
                              <span>{item.nomorWhatsApp || item.wa} (Buka WA)</span>
                            </a>
                          ) : (
                            <span className="font-semibold text-slate-800">
                              {item.nomorWhatsApp || item.wa}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 text-slate-600">
                        <span>🆔 ID Akun:</span>
                        <span className="font-mono text-[10px] text-slate-500 break-all text-right">{item.id || item.uid || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>🧾 Status Akun:</span>
                        <span className={item.accountStatus === 'reset' ? 'font-bold text-amber-700' : 'font-semibold text-slate-600'}>
                          {item.accountStatus === 'reset' ? 'Sudah Direset · Siap Dihapus' : 'Aktif'}
                        </span>
                      </div>
                      {/* Status Login Google */}
                      <div className="flex items-center justify-between text-slate-600">
                        <span>🔐 Status Login Google:</span>
                        <span className={`font-semibold ${item.googleAuth ? 'text-green-600' : 'text-slate-400'}`}>
                          {item.googleAuth ? 'Aktif Terhubung' : 'Belum / Telah Direset'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB KELOLA DEWAN AMBALAN: KHUSUS ADMIN UTAMA */}
      {activeTab === 'dewan' && isMainAdmin && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-red-100 bg-white p-4 space-y-2">
            <h3 className="text-sm font-black text-slate-900">Delapan Roda Kepengurusan</h3>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Tetapkan anggota aktif usia 14–20 tahun untuk setiap posisi. Anggota Purna (21 tahun ke atas), akun blacklist, dan akun Admin tidak ditampilkan. Satu anggota hanya dapat mengisi satu posisi.
            </p>
          </div>

          <div className="space-y-2">
            {pendingDewanPositions.map((position) => (
              <div key={position.id} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-slate-900">{position.jabatan}</strong>
                  <span className="text-[10px] font-bold text-slate-500">{position.satuan}</span>
                </div>
                <select
                  value={position.memberUid || ''}
                  onChange={(event) => {
                    const uid = event.target.value;
                    const member = userList.find((item) => item.id === uid || item.uid === uid);
                    setPendingDewanPositions((current) => current.map((item) => item.id === position.id
                      ? { ...item, memberUid: uid || undefined, memberName: member?.nama || member?.namaLengkap || 'Belum ditetapkan', sangga: member?.sangga || undefined }
                      : item
                    ));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-800"
                >
                  <option value="">— Belum ditetapkan —</option>
                  {userList
                    .filter((item) => item.id && item.role !== 'admin' && item.email?.toLowerCase() !== 'miralifa19@gmail.com' && isEligibleDewanCandidate(item))
                    .sort((a, b) => (a.nama || a.namaLengkap || '').localeCompare(b.nama || b.namaLengkap || '', 'id'))
                    .map((item) => {
                      const uid = item.id || item.uid;
                      const occupiedElsewhere = pendingDewanPositions.some((other) => other.id !== position.id && other.memberUid === uid);
                      return (
                        <option key={uid} value={uid} disabled={occupiedElsewhere}>
                          {item.nama || item.namaLengkap || item.email || uid}{occupiedElsewhere ? ' (sudah mengisi posisi)' : ''}
                        </option>
                      );
                    })}
                </select>
                <p className="text-[10px] text-slate-500">
                  {position.memberUid ? `Terpilih: ${position.memberName}` : 'Posisi belum memiliki anggota.'}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveDewanAssignments}
            disabled={savingDewan}
            className="w-full rounded-xl bg-[#e51c24] px-4 py-3 text-xs font-black text-white disabled:opacity-50"
          >
            {savingDewan ? 'Menyimpan susunan...' : 'Simpan Susunan 8 Roda Dewan'}
          </button>
        </div>
      )}

      {/* TAB 2: VERSI APK */}
      {activeTab === 'versi' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-2 shadow-xs flex items-center justify-center">
              <img
                src="/assets/pettalopo-logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pettalopo Mobile
              </h2>
              <p className="text-xs text-slate-500">
                Aplikasi Resmi Ambalan La Surullah Petta Lopo
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">Versi Aplikasi (Version Name)</span>
              <span className="font-bold text-slate-900 font-mono">1.4</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">Android Version Code</span>
              <span className="font-bold text-slate-900 font-mono">14</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">ID Paket (Package ID)</span>
              <span className="font-bold text-slate-900 font-mono">id.sch.smpialwasi_maros.ambalan</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">Gugus Depan</span>
              <span className="font-bold text-[#e51c24]">10.035 - 10.036</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">Pangkalan</span>
              <span className="font-bold text-slate-900">SMA Negeri 9 Maros</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">Status Pembaruan</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Disiapkan untuk rilis v1.4
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
            ℹ️ Sistem pembaruan aplikasi otomatis (OTA Update) terpasang dan akan memindai berkas APK rilis baru secara otomatis saat dibuka.
          </div>
        </div>
      )}
    </div>
  );
};
