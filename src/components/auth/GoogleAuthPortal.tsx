import React, { useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { onAuthStateChanged, signInWithPopup, signOut as webSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/config';
import { UserAccount } from '../../types';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';

type GooglePortalProps = {
  open: boolean;
  onComplete: (user: UserAccount) => void;
  onSkip: () => void;
  onLogout?: () => void;
};

type MemberKind = 'anggota' | 'purna';
const ADMIN_EMAIL = 'miralifa19@gmail.com';
const LEVELS = ['Calon Penegak', 'Penegak Bantara', 'Penegak Laksana', 'Penegak Garuda'] as const;

export const GoogleAuthPortal: React.FC<GooglePortalProps> = ({ open, onComplete, onSkip, onLogout }) => {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [kind, setKind] = useState<MemberKind>('anggota');
  const [nama, setNama] = useState('');
  const [ttl, setTtl] = useState('');
  const [alamat, setAlamat] = useState('');
  const [angkatan, setAngkatan] = useState('');
  const [wa, setWa] = useState('');
  const [tingkat, setTingkat] = useState<(typeof LEVELS)[number]>('Calon Penegak');
  const [motto, setMotto] = useState('');
  const [photo, setPhoto] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) setNama((current) => current || user.displayName || '');
    });
    return unsubscribe;
  }, []);

  const isAdmin = firebaseUser?.email?.toLowerCase() === ADMIN_EMAIL;
  const avatar = photo || firebaseUser?.photoURL || '';

  const finishLogin = async (user: any) => {
    setFirebaseUser(user);
    setError('');
    setLoading(true);
    try {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : null;
      if (user.email?.toLowerCase() === ADMIN_EMAIL) {
        const admin: UserAccount = {
          uid: user.uid, username: user.email.split('@')[0], email: user.email,
          nama: user.displayName || 'Admin Utama', role: 'admin', gudep: '10-035',
          satuan: 'Putra', tingkat: 'Penegak Garuda', sangga: 'Perintis',
          jabatan: 'Admin Utama Pettalopo', nomorKta: '', foto: user.photoURL || '',
          createdAt: new Date().toISOString().slice(0, 10)
        };
        await setDoc(ref, { ...admin, googleAuth: true, onboardingSelesai: true, statusKeanggotaan: 'admin', updatedAt: Date.now() }, { merge: true });
        onComplete(admin);
        return;
      }
      if (data?.onboardingSelesai && data?.googleAuth) {
        const saved: UserAccount = {
          uid: user.uid, username: data.username || user.email?.split('@')[0] || user.uid,
          email: user.email || '', nama: data.nama || user.displayName || 'Anggota',
          role: data.role === 'dewan' ? 'dewan' : 'anggota',
          gudep: data.gudep || '10-035', satuan: data.satuan || 'Putra',
          tingkat: data.tingkat || 'Calon Bantara', sangga: data.sangga || 'Perintis',
          jabatan: data.jabatan || 'Anggota Ambalan', nomorKta: data.nomorKta || '',
          foto: data.foto || user.photoURL || '', ttl: data.ttl || '',
          motto: data.motto || '', createdAt: data.createdAt || new Date().toISOString().slice(0, 10)
        };
        onComplete(saved);
      } else {
        setNama(user.displayName || '');
        setPhoto(user.photoURL || '');
        setNeedsProfile(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Gagal memeriksa profil akun. Periksa koneksi dan izin Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        const user = result.user;
        if (!user?.uid) throw new Error('Google tidak mengembalikan identitas akun.');
        await finishLogin(user);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        await finishLogin(result.user);
      }
    } catch (e: any) {
      setError(e?.message || 'Login Google gagal. Pastikan penyedia Google sudah aktif di Firebase.');
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

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firebaseUser) return;
    if (!nama.trim() || !ttl.trim() || !alamat.trim() || !angkatan.trim() || !wa.trim()) {
      setError('Lengkapi nama, tempat/tanggal lahir, alamat, angkatan, dan nomor WhatsApp.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const role = 'anggota';
      const profile = {
        uid: firebaseUser.uid, username: firebaseUser.email?.split('@')[0] || firebaseUser.uid,
        email: firebaseUser.email || '', nama: nama.trim(), namaLengkap: nama.trim(),
        role, statusKeanggotaan: kind === 'purna' ? 'purna_ambalan' : 'anggota_ambalan',
        status: kind === 'purna' ? 'purna_ambalan' : 'anggota_ambalan',
        ttl: ttl.trim(), alamat: alamat.trim(), angkatan: angkatan.trim(),
        nomorWhatsApp: wa.replace(/[^0-9+]/g, ''), tingkat: kind === 'anggota' ? tingkat : '',
        motto: kind === 'anggota' ? motto.trim() : '',
        foto: avatar, fotoUrl: avatar, googleAuth: true, onboardingSelesai: true,
        gudep: '10-035', satuan: 'Putra', sangga: 'Perintis',
        jabatan: kind === 'purna' ? 'Purna Ambalan' : 'Anggota Ambalan',
        nomorKta: '', createdAt: new Date().toISOString().slice(0, 10), updatedAt: Date.now()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true });
      onComplete(profile as UserAccount);
    } catch (e: any) {
      setError(e?.message || 'Profil gagal disimpan. Periksa aturan akses Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut();
      else await webSignOut(auth);
      setFirebaseUser(null);
      setNeedsProfile(false);
      onLogout?.();
    } catch (e: any) {
      setError(e?.message || 'Tidak dapat keluar dari akun Google.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-white">
        <div className="bg-gradient-to-br from-[#e51c24] to-[#a90d15] text-white p-6 text-center">
          <img src={LOGO_IMAGE_PATH} alt="Logo Ambalan" className="w-20 h-20 object-contain mx-auto mb-3" />
          <h1 className="text-xl font-black">Petta Lopo Mobile</h1>
          <p className="text-xs text-amber-100 mt-1">Sistem Akun Ambalan La Surullah Petta Lopo</p>
        </div>
        <div className="p-5 space-y-4">
          {needsProfile ? (
            <form onSubmit={saveProfile} className="space-y-3">
              <div className="text-center">
                <h2 className="font-black text-slate-900">Lengkapi Profil Ambalan</h2>
                <p className="text-xs text-slate-500 mt-1">{firebaseUser?.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setKind('anggota')} className={`rounded-xl p-3 text-xs font-bold border ${kind === 'anggota' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200'}`}>Anggota Ambalan</button>
                <button type="button" onClick={() => setKind('purna')} className={`rounded-xl p-3 text-xs font-bold border ${kind === 'purna' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200'}`}>Purna Ambalan</button>
              </div>
              <input required value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama Lengkap" className="w-full rounded-xl border p-3 text-sm" />
              <input required value={ttl} onChange={e => setTtl(e.target.value)} placeholder="Tempat, Tanggal Lahir" className="w-full rounded-xl border p-3 text-sm" />
              <textarea required value={alamat} onChange={e => setAlamat(e.target.value)} placeholder="Alamat lengkap" className="w-full rounded-xl border p-3 text-sm" rows={2} />
              <input required value={angkatan} onChange={e => setAngkatan(e.target.value)} placeholder="Angkatan" className="w-full rounded-xl border p-3 text-sm" />
              <input required value={wa} onChange={e => setWa(e.target.value)} placeholder="Nomor WhatsApp (contoh 62812...)" inputMode="tel" className="w-full rounded-xl border p-3 text-sm" />
              {kind === 'anggota' && <>
                <select value={tingkat} onChange={e => setTingkat(e.target.value as any)} className="w-full rounded-xl border p-3 text-sm">
                  {LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
                <textarea value={motto} onChange={e => setMotto(e.target.value)} placeholder="Motto (opsional)" className="w-full rounded-xl border p-3 text-sm" rows={2} />
              </>}
              <div className="flex items-center gap-3">
                <img src={avatar || LOGO_IMAGE_PATH} alt="Foto profil" className="w-14 h-14 rounded-full object-cover border" />
                <label className="text-xs font-bold text-red-700">Unggah Foto Profil
                  <input type="file" accept="image/*" className="block mt-1 text-[10px] w-full" onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) { try { setPhoto(await compressPhoto(file)); } catch (err: any) { setError(err.message); } }
                  }} />
                </label>
              </div>
              <button disabled={loading} className="w-full rounded-xl bg-[#e51c24] text-white font-black p-3 text-sm disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan Profil & Masuk'}</button>
            </form>
          ) : (
            <div className="space-y-3 text-center">
              <h2 className="font-black text-slate-900">Masuk dengan Akun Google</h2>
              <p className="text-xs text-slate-500">Gunakan akun Google untuk mengakses Pettalopo Mobile.</p>
              <button onClick={handleGoogle} disabled={loading} className="w-full rounded-xl border border-slate-300 p-3 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                <span className="font-black text-lg">G</span>{loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
              </button>
              {firebaseUser && <button onClick={logout} className="w-full text-xs text-red-700 font-bold">Keluar dari akun Google</button>}
              <button onClick={onSkip} className="w-full text-xs text-slate-500 underline">Lanjutkan dengan login lama untuk sementara</button>
            </div>
          )}
          {error && <p className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
};
