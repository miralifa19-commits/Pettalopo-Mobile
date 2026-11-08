import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Save, Pencil, X } from 'lucide-react';
import { db, auth } from '../../firebase/config';

interface AmbalanProfileData {
  namaAmbalan: string;
  gudepPutra: string;
  gudepPutri: string;
  sejarah: string;
  visi: string;
  misi: string;
  semboyan: string;
  pradana: string;
  pemangkuAdat: string;
  sekretaris: string;
  bendahara: string;
  pembina: string;
  kontak: string;
}

const EMPTY_PROFILE: AmbalanProfileData = {
  namaAmbalan: 'Ambalan La Surullah Petta Lopo',
  gudepPutra: '10-035',
  gudepPutri: '10-036',
  sejarah: '', visi: '', misi: '', semboyan: '',
  pradana: '', pemangkuAdat: '', sekretaris: '', bendahara: '',
  pembina: '', kontak: ''
};

const profileRef = doc(db, 'ambalan_profile', 'utama');

export const ProfilAmbalanFirestoreSection: React.FC<{
  isAdmin: boolean;
  onIdentityChange?: (identity: Pick<AmbalanProfileData, 'namaAmbalan' | 'gudepPutra' | 'gudepPutri'>) => void;
}> = ({ isAdmin, onIdentityChange }) => {
  const [profile, setProfile] = useState<AmbalanProfileData>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<AmbalanProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canEdit = isAdmin && auth.currentUser?.emailVerified === true && auth.currentUser?.email?.toLowerCase() === 'miralifa19@gmail.com';

  useEffect(() => onSnapshot(profileRef, (snapshot) => {
    const data = snapshot.exists()
      ? { ...EMPTY_PROFILE, ...(snapshot.data() as Partial<AmbalanProfileData>) }
      : EMPTY_PROFILE;
    setProfile(data);
    setDraft(data);
    onIdentityChange?.({
      namaAmbalan: data.namaAmbalan,
      gudepPutra: data.gudepPutra,
      gudepPutri: data.gudepPutri
    });
    setLoading(false);
  }, (reason) => {
    console.error('Profil Ambalan Firestore read failed:', reason);
    setError('Data profil belum dapat dimuat. Periksa koneksi dan izin baca Firestore.');
    setLoading(false);
  }), [onIdentityChange]);

  const change = (key: keyof AmbalanProfileData, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!canEdit || !auth.currentUser) {
      setError('Sesi admin diperlukan untuk menyimpan perubahan.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setDoc(profileRef, {
        ...draft,
        updatedAt: Date.now(),
        updatedBy: auth.currentUser.uid
      }, { merge: true });
      setEditing(false);
    } catch (reason) {
      console.error('Profil Ambalan Firestore write failed:', reason);
      setError('Gagal menyimpan. Pastikan aturan Firestore mengizinkan admin mengubah ambalan_profile/utama.');
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof AmbalanProfileData; label: string; multiline?: boolean }[] = [
    { key: 'namaAmbalan', label: 'Nama Ambalan' },
    { key: 'gudepPutra', label: 'Nomor Gudep Putra' },
    { key: 'gudepPutri', label: 'Nomor Gudep Putri' },
    { key: 'sejarah', label: 'Sejarah', multiline: true },
    { key: 'visi', label: 'Visi', multiline: true },
    { key: 'misi', label: 'Misi', multiline: true },
    { key: 'semboyan', label: 'Semboyan', multiline: true },
    { key: 'pradana', label: 'Pradana' },
    { key: 'pemangkuAdat', label: 'Pemangku Adat' },
    { key: 'sekretaris', label: 'Sekretaris' },
    { key: 'bendahara', label: 'Bendahara' },
    { key: 'pembina', label: 'Pembina' },
    { key: 'kontak', label: 'Kontak' }
  ];

  const group = (heading: string, rows: [string, string][]) => (
    <section className="rounded-2xl border border-slate-200 bg-white p-4" key={heading}>
      <h3 className="mb-3 text-sm font-extrabold text-slate-900">{heading}</h3>
      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{value.trim() || 'Belum diisi'}</p>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Profil dan Kepengurusan</h3>
          <p className="text-[11px] text-slate-500">Informasi yang dikelola melalui Firestore</p>
        </div>
        {canEdit && !editing && (
          <button type="button" onClick={() => { setDraft(profile); setEditing(true); }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#C41E2A] px-3 text-xs font-bold text-white">
            <Pencil size={14} /> Ubah Profil Ambalan
          </button>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      {loading ? (
        <p role="status" className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Memuat data profil...</p>
      ) : editing ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          {fields.map(({ key, label, multiline }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
              {multiline ? (
                <textarea rows={3} value={draft[key]} onChange={(event) => change(key, event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800" />
              ) : (
                <input value={draft[key]} onChange={(event) => change(key, event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800" />
              )}
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setDraft(profile); setEditing(false); }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
              <X size={16} /> Batal
            </button>
            <button type="button" onClick={save} disabled={saving}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#C41E2A] px-3 text-sm font-bold text-white disabled:opacity-60">
              <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </section>
      ) : (
        <>
          {group('Tentang Kami', [['Sejarah', profile.sejarah], ['Visi', profile.visi], ['Misi', profile.misi], ['Semboyan', profile.semboyan]])}
          {group('Susunan Dewan Ambalan', [['Pradana', profile.pradana], ['Pemangku Adat', profile.pemangkuAdat], ['Sekretaris', profile.sekretaris], ['Bendahara', profile.bendahara]])}
          {group('Pembina dan Kontak', [['Pembina', profile.pembina], ['Kontak', profile.kontak]])}
        </>
      )}
    </div>
  );
};
