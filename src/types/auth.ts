export type UserStatus = 'anggota_ambalan' | 'purna_ambalan';

export type UserPeran = 'anggota' | 'dewan' | 'admin';

export interface UserProfile {
  uid: string;
  namaLengkap: string;
  status: UserStatus;
  peran: UserPeran;
  email: string;
  fotoUrl?: string;
  onboardingSelesai: boolean;
  nonaktif?: boolean;
  createdAt: number | string;
  updatedAt?: number | string;
}

export interface AdminEmailRecord {
  id?: string;
  email: string;
  addedBy?: string;
  createdAt?: number | string;
}

export interface SandiAksesConfig {
  sandi: string;
  updatedAt?: number | string;
  updatedBy?: string;
}
