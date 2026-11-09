import React, { useEffect, useState } from 'react';
import { UserAccount } from '../../types';
import { ShiningAmbalanLogo } from '../common/ShiningAmbalanLogo';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { auth, db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

interface AkunViewProps {
  user: UserAccount;
  onUpdateUser?: (updated: UserAccount) => void;
  onNavigateToDatabase?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onBack?: () => void;
  editable?: boolean;
}

export function formatBirthDate(birthStr?: string): string {
  if (!birthStr) return '-';
  const d = new Date(birthStr.includes('T') ? birthStr : `${birthStr}T00:00:00`);
  if (isNaN(d.getTime())) return birthStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function getScoutMemberStatus(user?: UserAccount | null): string {
  if (!user) return 'Calon Anggota';
  if (user.role === 'admin' || user.email?.toLowerCase() === 'miralifa19@gmail.com') {
    return 'Pembina / Admin';
  }
  const birthStr = (user as any).tanggalLahir || user.ttl;
  let years = user.usia ?? (user as any).usiaTahun;
  if (birthStr) {
    const birth = new Date(`${birthStr}T00:00:00`);
    if (!isNaN(birth.getTime())) {
      const now = new Date();
      years = now.getFullYear() - birth.getFullYear();
      const beforeBirthday = now.getMonth() < birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
      if (beforeBirthday) years--;
    }
  }
  if (typeof years === 'number') {
    return years >= 21 ? 'Purna Ambalan' : 'Calon Anggota';
  }
  return 'Calon Anggota';
}

export const AkunView: React.FC<AkunViewProps> = ({ 
  user, 
  onUpdateUser,
  onLogout,
  onBack,
  editable = false
}) => {
  const photoUrl = user.foto ||
    (user as any).fotoUrl ||
    (user as any).photoURL ||
    (user as any).photo ||
    (user as any).avatarUrl ||
    auth.currentUser?.photoURL ||
    '';

  const birthDateFormatted = formatBirthDate((user as any).tanggalLahir || user.ttl);
  const [form, setForm] = useState<any>({ ...user });
  const [photoPreview, setPhotoPreview] = useState<string>(photoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => { setForm({ ...user }); setPhotoPreview(photoUrl || ''); }, [user.uid]);

  const updateField = (key: string, value: string) => setForm((current: any) => ({ ...current, [key]: value }));
  const handlePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 640 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        setPhotoPreview(dataUrl);
        setForm((current: any) => ({ ...current, foto: dataUrl }));
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };
  const handleSave = async () => {
    if (!onUpdateUser || !editable) return;
    const signedInUser = auth.currentUser;
    if (!signedInUser || signedInUser.uid !== user.uid) {
      setSaveError('Sesi akun tidak valid. Silakan masuk kembali sebelum menyimpan profil.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const birth = form.tanggalLahir ? new Date(form.tanggalLahir + 'T00:00:00') : null;
      let usia = form.usia;
      if (birth && !Number.isNaN(birth.getTime())) {
        const now = new Date();
        usia = now.getFullYear() - birth.getFullYear();
        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) usia--;
      }

      const updatedUser = {
        ...user,
        ...form,
        tanggalLahir: form.tanggalLahir || '',
        ttl: form.tanggalLahir || form.ttl || '',
        foto: form.foto || photoUrl || '',
        usia,
        uid: signedInUser.uid
      };
      const updatedAt = Date.now();
      const publicProfile = {
        uid: signedInUser.uid,
        nama: updatedUser.nama || '',
        namaLengkap: updatedUser.nama || '',
        gudep: updatedUser.gudep || '',
        satuan: updatedUser.satuan || '',
        tingkat: updatedUser.tingkat || updatedUser.tingkatan || '',
        tingkatan: updatedUser.tingkatan || updatedUser.tingkat || '',
        sangga: updatedUser.sangga || '',
        jabatan: updatedUser.jabatan || '',
        foto: updatedUser.foto || '',
        fotoUrl: updatedUser.foto || '',
        role: updatedUser.role || 'anggota',
        isDewan: updatedUser.isDewan === true,
        dewanJabatan: updatedUser.dewanJabatan || '',
        updatedAt
      };

      await setDoc(doc(db, 'users', signedInUser.uid), { ...updatedUser, updatedAt }, { merge: true });
      await setDoc(doc(db, 'public_members', signedInUser.uid), publicProfile, { merge: true });
      onUpdateUser(updatedUser);
      setForm(updatedUser);
      setPhotoPreview(updatedUser.foto);
      setSaveSuccess('Perubahan profil berhasil disimpan.');
    } catch (error: any) {
      console.error('[AkunView] Gagal menyimpan profil:', error);
      setSaveError('Profil belum berhasil disimpan. Periksa koneksi internet dan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 font-sans">
      <MenuHeaderCard
        title={editable ? "Akun Saya" : "Profil Saya"}
        subtitle={editable ? "Kelola informasi akun Pettalopo" : "Informasi profil pengguna Pettalopo"}
        onBack={onBack || (() => {})}
      />

      <section className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
        <div className="flex flex-col items-center">
          <label className={`relative mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-slate-50 shadow-sm sm:h-36 sm:w-36 ${editable ? 'cursor-pointer' : ''}`}>
            {photoPreview ? <img src={photoPreview} alt="Foto profil" className="h-full w-full object-cover" /> : <ShiningAmbalanLogo className="h-20 w-20" alt="Logo Ambalan" />}
            {editable && <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[10px] text-white">Ganti Foto</span>}
            {editable && <input type="file" accept="image/*" className="sr-only" onChange={(event) => handlePhoto(event.target.files?.[0])} aria-label="Ganti foto profil" />}
          </label>
          <h1 className="mb-1 text-center text-xl font-black tracking-tight text-slate-900">{form.nama || 'Nama Lengkap'}</h1>
          <p className="mb-5 break-all text-center text-xs text-slate-500">{user.email || auth.currentUser?.email || 'Email belum tersedia'}</p>
        </div>

        {editable ? (
          <div className="w-full space-y-3 text-left">
            <h2 className="text-sm font-extrabold text-slate-900">Informasi Profil</h2>
            {[
              { key: 'nama', label: 'Nama Lengkap', type: 'text' },
              { key: 'namaPanggilan', label: 'Nama Panggilan', type: 'text' },
              { key: 'tingkatan', label: 'Tingkatan', type: 'select' },
              { key: 'tempatLahir', label: 'Tempat Lahir', type: 'text' },
              { key: 'tanggalLahir', label: 'Tanggal Lahir', type: 'date' },
              { key: 'nomorWA', label: 'Nomor WhatsApp', type: 'tel' },
              { key: 'alamat', label: 'Alamat', type: 'textarea' },
              { key: 'motto', label: 'Motto', type: 'text' },
            ].map((field) => (
              <label key={field.key} className="block border-b border-slate-100 pb-3 last:border-0">
                <span className="mb-1 block text-xs font-bold text-slate-600">{field.label}</span>
                {field.type === 'select' ? (
                  <select value={form.tingkatan || 'Calon Penegak'} onChange={(event) => updateField(field.key, event.target.value)}
                    className="w-full select-text rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
                    {['Calon Penegak', 'Penegak Bantara', 'Penegak Laksana', 'Penegak Garuda', 'Purna'].map((level) => <option key={level}>{level}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea rows={2} value={form[field.key] || ''} onChange={(event) => updateField(field.key, event.target.value)}
                    className="w-full select-text resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800" />
                ) : (
                  <input type={field.type} value={form[field.key] || ''} onChange={(event) => updateField(field.key, event.target.value)}
                    className="w-full select-text rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800" />
                )}
              </label>
            ))}
            <div className="border-b border-slate-100 pb-3">
              <span className="block text-xs font-bold text-slate-600">Usia</span>
              <strong className="text-sm text-slate-900">{(() => { const d = form.tanggalLahir ? new Date(form.tanggalLahir + 'T00:00:00') : null; if (!d || Number.isNaN(d.getTime())) return form.usia ? form.usia + ' tahun' : '-'; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a + ' tahun'; })()}</strong>
            </div>
            {form.nomorWA && <a href={`https://wa.me/${String(form.nomorWA).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-block text-sm font-semibold text-emerald-700 underline">Buka WhatsApp</a>}
          </div>
        ) : (
          <div className="w-full divide-y divide-slate-100 text-left">
            {[
              { label: 'Nama Lengkap', value: user.nama },
              { label: 'Nama Panggilan', value: (user as any).namaPanggilan },
              { label: 'Tingkatan', value: (user as any).tingkatan || user.tingkat },
              { label: 'Tempat Lahir', value: (user as any).tempatLahir },
              { label: 'Tanggal Lahir', value: birthDateFormatted },
              { label: 'Nomor WhatsApp', value: (user as any).nomorWA },
              { label: 'Alamat', value: (user as any).alamat },
              { label: 'Motto', value: (user as any).motto },
              { label: 'Usia', value: typeof user.usia === 'number' ? `${user.usia} tahun` : '-' }
            ].map((field) => (
              <div key={field.label} className="py-3 first:pt-0 last:pb-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{field.label}</span>
                <strong className="break-words text-sm text-slate-800">{field.value || '-'}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {editable && (
        <div className="space-y-2">
          {saveError && <p role="alert" className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{saveError}</p>}
          {saveSuccess && <p role="status" className="w-full rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700">{saveSuccess}</p>}
          <button type="button" onClick={handleSave} disabled={isSaving || !onUpdateUser}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e51c24] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            {isSaving && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isSaving ? 'Menyimpan perubahan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}

      {onLogout && (
        <div className="flex justify-center pt-1">
          <button type="button" onClick={onLogout}
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-[#e51c24] shadow-xs transition-all hover:bg-red-100 active:bg-red-200">
            <span>🚪</span><span>Keluar dari Akun</span>
          </button>
        </div>
      )}
    </div>
  );
};
