import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut as webSignOut } from 'firebase/auth';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/config';
import { UserAccount } from '../../types';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';
import { FirestoreDiagnostics } from './FirestoreDiagnostics';

type GooglePortalProps = {
  open: boolean;
  onComplete: (user: UserAccount) => void;
  onSkip: () => void;
  onLogout?: () => void;
};

function withFirestoreTimeout<T>(promise: Promise<T>, timeoutMs = 10_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`Operasi tidak merespons dalam ${timeoutMs / 1000} detik.`);
      (error as Error & { code?: string }).code = 'timeout';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

const ADMIN_EMAIL = 'miralifa19@gmail.com';

// Perhitungan usia presisi sampai satuan hari berdasarkan kalender lahir
export function computeScoutAge(birthDateStr: string) {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr + 'T00:00:00');
  if (isNaN(birth.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  // 21 tahun tepat atau lebih: Purna Ambalan
  const twentyFirstBirthday = new Date(birth);
  twentyFirstBirthday.setFullYear(birth.getFullYear() + 21);
  const is21OrOlder = now >= twentyFirstBirthday;

  // 14 tahun tepat atau lebih
  const fourteenthBirthday = new Date(birth);
  fourteenthBirthday.setFullYear(birth.getFullYear() + 14);
  const is14OrOlder = now >= fourteenthBirthday;

  let category: 'purna' | 'calon_penegak' | 'underage';
  if (is21OrOlder) {
    category = 'purna';
  } else if (is14OrOlder) {
    category = 'calon_penegak';
  } else {
    category = 'underage';
  }

  return {
    years,
    months,
    days,
    is21OrOlder,
    is14OrOlder,
    category,
    ageString: `${years} tahun ${months} bulan`
  };
}

export const GoogleAuthPortal: React.FC<GooglePortalProps> = ({ open, onComplete, onSkip, onLogout }) => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [namaAsli, setNamaAsli] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [alamat, setAlamat] = useState('');
  const [photo, setPhoto] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isThanking, setIsThanking] = useState(false);
  const [showFirestoreDiagnostics, setShowFirestoreDiagnostics] = useState(false);
  const openRef = useRef(open);
  const processingUidRef = useRef<string | null>(null);
  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        console.info('[GoogleAuth] Login Google berhasil (auth state)', {
          email: user.email,
          uid: user.uid,
          projectId: auth.app.options.projectId,
        });
        console.info('[GoogleAuth] UID didapat', { uid: user.uid });
        setNamaAsli((current) => current || user.displayName || '');
        if (openRef.current) void finishLogin(user);
      }
    });
    return unsubscribe;
  }, []);

  const isAdmin = firebaseUser?.email?.toLowerCase() === ADMIN_EMAIL;
  const avatar = photo || firebaseUser?.photoURL || '';

  // Hitung usia dan status secara otomatis dari tanggal lahir
  const calculatedAge = computeScoutAge(tanggalLahir);

  const finishLogin = async (user: any) => {
    if (processingUidRef.current === user.uid) {
      console.info('[GoogleAuth] Proses login untuk UID ini masih berjalan; duplikasi diabaikan.', { uid: user.uid });
      return;
    }
    processingUidRef.current = user.uid;
    setFirebaseUser(user);
    setError('');
    setLoading(true);
    console.info('[GoogleAuth] Mulai menyelesaikan login', {
      uid: user.uid,
      projectId: auth.app.options.projectId,
      databaseId: '(default)',
    });
    try {
      const ref = doc(db, 'users', user.uid);

      // Refresh the Google credential before any Firestore operation.
      await withFirestoreTimeout(user.getIdToken(true), 10_000);

      // The primary administrator is trusted by the verified Google email.
      // Provision the admin profile before attempting a read: first login must
      // not be mistaken for an ordinary member onboarding flow.
      if (user.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified) {
        const admin: UserAccount = {
          uid: user.uid,
          username: user.email.split('@')[0],
          email: user.email,
          nama: user.displayName || 'Admin Utama',
          role: 'admin',
          gudep: '10-035',
          satuan: 'Putra',
          tingkat: 'Penegak Garuda',
          sangga: 'Perintis',
          jabatan: 'Admin Utama Pettalopo',
          nomorKta: '',
          foto: user.photoURL || '',
          createdAt: new Date().toISOString().slice(0, 10)
        };
        console.info('[GoogleAuth] Mulai tulis profil admin', { uid: user.uid, path: `users/${user.uid}` });
        await withFirestoreTimeout(setDoc(ref, {
          ...admin,
          googleAuth: true,
          onboardingSelesai: true,
          statusKeanggotaan: 'admin',
          updatedAt: Date.now()
        }, { merge: true }), 10_000);
        console.info('[GoogleAuth] Hasil tulis profil admin', { uid: user.uid, success: true });
        onComplete(admin);
        return;
      }

      // Members read only their own private profile document.
      console.info('[GoogleAuth] Mulai baca profil', {
        uid: user.uid,
        path: `users/${user.uid}`,
        databaseId: '(default)',
      });
      const snap = await withFirestoreTimeout(getDocFromServer(ref), 10_000);
      console.info('[GoogleAuth] Hasil baca profil', {
        uid: user.uid,
        exists: snap.exists(),
        status: snap.exists() ? 'profile-found' : 'profile-not-found-onboarding-needed',
      });

      // A missing profile is expected for a first login in a newly created
      // Firestore database. It is not a connectivity error: show onboarding.
      if (!snap.exists()) {
        setNamaAsli(user.displayName || '');
        setPhoto(user.photoURL || '');
        setNeedsProfile(true);
        return;
      }
      const data = snap.data() as Record<string, any>;

      // Refresh the non-sensitive directory projection after authenticated read.
      console.info('[GoogleAuth] Mulai tulis direktori anggota', { uid: user.uid, path: `public_members/${user.uid}` });
      await withFirestoreTimeout(setDoc(doc(db, 'public_members', user.uid), {
        uid: user.uid,
        nama: data.nama || data.namaLengkap || user.displayName || 'Anggota',
        namaLengkap: data.nama || data.namaLengkap || user.displayName || 'Anggota',
        gudep: data.gudep || '10-035',
        satuan: data.satuan || 'Putra',
        tingkat: data.tingkat || 'Calon Penegak',
        sangga: data.sangga || 'Perintis',
        jabatan: data.jabatan || 'Calon Penegak',
        foto: data.foto || data.fotoUrl || user.photoURL || '',
        fotoUrl: data.foto || data.fotoUrl || user.photoURL || '',
        role: data.role || 'anggota',
        isDewan: data.isDewan === true,
        dewanJabatan: data.dewanJabatan || '',
        updatedAt: Date.now()
      }, { merge: true }), 10_000);
      console.info('[GoogleAuth] Hasil tulis direktori anggota', { uid: user.uid, success: true });

      // Pengguna yang sudah menyelesaikan profil
      if (data?.onboardingSelesai && data?.googleAuth) {
        const saved: UserAccount = {
          uid: user.uid,
          username: data.username || user.email?.split('@')[0] || user.uid,
          email: user.email || '',
          nama: data.nama || data.namaLengkap || user.displayName || 'Anggota',
          role: data.role === 'dewan' || data.isDewan === true ? 'dewan' : 'anggota',
          isDewan: data.isDewan === true || data.role === 'dewan',
          dewanJabatan: data.dewanJabatan || '',
          gudep: data.gudep || '10-035',
          satuan: data.satuan || 'Putra',
          tingkat: data.tingkat || (data.status === 'purna_ambalan' ? 'Purna Ambalan' : 'Calon Penegak'),
          sangga: data.sangga || 'Perintis',
          jabatan: data.jabatan || (data.status === 'purna_ambalan' ? 'Purna Ambalan' : 'Calon Penegak'),
          nomorKta: data.nomorKta || '',
          foto: data.foto || data.fotoUrl || user.photoURL || '',
          ttl: data.tanggalLahir || data.ttl || '',
          usia: data.usia ?? data.usiaTahun ?? computeScoutAge(data.tanggalLahir || data.ttl || '')?.years ?? 0,
          motto: data.motto || '',
          createdAt: data.createdAt || new Date().toISOString().slice(0, 10)
        };
        onComplete(saved);
      } else {
        // Pengguna baru atau belum melengkapi profil
        setNamaAsli(user.displayName || '');
        setPhoto(user.photoURL || '');
        if (data?.tanggalLahir) setTanggalLahir(data.tanggalLahir);
        if (data?.nomorWhatsApp) setNomorWa(data.nomorWhatsApp);
        setNeedsProfile(true);
      }
    } catch (e: any) {
      const code = e?.code || 'unknown';
      console.error('Google login Firestore operation failed:', {
        code,
        message: e?.message,
        name: e?.name,
        stack: e?.stack,
        projectId: auth.app.options.projectId,
        userId: user?.uid,
      });
      if (code === 'permission-denied') {
        setError('Firestore permission-denied: akses profil ditolak oleh Firestore Rules.');
      } else if (code === 'unavailable') {
        setError('Firestore unavailable: layanan Firestore tidak dapat dijangkau. Periksa koneksi dan konfigurasi proyek.');
      } else if (code === 'timeout') {
        setError('Firestore timeout: proses membaca/menyelesaikan profil melebihi 10 detik. Periksa Firestore Rules dan koneksi.');
      } else {
        setError('Firestore ' + code + ': ' + (e?.message || 'Gagal memeriksa profil akun.'));
      }
    } finally {
      setLoading(false);
      if (processingUidRef.current === user.uid) processingUidRef.current = null;
    }
  };

  useEffect(() => {
    if (open && auth.currentUser) void finishLogin(auth.currentUser);
  }, [open]);

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (!result.user?.uid || !result.credential?.idToken) throw new Error('Google tidak mengembalikan token identitas.');
        const webCredential = GoogleAuthProvider.credential(result.credential.idToken);
        await signInWithCredential(auth, webCredential);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
      const signedInUser = auth.currentUser;
      console.info('[GoogleAuth] Login Google berhasil', {
        provider: Capacitor.isNativePlatform() ? 'native-google' : 'web-google',
        uid: signedInUser?.uid || null,
        email: signedInUser?.email || null,
      });
      if (signedInUser?.uid) {
        console.info('[GoogleAuth] UID didapat', { uid: signedInUser.uid });
      }
    } catch (e: any) {
      setError(e?.message || 'Login Google gagal. Pastikan koneksi tersedia.');
      setLoading(false);
    }
  };

  const compressPhoto = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format foto tidak didukung.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 720 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Pemrosesan foto gagal.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.62));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  // Pembuatan tautan WA langsung
  const getCleanWaLink = (numberStr: string) => {
    let clean = numberStr.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    else if (clean.startsWith('8')) clean = '62' + clean;
    return clean ? `https://wa.me/${clean}` : null;
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firebaseUser) return;

    if (!namaAsli.trim()) {
      setError('Wajib memasukkan nama asli.');
      return;
    }

    if (!nomorWa.trim() || nomorWa.replace(/[^0-9]/g, '').length < 9) {
      setError('Wajib memasukkan nomor WhatsApp yang valid.');
      return;
    }

    if (!tanggalLahir) {
      setError('Wajib memilih tanggal lahir dari kalender.');
      return;
    }

    const age = computeScoutAge(tanggalLahir);
    if (!age) {
      setError('Tanggal lahir tidak valid.');
      return;
    }

    // Aturan usia sesuai permintaan pengguna:
    // 1. Usia sudah 21 tahun -> Purna Ambalan
    // 2. Usia 14 - 20 tahun 11 bulan (sampai 1 hari sebelum 21) -> Calon Penegak
    let isPurna = age.is21OrOlder;
    let status = isPurna ? 'purna_ambalan' : 'anggota_ambalan';
    let tingkat = isPurna ? 'Purna Ambalan' : 'Calon Penegak';
    let jabatan = isPurna ? 'Purna Ambalan' : 'Calon Penegak';

    setLoading(true);
    setError('');
    try {
      const cleanWa = nomorWa.replace(/[^0-9+]/g, '');
      const profile = {
        uid: firebaseUser.uid,
        username: firebaseUser.email?.split('@')[0] || firebaseUser.uid,
        email: firebaseUser.email || '',
        nama: namaAsli.trim(),
        namaLengkap: namaAsli.trim(),
        nomorWhatsApp: cleanWa,
        wa: cleanWa,
        tanggalLahir,
        ttl: tanggalLahir,
        usiaTahun: age.years,
        usia: age.years,
        usiaBulan: age.months,
        role: 'anggota',
        isDewan: false,
        dewanJabatan: '',
        status,
        statusKeanggotaan: status,
        tingkat,
        jabatan,
        alamat: alamat.trim(),
        foto: avatar,
        fotoUrl: avatar,
        googleAuth: true,
        onboardingSelesai: true,
        gudep: '10-035',
        satuan: 'Putra',
        sangga: 'Perintis',
        nomorKta: '',
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: Date.now()
      };

      console.info('[GoogleAuth] Mulai tulis profil', { uid: firebaseUser.uid, path: `users/${firebaseUser.uid}` });
      await withFirestoreTimeout(setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true }), 10_000);
      console.info('[GoogleAuth] Hasil tulis profil', { uid: firebaseUser.uid, path: `users/${firebaseUser.uid}`, success: true });

      console.info('[GoogleAuth] Mulai tulis direktori anggota', { uid: firebaseUser.uid, path: `public_members/${firebaseUser.uid}` });
      await withFirestoreTimeout(setDoc(doc(db, 'public_members', firebaseUser.uid), {
        uid: firebaseUser.uid,
        nama: profile.nama,
        namaLengkap: profile.namaLengkap,
        gudep: profile.gudep,
        satuan: profile.satuan,
        tingkat: profile.tingkat,
        sangga: profile.sangga,
        jabatan: profile.jabatan,
        foto: profile.foto,
        fotoUrl: profile.fotoUrl,
        role: 'anggota',
        isDewan: false,
        dewanJabatan: '',
        updatedAt: Date.now()
      }, { merge: true }), 10_000);
      console.info('[GoogleAuth] Hasil tulis direktori anggota', { uid: firebaseUser.uid, path: `public_members/${firebaseUser.uid}`, success: true });
      onComplete(profile as UserAccount);
    } catch (e: any) {
      const code = e?.code || 'unknown';
      console.error('Google onboarding Firestore write failed:', {
        code,
        message: e?.message,
        projectId: auth.app.options.projectId,
        userId: firebaseUser?.uid
      });
      setError('Firestore ' + code + ': ' + (e?.message || 'Gagal menyimpan profil akun.'));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!window.confirm('Yakin ingin keluar dari akun Google?')) return;
    try {
      if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut();
      await webSignOut(auth);
      setFirebaseUser(null);
      setNeedsProfile(false);
      setIsThanking(true);
      window.setTimeout(() => { setIsThanking(false); onLogout?.(); }, 800);
    } catch (e: any) {
      setError(e?.message || 'Tidak dapat keluar dari akun Google.');
    }
  };

  if (!open) return null;
  if (isThanking) {
    return (
      <div className="fixed inset-0 z-[130] bg-white text-slate-900 flex flex-col items-center justify-center text-center p-6 select-none font-sans">
        <img src={LOGO_IMAGE_PATH} alt="Logo Ambalan" className="w-20 h-20 object-contain mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Terima kasih, Kak!</h2>
        <p className="text-xs text-slate-500 mt-1">Sampai jumpa kembali di Pettalopo Mobile.</p>
      </div>
    );
  }

  const waLink = getCleanWaLink(nomorWa);

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-white flex items-center justify-center p-4 select-none font-sans">
      <div className="w-full max-w-md rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white">
        {/* Header Bersih */}
        <div className="bg-[#e51c24] text-white p-6 text-center">
          <img src={LOGO_IMAGE_PATH} alt="Logo Ambalan" className="w-16 h-16 object-contain mx-auto mb-2" />
          <h1 className="text-lg font-bold">Pettalopo Mobile</h1>
          <p className="text-xs text-red-100">Sistem Akun Ambalan La Surullah Petta Lopo</p>
        </div>

        <div className="p-5 space-y-4">
          {needsProfile ? (
            <form onSubmit={saveProfile} className="space-y-3.5">
              <div className="text-center pb-1 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900">Pendaftaran Pengguna Baru</h2>
                <p className="text-xs text-slate-500 mt-0.5">{firebaseUser?.email}</p>
              </div>

              {/* 1. Nama Asli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Asli <span className="text-[#e51c24]">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={namaAsli}
                  onChange={(e) => setNamaAsli(e.target.value)}
                  placeholder="Masukkan nama asli lengkap"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] bg-slate-50 focus:bg-white"
                />
              </div>

              {/* 2. Nomor WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor WhatsApp <span className="text-[#e51c24]">*</span>
                  </label>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-green-700 hover:underline flex items-center gap-1"
                    >
                      <span>💬 Buka WA</span>
                    </a>
                  )}
                </div>
                <input
                  required
                  type="tel"
                  value={nomorWa}
                  onChange={(e) => setNomorWa(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 62812..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] bg-slate-50 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nomor ini dapat langsung dihubungi melalui tautan WhatsApp.
                </p>
              </div>

              {/* 3. Tanggal Lahir (Menggunakan Kalender) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Lahir (Pilih dari Kalender) <span className="text-[#e51c24]">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] bg-slate-50 focus:bg-white cursor-pointer"
                />

                {/* Indikator Otomatis Status Keanggotaan Berdasarkan Usia */}
                {calculatedAge && (
                  <div className={`mt-2 p-2.5 rounded-xl border text-xs leading-relaxed ${
                    calculatedAge.is21OrOlder
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : calculatedAge.is14OrOlder
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{calculatedAge.is21OrOlder ? '🎖️' : calculatedAge.is14OrOlder ? '⚜️' : '⚠️'}</span>
                      <span>Usia: {calculatedAge.ageString}</span>
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {calculatedAge.is21OrOlder ? (
                        <span>Status otomatis: <strong>Purna Ambalan</strong> (usia sudah 21 tahun ke atas).</span>
                      ) : calculatedAge.is14OrOlder ? (
                        <span>Status otomatis: <strong>Calon Penegak</strong> (usia 14 – 20 tahun 11 bulan).</span>
                      ) : (
                        <span>Usia di bawah 14 tahun belum memasuki tingkatan Penegak.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Alamat (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Alamat domisili saat ini"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] bg-slate-50 focus:bg-white"
                />
              </div>

              {/* 5. Foto Profil */}
              <div className="flex items-center gap-3 pt-1">
                <img
                  src={avatar || LOGO_IMAGE_PATH}
                  alt="Foto profil"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <label className="text-xs font-bold text-slate-700 cursor-pointer">
                  <span>Unggah Foto Profil (Opsional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="block mt-1 text-[10px] w-full text-slate-500"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          setPhoto(await compressPhoto(file));
                        } catch (err: any) {
                          setError(err.message);
                        }
                      }
                    }}
                  />
                </label>
              </div>

              {/* Tombol Simpan */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#e51c24] hover:bg-[#c9181f] text-white font-bold p-3 text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
              >
                {loading ? 'Menyimpan...' : 'Simpan Profil & Masuk ke Aplikasi'}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div>
                <h2 className="font-bold text-base text-slate-900">Masuk dengan Akun Google</h2>
                <p className="text-xs text-slate-500 mt-1">Gunakan akun Google untuk mengakses Pettalopo Mobile.</p>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 hover:border-slate-400 p-3 font-semibold text-xs text-slate-700 flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
              </button>

              {firebaseUser && (
                <button
                  type="button"
                  onClick={logout}
                  className="w-full text-xs text-[#e51c24] font-semibold cursor-pointer hover:underline"
                >
                  Keluar dari akun Google
                </button>
              )}

              <button
                type="button"
                onClick={onSkip}
                className="w-full text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Lanjutkan dengan mode pratinjau
              </button>

              <button
                type="button"
                onClick={() => setShowFirestoreDiagnostics(true)}
                className="w-full text-[11px] text-slate-500 underline cursor-pointer"
              >
                Diagnostik koneksi Firestore
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-[#e51c24] flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
      <FirestoreDiagnostics open={showFirestoreDiagnostics} onClose={() => setShowFirestoreDiagnostics(false)} />
    </div>
  );
};
