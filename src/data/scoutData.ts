import { SkuItem, SkkItem, AgendaEvent, UserProfile, LogbookEntry, AttendanceRecord } from '../types';

export const LOGO_IMAGE_PATH = '/assets/pettalopo-logo.png';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Amiruddin S.',
  gender: 'putra',
  gudep: '10-035',
  sangga: 'Perintis',
  level: 'Penegak Bantara',
  jabatan: 'Pradana Putra',
  ktaNumber: '10.035.2026.001',
  joinYear: '2025'
};

export const INITIAL_SKU_ITEMS: SkuItem[] = [
  // Bantara
  {
    id: 1,
    code: 'B-01',
    level: 'bantara',
    category: 'Spiritual / Agama',
    title: 'Ketaatan Beribadah & Toleransi',
    description: 'Dapat menjelaskan makna Rukun Iman dan Rukun Islam / ajaran agama masing-masing serta mampu menjalankan ibadah dengan tertib.',
    guide: 'Uji hafalan/pemahaman rukun, tata cara bersuci (wudhu/tayamum), dan praktik salat wajib atau tata ibadah agama yang dianut.',
    completed: true,
    completedDate: '2026-03-12',
    verifiedBy: 'Kak Pembina Satuan'
  },
  {
    id: 2,
    code: 'B-02',
    level: 'bantara',
    category: 'Spiritual / Agama',
    title: 'Mendalami Kitab Suci & Doa Harian',
    description: 'Mampu membaca Al-Qur\'an / Kitab Suci agamanya dengan baik dan benar serta hafal sekurang-kurangnya 3 doa sehari-hari.',
    guide: 'Setor bacaan ayat suci dan doa makan, tidur, keluar rumah/ibadah harian.',
    completed: true,
    completedDate: '2026-03-15',
    verifiedBy: 'Kak Pembina Satuan'
  },
  {
    id: 3,
    code: 'B-03',
    level: 'bantara',
    category: 'Patriotisme & Kebangsaan',
    title: 'Sejarah & Struktur Gerakan Pramuka',
    description: 'Dapat menjelaskan sejarah kepramukaan Indonesia dan dunia (Baden Powell) serta struktur organisasi Gerakan Pramuka dari Gugus Depan hingga Kwartir Nasional.',
    guide: 'Paparkan tanggal penting kepanduan, kepres No 238 tahun 1961, dan bagan organisasi Gerakan Pramuka.',
    completed: true,
    completedDate: '2026-03-20',
    verifiedBy: 'Kak Pradana'
  },
  {
    id: 4,
    code: 'B-04',
    level: 'bantara',
    category: 'Patriotisme & Kebangsaan',
    title: 'Pancasila & Lambang Negara',
    description: 'Dapat menjelaskan makna lambang Negara Garuda Pancasila, sejarah lagu kebangsaan Indonesia Raya, dan bendera Merah Putih.',
    guide: 'Sebutkan arti helai bulu burung garuda, semboyan Bhinneka Tunggal Ika, dan aturan pengibaran bendera.',
    completed: false
  },
  {
    id: 5,
    code: 'B-05',
    level: 'bantara',
    category: 'Sosial & Kepribadian',
    title: 'Tri Satya & Dasa Darma dalam Kehidupan',
    description: 'Dapat mengamalkan Tri Satya dan Dasa Darma Pramuka serta menjelaskan contoh nyata penerapannya dalam keluarga, sekolah, dan masyarakat.',
    guide: 'Ujian lisan dan observasi perilaku sehari-hari oleh rekan sangga dan pembina.',
    completed: true,
    completedDate: '2026-04-01',
    verifiedBy: 'Kak Pembina Satuan'
  },
  {
    id: 6,
    code: 'B-06',
    level: 'bantara',
    category: 'Sosial & Kepribadian',
    title: 'Adat Istiadat & Kearifan Lokal Bugis-Makassar',
    description: 'Mengenal adat istiadat Ambalan La Surullah Petta Lopo dan filosofi luhur Siri\' na Pacce serta aksara Lontara.',
    guide: 'Jelaskan makna semboyan ambalan, tata krama penerimaan tamu ambalan, dan baca aksara Lontara dasar.',
    completed: true,
    completedDate: '2026-04-08',
    verifiedBy: 'Kak Pemangku Adat'
  },
  {
    id: 7,
    code: 'B-07',
    level: 'bantara',
    category: 'Keterampilan & Teknologi',
    title: 'Sandi Morse, Semaphore & Sandi Kotak',
    description: 'Dapat menerima dan mengirim pesan menggunakan sandi morse (tiupan peluit/senter) dan semaphore minimal 30 huruf.',
    guide: 'Uji praktik kecepatan dan ketepatan membaca morse suara dan peragaan bendera semaphore.',
    completed: false
  },
  {
    id: 8,
    code: 'B-08',
    level: 'bantara',
    category: 'Keterampilan & Teknologi',
    title: 'Simpul & Ikatan Tali Temali (Pionering)',
    description: 'Mampu membuat simpul hidup, mati, pangkal, jangkar, ujung tali, kembar, serta ikatan palang, silang, dan canggah dalam mendirikan tiang bendera atau tenda.',
    guide: 'Praktik langsung membuat pionering tiang bendera atau rak piring sederhana.',
    completed: false
  },
  {
    id: 9,
    code: 'B-09',
    level: 'bantara',
    category: 'Keterampilan & Teknologi',
    title: 'Kompas & Navigasi Darat',
    description: 'Dapat menggunakan kompas bidik (azimuth dan back azimuth) serta membaca peta topografi dasar.',
    guide: 'Lakukan bidikan 3 titik sasaran dan tentukan sudut derajat serta koordinat dasar.',
    completed: false
  },
  {
    id: 10,
    code: 'B-10',
    level: 'bantara',
    category: 'Keterampilan & Teknologi',
    title: 'Menaksir Tinggi & Lebar',
    description: 'Dapat menaksir tinggi pohon/tiang dan lebar sungai dengan metode perbandingan segitiga atau bayangan.',
    guide: 'Lakukan penaksiran di lapangan dengan toleransi kesalahan maksimal 10%.',
    completed: false
  },
  {
    id: 11,
    code: 'B-11',
    level: 'bantara',
    category: 'Jasmani & Lingkungan',
    title: 'Pertolongan Pertama Pada Kecelakaan (P3K)',
    description: 'Dapat mempraktikkan pembalutan luka, pembidaian fraktur tulang, serta pembuatan tandu darurat.',
    guide: 'Simulasi penanganan korban pingsan, patah tulang lengan/kaki, dan pemindahan korban.',
    completed: false
  },
  {
    id: 12,
    code: 'B-12',
    level: 'bantara',
    category: 'Jasmani & Lingkungan',
    title: 'Kebugaran Jasmani & Baris Berbaris (PBB)',
    description: 'Dapat melakukan baris-berbaris (PBB bertongkat dan tanpa tongkat) serta menjaga kebugaran jasmani.',
    guide: 'Praktik komando PBB dasar dan tes lari/push-up kebugaran.',
    completed: false
  },
  {
    id: 13,
    code: 'B-13',
    level: 'bantara',
    category: 'Sosial & Kepribadian',
    title: 'Manajemen Sangga & Administrasi Ambalan',
    description: 'Dapat memimpin sangga dalam musyawarah dan menyusun rencana kegiatan atau proposal sederhana.',
    guide: 'Tunjukkan notulensi rapat sangga dan rencana perkemahan.',
    completed: false
  },
  {
    id: 14,
    code: 'B-14',
    level: 'bantara',
    category: 'Jasmani & Lingkungan',
    title: 'Pelestarian Lingkungan Hidup',
    description: 'Telah berpartisipasi dalam penanaman pohon, pengolahan sampah/daur ulang, atau aksi bersih lingkungan.',
    guide: 'Bukti dokumentasi kegiatan bakti lingkungan di sekolah atau pangkalan ambalan.',
    completed: false
  },

  // Laksana
  {
    id: 15,
    code: 'L-01',
    level: 'laksana',
    category: 'Spiritual / Agama',
    title: 'Kematangan Spiritual & Kepemimpinan Agama',
    description: 'Mampu memimpin ibadah bersama dan membimbing adik-adik Penggalang dalam hal pembinaan kerohanian.',
    guide: 'Menjadi imam/pemimpin doa pada upacara atau perkemahan ambalan.',
    completed: false
  },
  {
    id: 16,
    code: 'L-02',
    level: 'laksana',
    category: 'Patriotisme & Kebangsaan',
    title: 'Wawasan Kebangsaan & Bela Negara',
    description: 'Dapat menjelaskan konsep Ketahanan Nasional, Wawasan Nusantara, dan kontribusi pemuda dalam pembangunan.',
    guide: 'Membuat esai singkat atau paparan diskusi di hadapan Dewan Ambalan.',
    completed: false
  },
  {
    id: 17,
    code: 'L-03',
    level: 'laksana',
    category: 'Sosial & Kepribadian',
    title: 'Proyek Pengabdian Masyarakat (Community Development)',
    description: 'Telah merencanakan dan melaksanakan kegiatan bakti sosial yang bermanfaat bagi masyarakat di luar lingkungan gugus depan.',
    guide: 'Laporan kegiatan bakti sosial, edukasi, atau bantuan kemanusiaan.',
    completed: false
  },
  {
    id: 18,
    code: 'L-04',
    level: 'laksana',
    category: 'Keterampilan & Teknologi',
    title: 'Survival & Penjelajahan Alam Bebas',
    description: 'Dapat melakukan pengembaraan/survival selama minimal 2 hari 1 malam dengan mendirikan bivak dan memasak bahan rimba.',
    guide: 'Laporan perjalanan pengembaraan penegak laksana dengan peta rute perjalanan.',
    completed: false
  },
  {
    id: 19,
    code: 'L-05',
    level: 'laksana',
    category: 'Keterampilan & Teknologi',
    title: 'Penerapan Teknologi Tepat Guna',
    description: 'Dapat membuat atau memanfaatkan karya teknologi tepat guna yang berguna bagi ambalan atau masyarakat.',
    guide: 'Presentasi alat atau sistem teknologi tepat guna (penyaring air, komposter, atau sistem digital).',
    completed: false
  },
  {
    id: 20,
    code: 'L-06',
    level: 'laksana',
    category: 'Jasmani & Lingkungan',
    title: 'Manajemen Krisis & Search and Rescue (SAR)',
    description: 'Memahami dasar-dasar pertolongan bencana alam, pemadaman api dini, dan evakuasi darurat.',
    guide: 'Sertifikat pelatihan atau simulasi tanggap bencana di pangkalan.',
    completed: false
  }
];

export const INITIAL_SKK_ITEMS: SkkItem[] = [
  {
    id: 'skk-1',
    name: 'SKK Berkemah',
    category: 'Ketangkasan & Kesehatan',
    level: 'Madya',
    icon: 'Tent',
    description: 'Telah mengikuti dan memimpin perkemahan minimal 3 hari berturut-turut serta mampu menata tapak perkemahan yang bersih dan higienis.',
    completed: true
  },
  {
    id: 'skk-2',
    name: 'SKK Pengamat',
    category: 'Ketangkasan & Kesehatan',
    level: 'Purwa',
    icon: 'Eye',
    description: 'Mampu mengingat 15 dari 20 macam benda dalam waktu 1 menit (Permainan Kim) dan mengenali jejak di alam.',
    completed: true
  },
  {
    id: 'skk-3',
    name: 'SKK Juru Masak',
    category: 'Keterampilan',
    level: 'Madya',
    icon: 'Utensils',
    description: 'Mampu memasak untuk satu regu/sangga menu 4 sehat 5 sempurna dengan peralatan lapangan.',
    completed: true
  },
  {
    id: 'skk-4',
    name: 'SKK P3K',
    category: 'Sosial & Kemanusiaan',
    level: 'Utama',
    icon: 'HeartPulse',
    description: 'Menguasai pertolongan pendarahan, patah tulang, gigitan hewan berbisa, dan resusitasi jantung paru (RJP).',
    completed: false
  },
  {
    id: 'skk-5',
    name: 'SKK Penunjuk Jalan',
    category: 'Patriotisme & Seni',
    level: 'Purwa',
    icon: 'Compass',
    description: 'Mengetahui jalan-jalan penting, letak pos polisi, puskesmas, dan kantor pemerintahan di wilayah Maros dan sekitarnya.',
    completed: false
  },
  {
    id: 'skk-6',
    name: 'SKK Komunikasi & Morse',
    category: 'Keterampilan',
    level: 'Madya',
    icon: 'Radio',
    description: 'Menguasai komunikasi radio amatir, sandi morse optik dan akustik, serta kode q internasional.',
    completed: false
  }
];

export const INITIAL_EVENTS: AgendaEvent[] = [
  {
    id: 'ev-1',
    title: 'Latihan Rutin Mingguan: Sandi & Navigasi',
    date: 'Setiap Sabtu Sore',
    time: '15:30 - 17:30 WITA',
    location: 'Lapangan Utama Pangkalan Gudep 10-035 / 10-036',
    category: 'Latihan Rutin',
    description: 'Pendalaman materi Sandi Morse peluit, Semaphore, dan pembacaan sudut kompas azimuth. Wajib membawa tongkat pramuka dan buku saku.',
    uniform: 'Seragam Pramuka Lengkap'
  },
  {
    id: 'ev-2',
    title: 'Ujian Kenaikan Tingkat SKU Bantara & Laksana',
    date: '14 - 15 November 2026',
    time: '08:00 WITA - Selesai',
    location: 'Bumi Perkemahan Maros & Sanggar Pramuka',
    category: 'Ujian SKU',
    description: 'Pelaksanaan sidang uji kelayakan SKU bagi Calon Penegak Bantara dan Bantara menuju Laksana oleh Tim Pembina & Penguji Ambalan.',
    uniform: 'Seragam Pramuka Lengkap'
  },
  {
    id: 'ev-3',
    title: 'Kemah Wirakarya & Bakti Pelestarian Alam',
    date: '27 - 29 November 2026',
    time: '3 Hari 2 Malam',
    location: 'Kawasan Wisata Alam Bantimurung - Rammang-Rammang',
    category: 'Perkemahan',
    description: 'Aksi penghijauan, susur karst, eksplorasi kebudayaan Lontara, dan bakti pembersihan situs cagar budaya ambalan.',
    uniform: 'Kaos Lapangan Ambalan'
  },
  {
    id: 'ev-4',
    title: 'Musyawarah Penegak Putra & Putri (MUPANITERA)',
    date: '12 Desember 2026',
    time: '09:00 - 16:00 WITA',
    location: 'Aula Gugus Depan La Surullah Petta Lopo',
    category: 'Rapat Dewan',
    description: 'Laporan pertanggungjawaban Dewan Ambalan periode 2025/2026 dan pemilihan Pradana Putra & Putri masa bakti berikutnya.',
    uniform: 'Seragam Pramuka Lengkap'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', date: '2026-10-24', sangga: 'Perintis', gudep: '10-035', memberName: 'Amiruddin S.', status: 'Hadir' },
  { id: 'att-2', date: '2026-10-24', sangga: 'Perintis', gudep: '10-035', memberName: 'Muh. Fadel', status: 'Hadir' },
  { id: 'att-3', date: '2026-10-24', sangga: 'Penegas', gudep: '10-035', memberName: 'Rahmat Hidayat', status: 'Hadir' },
  { id: 'att-4', date: '2026-10-24', sangga: 'Pendobrak', gudep: '10-035', memberName: 'Andi Rizal', status: 'Izin', notes: 'Ada ujian sekolah' },
  { id: 'att-5', date: '2026-10-24', sangga: 'Perintis', gudep: '10-036', memberName: 'Nur Fatimah', status: 'Hadir' },
  { id: 'att-6', date: '2026-10-24', sangga: 'Penegas', gudep: '10-036', memberName: 'Siti Rahmawati', status: 'Hadir' }
];

export const INITIAL_LOGBOOK: LogbookEntry[] = [
  {
    id: 'log-1',
    date: '2026-10-24',
    title: 'Latihan Tali Temali & Pionering Tiang Tiga',
    category: 'Pionering',
    content: 'Hari ini seluruh sangga mempraktikkan ikatan palang dan kaki tiga untuk membuat miniatur menara pandang. Sangga Perintis berhasil menyelesaikan dalam tempo 18 menit tanpa ada tali yang kendur.',
    author: 'Amiruddin S.',
    sangga: 'Perintis',
    rating: 5
  },
  {
    id: 'log-2',
    date: '2026-10-17',
    title: 'Kajian Sejarah Tokoh La Surullah Petta Lopo & Filosofi Siri\' na Pacce',
    category: 'Adat Ambalan',
    content: 'Dibimbing langsung oleh Kak Pembina, kami mengupas makna badik pada lambang ambalan serta bagaimana seorang Pramuka Penegak harus memiliki ketegasan moral dan sifat pantang menyerah.',
    author: 'Amiruddin S.',
    sangga: 'Perintis',
    rating: 5
  }
];

export const MORSE_CODE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  ' ': ' / '
};

export const SEMAPHORE_TABLE = [
  { letter: 'A', left: 225, right: 180, desc: 'Tangan kiri turun 45°, tangan kanan ke bawah' },
  { letter: 'B', left: 270, right: 180, desc: 'Tangan kiri horizontal kiri, tangan kanan ke bawah' },
  { letter: 'C', left: 315, right: 180, desc: 'Tangan kiri serong atas 45°, tangan kanan ke bawah' },
  { letter: 'D', left: 0, right: 180, desc: 'Tangan kiri lurus ke atas, tangan kanan ke bawah' },
  { letter: 'E', left: 180, right: 45, desc: 'Tangan kiri ke bawah, tangan kanan serong atas 45°' },
  { letter: 'F', left: 180, right: 90, desc: 'Tangan kiri ke bawah, tangan kanan horizontal kanan' },
  { letter: 'G', left: 180, right: 135, desc: 'Tangan kiri ke bawah, tangan kanan serong bawah 45°' },
  { letter: 'H', left: 270, right: 225, desc: 'Tangan kiri mendatar, tangan kanan serong kiri bawah' },
  { letter: 'I', left: 315, right: 225, desc: 'Tangan kiri serong atas, tangan kanan serong bawah' },
  { letter: 'K', left: 0, right: 225, desc: 'Tangan kiri tegak atas, tangan kanan serong kiri bawah' },
  { letter: 'L', left: 45, right: 225, desc: 'Tangan kiri serong kanan atas, tangan kanan serong bawah' },
  { letter: 'M', left: 90, right: 225, desc: 'Tangan kiri mendatar kanan, tangan kanan serong bawah' },
  { letter: 'N', left: 135, right: 225, desc: 'Kedua tangan serong bawah membentuk huruf V terbalik' },
  { letter: 'O', left: 270, right: 315, desc: 'Tangan kiri horizontal, tangan kanan serong atas' },
  { letter: 'P', left: 0, right: 270, desc: 'Tangan kiri tegak lurus ke atas, tangan kanan mendatar ke kiri' },
  { letter: 'Q', left: 45, right: 270, desc: 'Tangan kiri serong kanan atas, tangan kanan horizontal kiri' },
  { letter: 'R', left: 90, right: 270, desc: 'Kedua tangan direntangkan mendatar horizontal' },
  { letter: 'S', left: 135, right: 270, desc: 'Tangan kiri serong kanan bawah, tangan kanan horizontal kiri' },
  { letter: 'T', left: 0, right: 315, desc: 'Tangan kiri tegak lurus ke atas, tangan kanan serong kanan atas' },
  { letter: 'U', left: 45, right: 315, desc: 'Kedua tangan membentuk huruf V ke atas' },
  { letter: 'V', left: 0, right: 135, desc: 'Tangan kiri tegak atas, tangan kanan serong bawah' },
  { letter: 'W', left: 45, right: 90, desc: 'Tangan kiri serong kanan atas, tangan kanan mendatar kanan' },
  { letter: 'X', left: 45, right: 135, desc: 'Tangan kiri serong kanan atas, tangan kanan serong bawah' },
  { letter: 'Y', left: 90, right: 315, desc: 'Tangan kiri mendatar kanan, tangan kanan serong atas' },
  { letter: 'Z', left: 90, right: 135, desc: 'Tangan kiri mendatar kanan, tangan kanan serong bawah' }
];

export const LONTARA_DICTIONARY: { latin: string; lontara: string; desc: string }[] = [
  { latin: 'ka', lontara: 'ᨀ', desc: 'Konsonan Ka' },
  { latin: 'ga', lontara: 'ᨁ', desc: 'Konsonan Ga' },
  { latin: 'nga', lontara: 'ᨂ', desc: 'Konsonan Nga' },
  { latin: 'ngka', lontara: 'ᨃ', desc: 'Konsonan Ngka' },
  { latin: 'pa', lontara: 'ᨄ', desc: 'Konsonan Pa' },
  { latin: 'ba', lontara: 'ᨅ', desc: 'Konsonan Ba' },
  { latin: 'ma', lontara: 'ᨆ', desc: 'Konsonan Ma' },
  { latin: 'mpa', lontara: 'ᨇ', desc: 'Konsonan Mpa' },
  { latin: 'ta', lontara: 'ᨈ', desc: 'Konsonan Ta' },
  { latin: 'da', lontara: 'ᨉ', desc: 'Konsonan Da' },
  { latin: 'na', lontara: 'ᨊ', desc: 'Konsonan Na' },
  { latin: 'nra', lontara: 'ᨋ', desc: 'Konsonan Nra' },
  { latin: 'ca', lontara: 'ᨌ', desc: 'Konsonan Ca' },
  { latin: 'ja', lontara: 'ᨍ', desc: 'Konsonan Ja' },
  { latin: 'nya', lontara: 'ᨎ', desc: 'Konsonan Nya' },
  { latin: 'nca', lontara: 'ᨏ', desc: 'Konsonan Nca' },
  { latin: 'ya', lontara: 'ᨐ', desc: 'Konsonan Ya' },
  { latin: 'ra', lontara: 'ᨑ', desc: 'Konsonan Ra' },
  { latin: 'la', lontara: 'ᨒ', desc: 'Konsonan La' },
  { latin: 'wa', lontara: 'ᨓ', desc: 'Konsonan Wa' },
  { latin: 'sa', lontara: 'ᨔ', desc: 'Konsonan Sa' },
  { latin: 'a', lontara: 'ᨕ', desc: 'Vokal dasar A' },
  { latin: 'ha', lontara: 'ᨖ', desc: 'Konsonan Ha' }
];

// Diacritics for vowels in Bugis Lontara
export const LONTARA_VOWELS = {
  i: 'ᨗ', // tetti' riase' (dot above)
  u: 'ᨘ', // tetti' riawa (dot below)
  e: 'ᨙ', // kecce' riolo (curve before)
  o: 'ᨚ', // kecce' rimunri (accent after)
  ae: 'ᨛ' // anassang (e pepet)
};

export const SIMPUL_IKATAN = [
  {
    name: 'Simpul Hidup (Overhand Knot)',
    type: 'Simpul',
    purpose: 'Mengikat tiang atau hewan ternak agar mudah dilepas kembali dengan cepat.',
    difficulty: 'Mudah',
    steps: [
      'Buat lingkaran tali kecil di tangan.',
      'Masukkan ujung tali melipat sebagian ke dalam lingkaran.',
      'Tarik ujung simpul untuk mengencangkan.'
    ]
  },
  {
    name: 'Simpul Mati (Reef / Square Knot)',
    type: 'Simpul',
    purpose: 'Menyambung dua utas tali yang sama besar dan dalam keadaan kering tidak licin.',
    difficulty: 'Mudah',
    steps: [
      'Silangkan ujung kanan di atas ujung kiri lalu lingkarkan.',
      'Silangkan kembali ujung kiri di atas ujung kanan lalu lingkarkan.',
      'Tarik kedua sisi hingga simpul mengunci rata simetris.'
    ]
  },
  {
    name: 'Simpul Pangkal (Clove Hitch)',
    type: 'Simpul Dasar Pionering',
    purpose: 'Memulai dan mengakhiri semua jenis ikatan tongkat dan jangkar tali.',
    difficulty: 'Sedang',
    steps: [
      'Lilitkan tali melingkari tiang atau tongkat.',
      'Silangkan tali di atas lilitan pertama.',
      'Selipkan ujung tali di bawah silangan lalu tarik kencang.'
    ]
  },
  {
    name: 'Simpul Jangkar (Cow Hitch)',
    type: 'Simpul',
    purpose: 'Membuat tandu darurat, menambatkan tali pada pasak tenda, atau mengikat jangkar perahu.',
    difficulty: 'Mudah',
    steps: [
      'Tekuk tali menjadi dua bagian sama panjang.',
      'Lilitkan kedua ujung tali melompati palang tongkat.',
      'Masukkan kedua ujung tali melalui lekukan lengkung.'
    ]
  },
  {
    name: 'Ikatan Palang (Square Lashing)',
    type: 'Ikatan Pionering',
    purpose: 'Mengikat dua tongkat yang bersilangan membentuk sudut siku-siku 90°.',
    difficulty: 'Tinggi',
    steps: [
      'Awali dengan simpul pangkal pada salah satu tiang di bawah persilangan.',
      'Lilitkan tali mengelilingi kedua tongkat secara bergantian (atas-bawah) sebanyak 3-4 kali dengan sangat kencang.',
      'Lakukan penindasan (frapping) di antara kedua tongkat 2-3 putaran.',
      'Kunci dan akhiri dengan simpul mati atau simpul pangkal.'
    ]
  },
  {
    name: 'Ikatan Kaki Tiga (Tripod Lashing)',
    type: 'Ikatan Pionering',
    purpose: 'Menyatukan tiga tongkat untuk membuat menara pandang, kaki tenda piramida, atau gantungan kuali.',
    difficulty: 'Tinggi',
    steps: [
      'Sejajarkan ketiga tongkat di tanah.',
      'Awali simpul pangkal pada tongkat paling pinggir.',
      'Lilitkan tali secara berselang-seling (anyaman angka delapan) melingkari ketiga tongkat sebanyak 4-5 kali.',
      'Lilitkan penindas di sela-sela antar tongkat dengan sangat erat.',
      'Kunci dengan simpul mati lalu tegakkan dan putar tongkat tengah.'
    ]
  }
];

export const FILOSOFI_LOGO = [
  {
    element: 'Perisai Segi Lima Merah Putih',
    title: 'Perisai Merah Putih',
    description: 'Bentuk perisai melambangkan benteng pertahanan moral, keteguhan hati menegakkan marwah bangsa, serta pengamalan Pancasila. Warna Merah melambangkan keberanian dan kepahlawanan pejuang Bugis, sedangkan Putih melambangkan kesucian niat dan budi pekerti luhur seorang Pramuka.'
  },
  {
    element: 'Mahkota Kuning Emas Atas',
    title: 'Banner Ambalan Kuning Emas',
    description: 'Bagian atas bertuliskan "AMBALAN LA SURULLAH PETTA LOPO" berlatar kuning emas, melambangkan keagungan martabat, kearifan kepemimpinan, dan kemuliaan cita-cita kepramukaan yang selalu dijunjung tinggi di atas segalanya.'
  },
  {
    element: 'Nomor 10-035 dan 10-036',
    title: 'Nomor Gugus Depan',
    description: '10-035 adalah Gugus Depan Putra dan 10-036 adalah Gugus Depan Putri pangkalan Ambalan La Surullah Petta Lopo. Menunjukkan kesetaraan, kekompakan, dan sinergi putra-putri dalam Gerakan Pramuka.'
  },
  {
    element: 'Bintang Emas Segi Lima',
    title: 'Bintang Ketuhanan',
    description: 'Terletak di titik pusat tertinggi, mencerminkan Sila Pertama Pancasila dan Dasa Darma pertama "Taqwa kepada Tuhan Yang Maha Esa". Segala daya upaya dan karsa ambalan senantiasa bernafaskan ketakwaan.'
  },
  {
    element: 'Badik Khas Sulawesi Selatan',
    title: 'Pusaka Badik Bugis-Makassar',
    description: 'Badik tegak lurus melambangkan ketegasan, keberanian, kewaspadaan tinggi, serta penegakan harga diri dan kehormatan luhur (Siri\' na Pacce). Badik bukan untuk kezaliman, melainkan penjaga kebajikan dan benteng pertahanan kebenaran.'
  },
  {
    element: 'Dua Tunas Kelapa',
    title: 'Tunas Kelapa Kembar',
    description: 'Lambang resmi Gerakan Pramuka Indonesia yang memiliki daya guna di setiap bagiannya. Di ambalan ini, dua tunas kelapa melambangkan generasi muda penegak putra dan putri yang tangguh, ulet, dan serba guna bagi nusa dan bangsa.'
  },
  {
    element: 'Sayap Emas 10 Helai',
    title: 'Sepasang Sayap Emas (5 Kiri + 5 Kanan)',
    description: 'Dua kepak sayap kuning emas yang masing-masing terdiri dari 5 helai (total 10 helai) melambangkan 10 butir Dasa Darma Pramuka yang menerbangkan cita-cita penegak menuju puncak kejayaan dan kemandirian hidup.'
  },
  {
    element: 'Pita Merah Aksara Lontara',
    title: 'Pita Merah Aksara Lontara',
    description: 'Pita merah di bagian bawah bertuliskan aksara warisan leluhur Lontara Bugis-Makassar, menegaskan bahwa Pramuka Penegak Ambalan La Surullah Petta Lopo berakar kuat pada nilai kearifan lokal, kehormatan budaya nusantara, dan persaudaraan sejati.'
  }
];

export const SEJARAH_TOKOH = {
  tokoh: 'La Surullah Petta Lopo',
  gelar: 'Petta Lopo (Pemimpin yang Berwibawa & Pelindung Rakyat)',
  wilayah: 'Sulawesi Selatan / Maros',
  kisah: 'La Surullah Petta Lopo dikenal dalam sejarah lokal Sulawesi Selatan sebagai sosok bangsawan dan kesatria yang bijaksana, gagah berani, dan senantiasa mendahulukan keselamatan serta martabat rakyatnya. Gelar "Petta Lopo" mencerminkan kedudukan yang lapang, berwibawa, dan tempat bersandar bagi masyarakat dalam menghadapi tantangan hidup.',
  nilaiTeladan: [
    'Siri\' (Menjaga kehormatan, integritas, dan martabat diri serta bangsa)',
    'Pacce / Pesse\' (Rasa empati mendalam, solidaritas tanpa pamrih, dan setia kawan)',
    'Getteng (Konsisten, teguh pendirian memegang amanah dan janji Tri Satya)',
    'Lempu\' (Kejujuran dan keikhlasan hati dalam berbakti)',
    'Acca (Cerdas, berwawasan luas, dan terampil menguasai teknologi zamannya)'
  ]
};
