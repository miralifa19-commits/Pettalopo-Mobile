import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
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

    setSavingDewan(true);
    try {
      const batch = writeBatch(db);
      const previousIds = new Set(dewanPositions.map((position) => position.memberUid).filter(Boolean) as string[]);
      const nextIds = new Set(assignedIds);

      previousIds.forEach((uid) => {
        if (!nextIds.has(uid)) {
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

      batch.set(doc(db, 'config', 'dewan_kepengurusan'), {
        positions: pendingDewanPositions,
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
    const confirm = window.confirm(
      `Yakin ingin mereset akun Google milik "${targetUser.nama || targetUser.namaLengkap || targetUser.email}"?\n\nSetelah direset, data login Google akan diatur ulang sehingga pengguna dapat masuk atau mengisi profil kembali.`
    );
    if (!confirm) return;

    try {
      const userRef = doc(db, 'users', targetUser.id || targetUser.uid);
      await updateDoc(userRef, {
        googleAuth: false,
        onboardingSelesai: false,
        updatedAt: Date.now()
      });

      setActionNotice(`Akun ${targetUser.nama || targetUser.email} berhasil direset. Pengguna dapat login ulang.`);
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

  const filteredUsers = userList.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.nama || u.namaLengkap || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const waMatch = (u.nomorWhatsApp || u.wa || '').includes(q);
    return nameMatch || emailMatch || waMatch;
  });

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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.email?.toLowerCase() === 'miralifa19@gmail.com' || item.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : (item.status === 'purna_ambalan' || item.statusKeanggotaan === 'purna_ambalan')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.email?.toLowerCase() === 'miralifa19@gmail.com'
                                ? '🛡️ Admin Utama'
                                : (item.status === 'purna_ambalan' || item.statusKeanggotaan === 'purna_ambalan')
                                ? '🎖️ Purna Ambalan'
                                : `⚜️ ${item.tingkat || 'Calon Penegak'}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Reset Akun Google */}
                      <button
                        type="button"
                        onClick={() => handleResetGoogleAccount(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 text-[#e51c24] text-[10px] font-bold border border-red-200 transition-colors shrink-0 cursor-pointer"
                        title="Reset akun Google pengguna agar bisa login ulang"
                      >
                        🔄 Reset Akun
                      </button>
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
              Tetapkan anggota terpilih untuk setiap posisi. Perubahan akan tersimpan di Firestore dan berlaku di seluruh perangkat. Satu anggota hanya dapat mengisi satu posisi.
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
                    .filter((item) => item.id && item.role !== 'admin' && item.email?.toLowerCase() !== 'miralifa19@gmail.com')
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
              <span className="font-bold text-slate-900 font-mono">1.2</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-500 font-medium">Android Version Code</span>
              <span className="font-bold text-slate-900 font-mono">12</span>
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
              <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                Terkini & Aktif
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
