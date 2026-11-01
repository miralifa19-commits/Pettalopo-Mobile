import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  FileText, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  Search, 
  FileUp, 
  Clock,
  Layers,
  FileCheck,
  Copy,
  Check,
  BookMarked,
  Eye,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { MateriBelajar } from '../../types';
import { extractTextFromPdf, formatMateriCantik } from '../../utils/pdfExtractor';

interface RuangBelajarViewProps {
  isAdmin?: boolean;
}

export const RuangBelajarView: React.FC<RuangBelajarViewProps> = ({ isAdmin = true }) => {
  const [materiList, setMateriList] = useState<MateriBelajar[]>(() => {
    const saved = localStorage.getItem('ambalan_ruang_belajar_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'mat-1',
        judul: 'Buku Pedoman Adat Ambalan & Kepemimpinan Penegak',
        kategori: 'Sejarah & Adat',
        tipeFormat: 'ai_generated',
        jumlahHalaman: 3,
        totalKata: 480,
        estimasiMenitBaca: 3,
        isiMateriOriginal: `ADAT AMBALAN LA SURULLAH PETTA LOPO
GUGUS DEPAN 10-035 (PUTRA) & 10-036 (PUTRI)

BAB I: DASAR HUKUM DAN PRINSIP DASAR
Adat Ambalan adalah seperangkat norma, nilai kehormatan, dan tata tertib yang disepakati secara musyawarah oleh seluruh warga Ambalan La Surullah Petta Lopo. Adat ini bertujuan membina budi pekerti luhur, kemandirian, dan keteguhan jiwa kepemimpinan kesatria.

BAB II: PENGHAYATAN FALSAFAH SIRI' NA PACCE
Setiap warga ambalan wajib menjunjung tinggi falsafah budaya Bugis-Makassar:
1. Siri' (Harga Diri & Kehormatan): Rasa malu yang mendalam jika melanggar janji Tri Satya dan Dasa Darma Pramuka, serta tekad menjaga marwah sangga dan ambalan.
2. Pacce (Solidaritas & Empati): Kepedulian tanpa pamrih kepada sesama rekan ambalan yang tertimpa kesulitan atau kesusahan. Berat sama dipikul, ringan sama dijinjing.

BAB III: TATA TERTIB UPACARA DAN SANGGAR
1. Setiap anggota yang memasuki Sanggar Bakti wajib mengenakan pakaian rapi dan mengucapkan salam ambalan.
2. Tongkat, bendera ambalan, dan pusaka adat wajib dirawat dengan penuh kehormatan oleh Pemangku Adat.
3. Seluruh perselisihan antar anggota diselesaikan melalui musyawarah dewan kehormatan dengan prinsip tabayyun dan kekeluargaan.`,
        isiMateriAi: `### BAB I: DASAR HUKUM DAN PRINSIP DASAR
Adat Ambalan adalah seperangkat norma, nilai kehormatan, dan tata tertib yang disepakati secara musyawarah oleh seluruh warga Ambalan La Surullah Petta Lopo. Adat ini bertujuan membina budi pekerti luhur, kemandirian, dan keteguhan jiwa kepemimpinan kesatria.

### BAB II: PENGHAYATAN FALSAFAH SIRI' NA PACCE
Setiap warga ambalan wajib menjunjung tinggi falsafah budaya Bugis-Makassar:

• 1. Siri' (Harga Diri & Kehormatan): Rasa malu yang mendalam jika melanggar janji Tri Satya dan Dasa Darma Pramuka, serta tekad menjaga marwah sangga dan ambalan.
• 2. Pacce (Solidaritas & Empati): Kepedulian tanpa pamrih kepada sesama rekan ambalan yang tertimpa kesulitan atau kesusahan. Berat sama dipikul, ringan sama dijinjing.

### BAB III: TATA TERTIB UPACARA DAN SANGGAR
• 1. Setiap anggota yang memasuki Sanggar Bakti wajib mengenakan pakaian rapi dan mengucapkan salam ambalan.
• 2. Tongkat, bendera ambalan, dan pusaka adat wajib dirawat dengan penuh kehormatan oleh Pemangku Adat.
• 3. Seluruh perselisihan antar anggota diselesaikan melalui musyawarah dewan kehormatan dengan prinsip tabayyun dan kekeluargaan.`,
        ringkasan: 'Adat Ambalan adalah norma kehormatan yang mengintegrasikan Tri Satya, Dasa Darma, dan falsafah kesatria Siri\' na Pacce untuk membentuk karakter kepemimpinan Pramuka Penegak.',
        poinPenting: [
          'Adat disepakati secara musyawarah mufakat demi membina keluhuran budi pekerti',
          'Siri\' menanamkan integritas moral dan pantang melanggar sumpah pramuka',
          'Pacce memupuk solidaritas, persaudaraan, dan empati tanpa pamrih di sangga',
          'Tata tertib sanggar dan pusaka dijaga dengan penuh ketertiban oleh Pemangku Adat'
        ],
        tipsPramuka: [
          'Terapkan sikap hormat kepada yang lebih tua dan ayomi adik-adik penegak',
          'Jadikan musyawarah sebagai jalan utama setiap kali terjadi silang pendapat'
        ],
        tanggalDibuat: '2026-10-28',
        penulis: 'Dewan Kehormatan Ambalan'
      },
      {
        id: 'mat-2',
        judul: 'Modul Navigasi Darat: Kompas Bidik & Peta Topografi',
        kategori: 'Kepramukaan',
        tipeFormat: 'ai_generated',
        jumlahHalaman: 2,
        totalKata: 320,
        estimasiMenitBaca: 2,
        isiMateriOriginal: `PANDUAN NAVIGASI LAPANGAN PENEGAK

1. PENGERTIAN KOMPAS BIDIK
Kompas bidik adalah alat navigasi yang digunakan untuk menentukan arah mata angin dan membidik sasaran medan di alam terbuka dengan akurasi derajat tertentu.

2. CARA MEMBIDIK SASARAN
A. Buka penutup kompas tegak lurus ke atas.
B. Masukkan jempol ke dalam cincin pengait.
C. Dekatkan lensa pembidik ke mata dan arahkan kawat pembidik tepat ke objek sasaran medan (pohon besar, puncak bukit, dll).
D. Baca angka derajat pada piringan kompas melalui prisma pembesar.

3. RUMUS BACK AZIMUTH
Jika sudut bidik (Azimuth) < 180°, maka Back Azimuth = Azimuth + 180°.
Jika sudut bidik (Azimuth) > 180°, maka Back Azimuth = Azimuth - 180°.`,
        isiMateriAi: `### 1. PENGERTIAN KOMPAS BIDIK
Kompas bidik adalah alat navigasi yang digunakan untuk menentukan arah mata angin dan membidik sasaran medan di alam terbuka dengan akurasi derajat tertentu.

### 2. CARA MEMBIDIK SASARAN
• A. Buka penutup kompas tegak lurus ke atas.
• B. Masukkan jempol ke dalam cincin pengait.
• C. Dekatkan lensa pembidik ke mata dan arahkan kawat pembidik tepat ke objek sasaran medan (pohon besar, puncak bukit, dll).
• D. Baca angka derajat pada piringan kompas melalui prisma pembesar.

### 3. RUMUS BACK AZIMUTH
• Jika sudut bidik (Azimuth) < 180°, maka Back Azimuth = Azimuth + 180°.
• Jika sudut bidik (Azimuth) > 180°, maka Back Azimuth = Azimuth - 180°.`,
        ringkasan: 'Panduan operasional penggunaan kompas bidik medan dan perhitungan sudut azimuth serta back azimuth untuk penjelajahan alam bebas.',
        poinPenting: [
          'Kompas bidik menentukan sudut derajat objek terhadap arah utara magnetis',
          'Posisi jempol pada cincin menjaga stabilitas kompas saat proses membidik',
          'Rumus Back Azimuth dipakai untuk menentukan arah pulang atau jalur balik'
        ],
        tipsPramuka: [
          'Hindarkan kompas dari benda logam, sabuk besi, atau gawai elektronik saat membidik',
          'Selalu verifikasi koordinat medan sebelum sangga memulai perjalanan malam'
        ],
        tanggalDibuat: '2026-10-29',
        penulis: 'Seksi Giat Operasional'
      }
    ];
  });

  const [activeMateri, setActiveMateri] = useState<MateriBelajar | null>(materiList[0] || null);
  const [activeTabMode, setActiveTabMode] = useState<'ai' | 'original' | 'pdf'>('ai');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Reader Settings
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [hasCopied, setHasCopied] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [pdfReadProgress, setPdfReadProgress] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Form Inputs
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState('Kepramukaan');
  const [tipePilihan, setTipePilihan] = useState<'ai_generated' | 'original'>('ai_generated');
  const [isiTeks, setIsTeks] = useState('');
  const [penulis, setPenulis] = useState('Dewan Ambalan');
  
  // Uploaded PDF info
  const [uploadedPdf, setUploadedPdf] = useState<{
    dataUrl: string;
    fileName: string;
    fileSize: string;
    numPages?: number;
    wordCount?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Salin isi materi
  const handleCopyText = () => {
    if (!activeMateri) return;
    const content = activeTabMode === 'original' 
      ? (activeMateri.isiMateriOriginal || '') 
      : (activeMateri.isiMateriAi || activeMateri.isiMateriOriginal || '');
    
    navigator.clipboard.writeText(content);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Handle PDF / File Selection & Instant Client-side Text Extraction
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    // 1. Baca data URL untuk pratinjau & unduh
    const dataUrlPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // 2. Baca array buffer untuk ekstraksi teks langsung
    const arrayBufferPromise = new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    try {
      setIsReadingPdf(true);
      setPdfReadProgress('Membaca berkas dokumen...');

      const [dataUrl, arrayBuffer] = await Promise.all([dataUrlPromise, arrayBufferPromise]);

      setPdfReadProgress('Mengekstrak seluruh teks halaman dokumen PDF...');
      const extraction = await extractTextFromPdf(arrayBuffer);

      setUploadedPdf({
        dataUrl,
        fileName: file.name,
        fileSize: sizeStr,
        numPages: extraction.numPages,
        wordCount: extraction.wordCount,
      });

      // Otomatis masukkan isi teks yang diekstrak dari PDF
      if (extraction.text && extraction.text.trim().length > 0) {
        setIsTeks(extraction.text);
      }

      // Otomatis isi judul jika masih kosong
      if (!judul) {
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        setJudul(cleanTitle);
      }

      setIsReadingPdf(false);
      setPdfReadProgress('');
    } catch (err) {
      console.error('Gagal membaca PDF:', err);
      setIsReadingPdf(false);
      setPdfReadProgress('');
    }
  };

  // Simpan Materi (AI Mempercantik Penulisan Sesuai PDF Tanpa Mengubah Makna)
  const handleSimpanMateri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) return;

    const rawSource = isiTeks.trim();

    if (tipePilihan === 'ai_generated') {
      setIsProcessingAi(true);

      // AI mempercantik penulisan tanpa mengubah isi sesuai permintaan user
      await new Promise(r => setTimeout(r, 600));

      const { formattedContent, ringkasan, poinPenting, estimasiMenitBaca } = formatMateriCantik(
        rawSource || `Materi dokumen: ${judul.trim()}`,
        judul.trim()
      );

      const wordCount = rawSource.split(/\s+/).filter(Boolean).length;

      const newMateri: MateriBelajar = {
        id: `mat-${Date.now()}`,
        judul: judul.trim(),
        kategori,
        tipeFormat: 'ai_generated',
        pdfDataUrl: uploadedPdf?.dataUrl,
        pdfFileName: uploadedPdf?.fileName,
        pdfFileSize: uploadedPdf?.fileSize,
        jumlahHalaman: uploadedPdf?.numPages || 1,
        totalKata: wordCount,
        estimasiMenitBaca: estimasiMenitBaca,
        isiMateriOriginal: rawSource,
        isiMateriAi: formattedContent,
        ringkasan: ringkasan,
        poinPenting: poinPenting,
        tipsPramuka: [
          'Materi dibaca dan dipahami langsung tanpa harus membuka atau mendownload file PDF',
          'Diskusikan materi ini bersama rekan sangga dalam latihan rutin ambalan'
        ],
        tanggalDibuat: new Date().toISOString().split('T')[0],
        penulis: penulis.trim() || 'Ambalan La Surullah'
      };

      const updated = [newMateri, ...materiList];
      setMateriList(updated);
      localStorage.setItem('ambalan_ruang_belajar_v3', JSON.stringify(updated));
      setActiveMateri(newMateri);
      setActiveTabMode('ai');
      setIsProcessingAi(false);
      handleCloseModal();
    } else {
      // Simpan Original (apa adanya)
      const wordCount = rawSource.split(/\s+/).filter(Boolean).length;
      const newMateri: MateriBelajar = {
        id: `mat-${Date.now()}`,
        judul: judul.trim(),
        kategori,
        tipeFormat: 'original',
        pdfDataUrl: uploadedPdf?.dataUrl,
        pdfFileName: uploadedPdf?.fileName,
        pdfFileSize: uploadedPdf?.fileSize,
        jumlahHalaman: uploadedPdf?.numPages || 1,
        totalKata: wordCount,
        estimasiMenitBaca: Math.max(1, Math.ceil(wordCount / 200)),
        isiMateriOriginal: rawSource,
        poinPenting: ['Naskah asli sesuai dokumen sumber'],
        tanggalDibuat: new Date().toISOString().split('T')[0],
        penulis: penulis.trim() || 'Ambalan La Surullah'
      };

      const updated = [newMateri, ...materiList];
      setMateriList(updated);
      localStorage.setItem('ambalan_ruang_belajar_v3', JSON.stringify(updated));
      setActiveMateri(newMateri);
      setActiveTabMode('original');
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setJudul('');
    setIsTeks('');
    setUploadedPdf(null);
    setTipePilihan('ai_generated');
    setIsReadingPdf(false);
    setIsProcessingAi(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = materiList.filter(m => m.id !== id);
    setMateriList(updated);
    localStorage.setItem('ambalan_ruang_belajar_v3', JSON.stringify(updated));
    if (activeMateri?.id === id) {
      setActiveMateri(updated[0] || null);
    }
  };

  // Filter list
  const filteredMateri = materiList.filter(item => {
    const matchCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    const matchSearch = item.judul.toLowerCase().includes(search.toLowerCase()) ||
                        (item.ringkasan || '').toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categories = ['Semua', 'Kepramukaan', 'Pionering', 'Sandi & Morse', 'Sejarah & Adat', 'P3K & Survival'];

  const fontClass = fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className="space-y-4 pb-28">
      
      {/* Header Utama Ruang Belajar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-amber-400 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
              Perpustakaan & Ruang Baca Digital
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Membaca Tanpa Buka PDF
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1 flex items-center gap-1.5">
            <span>Ruang Belajar Materi Ambalan</span>
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Unggah dokumen PDF, sistem akan membaca teksnya dan AI akan mempercantik tata letak bacaan secara rapi tanpa mengubah isi aslinya.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#e51c24] hover:bg-[#c9141b] text-white text-xs font-black flex items-center gap-2 shadow-md border border-amber-400 active:scale-95 transition-transform shrink-0"
          >
            <FileUp className="w-4 h-4 text-amber-300" />
            <span>+ Upload PDF / Tambah Materi</span>
          </button>
        ) : (
          <span className="px-3.5 py-1.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 shrink-0">
            Mode Anggota (Hanya Baca)
          </span>
        )}
      </div>

      {/* Filter Kategori & Pencarian */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari materi pembelajaran, modul adat, SKU, kompas..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-2xl border-2 border-slate-200 text-xs focus:outline-none focus:border-amber-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#e51c24] text-white border border-amber-400 shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TAMPILAN PEMBACA MATERI UTAMA (LANGSUNG DIBACA TANPA BUKA PDF) */}
      {activeMateri ? (
        <div className="bg-white rounded-3xl border-2 border-amber-400 shadow-md p-4 sm:p-6 space-y-4">
          
          {/* Header Kartu Bacaan */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-[#e51c24] border border-red-200">
                  {activeMateri.kategori}
                </span>

                {activeMateri.tipeFormat === 'ai_generated' ? (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Penulisan Cantik (AI) Sesuai Dokumen
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Naskah Asli PDF
                  </span>
                )}

                {activeMateri.pdfFileName && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {activeMateri.pdfFileName}
                  </span>
                )}
              </div>

              {/* Toolbar Pembaca: Ukuran Teks & Tombol Salin */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button
                  title="Ukuran Teks Kecil"
                  onClick={() => setFontSize('sm')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg ${fontSize === 'sm' ? 'bg-amber-400 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  A-
                </button>
                <button
                  title="Ukuran Teks Sedang"
                  onClick={() => setFontSize('base')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg ${fontSize === 'base' ? 'bg-amber-400 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  A
                </button>
                <button
                  title="Ukuran Teks Besar"
                  onClick={() => setFontSize('lg')}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg ${fontSize === 'lg' ? 'bg-amber-400 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  A+
                </button>

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <button
                  onClick={handleCopyText}
                  title="Salin Teks Materi"
                  className="px-2 py-1 text-slate-600 hover:text-[#e51c24] flex items-center gap-1 text-[11px] font-bold"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 text-[10px]">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <h2 className="text-base sm:text-xl font-black text-slate-900 mt-2 leading-tight">
              {activeMateri.judul}
            </h2>

            {/* Metadata Dokumen */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                ± {activeMateri.estimasiMenitBaca || 3} menit baca
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {activeMateri.jumlahHalaman || 1} Halaman Dokumen
              </span>
              <span>•</span>
              <span>Penulis: <strong className="text-slate-700">{activeMateri.penulis}</strong></span>
              <span>•</span>
              <span>Diperbarui: {activeMateri.tanggalDibuat}</span>
            </div>
          </div>

          {/* TAB NAVIGASI PEMBACA */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTabMode('ai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                activeTabMode === 'ai'
                  ? 'bg-[#e51c24] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Bacaan Cantik & Rapi (AI)</span>
            </button>

            <button
              onClick={() => setActiveTabMode('original')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTabMode === 'original'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Teks Asli Dokumen</span>
            </button>

            {activeMateri.pdfDataUrl && (
              <button
                onClick={() => setActiveTabMode('pdf')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ml-auto ${
                  activeTabMode === 'pdf'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Berkas Asli PDF</span>
              </button>
            )}
          </div>

          {/* KONTEN MODE 1: BACAAN CANTIK (AI MEMPERCANTIK PENULISAN SESUAI PDF TANPA MENGUBAH) */}
          {activeTabMode === 'ai' && (
            <div className="space-y-4">
              
              {/* Box Info: Konfirmasi Pembaca */}
              <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <BookMarked className="w-4 h-4 text-[#e51c24] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Membaca langsung dari dokumen:</span> Materi di bawah ini ditata dengan tata letak yang indah dan nyaman dibaca langsung dari layar Anda tanpa harus membuka berkas PDF. Seluruh isi dan makna naskah tetap utuh 100%.
                </div>
              </div>

              {/* Ringkasan Intisari */}
              {activeMateri.ringkasan && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                  <strong className="text-slate-900 font-bold block mb-1">
                    Ringkasan Intisari Dokumen:
                  </strong>
                  {activeMateri.ringkasan}
                </div>
              )}

              {/* Poin-Poin Penting Pembelajaran */}
              {activeMateri.poinPenting && activeMateri.poinPenting.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300">
                  <h3 className="text-xs font-black text-amber-950 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-[#e51c24]" />
                    Poin Utama Yang Harus Dikuasai:
                  </h3>
                  <ul className="space-y-1.5 text-xs text-amber-900 font-medium">
                    {activeMateri.poinPenting.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#e51c24] font-bold text-sm leading-none">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Naskah Lengkap yang Dipercantik Tata Letaknya */}
              <div className={`text-slate-800 leading-relaxed space-y-3 font-normal p-2 rounded-2xl bg-white border border-slate-100 ${fontClass}`}>
                {activeMateri.isiMateriAi ? (
                  activeMateri.isiMateriAi.split('\n\n').map((block, idx) => {
                    const trimmed = block.trim();
                    if (trimmed.startsWith('###')) {
                      return (
                        <div key={idx} className="pt-3 pb-1 border-b border-amber-200">
                          <h3 className="font-black text-[#e51c24] tracking-wide text-xs sm:text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#e51c24]" />
                            <span>{trimmed.replace(/^###\s*/, '')}</span>
                          </h3>
                        </div>
                      );
                    }
                    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                      return (
                        <div key={idx} className="pl-3 border-l-2 border-amber-400 py-0.5 bg-amber-50/30 rounded-r-lg my-1">
                          <p className="font-medium text-slate-800">{trimmed}</p>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-slate-700 leading-relaxed text-justify">
                        {trimmed}
                      </p>
                    );
                  })
                ) : (
                  <p className="whitespace-pre-line text-slate-700">
                    {activeMateri.isiMateriOriginal}
                  </p>
                )}
              </div>

              {/* Penerapan Praktik di Ambalan */}
              {activeMateri.tipsPramuka && activeMateri.tipsPramuka.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950">
                  <h4 className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Penerapan Praktik di Ambalan:
                  </h4>
                  <ul className="space-y-1 pl-4 list-disc text-emerald-900">
                    {activeMateri.tipsPramuka.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {/* KONTEN MODE 2: TEKS ASLI DOKUMEN (APA ADANYA TANPA FORMATTING TAMBAHAN) */}
          {activeTabMode === 'original' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="font-bold">Naskah Asli Sesuai Teks Terbaca Dari PDF</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activeMateri.totalKata || 0} Kata
                </span>
              </div>

              <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono whitespace-pre-wrap leading-relaxed text-slate-800 ${fontClass}`}>
                {activeMateri.isiMateriOriginal || 'Tidak ada naskah teks tersimpan.'}
              </div>
            </div>
          )}

          {/* KONTEN MODE 3: BERKAS ASLI PDF (VIEWER & DOWNLOAD) */}
          {activeTabMode === 'pdf' && activeMateri.pdfDataUrl && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#e51c24]" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{activeMateri.pdfFileName || 'dokumen-materi.pdf'}</p>
                    <p className="text-[10px] text-slate-500">Ukuran Berkas: {activeMateri.pdfFileSize || '-'}</p>
                  </div>
                </div>

                <a
                  href={activeMateri.pdfDataUrl}
                  download={activeMateri.pdfFileName || 'materi-pramuka.pdf'}
                  className="px-3 py-1.5 rounded-xl bg-[#e51c24] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#c9141b] shadow-xs active:scale-95 transition-transform"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File PDF</span>
                </a>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 h-96 w-full">
                <object
                  data={activeMateri.pdfDataUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-xs text-slate-600">
                    <FileText className="w-8 h-8 text-slate-400 mb-1" />
                    <p className="font-bold">File Dokumen PDF Tersedia</p>
                    <p className="text-[11px] text-slate-500 mt-1">Anda juga dapat membaca materi ini langsung dengan format rapi melalui tab "Bacaan Cantik & Rapi (AI)" di atas.</p>
                    <a
                      href={activeMateri.pdfDataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                    >
                      Buka Dokumen PDF
                    </a>
                  </div>
                </object>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Pilih salah satu materi di bawah untuk mulai membaca tanpa membuka PDF.</p>
        </div>
      )}

      {/* DAFTAR MATERI PERPUSTAKAAN */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5 text-[#e51c24]" />
            Daftar Modul & Materi ({filteredMateri.length})
          </h3>
          <span className="text-[10px] text-slate-400">Sentuh untuk membaca</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredMateri.map((materi) => (
            <div
              key={materi.id}
              onClick={() => setActiveMateri(materi)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                activeMateri?.id === materi.id
                  ? 'border-[#e51c24] bg-red-50/40 shadow-sm ring-2 ring-red-100'
                  : 'border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {materi.kategori}
                </span>

                <div className="flex items-center gap-1">
                  {materi.tipeFormat === 'ai_generated' ? (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                      Format Cantik
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      Asli
                    </span>
                  )}
                </div>
              </div>

              <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2">
                {materi.judul}
              </h4>

              {materi.ringkasan && (
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {materi.ringkasan}
                </p>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  ± {materi.estimasiMenitBaca || 2} mnt baca
                </span>
                
                <span className="text-[#e51c24] font-bold flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  Baca Sekarang
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL UPLOAD DOKUMEN & AI FORMATTER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 border-2 border-amber-400 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-[#e51c24]">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Upload Dokumen & Bacaan Materi</h2>
                  <p className="text-[10px] text-slate-500">AI membaca teks PDF & mempercantik penulisan tanpa mengubah isi</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpanMateri} className="mt-3.5 space-y-3.5">
              
              {/* 1. UPLOAD FILE PDF (AKAN DIBACA LANGSUNG OLEH SISTEM) */}
              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">
                  Pilih Dokumen PDF (Sistem akan membaca isi file):
                </label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/40 hover:bg-amber-50 cursor-pointer text-center space-y-1.5 transition-colors"
                >
                  {isReadingPdf ? (
                    <div className="py-2 space-y-2">
                      <Loader2 className="w-7 h-7 text-[#e51c24] animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-800">{pdfReadProgress}</p>
                      <p className="text-[10px] text-slate-500">Mengekstrak teks halaman per halaman secara akurat...</p>
                    </div>
                  ) : uploadedPdf ? (
                    <div className="space-y-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-black text-slate-900">
                        {uploadedPdf.fileName}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold">
                        ✓ Berhasil Dibaca: {uploadedPdf.numPages || 1} Halaman ({uploadedPdf.wordCount?.toLocaleString() || 0} Kata diekstrak)
                      </p>
                      <span className="inline-block text-[9px] text-slate-400 underline mt-1">
                        Klik untuk mengganti berkas PDF
                      </span>
                    </div>
                  ) : (
                    <>
                      <FileUp className="w-7 h-7 text-[#e51c24] mx-auto" />
                      <p className="text-xs font-bold text-slate-800">
                        Pilih Berkas PDF Materi Pramuka
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Sistem akan membaca naskah PDF secara otomatis untuk dijadikan bahan bacaan di aplikasi
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf, text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadedPdf && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedPdf(null);
                      setIsTeks('');
                    }}
                    className="mt-1 text-[10px] text-rose-600 font-bold hover:underline"
                  >
                    ✕ Hapus berkas PDF
                  </button>
                )}
              </div>

              {/* 2. PILIHAN OPSI PENULISAN: AI GENERATED vs ORIGINAL */}
              <div>
                <label className="text-[11px] font-bold text-slate-800 block mb-1">
                  Format Penampilan Materi: *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setTipePilihan('ai_generated')}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      tipePilihan === 'ai_generated'
                        ? 'border-[#e51c24] bg-red-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs text-[#e51c24]">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>AI Generated (Cantik)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                      Mempercantik penulisan, judul & poin bacaan sesuai PDF <strong>tanpa mengubah makna asli</strong>.
                    </p>
                  </div>

                  <div
                    onClick={() => setTipePilihan('original')}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      tipePilihan === 'original'
                        ? 'border-amber-400 bg-amber-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Format Asli (Original)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                      Menyimpan teks apa adanya persis seperti naskah sumber tanpa penyesuaian visual.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. JUDUL & KATEGORI */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Judul Modul / Materi: *
                </label>
                <input
                  type="text"
                  required
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Modul Teknik Pioneering & Ikatan Tiang"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Kategori:
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                  >
                    <option value="Kepramukaan">Kepramukaan Umum</option>
                    <option value="Pionering">Pionering & Tali Temali</option>
                    <option value="Sandi & Morse">Sandi & Komunikasi</option>
                    <option value="Sejarah & Adat">Sejarah & Adat Ambalan</option>
                    <option value="P3K & Survival">P3K & Survival Rimba</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Penyusun / Penulis:
                  </label>
                  <input
                    type="text"
                    value={penulis}
                    onChange={(e) => setPenulis(e.target.value)}
                    placeholder="Contoh: Pembina / Dewan Ambalan"
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* 4. TEKS HASIL EKSTRAKSI PDF / INPUT BEBAS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Isi Materi Terbaca (Bebas Panjang Tanpa Batas):
                  </label>
                  {isiTeks && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isiTeks.split(/\s+/).filter(Boolean).length} kata
                    </span>
                  )}
                </div>
                
                <textarea
                  rows={4}
                  value={isiTeks}
                  onChange={(e) => setIsTeks(e.target.value)}
                  placeholder="Teks dari PDF yang diunggah akan otomatis terbaca dan terisi di sini. Anda juga dapat mengetik atau menempel materi tambahan..."
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400 font-mono leading-relaxed"
                />
                
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>AI akan mempercantik tata letak bacaan ini agar nyaman dibaca langsung di HP tanpa harus membuka file PDF aslinya.</span>
                </p>
              </div>

              {/* TOMBOL SIMPAN */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isProcessingAi || isReadingPdf || (!isiTeks.trim() && !uploadedPdf)}
                  className="px-4 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-black border border-amber-400 hover:bg-[#c9141b] flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isProcessingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                      <span>AI Sedang Menata Bacaan...</span>
                    </>
                  ) : tipePilihan === 'ai_generated' ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Cantikkan Penulisan & Simpan</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 text-white" />
                      <span>Simpan Naskah Asli</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
