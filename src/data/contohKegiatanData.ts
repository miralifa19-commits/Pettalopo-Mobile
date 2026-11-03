import { ProgramKerjaItem } from '../types';

export interface ContohKegiatanTemplate {
  id: string;
  nama: string;
  tipe: 'Kegiatan' | 'Latihan Rutin';
  bulan: string;
  bulanUrutan: number;
  waktuPelaksanaan: string;
  sasaran: string;
  anggaran: string;
  tempat: string;
  seragam: string;
  penanggungJawab: string;
  deskripsi: string;
  kategoriLabel: string;
}

export const BANK_CONTOH_KEGIATAN: ContohKegiatanTemplate[] = [
  {
    id: 'tpl_persami',
    nama: 'Perkemahan Sabtu Minggu (Persami) Calon Penegak',
    tipe: 'Kegiatan',
    bulan: 'September',
    bulanUrutan: 3,
    waktuPelaksanaan: 'Sabtu - Minggu, 12 - 13 September 2026',
    sasaran: 'Seluruh Penegak Calon Bantara & Tamu Ambalan',
    anggaran: 'Rp 1.500.000',
    tempat: 'Bumi Perkemahan Pangkalan / Lapangan Terbuka',
    seragam: 'Seragam Pramuka Lengkap & Kaos Lapangan',
    penanggungJawab: 'Pradana & Sangga Kerja Persami',
    deskripsi: 'Praktek pendirian tenda sangga, memasak darurat di alam bebas (survival cooking), api unggun keakraban, dan pemantapan adat ambalan.',
    kategoriLabel: '🏕️ Perkemahan & Lapangan'
  },
  {
    id: 'tpl_lkbb_tongkat',
    nama: 'Lomba Ketangkasan Baris Berbaris (LKBB) Tongkat',
    tipe: 'Kegiatan',
    bulan: 'November',
    bulanUrutan: 5,
    waktuPelaksanaan: 'Sabtu, 14 November 2026',
    sasaran: 'Seluruh Sangga (Perintis, Penegas, Pendobrak, Pencoba, Pelaksana)',
    anggaran: 'Rp 750.000',
    tempat: 'Lapangan Utama Pangkalan',
    seragam: 'Seragam Pramuka Lengkap Atribut Upacara',
    penanggungJawab: 'Pinsang & Bidang Giat-Ops',
    deskripsi: 'Kompetisi keterampilan baris berbaris menggunakan tongkat pramuka resmi, variasi formasi lapangan, dan penanaman disiplin kesatuan sangga.',
    kategoriLabel: '🎖️ Ketangkasan & PBB'
  },
  {
    id: 'tpl_pionering_menara',
    nama: 'Latihan Rutin: Pionering Menara Kaki Tiga & Jembatan Angkat',
    tipe: 'Latihan Rutin',
    bulan: 'Oktober',
    bulanUrutan: 4,
    waktuPelaksanaan: 'Jumat, 16 Oktober 2026 (Pukul 14.30 - 17.00 WITA)',
    sasaran: 'Seluruh Anggota Sangga Ambalan',
    anggaran: 'Rp 150.000',
    tempat: 'Plaza Sanggar Pramuka',
    seragam: 'Kaos Lapangan Ambalan & Kacu Leher',
    penanggungJawab: 'Sangga Pencoba & Kerani',
    deskripsi: 'Penerapan ikatan palang, silang, dan canggah pada konstruksi menara pantau kaki tiga darurat dan jembatan penyeberangan rintangan.',
    kategoriLabel: '🪢 Tali Temali & Pionering'
  },
  {
    id: 'tpl_navigasi_kompas',
    nama: 'Latihan Rutin: Navigasi Darat, Resection & Orientering Kompas',
    tipe: 'Latihan Rutin',
    bulan: 'Oktober',
    bulanUrutan: 4,
    waktuPelaksanaan: 'Jumat, 23 Oktober 2026 (Pukul 14.30 - 17.00 WITA)',
    sasaran: 'Penegak Bantara & Calon Bantara',
    anggaran: 'Rp 120.000',
    tempat: 'Rute Lintas Alam Pangkalan & Sekitar',
    seragam: 'Kaos Lapangan & Sepatu Olahraga',
    penanggungJawab: 'Sangga Pendobrak',
    deskripsi: 'Membaca peta topografi, penentuan koordinat grid 6 angka, teknik resection/intersection, dan pencarian target pos rahasia.',
    kategoriLabel: '🧭 Navigasi & Survival'
  },
  {
    id: 'tpl_p3k_tandu',
    nama: 'Latihan Rutin: Pertolongan Pertama (P3K) & Pembuatan Tandu Darurat',
    tipe: 'Latihan Rutin',
    bulan: 'Agustus',
    bulanUrutan: 2,
    waktuPelaksanaan: 'Jumat, 28 Agustus 2026 (Pukul 14.30 - 17.00 WITA)',
    sasaran: 'Seluruh Anggota Sangga',
    anggaran: 'Rp 100.000',
    tempat: 'Aula Sanggar Pramuka',
    seragam: 'Seragam Pramuka / Kaos Lapangan',
    penanggungJawab: 'Hartaka & Bidang Pengabdian Masyarakat',
    deskripsi: 'Simulasi penanganan patah tulang, luka bakar, balut bidai mitela, serta pembuatan tandu darurat menggunakan 2 tongkat dan tambang.',
    kategoriLabel: '🩹 Medis & P3K'
  },
  {
    id: 'tpl_baksos_lingkungan',
    nama: 'Aksi Bakti Sosial Peduli Lingkungan & Penghijauan Pangkalan',
    tipe: 'Kegiatan',
    bulan: 'Februari',
    bulanUrutan: 8,
    waktuPelaksanaan: 'Sabtu, 20 Februari 2027',
    sasaran: 'Seluruh Ambalan La Surullah & Masyarakat Sekitar',
    anggaran: 'Rp 600.000',
    tempat: 'Kawasan Pangkalan & Lingkungan Kelurahan',
    seragam: 'Kaos Lapangan Ambalan',
    penanggungJawab: 'Pemangku Adat & Sangga Pelaksana',
    deskripsi: 'Penanaman bibit pohon buah/pelindung, pembersihan saluran air, edukasi daur ulang sampah plastik, dan bakti peduli kebersihan tempat ibadah.',
    kategoriLabel: '🌱 Bakti Masyarakat & Alam'
  },
  {
    id: 'tpl_ujian_sku_bantara',
    nama: 'Giat Ujian Kenaikan Tingkat SKU Bantara & Laksana',
    tipe: 'Kegiatan',
    bulan: 'Maret',
    bulanUrutan: 9,
    waktuPelaksanaan: 'Jumat - Sabtu, 26 - 27 Maret 2027',
    sasaran: 'Calon Penegak Bantara & Bantara Menuju Laksana',
    anggaran: 'Rp 500.000',
    tempat: 'Pos Ujian SKU Sanggar & Pangkalan',
    seragam: 'Seragam Pramuka Lengkap Upacara',
    penanggungJawab: 'Pembina Satuan & Tim Penguji SKU',
    deskripsi: 'Pengujian butir SKU poin 1 s.d 23 untuk Bantara dan butir lanjutan untuk Laksana secara menyeluruh (spiritual, emosional, sosial, intelektual, fisik).',
    kategoriLabel: '📜 Ujian Tingkat SKU'
  },
  {
    id: 'tpl_morse_semaphore',
    nama: 'Latihan Rutin: Pendalaman Semboyan Semaphore & Sandi Morse Digital',
    tipe: 'Latihan Rutin',
    bulan: 'Agustus',
    bulanUrutan: 2,
    waktuPelaksanaan: 'Jumat, 21 Agustus 2026 (Pukul 14.30 - 17.00 WITA)',
    sasaran: 'Seluruh Anggota Sangga',
    anggaran: 'Rp 80.000',
    tempat: 'Lapangan Upacara Pangkalan',
    seragam: 'Seragam Pramuka / Kaos Lapangan',
    penanggungJawab: 'Sangga Penegas & Kerani',
    deskripsi: 'Kecepatan pengiriman pesan berjarak jauh menggunakan bendera semaphore, peluit morse, dan senter kedip malam hari.',
    kategoriLabel: '📡 Sandi & Komunikasi'
  },
  {
    id: 'tpl_malam_api_unggun',
    nama: 'Malam Renungan Suci Api Unggun & Penerimaan Tamu Ambalan (PTA)',
    tipe: 'Kegiatan',
    bulan: 'Juli',
    bulanUrutan: 1,
    waktuPelaksanaan: 'Sabtu Malam, 25 Juli 2026',
    sasaran: 'Tamu Ambalan Baru & Warga Ambalan La Surullah',
    anggaran: 'Rp 1.200.000',
    tempat: 'Lapangan Sanggar Ambalan',
    seragam: 'Seragam Pramuka Lengkap Upacara',
    penanggungJawab: 'Pemangku Adat & Pradana Putra/Putri',
    deskripsi: 'Upacara adat pembakaran api unggun dasa darma, perenungan ulang janji Tri Satya, prosesi adat Siri\' na Pacce, dan pentas seni sangga.',
    kategoriLabel: '🔥 Tradisi & Adat Ambalan'
  },
  {
    id: 'tpl_musyawarah_ambalan',
    nama: 'Musyawarah Penegak Ambalan (MUPEN) & Laporan Pertanggungjawaban',
    tipe: 'Kegiatan',
    bulan: 'Juni',
    bulanUrutan: 12,
    waktuPelaksanaan: 'Sabtu - Minggu, 19 - 20 Juni 2027',
    sasaran: 'Seluruh Dewan Ambalan & Anggota Penegak Aktif',
    anggaran: 'Rp 800.000',
    tempat: 'Aula Utama Pangkalan',
    seragam: 'Seragam Pramuka Lengkap',
    penanggungJawab: 'Dewan Kehormatan Ambalan & Pembina',
    deskripsi: 'Evaluasi kinerja dewan ambalan satu tahun masa bakti, pembahasan adat ambalan, penyusunan rancangan proker baru, dan pemilihan pradana baru.',
    kategoriLabel: '⚖️ Musyawarah & Organisasi'
  }
];
