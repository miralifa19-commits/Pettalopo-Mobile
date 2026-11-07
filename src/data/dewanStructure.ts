import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserAccount } from '../types';

export interface Dewan8Position {
  id: string;
  jabatan: string;
  satuan: 'Putra' | 'Putri';
  memberUid?: string;
  memberName: string;
  sangga?: string;
}

export const DEFAULT_8_DEWAN: Dewan8Position[] = [
  { id: 'pradana_pa', jabatan: 'Pradana Putra', satuan: 'Putra', memberName: 'Belum ditetapkan' },
  { id: 'pradana_pi', jabatan: 'Pradana Putri', satuan: 'Putri', memberName: 'Belum ditetapkan' },
  { id: 'pemangku_adat_pa', jabatan: 'Pemangku Adat Putra', satuan: 'Putra', memberName: 'Belum ditetapkan' },
  { id: 'pemangku_adat_pi', jabatan: 'Pemangku Adat Putri', satuan: 'Putri', memberName: 'Belum ditetapkan' },
  { id: 'kerani_pa', jabatan: 'Kerani Putra', satuan: 'Putra', memberName: 'Belum ditetapkan' },
  { id: 'kerani_pi', jabatan: 'Kerani Putri', satuan: 'Putri', memberName: 'Belum ditetapkan' },
  { id: 'juru_uang_pa', jabatan: 'Juru Uang Putra', satuan: 'Putra', memberName: 'Belum ditetapkan' },
  { id: 'juru_uang_pi', jabatan: 'Juru Uang Putri', satuan: 'Putri', memberName: 'Belum ditetapkan' }
];

const STORAGE_KEY = 'pettalopo_8_dewan_kepengurusan_v1';
const CONFIG_REF = doc(db, 'config', 'dewan_kepengurusan');

function normalizePositions(value: unknown): Dewan8Position[] {
  if (!Array.isArray(value)) return DEFAULT_8_DEWAN;
  return DEFAULT_8_DEWAN.map((base) => {
    const saved = value.find((item: any) => item?.id === base.id);
    if (!saved) return base;
    return {
      ...base,
      memberUid: typeof saved.memberUid === 'string' ? saved.memberUid : undefined,
      memberName: typeof saved.memberName === 'string' && saved.memberName.trim()
        ? saved.memberName
        : 'Belum ditetapkan',
      sangga: typeof saved.sangga === 'string' ? saved.sangga : undefined
    };
  });
}

// Data delapan posisi dibagikan melalui Firestore agar seluruh perangkat memakai susunan yang sama.
export function subscribeTo8DewanPositions(callback: (positions: Dewan8Position[]) => void) {
  return onSnapshot(
    CONFIG_REF,
    (snapshot) => {
      const positions = snapshot.exists()
        ? normalizePositions(snapshot.data().positions)
        : DEFAULT_8_DEWAN;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch {}
      callback(positions);
    },
    () => {
      // Cache hanya menjadi cadangan saat jaringan/Firestore sedang tidak tersedia.
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        callback(cached ? normalizePositions(JSON.parse(cached)) : DEFAULT_8_DEWAN);
      } catch {
        callback(DEFAULT_8_DEWAN);
      }
    }
  );
}

export async function save8DewanPositions(positions: Dewan8Position[], updatedBy?: string): Promise<void> {
  const normalized = normalizePositions(positions);
  await setDoc(CONFIG_REF, {
    positions: normalized,
    updatedAt: Date.now(),
    updatedBy: updatedBy || ''
  }, { merge: true });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch {}
}

export function get8DewanPositions(): Dewan8Position[] {
  if (typeof window === 'undefined') return DEFAULT_8_DEWAN;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizePositions(JSON.parse(saved));
  } catch {}
  return DEFAULT_8_DEWAN;
}

export function isUserInDewan(user?: UserAccount, positions?: Dewan8Position[]): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'dewan' || user.isDewan === true) return true;
  const list = positions || get8DewanPositions();
  return Boolean(user.uid && list.some((position) => position.memberUid === user.uid));
}

export function getUserDewanJabatan(user?: UserAccount, positions?: Dewan8Position[]): string | null {
  if (!user) return null;
  const list = positions || get8DewanPositions();
  const found = user.uid ? list.find((position) => position.memberUid === user.uid) : undefined;
  return found?.jabatan || (user.role === 'admin' ? 'Pembina / Admin' : user.dewanJabatan || null);
}
