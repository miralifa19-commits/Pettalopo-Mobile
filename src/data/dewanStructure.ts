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
  { id: 'pradana_pa', jabatan: 'Pradana Putra', satuan: 'Putra', memberName: 'Amiruddin S.', sangga: 'Perintis' },
  { id: 'pradana_pi', jabatan: 'Pradana Putri', satuan: 'Putri', memberName: 'Nurhaliza Azzahra', sangga: 'Penegas' },
  { id: 'pemangku_adat_pa', jabatan: 'Pemangku Adat Putra', satuan: 'Putra', memberName: 'Muh. Ikhsan Pratama', sangga: 'Pendobrak' },
  { id: 'pemangku_adat_pi', jabatan: 'Pemangku Adat Putri', satuan: 'Putri', memberName: 'Andi Tenri Sumpala', sangga: 'Pencoba' },
  { id: 'kerani_pa', jabatan: 'Kerani Putra', satuan: 'Putra', memberName: 'Fajar Nugraha', sangga: 'Perintis' },
  { id: 'kerani_pi', jabatan: 'Kerani Putri', satuan: 'Putri', memberName: 'Siti Rahmawati', sangga: 'Pelaksana' },
  { id: 'juru_uang_pa', jabatan: 'Juru Uang Putra', satuan: 'Putra', memberName: 'Ahmad Fauzan', sangga: 'Penegas' },
  { id: 'juru_uang_pi', jabatan: 'Juru Uang Putri', satuan: 'Putri', memberName: 'Riska Indah Sari', sangga: 'Pendobrak' }
];

const STORAGE_KEY = 'pettalopo_8_dewan_kepengurusan_v1';

export function get8DewanPositions(): Dewan8Position[] {
  if (typeof window === 'undefined') return DEFAULT_8_DEWAN;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 8) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_8_DEWAN;
}

export function save8DewanPositions(positions: Dewan8Position[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}

export function isUserInDewan(user?: UserAccount, positions?: Dewan8Position[]): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'dewan') return true;
  const list = positions || get8DewanPositions();
  const userName = (user.nama || '').trim().toLowerCase();
  const userUid = user.uid;

  return list.some(p => {
    if (userUid && p.memberUid === userUid) return true;
    if (userName && p.memberName.trim().toLowerCase() === userName) return true;
    return false;
  });
}

export function getUserDewanJabatan(user?: UserAccount, positions?: Dewan8Position[]): string | null {
  if (!user) return null;
  const list = positions || get8DewanPositions();
  const userName = (user.nama || '').trim().toLowerCase();
  const userUid = user.uid;

  const found = list.find(p => {
    if (userUid && p.memberUid === userUid) return true;
    if (userName && p.memberName.trim().toLowerCase() === userName) return true;
    return false;
  });

  return found ? found.jabatan : (user.role === 'admin' ? 'Pembina / Admin' : null);
}
