export interface MabigusOfficials {
  ketuaGudep: string;
  ketuaGudepJabatan?: string;
  nipKetuaGudep?: string;
  pembinaPutra: string;
  nipPembinaPutra?: string;
  pembinaPutri: string;
  nipPembinaPutri?: string;
  pembantuPembinaPutra: string;
  pembantuPembinaPutri: string;
}

export const DEFAULT_MABIGUS_OFFICIALS: MabigusOfficials = {
  ketuaGudep: 'Dr. H. Idrus, S. Pd., M. Pd',
  ketuaGudepJabatan: 'Kepala Sekolah / Ketua Mabigus',
  nipKetuaGudep: 'NIP. 19680512 199403 1 004',
  pembinaPutra: 'Jumalang, S. Pd',
  nipPembinaPutra: 'NIP. 19750810 200502 1 002',
  pembinaPutri: 'Jasmania, S. Pd',
  nipPembinaPutri: 'NIP. 19800415 200801 2 015',
  pembantuPembinaPutra: 'Safri',
  pembantuPembinaPutri: 'Ani'
};

const STORAGE_KEY_MABIGUS = 'pettalopo_mabigus_officials_v1';

export function getMabigusOfficials(): MabigusOfficials {
  if (typeof window === 'undefined') return DEFAULT_MABIGUS_OFFICIALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MABIGUS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_MABIGUS_OFFICIALS, ...parsed };
    }
  } catch {}
  return DEFAULT_MABIGUS_OFFICIALS;
}

export function saveMabigusOfficials(data: MabigusOfficials): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MABIGUS, JSON.stringify(data));
  } catch {}
}
