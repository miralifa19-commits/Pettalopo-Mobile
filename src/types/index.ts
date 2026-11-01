export type ActiveMenu = 
  | 'home'
  | 'dashboard'
  | 'profil_ambalan'
  | 'kegiatan_latihan'
  | 'sangga'
  | 'organisasi'
  | 'program_kerja'
  | 'sku_skk'
  | 'ruang_belajar'
  | 'quiz'
  | 'chat'
  | 'pengaturan'
  | 'latihan_rutin'
  | 'akun'
  | 'database';

export interface ChatListItem {
  id: string;
  name: string;
  userId?: string;
  userGudep?: string;
  userSangga?: string;
  addedAt: string;
  note?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderGudep?: string;
  senderSangga?: string;
  senderRole?: 'admin' | 'anggota';
  type: 'text' | 'list';
  text?: string;
  timestamp: string;
  createdAtNumber: number;
  listTitle?: string;
  listItems?: ChatListItem[];
  listClosed?: boolean;
}

export type BottomNavTab = 'dashboard' | 'program_kerja' | 'latihan_rutin' | 'akun';

export type ProgramKerjaStatus = 
  | 'Direncanakan' 
  | 'Berjalan' 
  | 'Terlaksana' 
  | 'Tidak Terlaksana' 
  | 'Selesai' 
  | 'Menunggu' 
  | 'Belum Terlaksana';

export interface ProgramKerjaItem {
  id: string;
  tipe: 'Kegiatan' | 'Latihan Rutin';
  nama: string;
  waktuPelaksanaan: string;
  bulan: string; // e.g. 'Juli', 'Agustus', 'September', 'Oktober', etc.
  bulanUrutan: number; // 1 to 12 (Juli = 1 ... Juni = 12)
  sasaran: string;
  anggaran?: string;
  penanggungJawab: string;
  status: ProgramKerjaStatus;
  deskripsi: string;
  tempat?: string;
  seragam?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface MateriBelajar {
  id: string;
  judul: string;
  kategori: string;
  tipeFormat: 'original' | 'ai_generated';
  pdfDataUrl?: string; // Data URL for uploaded PDF
  pdfFileName?: string;
  pdfFileSize?: string;
  jumlahHalaman?: number;
  totalKata?: number;
  estimasiMenitBaca?: number;
  isiMateriOriginal?: string;
  isiMateriAi?: string;
  ringkasan?: string;
  poinPenting: string[];
  tipsPramuka?: string[];
  tanggalDibuat: string;
  penulis: string;
}

export type UserRole = 'admin' | 'anggota';

export interface UserAccount {
  uid?: string;
  username: string; // Internal Ambalan username
  password?: string; // Internal Ambalan password (visible to Pembina/Admin in Database view)
  email?: string;
  nama: string;
  role: UserRole;
  gudep: '10-035' | '10-036';
  satuan: 'Putra' | 'Putri';
  tingkat: 'Tamu Ambalan' | 'Calon Bantara' | 'Penegak Bantara' | 'Penegak Laksana' | 'Penegak Garuda';
  sangga: 'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana';
  jabatan: string;
  nomorKta: string;
  foto?: string; // Avatar/profile picture data URL
  createdAt?: string;
}

export interface AttendanceSession {
  id: string;
  title: string;
  date: string;
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  openedBy: string;
  tipe: 'Latihan Rutin' | 'Kegiatan';
}

// Supporting & Reference Types
export type NavigationTab = 
  | 'home' 
  | 'sku' 
  | 'sandi' 
  | 'lontara' 
  | 'pionering' 
  | 'agenda' 
  | 'presensi' 
  | 'profil' 
  | 'logbook'
  | 'dasadarma';

export type SkuLevel = 'bantara' | 'laksana';

export interface SkuItem {
  id: number;
  code: string;
  level: SkuLevel;
  category: 'Spiritual / Agama' | 'Patriotisme & Kebangsaan' | 'Sosial & Kepribadian' | 'Keterampilan & Teknologi' | 'Jasmani & Lingkungan';
  title: string;
  description: string;
  guide: string;
  completed: boolean;
  completedDate?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface SkkItem {
  id: string;
  name: string;
  category: 'Agama & Mental' | 'Patriotisme & Seni' | 'Keterampilan' | 'Ketangkasan & Kesehatan' | 'Sosial & Kemanusiaan';
  level: 'Purwa' | 'Madya' | 'Utama';
  icon: string;
  description: string;
  completed: boolean;
}

export interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: 'Latihan Rutin' | 'Perkemahan' | 'Ujian SKU' | 'Bakti Masyarakat' | 'Rapat Dewan';
  description: string;
  uniform: 'Seragam Pramuka Lengkap' | 'Kaos Lapangan Ambalan' | 'Bebas Rapi';
  completed?: boolean;
}

export interface AttendanceRecord {
  id: string;
  sessionId?: string;
  userId?: string;
  date: string;
  sangga: 'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana';
  gudep: '10-035' | '10-036';
  memberName: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  notes?: string;
  timestamp?: string;
  submittedBy?: 'self' | 'admin';
}

export interface LogbookEntry {
  id: string;
  date: string;
  title: string;
  category: string;
  content: string;
  author: string;
  sangga: string;
  rating?: number;
}

export interface UserProfile {
  name: string;
  gender: 'putra' | 'putri';
  gudep: '10-035' | '10-036';
  sangga: 'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana';
  level: 'Tamu Ambalan' | 'Calon Bantara' | 'Penegak Bantara' | 'Penegak Laksana' | 'Penegak Garuda';
  jabatan: string;
  ktaNumber: string;
  joinYear: string;
}

