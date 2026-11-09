import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut as webSignOut, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/config';
import { UserAccount } from '../../types';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';
import { verifySandiAmbalan } from '../../services/authService';

type GooglePortalProps = {
  open: boolean;
  onComplete: (user: UserAccount) => void;
  onLogout?: () => void;
};

function withFirestoreTimeout<T>(promise: Promise<T>, timeoutMs = 10_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`Koneksi ke Firestore tidak merespons dalam ${timeoutMs / 1000} detik.`);
      (error as Error & { code?: string }).code = 'timeout';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

const ADMIN_EMAIL = 'miralifa19@gmail.com';

/**
 * Perhitungan usia presisi berdasarkan tanggal lahir kalender
 * - Usia >= 21 tahun: Purna Ambalan
 * - Usia < 21 tahun: Anggota Ambalan
 */
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

  const twentyFirstBirthday = new Date(birth);
  twentyFirstBirthday.setFullYear(birth.getFullYear() + 21);
  const is21OrOlder = now >= twentyFirstBirthday;

  const status = is21OrOlder ? 'purna_ambalan' : 'anggota_ambalan';
  const statusLabel = is21OrOlder ? 'Purna Ambalan' : 'Anggota Ambalan';
  const tingkat = is21OrOlder ? 'Purna Ambalan' : 'Calon Penegak';
  const jabatan = is21OrOlder ? 'Purna Ambalan' : 'Calon Penegak';

  return {
    years,
    months,
    days,
    is21OrOlder,
    status,
    statusLabel,
    tingkat,
    jabatan,
    ageString: `${years} tahun ${months} bulan`
  };
}

export const GoogleAuthPortal: React.FC<GooglePortalProps> = ({ open, onComplete, onLogout }) => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [sandiAmbalan, setSandiAmbalan] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Menghubungkan...');
  const [error, setError] = useState('');
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [domainCopied, setDomainCopied] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagTesting, setDiagTesting] = useState(false);
  const [diagResult, setDiagResult] = useState<{
    status: 'idle' | 'success' | 'error';
    latencyMs?: number;
    message?: string;
    code?: string;
  } | null>(null);

  const openRef = useRef(open);
  const processingUidRef = useRef<string | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Listener status login Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const hasGoogleProvider = !!user
        && !user.isAnonymous
        && user.providerData?.some((provider) => provider.providerId === 'google.com');

      console.info('[AUTH_FLOW] Portal: perubahan sesi diterima.', {
        googleSession: hasGoogleProvider,
        portalOpen: openRef.current
      });
      setFirebaseUser(hasGoogleProvider ? user : null);
      if (hasGoogleProvider) {
        setNamaLengkap((current) => current || user.displayName || '');
        if (openRef.current) {
          void finishLogin(user);
        }
      }
    });
    return unsubscribe;
  }, []);

  const finishLogin = async (user: any) => {
    if (processingUidRef.current === user.uid) return;
    processingUidRef.current = user.uid;
    setFirebaseUser(user);
    setError('');
    setLoading(true);
    setLoadingText('Memeriksa akun...');
    console.info('[AUTH_FLOW] Portal: pemeriksaan profil dimulai.');

    try {
      const ref = doc(db, 'users', user.uid);

      // Gunakan token autentikasi yang sudah ada (tanpa paksa refresh jaringan)
      await withFirestoreTimeout(user.getIdToken(false), 8_000);

      // 1. Akun Admin Utama (miralifa19@gmail.com) otomatis menjadi admin dan langsung masuk
      if (user.email?.toLowerCase() === ADMIN_EMAIL) {
        console.info('[AUTH_FLOW] Admin utama terdeteksi (miralifa19@gmail.com). Membuka akses admin...');

        let savedAdminData: Record<string, any> = {};
        try {
          // Ambil profil tersimpan jika tersedia dengan waktu tunggu toleran (2.5 detik)
          const adminSnap = await withFirestoreTimeout(getDoc(ref), 2_500);
          if (adminSnap.exists()) {
            savedAdminData = adminSnap.data();
          }
        } catch (readErr) {
          console.warn('[AUTH_FLOW] Pembacaan profil Firestore admin ditunda atau lambat, menggunakan data default:', readErr);
        }

        const adminAccount: UserAccount = {
          ...savedAdminData,
          uid: user.uid,
          username: savedAdminData.username || user.email.split('@')[0],
          email: user.email,
          nama: savedAdminData.nama || savedAdminData.namaLengkap || user.displayName || 'Admin Utama',
          role: 'admin',
          gudep: savedAdminData.gudep || '10-035',
          satuan: savedAdminData.satuan || 'Putra',
          tingkat: savedAdminData.tingkat || savedAdminData.tingkatan || 'Penegak Garuda',
          sangga: savedAdminData.sangga || 'Perintis',
          jabatan: savedAdminData.jabatan || 'Admin Utama Pettalopo',
          nomorKta: savedAdminData.nomorKta || '',
          foto: savedAdminData.foto || savedAdminData.fotoUrl || user.photoURL || '',
          tanggalLahir: savedAdminData.tanggalLahir || savedAdminData.ttl || '',
          ttl: savedAdminData.tanggalLahir || savedAdminData.ttl || '',
          createdAt: savedAdminData.createdAt || new Date().toISOString().slice(0, 10)
        };

        // Sinkronisasi data admin ke Firestore dilakukan secara background (non-blocking)
        // sehingga admin tidak pernah mengalami loading macet atau timeout.
        setDoc(ref, {
          ...adminAccount,
          googleAuth: true,
          onboardingSelesai: true,
          statusKeanggotaan: 'admin',
          updatedAt: Date.now()
        }, { merge: true }).catch((err) => {
          console.warn('[AUTH_FLOW] Penyimpanan data admin di latar belakang ditunda:', err);
        });

        // Langsung masuk seketika
        onComplete(adminAccount);
        return;
      }

      // 2. Baca dokumen profil users/{uid} untuk anggota
      let snap: any = null;
      try {
        snap = await withFirestoreTimeout(getDoc(ref), 5_000);
        console.info('[AUTH_FLOW] Portal: pembacaan profil selesai.', { profileExists: snap?.exists() });
      } catch (e: any) {
        console.warn('[AUTH_FLOW] Pembacaan profil online melebihi waktu tunggu, beralih ke form anggota baru:', e);
      }

      // Belum ada profil di Firestore atau koneksi lambat untuk akun baru: tampilkan pendaftaran
      if (!snap || !snap.exists()) {
        setNamaLengkap(user.displayName || '');
        setNeedsProfile(true);
        return;
      }

      const data = snap.data() as Record<string, any>;

      // Profil lama yang sudah memiliki nama dan tanggal lahir tetap dianggap selesai
      // meskipun belum memiliki penanda onboardingSelesai.
      const hasLegacyCompletedProfile = !!(data.nama || data.namaLengkap)
        && !!(data.tanggalLahir || data.ttl);
      const isProfileComplete = data?.onboardingSelesai === true || hasLegacyCompletedProfile;
      console.info('[AUTH_FLOW] Portal: status kelengkapan profil diperiksa.', {
        onboardingFlag: data?.onboardingSelesai === true,
        legacyProfileComplete: hasLegacyCompletedProfile,
        profileComplete: isProfileComplete
      });

      // Pengguna sudah pernah mendaftar dan menyelesaikan profil
      if (isProfileComplete) {
        const userAccount = {
          // Pertahankan seluruh kolom profil yang tersimpan
          ...data,
          uid: user.uid,
          username: data.username || user.email?.split('@')[0] || user.uid,
          email: user.email || '',
          nama: data.nama || data.namaLengkap || user.displayName || 'Anggota',
          role: data.role === 'dewan' || data.isDewan === true ? 'dewan' : 'anggota',
          isDewan: data.isDewan === true || data.role === 'dewan',
          dewanJabatan: data.dewanJabatan || '',
          gudep: data.gudep || '10-035',
          satuan: data.satuan || 'Putra',
          tingkat: data.tingkat || data.tingkatan || (data.status === 'purna_ambalan' ? 'Purna Ambalan' : 'Calon Penegak'),
          tingkatan: data.tingkatan || data.tingkat || '',
          sangga: data.sangga || 'Perintis',
          jabatan: data.jabatan || (data.status === 'purna_ambalan' ? 'Purna Ambalan' : 'Calon Penegak'),
          nomorKta: data.nomorKta || '',
          foto: data.foto || data.fotoUrl || user.photoURL || '',
          tanggalLahir: data.tanggalLahir || data.ttl || '',
          ttl: data.tanggalLahir || data.ttl || '',
          usia: data.usia ?? data.usiaTahun ?? computeScoutAge(data.tanggalLahir || data.ttl || '')?.years ?? 0,
          createdAt: data.createdAt || new Date().toISOString().slice(0, 10)
        } as UserAccount;

        // Sinkronisasi non-blocking direktori publik
        setDoc(doc(db, 'public_members', user.uid), {
          uid: user.uid,
          nama: userAccount.nama,
          namaLengkap: userAccount.nama,
          gudep: userAccount.gudep,
          satuan: userAccount.satuan,
          tingkat: userAccount.tingkat,
          sangga: userAccount.sangga,
          jabatan: userAccount.jabatan,
          foto: userAccount.foto,
          fotoUrl: userAccount.foto,
          role: userAccount.role,
          isDewan: userAccount.isDewan,
          dewanJabatan: userAccount.dewanJabatan,
          updatedAt: Date.now()
        }, { merge: true }).catch((err) => {
          console.warn('[GoogleAuth] Penulisan direktori anggota ditunda:', err);
        });

        onComplete(userAccount);
      } else {
        // Dokumen ada tapi belum selesai pendaftaran
        setNamaLengkap(data.namaLengkap || user.displayName || '');
        if (data.tanggalLahir) setTanggalLahir(data.tanggalLahir);
        setNeedsProfile(true);
      }
    } catch (e: any) {
      const code = String(e?.code || 'unknown');
      console.error('[GoogleAuth] Pemeriksaan profil Firestore gagal:', e);
      if (code === 'permission-denied') {
        setError('Akses ditolak (permission-denied). Periksa Firestore Rules.');
      } else if (code === 'unavailable') {
        setError('Layanan Firestore tidak dapat dijangkau. Periksa koneksi internet.');
      } else if (code === 'timeout') {
        setError('Koneksi Firestore melebihi batas waktu 10 detik. Silakan periksa jaringan internet dan tekan tombol Coba Lagi.');
      } else {
        setError('Gagal memeriksa profil: ' + (e?.message || code));
      }
    } finally {
      setLoading(false);
      if (processingUidRef.current === user.uid) {
        processingUidRef.current = null;
      }
    }
  };

  // Pulihkan sesi Google yang mungkin sudah selesai dipulihkan Firebase
  // sebelum portal login dibuka setelah splash screen.
  useEffect(() => {
    if (!open) return;

    const currentUser = auth.currentUser;
    const hasGoogleProvider = !!currentUser
      && !currentUser.isAnonymous
      && currentUser.providerData?.some((provider) => provider.providerId === 'google.com');

    if (hasGoogleProvider) {
      void finishLogin(currentUser);
    }
  }, [open]);

  const copyDomainToClipboard = () => {
    const domain = window.location.hostname;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(domain).then(() => {
        setDomainCopied(true);
        setTimeout(() => setDomainCopied(false), 3000);
      }).catch(() => {
        setDomainCopied(true);
        setTimeout(() => setDomainCopied(false), 3000);
      });
    } else {
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 3000);
    }
  };

  const handleWebPreviewLogin = async (asAdmin = true) => {
    setLoading(true);
    setLoadingText('Memulai sesi pratinjau web...');
    setError('');
    try {
      let currentAuthUser = auth.currentUser;
      if (!currentAuthUser) {
        try {
          const cred = await signInAnonymously(auth);
          currentAuthUser = cred.user;
        } catch (anonErr) {
          console.warn('[GoogleAuth] Sesi anonim Firebase gagal, melanjutkan mode simulasi lokal:', anonErr);
        }
      }
      const uid = currentAuthUser?.uid || 'preview_user_' + Date.now();

      if (asAdmin) {
        const adminAccount: UserAccount = {
          uid,
          username: 'miralifa19',
          email: ADMIN_EMAIL,
          nama: 'Admin Utama (Pratinjau Web)',
          role: 'admin',
          gudep: '10-035',
          satuan: 'Putra',
          tingkat: 'Penegak Garuda',
          sangga: 'Perintis',
          jabatan: 'Admin Utama Pettalopo',
          nomorKta: '',
          foto: '',
          createdAt: new Date().toISOString().slice(0, 10)
        };

        if (currentAuthUser) {
          try {
            await withFirestoreTimeout(setDoc(doc(db, 'users', uid), {
              ...adminAccount,
              googleAuth: true,
              onboardingSelesai: true,
              statusKeanggotaan: 'admin',
              updatedAt: Date.now()
            }, { merge: true }), 4000);
          } catch (e) {
            console.warn('[GoogleAuth] Penyimpanan profil pratinjau ditunda:', e);
          }
        }

        onComplete(adminAccount);
      } else {
        const dummyUser = currentAuthUser || { uid, email: 'calon.anggota@pettalopo.id', displayName: 'Anggota Pratinjau' };
        setFirebaseUser(dummyUser);
        setNamaLengkap('Anggota Pratinjau');
        setNeedsProfile(true);
      }
    } catch (err: any) {
      console.warn('[GoogleAuth] Gagal login pratinjau:', err);
      setError('Gagal masuk mode pratinjau. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoadingText('Membuka Google...');
    setError('');
    setIsUnauthorizedDomain(false);

    try {
      if (Capacitor.isNativePlatform()) {
        let result: any = null;
        let lastError: any = null;

        // Strategi 1: Coba Credential Manager (standar Android modern)
        try {
          console.info('[GoogleAuth] Mencoba Google Sign-In via Credential Manager...');
          result = await FirebaseAuthentication.signInWithGoogle({
            useCredentialManager: true
          });
        } catch (credErr: any) {
          lastError = credErr;
          console.warn('[GoogleAuth] Credential Manager tidak berhasil atau tidak didukung di perangkat ini:', credErr);
          
          // Strategi 2: Fallback otomatis ke GoogleSignInClient klasik (kompatibel semua versi Android)
          try {
            setLoadingText('Membuka pemilih akun Google...');
            console.info('[GoogleAuth] Mencoba fallback ke Google Play Services Sign-In klasik...');
            result = await FirebaseAuthentication.signInWithGoogle({
              useCredentialManager: false
            });
          } catch (legacyErr: any) {
            console.error('[GoogleAuth] Fallback Google Play Services Sign-In juga gagal:', legacyErr);
            throw legacyErr || credErr;
          }
        }

        const idToken = result?.credential?.idToken;
        if (!idToken) {
          throw new Error('Token identitas Google (idToken) tidak ditemukan dari login Android. Pastikan akun Google terhubung di perangkat.');
        }

        setLoadingText('Menghubungkan ke sesi Ambalan...');
        console.info('[GoogleAuth] Menukarkan idToken dengan sesi Firebase Web SDK...');
        const webCredential = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(auth, webCredential);

        // Panggil langsung finishLogin agar tidak terjadi macet/loading tanpa henti jika listener lambat
        if (userCred?.user) {
          await finishLogin(userCred.user);
        }
      } else {
        setLoadingText('Menghubungkan dengan Google...');
        const userCred = await signInWithPopup(auth, googleProvider);
        if (userCred?.user) {
          await finishLogin(userCred.user);
        }
      }
    } catch (e: any) {
      const code = String(e?.code || '');
      const msg = String(e?.message || '');
      const rawError = JSON.stringify(e || {});
      console.error('[GoogleAuth] Login Google gagal:', { code, msg, rawError, e });

      if (code === 'auth/popup-closed-by-user' || msg.includes('closed-by-user')) {
        setError('Jendela login Google ditutup sebelum proses selesai.');
      } else if (code === 'auth/cancelled-popup-request') {
        setError('Permintaan login Google dibatalkan.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        console.warn('[GoogleAuth] Domain web preview belum didaftarkan di Firebase Console:', window.location.hostname);
        setIsUnauthorizedDomain(true);
        setError(`Domain pratinjau web (${window.location.hostname}) belum didaftarkan di Firebase Console.`);
      } else if (code === '10' || msg.includes('10:') || msg.includes('DEVELOPER_ERROR') || rawError.includes(': 10:')) {
        setError('Developer Error (Kode 10): Sidik jari SHA-1 dari keystore rilis APK belum didaftarkan di Firebase Console untuk package "id.sch.smpialwasi_maros.ambalan". Buka Firebase Console > Project Settings > Android Apps dan daftarkan SHA-1.');
      } else if (code === '12501' || msg.includes('12501') || msg.includes('canceled') || msg.includes('cancelled') || code === '16' || msg.includes('16:')) {
        setError('Pemilihan akun Google dibatalkan oleh pengguna.');
      } else if (code === '12500' || msg.includes('12500')) {
        setError('Internal Error (Kode 12500): Google Play Services pada perangkat bermasalah. Pastikan Google Play Services sudah diperbarui.');
      } else if (msg.includes('NoCredentialException') || msg.includes('No credentials available')) {
        setError('Tidak ada akun Google yang terdaftar atau siap digunakan di Credential Manager. Silakan pilih akun Google aktif di perangkat.');
      } else {
        setError(msg || (code ? `Gagal login (kode: ${code})` : 'Login Google gagal. Pastikan koneksi internet tersedia dan coba lagi.'));
      }
      setLoading(false);
    }
  };

  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    if (!namaLengkap.trim()) {
      setError('Wajib memasukkan Nama Lengkap.');
      return;
    }

    if (!tanggalLahir) {
      setError('Wajib memilih Tanggal Lahir dari kalender.');
      return;
    }

    if (!sandiAmbalan.trim()) {
      setError('Wajib memasukkan Sandi Ambalan.');
      return;
    }

    setLoading(true);
    setLoadingText('Memverifikasi Sandi Ambalan...');
    setError('');

    try {
      // 1. Verifikasi Sandi Ambalan dari Firestore config/akses
      const isValidSandi = await verifySandiAmbalan(sandiAmbalan);
      if (!isValidSandi) {
        setError('Sandi belum tepat. Tanyakan kepada Dewan Ambalan ya, Kak.');
        setLoading(false);
        return;
      }

      setLoadingText('Menyimpan profil anggota...');
      const age = computeScoutAge(tanggalLahir);
      if (!age) {
        setError('Tanggal lahir tidak valid.');
        setLoading(false);
        return;
      }

      const profile = {
        uid: firebaseUser.uid,
        username: firebaseUser.email?.split('@')[0] || firebaseUser.uid,
        email: firebaseUser.email || '',
        nama: namaLengkap.trim(),
        namaLengkap: namaLengkap.trim(),
        tanggalLahir,
        ttl: tanggalLahir,
        usiaTahun: age.years,
        usia: age.years,
        status: age.status,
        statusKeanggotaan: age.status,
        tingkat: age.tingkat,
        jabatan: age.jabatan,
        role: 'anggota',
        isDewan: false,
        dewanJabatan: '',
        gudep: '10-035',
        satuan: 'Putra',
        sangga: 'Perintis',
        nomorKta: '',
        foto: firebaseUser.photoURL || '',
        fotoUrl: firebaseUser.photoURL || '',
        googleAuth: true,
        onboardingSelesai: true,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: Date.now()
      };

      // Simpan dokumen profil pribadi users/{uid}
      await withFirestoreTimeout(setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true }), 8_000);

      // Sinkronisasi non-blocking ke direktori publik public_members/{uid}
      withFirestoreTimeout(setDoc(doc(db, 'public_members', firebaseUser.uid), {
        uid: profile.uid,
        nama: profile.nama,
        namaLengkap: profile.namaLengkap,
        gudep: profile.gudep,
        satuan: profile.satuan,
        tingkat: profile.tingkat,
        sangga: profile.sangga,
        jabatan: profile.jabatan,
        foto: profile.foto,
        fotoUrl: profile.fotoUrl,
        role: profile.role,
        isDewan: profile.isDewan,
        dewanJabatan: profile.dewanJabatan,
        updatedAt: Date.now()
      }, { merge: true }), 8_000).catch((err) => {
        console.warn('[GoogleAuth] Penulisan direktori anggota ditunda:', err);
      });

      onComplete(profile as UserAccount);
    } catch (err: any) {
      console.error('[GoogleAuth] Gagal mendaftarkan profil:', err);
      setError('Gagal menyimpan profil: ' + (err?.message || 'Terjadi kesalahan jaringan.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await FirebaseAuthentication.signOut();
        } catch {}
      }
      await webSignOut(auth);
      setFirebaseUser(null);
      setNeedsProfile(false);
      setSandiAmbalan('');
      setError('');
      onLogout?.();
    } catch (e: any) {
      setError(e?.message || 'Gagal keluar dari akun Google.');
    }
  };

  const runDiagnosticTest = async () => {
    setDiagTesting(true);
    setDiagResult(null);
    const startTime = Date.now();
    try {
      const pingRef = doc(db, 'config', 'akses');
      await withFirestoreTimeout(getDoc(pingRef), 10_000);
      const latencyMs = Date.now() - startTime;
      setDiagResult({
        status: 'success',
        latencyMs,
        message: `Terhubung sukses ke Firestore pettalopo-6f6f4 dalam ${latencyMs} ms (database: (default)).`
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const code = err?.code || 'unknown';
      setDiagResult({
        status: 'error',
        latencyMs,
        code,
        message: err?.message || 'Gagal berkomunikasi dengan Firestore.'
      });
    } finally {
      setDiagTesting(false);
    }
  };

  if (!open) return null;

  const calculatedAge = computeScoutAge(tanggalLahir);

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white">
        {/* Header Ambalan Bersih */}
        <div className="bg-[#e51c24] text-white p-6 text-center">
          <img src={LOGO_IMAGE_PATH} alt="Logo Ambalan" className="w-16 h-16 object-contain mx-auto mb-2" />
          <h1 className="text-lg font-bold">Pettalopo Mobile</h1>
          <p className="text-[10px] text-red-100 whitespace-nowrap">Ambalan La Surullah Petta Lopo · Gugus Depan 10.035–10.036</p>
        </div>

        <div className="p-5 space-y-4">
          {needsProfile ? (
            /* ============================================================ */
            /* 2. LAYAR PENDAFTARAN ANGGOTA BARU                           */
            /* ============================================================ */
            <form onSubmit={handleRegisterProfile} className="space-y-4">
              <div className="text-center pb-2 border-b border-slate-100">
                <h2 className="font-bold text-sm text-slate-900">Pendaftaran Anggota Ambalan</h2>
                <p className="text-xs text-slate-500 mt-0.5">{firebaseUser?.email}</p>
              </div>

              {/* 1. Nama Lengkap (Wajib) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-[#e51c24]">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Masukkan nama lengkap asli"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] bg-slate-50 focus:bg-white"
                />
              </div>

              {/* 2. Tanggal Lahir (Wajib, Kalender) - Status Ditentukan Otomatis Tanpa Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Lahir <span className="text-[#e51c24]">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] bg-slate-50 focus:bg-white cursor-pointer"
                />

                {/* Banner Status Otomatis Berdasarkan Usia */}
                {calculatedAge ? (
                  <div className={`mt-2 p-2.5 rounded-xl border text-xs leading-relaxed ${
                    calculatedAge.is21OrOlder
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{calculatedAge.is21OrOlder ? '🎖️' : '⚜️'}</span>
                      <span>Usia: {calculatedAge.ageString}</span>
                    </div>
                    <div className="text-[11px] mt-0.5">
                      Status otomatis: <strong>{calculatedAge.statusLabel}</strong> {calculatedAge.is21OrOlder ? '(usia 21 tahun ke atas)' : '(usia di bawah 21 tahun)'}.
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih tanggal lahir dari kalender untuk menentukan status keanggotaan otomatis.
                  </p>
                )}
              </div>

              {/* 3. Sandi Ambalan (Wajib) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sandi Ambalan <span className="text-[#e51c24]">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={sandiAmbalan}
                  onChange={(e) => setSandiAmbalan(e.target.value)}
                  placeholder="Masukkan sandi ambalan"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#e51c24] bg-slate-50 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Tanyakan sandi kepada Dewan Ambalan ya, Kak.
                </p>
              </div>

              {/* Pesan Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-[#e51c24] flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Tombol Masuk ke Ambalan */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#e51c24] hover:bg-[#c9181f] text-white font-bold p-3 text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-colors"
              >
                {loading ? loadingText : 'Masuk ke Ambalan'}
              </button>

              {/* Tombol Kecil Keluar */}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer py-1"
              >
                Keluar
              </button>
            </form>
          ) : (
            /* ============================================================ */
            /* 1. HALAMAN LOGIN GOOGLE                                      */
            /* ============================================================ */
            <div className="space-y-4 text-center py-2">
              <div>
                <h2 className="font-bold text-base text-slate-900">Masuk dengan Akun Google</h2>
                <p className="text-xs text-slate-500 mt-1">Gunakan akun Google untuk mengakses Pettalopo Mobile.</p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 hover:border-slate-400 p-3 font-semibold text-xs text-slate-700 flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? loadingText : 'Masuk dengan Google'}</span>
              </button>

              {/* Tampilan Error dengan Tombol Coba Lagi */}
              {error && (
                <div className="space-y-2 text-left">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-[#e51c24] flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span className="leading-relaxed">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      if (auth.currentUser) {
                        void finishLogin(auth.currentUser);
                      } else {
                        void handleGoogleLogin();
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#e51c24] hover:bg-[#c9181f] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>🔄</span>
                    <span>Coba Lagi</span>
                  </button>
                </div>
              )}

              {firebaseUser && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full text-xs text-[#e51c24] font-semibold cursor-pointer hover:underline pt-1"
                >
                  Keluar dari akun Google ({firebaseUser.email})
                </button>
              )}

              {/* Tombol Diagnostik Koneksi Firestore */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDiagnostic((prev) => !prev)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <span>🔍</span>
                  <span>{showDiagnostic ? 'Sembunyikan Diagnostik Koneksi' : 'Diagnostik Koneksi Firestore'}</span>
                </button>

                {showDiagnostic && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[11px]">Status Server & Database</span>
                      <button
                        type="button"
                        onClick={runDiagnosticTest}
                        disabled={diagTesting}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-[10px] font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        {diagTesting ? 'Menguji...' : 'Uji Sekarang'}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p>• Proyek: <strong className="text-slate-800">pettalopo-6f6f4</strong></p>
                      <p>• Database: <strong className="text-slate-800">(default)</strong></p>
                      <p>• Platform: <strong className="text-slate-800">{Capacitor.isNativePlatform() ? 'Android APK' : 'Web Browser'}</strong></p>
                    </div>
                    {diagResult && (
                      <div className={`p-2 rounded-xl text-[11px] leading-relaxed ${
                        diagResult.status === 'success'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        <div className="font-bold flex items-center gap-1">
                          <span>{diagResult.status === 'success' ? '✅' : '❌'}</span>
                          <span>{diagResult.status === 'success' ? 'Koneksi Berhasil' : 'Koneksi Terkendala'}</span>
                          {diagResult.latencyMs !== undefined && (
                            <span className="text-[10px] font-normal text-slate-500">({diagResult.latencyMs} ms)</span>
                          )}
                        </div>
                        <p className="mt-0.5">{diagResult.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
