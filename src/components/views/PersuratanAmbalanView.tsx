import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { createLetterPdf, PdfExportStageError } from '../../services/pdfLetterGenerator';
import { deliverPdfFile } from '../../services/pdfFileDelivery';
import { UserAccount, ProgramKerjaItem } from '../../types';
import { askKakCikalAI } from '../../services/aiChatService';
import { getMabigusOfficials, MabigusOfficials } from '../../data/mabigusData';
import { get8DewanPositions, Dewan8Position } from '../../data/dewanStructure';
import { TUNAS_KELAPA_BASE64, WOSM_BASE64 } from '../../data/letterAssets';

interface PersuratanAmbalanViewProps {
  currentUser?: UserAccount;
  allMembers?: UserAccount[];
  programKerjaList?: ProgramKerjaItem[];
  onBack?: () => void;
}

export type DigitalSignerType = 'kepala_sekolah' | 'pembina_putra' | 'pembina_putri';

export interface GeneratedSurat {
  id: string;
  nomorSurat: string;
  nomorUrut: string;
  perihal: string;
  lampiran: string;
  keteranganIdentitas: string;
  tanggalSurat: string;
  gudepType: '10.035' | '10.036' | '10.035-10.036';
  
  // Toggle circular inclusions
  includeNomor: boolean;
  includeTanggal: boolean;
  includePerihal: boolean;
  includeLampiran: boolean;
  includeKeteranganIdentitas: boolean;
  includeKepadaYth: boolean;
  penerimaNama: string;
  penerimaTempat: string;
  
  // Isi Surat
  isiParagraf: string;
  bulletStyle: 'titik' | 'nomor' | 'abcd' | 'strip';
  rincianHariTanggal: string;
  rincianWaktu: string;
  includeTempat: boolean;
  rincianTempat: string;
  includeKeteranganAcara: boolean;
  rincianKeteranganAcara: string;
  penutupParagraf: string;

  // Pengesahan (Semua yang bertanda tangan harus dipilih)
  includeDewan: boolean; // Opsional
  dewanJabatan: string;
  dewanNama: string;
  dewanNta: string;
  
  includePembina: boolean;
  pembinaJabatan: string;
  pembinaNama: string;
  pembinaNip?: string;
  includePembinaTambahan?: boolean;
  pembinaTambahanJabatan?: string;
  pembinaTambahanNama?: string;
  pembinaTambahanNip?: string;

  includeKetuaGudep: boolean; // Pilihan
  ketuaGudepNama: string;
  ketuaGudepNip?: string;

  metodeTtd: 'biasa' | 'digital' | 'stempel';
  digitalSigner: DigitalSignerType;
  digitalSignerName: string;
  digitalSignerTitle: string;
  
  qrCodeDataUrl?: string;
  includeStempel: boolean;
  
  includeTembusan: boolean;
  tembusanList: string[];
  approvalType?: 'Mengetahui' | 'Menyetujui';
  dewanApprovalType?: 'Mengetahui' | 'Menyetujui';
  pembinaApprovalType?: 'Mengetahui' | 'Menyetujui';
  pembinaTambahanApprovalType?: 'Mengetahui' | 'Menyetujui';
  ketuaGudepApprovalType?: 'Mengetahui' | 'Menyetujui';
  kotaPengesahan?: string;
  createdAt: string;
}

interface FormDraft { id: string; perihal: string; nomorUrut: string; savedAt: string; data: Record<string, unknown>; }

const STORAGE_KEY_DRAFT = 'pettalopo_draf_surat_v1';
const STORAGE_KEY_SURAT = 'pettalopo_arsip_surat_resmi_v5';

export const PersuratanAmbalanView: React.FC<PersuratanAmbalanViewProps> = ({
  allMembers = [],
  programKerjaList = [],
  onBack
}) => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'form' | 'preview' | 'list' | 'drafts'>('dashboard');
  const [officials, setOfficials] = useState<MabigusOfficials>(getMabigusOfficials());
  const [dewanList, setDewanList] = useState<Dewan8Position[]>(get8DewanPositions());

  // Arsip Surat
  const [arsipSurat, setArsipSurat] = useState<GeneratedSurat[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURAT);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [draftSurat, setDraftSurat] = useState<FormDraft[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY_DRAFT) || '[]'); } catch { return []; } });
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Load latest officials and dewan
  useEffect(() => {
    setOfficials(getMabigusOfficials());
    setDewanList(get8DewanPositions());
  }, []);

  // --- BAGIAN 1: IDENTITAS (Google Form style dengan toggle lingkaran di samping) ---
  const [includeNomor, setIncludeNomor] = useState(true);
  const [nomorUrut, setNomorUrut] = useState('024');
  const [gudepPilihan, setGudepPilihan] = useState<'10.035' | '10.036' | '10.035-10.036'>('10.035-10.036');
  const [ceklisDuaDua, setCeklisDuaDua] = useState(false); // Mode generate 2 surat terpisah

  const [includeTanggal, setIncludeTanggal] = useState(true);
  const [tanggalSurat, setTanggalSurat] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  });

  const [includePerihal, setIncludePerihal] = useState(true);
  const [perihal, setPerihal] = useState('Permohonan Izin Kegiatan & Bantuan');

  const [includeLampiran, setIncludeLampiran] = useState(false);
  const [lampiran, setLampiran] = useState('1 (Satu) Berkas Proposal');

  const [includeKeteranganIdentitas, setIncludeKeteranganIdentitas] = useState(false);
  const [keteranganIdentitas, setKeteranganIdentitas] = useState('Penting / Segera');

  const [includeKepadaYth, setIncludeKepadaYth] = useState(true);
  const [penerimaNama, setPenerimaNama] = useState('Kepala SMA Negeri 9 Maros');
  const [penerimaTempat, setPenerimaTempat] = useState('di - Tempat');

  // --- BAGIAN 2: ISI SURAT ---
  const [isiParagraf, setIsiParagraf] = useState(
    'Sehubungan dengan pelaksanaan program kerja Gerakan Pramuka Ambalan La Surullah Petta Lopo Pangkalan SMA Negeri 9 Maros masa bakti 2026/2027, dengan ini kami sampaikan bahwa akan diselenggarakan kegiatan pembinaan dengan rincian sebagai berikut:'
  );

  const [bulletStyle, setBulletStyle] = useState<'titik' | 'nomor' | 'abcd' | 'strip'>('titik');
  const [rincianHariTanggal, setRincianHariTanggal] = useState('Sabtu s.d. Minggu, 21 - 22 November 2026');
  const [rincianWaktu, setRincianWaktu] = useState('08.00 WITA s.d. Selesai');
  const [includeTempat, setIncludeTempat] = useState(true);
  const [rincianTempat, setRincianTempat] = useState('Sanggar Bakti Pramuka SMA Negeri 9 Maros');
  const [includeKeteranganAcara, setIncludeKeteranganAcara] = useState(true);
  const [rincianKeteranganAcara, setRincianKeteranganAcara] = useState('Latihan Gabungan & Pemantapan Tata Adat Ambalan');

  const [penutupParagraf, setPenutupParagraf] = useState(
    'Demikian surat ini kami sampaikan, atas perhatian, dukungan, dan kerja sama Kakak kami ucapkan terima kasih.'
  );

  // --- BAGIAN 3: PENGESAHAN & PENANDATANGAN ---
  // Dewan Ambalan (OPSIONAL: jika diceklis, WAJIB pilih nama via dropdown)
  const [includeDewan, setIncludeDewan] = useState(false); // Opsional
  const [selectedDewanId, setSelectedDewanId] = useState<string>('pradana_pa');
  const [customSignerName, setCustomSignerName] = useState('');

  // Pembina (BISA DIPILIH: default aktif)
  const [includePembina, setIncludePembina] = useState(true);
  const [selectedPembinaRole, setSelectedPembinaRole] = useState<'pembina_pa' | 'pembina_pi' | 'pembantu_pa' | 'pembantu_pi'>('pembina_pa');

  // Ketua Gugus Depan (BISA DIPILIH: default aktif)
  const [includeKetuaGudep, setIncludeKetuaGudep] = useState(true);
  const [approvalType, setApprovalType] = useState<'Mengetahui' | 'Menyetujui'>('Mengetahui');
  const [dewanApprovalType, setDewanApprovalType] = useState<'Mengetahui' | 'Menyetujui'>('Mengetahui');
  const [pembinaApprovalType, setPembinaApprovalType] = useState<'Mengetahui' | 'Menyetujui'>('Mengetahui');
  const [pembinaTambahanApprovalType, setPembinaTambahanApprovalType] = useState<'Mengetahui' | 'Menyetujui'>('Mengetahui');
  const [ketuaGudepApprovalType, setKetuaGudepApprovalType] = useState<'Mengetahui' | 'Menyetujui'>('Mengetahui');
  const [kotaPengesahan, setKotaPengesahan] = useState('Maros');

  // Metode Pengesahan
  const [metodeTtd, setMetodeTtd] = useState<'biasa' | 'digital' | 'stempel'>('digital');
  const [digitalSigner, setDigitalSigner] = useState<DigitalSignerType>('pembina_putra');
  const [includeStempel, setIncludeStempel] = useState(true);

  // Tembusan
  const [includeTembusan, setIncludeTembusan] = useState(true);
  const [tembusanInput, setTembusanInput] = useState('');
  const [tembusanList, setTembusanList] = useState<string[]>([
    'Kepala UPT SMA Negeri 9 Maros (selaku Kamabigus)',
    'Kwartir Ranting Gerakan Pramuka Marusu',
    'Arsip Ambalan'
  ]);

  // Preview & Printing state
  const [previewSuratList, setPreviewSuratList] = useState<GeneratedSurat[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState('');
  
  // AI Generation Progress State (0 - 100%)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGeneratingTitle, setAiGeneratingTitle] = useState('');
  
  // Verification Modal State
  const [verificationModalSurat, setVerificationModalSurat] = useState<GeneratedSurat | null>(null);

  const letterRef = useRef<HTMLDivElement | null>(null);

  // Helpers for bullet indicators
  const getBulletPrefix = (style: 'titik' | 'nomor' | 'abcd' | 'strip', index: number) => {
    switch (style) {
      case 'titik': return '•';
      case 'nomor': return `${index + 1}.`;
      case 'abcd': return `${String.fromCharCode(97 + index)}.`;
      case 'strip': return '-';
      default: return '•';
    }
  };

  // Add Tembusan item
  const handleAddTembusan = () => {
    if (!tembusanInput.trim()) return;
    setTembusanList([...tembusanList, tembusanInput.trim()]);
    setTembusanInput('');
  };

  const handleRemoveTembusan = (idx: number) => {
    setTembusanList(tembusanList.filter((_, i) => i !== idx));
  };

  // AI paragraph assist dengan visual progress bar 0 - 100%
  const handleGenerateAiParagraph = async (type: 'isi' | 'penutup') => {
    setIsGeneratingAi(true);
    setAiProgress(5);
    setAiGeneratingTitle(
      type === 'isi' 
        ? 'Kak Cikal AI Sedang Merancang Paragraf Isi Surat...' 
        : 'Kak Cikal AI Sedang Menyusun Paragraf Penutup Surat...'
    );

    // Progress counter interval
    const interval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev < 30) return prev + 12;
        if (prev < 65) return prev + 8;
        if (prev < 88) return prev + 4;
        if (prev < 95) return prev + 1;
        return prev;
      });
    }, 120);

    try {
      const prompt = type === 'isi'
        ? `Buat kalimat pembuka dan isi surat resmi Gerakan Pramuka untuk perihal: "${perihal}". Bahasa baku, sopan, bernuansa kepramukaan, singkat dan padat 2-3 kalimat.`
        : `Buat 1 kalimat penutup resmi surat pramuka yang santun dan padat.`;
      
      const res = await askKakCikalAI({ prompt, programKerjaList, actionType: 'rancang' });

      clearInterval(interval);
      setAiProgress(100);

      // Berikan jeda 400ms agar user melihat 100% selesai
      setTimeout(() => {
        if (res) {
          if (type === 'isi') {
            setIsiParagraf(res.replace(/^Salam Pramuka.*?\n+/i, '').trim());
          } else {
            setPenutupParagraf(res.trim());
          }
        }
        setIsGeneratingAi(false);
      }, 400);

    } catch {
      clearInterval(interval);
      setAiProgress(100);
      setTimeout(() => {
        if (type === 'isi') {
          setIsiParagraf(`Sehubungan dengan pelaksanaan agenda Gerakan Pramuka Gugus Depan Pangkalan SMA Negeri 9 Maros, bersama surat ini kami bermaksud menyampaikan ${perihal}.`);
        } else {
          setPenutupParagraf('Demikian surat ini kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.');
        }
        setIsGeneratingAi(false);
      }, 400);
    }
  };

  // Build Surat
  const handleGenerateSurat = async (e: React.FormEvent) => {
    e.preventDefault();

    // Resolve Dewan (Hanya jika includeDewan aktif)
    const customSignerRoles: Record<string, string> = { ketua_sangga_kerja: 'Ketua Sangga Kerja', sekretaris_sangga_kerja: 'Sekretaris Sangga Kerja', ketua_panitia: 'Ketua Panitia', sekretaris_panitia: 'Sekretaris Panitia' };
    const currentDewan = dewanList.find(d => d.id === selectedDewanId) || dewanList[0];
    const dewanNama = customSignerRoles[selectedDewanId] ? customSignerName.trim() : (currentDewan?.memberName || '');
    const dewanJabatan = customSignerRoles[selectedDewanId] || currentDewan?.jabatan || '';
    const dewanNta = customSignerRoles[selectedDewanId] ? '' : (currentDewan?.satuan === 'Putra' ? 'NTA. 10.035.001' : 'NTA. 10.036.001');

    // Resolve Pembina
    let pembinaNama = officials.pembinaPutra;
    let pembinaJabatan = 'Pembina Gugus Depan 10.035';
    let pembinaNip = officials.nipPembinaPutra;

    if (selectedPembinaRole === 'pembina_pi') {
      pembinaNama = officials.pembinaPutri;
      pembinaJabatan = 'Pembina Gugus Depan 10.036';
      pembinaNip = officials.nipPembinaPutri;
    } else if (selectedPembinaRole === 'pembantu_pa') {
      pembinaNama = officials.pembantuPembinaPutra;
      pembinaJabatan = 'Pembantu Pembina Putra 10.035';
      pembinaNip = undefined;
    } else if (selectedPembinaRole === 'pembantu_pi') {
      pembinaNama = officials.pembantuPembinaPutri;
      pembinaJabatan = 'Pembantu Pembina Putri 10.036';
      pembinaNip = undefined;
    }

    // Resolve Digital Signer
    let signerName = officials.pembinaPutra;
    let signerTitle = 'Pembina Putra Gugus Depan 10.035';
    if (digitalSigner === 'kepala_sekolah') {
      signerName = officials.ketuaGudep;
      signerTitle = 'Kepala SMA Negeri 9 Maros (Mabigus)';
    } else if (digitalSigner === 'pembina_putri') {
      signerName = officials.pembinaPutri;
      signerTitle = 'Pembina Putri Gugus Depan 10.036';
    }

    if (!kotaPengesahan.trim()) { alert('Isi kota pengesahan terlebih dahulu.'); return; }
    if (includeDewan && customSignerRoles[selectedDewanId] && !customSignerName.trim()) { alert('Nama penandatangan wajib diisi untuk jabatan yang dipilih.'); return; }
    const createdList: GeneratedSurat[] = [];

    // If ceklis dua-dua is active: generate 2 letters (10.035 for Putra and 10.036 for Putri)
    if (ceklisDuaDua) {
      // 1. Gudep 10.035 (Putra)
      const idPa = `surat_${Date.now()}_pa`;
      const nomorPa = `${nomorUrut}/10.035/C/2026`;
      const qrDataUrlPa = await QRCode.toDataURL(
        JSON.stringify({ id: idPa, no: nomorPa, p: perihal, t: tanggalSurat, s: officials.pembinaPutra }),
        { width: 140, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
      );

      createdList.push({
        id: idPa,
        nomorSurat: nomorPa,
        nomorUrut,
        perihal,
        lampiran,
        keteranganIdentitas,
        tanggalSurat,
        gudepType: '10.035',
        includeNomor,
        includeTanggal,
        includePerihal,
        includeLampiran,
        includeKeteranganIdentitas,
        includeKepadaYth,
        penerimaNama,
        penerimaTempat,
        isiParagraf: isiParagraf.replace(/^Salam Pramuka[,.]?\s*/i, ''),
        bulletStyle,
        rincianHariTanggal,
        rincianWaktu,
        includeTempat,
        rincianTempat,
        includeKeteranganAcara,
        rincianKeteranganAcara,
        penutupParagraf,
        includeDewan,
        dewanJabatan: 'Pradana Putra',
        dewanNama: dewanList.find(d => d.id === 'pradana_pa')?.memberName || 'Amiruddin S.',
        dewanNta: 'NTA. 10.035.001',
        approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, ketuaGudepApprovalType, kotaPengesahan,
        includePembina,
        pembinaJabatan: 'Pembina Gugus Depan 10.035',
        pembinaNama: officials.pembinaPutra,
        pembinaNip: officials.nipPembinaPutra,
        includeKetuaGudep,
        ketuaGudepNama: officials.ketuaGudep,
        ketuaGudepNip: officials.nipKetuaGudep,
        metodeTtd,
        digitalSigner: 'pembina_putra',
        digitalSignerName: officials.pembinaPutra,
        digitalSignerTitle: 'Pembina Putra Gugus Depan 10.035',
        qrCodeDataUrl: qrDataUrlPa,
        includeStempel,
        includeTembusan,
        tembusanList,
        createdAt: new Date().toISOString()
      });

      // 2. Gudep 10.036 (Putri)
      const idPi = `surat_${Date.now()}_pi`;
      const nomorPi = `${nomorUrut}/10.036/C/2026`;
      const qrDataUrlPi = await QRCode.toDataURL(
        JSON.stringify({ id: idPi, no: nomorPi, p: perihal, t: tanggalSurat, s: officials.pembinaPutri }),
        { width: 140, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
      );

      createdList.push({
        id: idPi,
        nomorSurat: nomorPi,
        nomorUrut,
        perihal,
        lampiran,
        keteranganIdentitas,
        tanggalSurat,
        gudepType: '10.036',
        includeNomor,
        includeTanggal,
        includePerihal,
        includeLampiran,
        includeKeteranganIdentitas,
        includeKepadaYth,
        penerimaNama,
        penerimaTempat,
        isiParagraf: isiParagraf.replace(/^Salam Pramuka[,.]?\s*/i, ''),
        bulletStyle,
        rincianHariTanggal,
        rincianWaktu,
        includeTempat,
        rincianTempat,
        includeKeteranganAcara,
        rincianKeteranganAcara,
        penutupParagraf,
        includeDewan,
        dewanJabatan: 'Pradana Putri',
        dewanNama: dewanList.find(d => d.id === 'pradana_pi')?.memberName || 'Nurhaliza Azzahra',
        dewanNta: 'NTA. 10.036.001',
        approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, ketuaGudepApprovalType, kotaPengesahan,
        includePembina,
        pembinaJabatan: 'Pembina Gugus Depan 10.036',
        pembinaNama: officials.pembinaPutri,
        pembinaNip: officials.nipPembinaPutri,
        includeKetuaGudep,
        ketuaGudepNama: officials.ketuaGudep,
        ketuaGudepNip: officials.nipKetuaGudep,
        metodeTtd,
        digitalSigner: 'pembina_putri',
        digitalSignerName: officials.pembinaPutri,
        digitalSignerTitle: 'Pembina Putri Gugus Depan 10.036',
        qrCodeDataUrl: qrDataUrlPi,
        includeStempel,
        includeTembusan,
        tembusanList,
        createdAt: new Date().toISOString()
      });
    } else {
      // Single Surat
      const id = `surat_${Date.now()}`;
      const nomor = `${nomorUrut}/${gudepPilihan}/C/2026`;
      const qrDataUrl = await QRCode.toDataURL(
        JSON.stringify({ id, no: nomor, p: perihal, t: tanggalSurat, s: signerName }),
        { width: 140, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
      );

      createdList.push({
        id,
        nomorSurat: nomor,
        nomorUrut,
        perihal,
        lampiran,
        keteranganIdentitas,
        tanggalSurat,
        gudepType: gudepPilihan,
        includeNomor,
        includeTanggal,
        includePerihal,
        includeLampiran,
        includeKeteranganIdentitas,
        includeKepadaYth,
        penerimaNama,
        penerimaTempat,
        isiParagraf: isiParagraf.replace(/^Salam Pramuka[,.]?\s*/i, ''),
        bulletStyle,
        rincianHariTanggal,
        rincianWaktu,
        includeTempat,
        rincianTempat,
        includeKeteranganAcara,
        rincianKeteranganAcara,
        penutupParagraf,
        includeDewan,
        dewanJabatan,
        dewanNama,
        dewanNta,
        approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, ketuaGudepApprovalType, kotaPengesahan,
        includePembina,
        pembinaJabatan,
        pembinaNama,
        pembinaNip,
        includePembinaTambahan: includePembina && gudepPilihan === '10.035-10.036',
        pembinaTambahanJabatan: selectedPembinaRole === 'pembina_pi' ? 'Pembina Gugus Depan 10.035' : 'Pembina Gugus Depan 10.036',
        pembinaTambahanNama: selectedPembinaRole === 'pembina_pi' ? officials.pembinaPutra : officials.pembinaPutri,
        pembinaTambahanNip: selectedPembinaRole === 'pembina_pi' ? officials.nipPembinaPutra : officials.nipPembinaPutri,
        includeKetuaGudep,
        ketuaGudepNama: officials.ketuaGudep,
        ketuaGudepNip: officials.nipKetuaGudep,
        metodeTtd,
        digitalSigner,
        digitalSignerName: signerName,
        digitalSignerTitle: signerTitle,
        qrCodeDataUrl: qrDataUrl,
        includeStempel,
        includeTembusan,
        tembusanList,
        createdAt: new Date().toISOString()
      });
    }

    const updated = [...createdList, ...arsipSurat];
    setArsipSurat(updated);
    try { localStorage.setItem(STORAGE_KEY_SURAT, JSON.stringify(updated)); } catch {}
    if (editingDraftId) { const remainingDrafts = draftSurat.filter((draft) => draft.id !== editingDraftId); setDraftSurat(remainingDrafts); try { localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(remainingDrafts)); } catch {} setEditingDraftId(null); }
    setPreviewSuratList(createdList);
    setActivePreviewIndex(0);
    setViewMode('preview');
  };


  const handleSaveDraft = () => {
    const data = { includeNomor, nomorUrut, gudepPilihan, ceklisDuaDua, includeTanggal, tanggalSurat, includePerihal, perihal, includeLampiran, lampiran, includeKeteranganIdentitas, keteranganIdentitas, includeKepadaYth, penerimaNama, penerimaTempat, isiParagraf, bulletStyle, rincianHariTanggal, rincianWaktu, includeTempat, rincianTempat, includeKeteranganAcara, rincianKeteranganAcara, penutupParagraf, includeDewan, selectedDewanId, customSignerName, includePembina, selectedPembinaRole, includeKetuaGudep, approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, ketuaGudepApprovalType, kotaPengesahan, metodeTtd, digitalSigner, includeStempel, includeTembusan, tembusanList };
    const draft: FormDraft = { id: editingDraftId || `draft_${Date.now()}`, perihal: perihal.trim() || 'Draf tanpa judul', nomorUrut, savedAt: new Date().toISOString(), data };
    const updated = [draft, ...draftSurat.filter((item) => item.id !== draft.id)]; setDraftSurat(updated);
    try { localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(updated)); } catch {}
    setEditingDraftId(draft.id); setViewMode('drafts');
  };
  const handleOpenDraft = (draft: FormDraft) => {
    const d = draft.data as any;
    setIncludeNomor(d.includeNomor ?? true); setNomorUrut(d.nomorUrut ?? '024'); setGudepPilihan(d.gudepPilihan ?? '10.035-10.036'); setCeklisDuaDua(d.ceklisDuaDua ?? false);
    setIncludeTanggal(d.includeTanggal ?? true); setTanggalSurat(d.tanggalSurat ?? ''); setIncludePerihal(d.includePerihal ?? true); setPerihal(d.perihal ?? draft.perihal);
    setIncludeLampiran(d.includeLampiran ?? false); setLampiran(d.lampiran ?? ''); setIncludeKeteranganIdentitas(d.includeKeteranganIdentitas ?? false); setKeteranganIdentitas(d.keteranganIdentitas ?? '');
    setIncludeKepadaYth(d.includeKepadaYth ?? true); setPenerimaNama(d.penerimaNama ?? ''); setPenerimaTempat(d.penerimaTempat ?? '');
    setIsiParagraf(String(d.isiParagraf ?? '').replace(/^Salam Pramuka[,.]?\s*/i, '')); setBulletStyle(d.bulletStyle ?? 'titik');
    setRincianHariTanggal(d.rincianHariTanggal ?? ''); setRincianWaktu(d.rincianWaktu ?? ''); setIncludeTempat(d.includeTempat ?? true); setRincianTempat(d.rincianTempat ?? '');
    setIncludeKeteranganAcara(d.includeKeteranganAcara ?? true); setRincianKeteranganAcara(d.rincianKeteranganAcara ?? ''); setPenutupParagraf(d.penutupParagraf ?? '');
    setIncludeDewan(d.includeDewan ?? false); setSelectedDewanId(d.selectedDewanId ?? 'pradana_pa'); setCustomSignerName(d.customSignerName ?? '');
    setIncludePembina(d.includePembina ?? true); setSelectedPembinaRole(d.selectedPembinaRole ?? 'pembina_pa'); setIncludeKetuaGudep(d.includeKetuaGudep ?? true);
    setApprovalType(d.approvalType ?? 'Mengetahui'); setDewanApprovalType(d.dewanApprovalType ?? d.approvalType ?? 'Mengetahui'); setPembinaApprovalType(d.pembinaApprovalType ?? d.approvalType ?? 'Mengetahui'); setPembinaTambahanApprovalType(d.pembinaTambahanApprovalType ?? d.approvalType ?? 'Mengetahui'); setKetuaGudepApprovalType(d.ketuaGudepApprovalType ?? d.approvalType ?? 'Mengetahui'); setKotaPengesahan(d.kotaPengesahan ?? 'Maros'); setMetodeTtd(d.metodeTtd ?? 'digital'); setDigitalSigner(d.digitalSigner ?? 'pembina_putra');
    setIncludeStempel(d.includeStempel ?? true); setIncludeTembusan(d.includeTembusan ?? true); setTembusanList(d.tembusanList ?? []);
    setEditingDraftId(draft.id); setViewMode('form');
  };
  const handleDeleteDraft = (id: string) => {
    const updated = draftSurat.filter((draft) => draft.id !== id); setDraftSurat(updated);
    try { localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(updated)); } catch {}
    if (editingDraftId === id) setEditingDraftId(null);
  };

  // PDF export uses the original vector letterhead and selectable PDF text.
  const handleDownloadPdf = async (surat: GeneratedSurat) => {
    setIsExportingPdf(true);
    let currentStage = 'Memulai pembuatan PDF';

    try {
      const pdfBytes = await createLetterPdf(surat, undefined, (stage) => {
        currentStage = stage;
      });

      const safeNumber = (surat.nomorUrut || 'Ambalan').replace(/[^a-zA-Z0-9_-]/g, '-');
      const safeGudep = (surat.gudepType || '10-035').replace(/[^a-zA-Z0-9_-]/g, '-');
      const fileName = `Surat_Pramuka_${safeNumber}_${safeGudep}.pdf`;

      const delivery = await deliverPdfFile(pdfBytes, fileName, (stage) => {
        currentStage = stage;
      });

      setDownloadSuccessMessage(delivery.message);
      setDownloadSuccessToast(true);
      window.setTimeout(() => setDownloadSuccessToast(false), 4500);
    } catch (error) {
      const details = error instanceof PdfExportStageError
        ? error
        : new PdfExportStageError(currentStage, error);
      console.error('PDF export failed:', {
        stage: details.stage,
        errorName: details.originalName,
        errorMessage: details.originalMessage,
        savedPath: details.savedPath,
      }, error);

      const savedNotice = details.savedPath
        ? `\nFile sudah tersimpan di: ${details.savedPath}`
        : '';
      alert(
        `Gagal pada tahap: ${details.stage}\nerror.name: ${details.originalName}\nerror.message: ${details.originalMessage}${savedNotice}`
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const activeSurat = previewSuratList[activePreviewIndex] || previewSuratList[0];

  return (
    <div className="space-y-4 pb-28 font-sans">
      <div className="flex items-center gap-3 py-1"><button type="button" onClick={() => viewMode === 'dashboard' ? onBack?.() : setViewMode('dashboard')} className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold" aria-label="Kembali">←</button><h1 className="text-lg font-extrabold text-slate-900">Kelola Surat Ambalan</h1></div>
      {viewMode === 'dashboard' && (
        <div className="grid grid-cols-1 gap-3">
          <button type="button" onClick={() => { setEditingDraftId(null); setViewMode('form'); }} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left flex items-center gap-4"><span className="w-12 h-12 rounded-xl bg-red-50 text-[#b71922] flex items-center justify-center text-2xl">＋</span><span className="min-w-0"><strong className="block text-sm text-slate-900">Buat Surat Baru</strong><span className="block text-xs text-slate-500 mt-1">Isi, generate, dan simpan surat ke bundel keluar</span></span><span className="ml-auto text-slate-400">›</span></button>
          <button type="button" onClick={() => setViewMode('drafts')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left flex items-center gap-4"><span className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl">▤</span><span className="min-w-0"><strong className="block text-sm text-slate-900">Draf Surat</strong><span className="block text-xs text-slate-500 mt-1">{draftSurat.length} draf tersimpan</span></span><span className="ml-auto text-slate-400">›</span></button>
          <button type="button" onClick={() => setViewMode('list')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left flex items-center gap-4"><span className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl">▣</span><span className="min-w-0"><strong className="block text-sm text-slate-900">Bundel Surat Keluar</strong><span className="block text-xs text-slate-500 mt-1">{arsipSurat.length} surat tersimpan</span></span><span className="ml-auto text-slate-400">›</span></button>
        </div>
      )}
      {/* Download Success Notification Toast */}
      {downloadSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <span>✅ {downloadSuccessMessage || 'PDF siap diunduh.'}</span>
          <button type="button" onClick={() => setDownloadSuccessToast(false)} className="text-emerald-700 font-bold px-1.5">✕</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. GOOGLE FORM STYLE: DUA BAGIAN (IDENTITAS & ISI SURAT)  */}
      {/* ======================================================== */}
      {viewMode === 'form' && (
        <form onSubmit={handleGenerateSurat} className="space-y-4">
          
          <h2 className="text-sm font-bold text-slate-700">Buat Surat Baru</h2>

          {/* ==================== BAGIAN 1: IDENTITAS ==================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-[#c81e28] uppercase tracking-wider">
                Bagian 1: Identitas Surat
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Klik lingkaran untuk memilih</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Generate 2 Surat Sekaligus</p>
                <p className="text-[10px] text-slate-500">Terbitkan otomatis untuk Gudep 10.035 &amp; 10.036 secara terpisah</p>
              </div>
              <button type="button" onClick={() => setCeklisDuaDua(!ceklisDuaDua)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${ceklisDuaDua ? 'border-[#c81e28] bg-[#c81e28] text-white' : 'border-slate-300 bg-white'}`}></button>
            </div>

            {/* 1. Tanggal (Wajib) */}
            <div className="flex items-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIncludeTanggal(!includeTanggal)}
                title="Pilih untuk menampilkan di surat"
                className={`mt-6 w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  includeTanggal
                    ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
              </button>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Tanggal Surat <span className="text-[#c81e28]">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Sejajar nomor surat di kanan</span>
                </div>
                <input
                  type="text"
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  placeholder="Contoh: 10 November 2026"
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#c81e28]"
                />
              </div>
            </div>

            {/* 2. Nomor Surat (Wajib) */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIncludeNomor(!includeNomor)}
                title="Pilih untuk menampilkan di surat"
                className={`mt-6 w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  includeNomor
                    ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
              </button>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Nomor Surat <span className="text-[#c81e28]">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    Hasil: {nomorUrut}/{ceklisDuaDua ? '10.035 & 10.036' : gudepPilihan}/C/2026
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nomorUrut}
                    onChange={(e) => setNomorUrut(e.target.value)}
                    placeholder="Contoh: 015"
                    required
                    className="w-24 text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:outline-none focus:border-[#c81e28]"
                  />
                  <span className="text-xs font-mono text-slate-500">
                    /{ceklisDuaDua ? '10.035 / 10.036' : gudepPilihan}/C/2026
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Perihal (Wajib) */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIncludePerihal(!includePerihal)}
                title="Pilih untuk menampilkan di surat"
                className={`mt-6 w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  includePerihal
                    ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
              </button>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  Perihal <span className="text-[#c81e28]">*</span>
                </label>
                <input
                  type="text"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Contoh: Undangan Kegiatan Latihan Gabungan"
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#c81e28]"
                />
              </div>
            </div>

            {/* 4. Lampiran (Opsional, dengan lingkaran opsi) */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIncludeLampiran(!includeLampiran)}
                title="Pilih untuk memasukkan lampiran ke surat"
                className={`mt-6 w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  includeLampiran
                    ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
              </button>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Lampiran <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {includeLampiran ? 'Dimasukkan ke surat' : 'Dilewati'}
                  </span>
                </div>
                <input
                  type="text"
                  value={lampiran}
                  onChange={(e) => setLampiran(e.target.value)}
                  placeholder="Contoh: 1 (Satu) Lembar Jadwal Kegiatan"
                  disabled={!includeLampiran}
                  className={`w-full text-xs p-2.5 rounded-xl border border-slate-200 transition-all ${
                    includeLampiran ? 'bg-white text-slate-900 focus:border-[#c81e28]' : 'bg-slate-100 text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* 5. Keterangan Identitas (Opsional, dengan lingkaran opsi) */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIncludeKeteranganIdentitas(!includeKeteranganIdentitas)}
                title="Pilih untuk memasukkan keterangan identitas"
                className={`mt-6 w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  includeKeteranganIdentitas
                    ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
              </button>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Keterangan <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {includeKeteranganIdentitas ? 'Dimasukkan ke surat' : 'Dilewati'}
                  </span>
                </div>
                <input
                  type="text"
                  value={keteranganIdentitas}
                  onChange={(e) => setKeteranganIdentitas(e.target.value)}
                  placeholder="Contoh: Sangat Segera / Penting"
                  disabled={!includeKeteranganIdentitas}
                  className={`w-full text-xs p-2.5 rounded-xl border border-slate-200 transition-all ${
                    includeKeteranganIdentitas ? 'bg-white text-slate-900 focus:border-[#c81e28]' : 'bg-slate-100 text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* 6. Kepada Yth. (Opsional, dengan lingkaran opsi) */}
            <div className="flex items-start gap-3 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIncludeKepadaYth(!includeKepadaYth)}
                title="Pilih untuk memasukkan Kepada Yth"
                className={`mt-6 w-6 h-6 rounded-full shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  includeKepadaYth
                    ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
              </button>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Tujuan Surat (Kepada Yth.) <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {includeKepadaYth ? 'Dimasukkan ke surat' : 'Dilewati'}
                  </span>
                </div>
                {includeKepadaYth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={penerimaNama}
                      onChange={(e) => setPenerimaNama(e.target.value)}
                      placeholder="Nama / Instansi Penerima"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]"
                    />
                    <input
                      type="text"
                      value={penerimaTempat}
                      onChange={(e) => setPenerimaTempat(e.target.value)}
                      placeholder="di - Tempat"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ==================== BAGIAN 2: ISI SURAT ==================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-[#c81e28] uppercase tracking-wider">
                Bagian 2: Isi Surat
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Times New Roman 12pt</span>
            </div>

            {/* Salam Pembuka (Otomatis) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Salam Pembuka &amp; Salam Pramuka (Otomatis)
              </span>
              <p className="text-xs font-serif italic text-slate-800">Assalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
              <p className="text-xs font-serif text-slate-800 text-center">Salam Pramuka,</p>
            </div>

            {/* Isi Surat Paragraf */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Isi Surat (Paragraf)
                </label>
                <button
                  type="button"
                  onClick={() => handleGenerateAiParagraph('isi')}
                  disabled={isGeneratingAi}
                  className="text-[11px] font-bold text-[#c81e28] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ✨ Bantu Buat Paragraf
                </button>
              </div>
              <textarea
                rows={3}
                value={isiParagraf}
                onChange={(e) => setIsiParagraf(e.target.value)}
                placeholder="Tuliskan isi surat secara ringkas dan lugas..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed font-serif focus:border-[#c81e28] focus:outline-none"
              />
            </div>

            {/* Poin-Poin Rincian Acara */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Rincian Kegiatan
                </span>
              </div>
              {/* Hari / Tanggal (Wajib) */}
              <div className="flex items-start gap-2">
                <span className="w-6 text-center text-xs font-bold text-[#c81e28] pt-2.5">
                  
                </span>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                    Hari / Tanggal <span className="text-[#c81e28]">*</span>
                  </label>
                  <input
                    type="text"
                    value={rincianHariTanggal}
                    onChange={(e) => setRincianHariTanggal(e.target.value)}
                    required
                    placeholder="Contoh: Sabtu, 21 November 2026"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]"
                  />
                </div>
              </div>

              {/* Waktu (Wajib) */}
              <div className="flex items-start gap-2">
                <span className="w-6 text-center text-xs font-bold text-[#c81e28] pt-2.5">
                  
                </span>
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                    Waktu <span className="text-[#c81e28]">*</span>
                  </label>
                  <input
                    type="text"
                    value={rincianWaktu}
                    onChange={(e) => setRincianWaktu(e.target.value)}
                    required
                    placeholder="Contoh: 08.00 WITA s.d. Selesai"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]"
                  />
                </div>
              </div>

              {/* Tempat (Opsional dengan lingkaran toggle) */}
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeTempat(!includeTempat)}
                  className={`w-6 h-6 rounded-full shrink-0 border-2 mt-6 flex items-center justify-center transition-all cursor-pointer ${
                    includeTempat ? 'border-[#c81e28] bg-[#c81e28] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-bold text-slate-700">
                      Tempat <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {includeTempat ? 'Dimasukkan' : 'Dilewati'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={rincianTempat}
                    onChange={(e) => setRincianTempat(e.target.value)}
                    disabled={!includeTempat}
                    placeholder="Contoh: Sanggar Bakti SMA Negeri 9 Maros"
                    className={`w-full text-xs p-2 rounded-xl border border-slate-200 transition-all ${
                      includeTempat ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Keterangan Acara (Opsional dengan lingkaran toggle) */}
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeKeteranganAcara(!includeKeteranganAcara)}
                  className={`w-6 h-6 rounded-full shrink-0 border-2 mt-6 flex items-center justify-center transition-all cursor-pointer ${
                    includeKeteranganAcara ? 'border-[#c81e28] bg-[#c81e28] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-bold text-slate-700">
                      Keterangan / Agenda Kegiatan <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {includeKeteranganAcara ? 'Dimasukkan' : 'Dilewati'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={rincianKeteranganAcara}
                    onChange={(e) => setRincianKeteranganAcara(e.target.value)}
                    disabled={!includeKeteranganAcara}
                    placeholder="Contoh: Menggunakan Seragam Pramuka Lengkap"
                    className={`w-full text-xs p-2 rounded-xl border border-slate-200 transition-all ${
                      includeKeteranganAcara ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-400'
                    }`}
                  />
                </div>
              </div>

            </div>

            {/* Penutup Paragraf */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Penutup (Paragraf)
                </label>
                <button
                  type="button"
                  onClick={() => handleGenerateAiParagraph('penutup')}
                  disabled={isGeneratingAi}
                  className="text-[11px] font-bold text-[#c81e28] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ✨ Bantu Penutup
                </button>
              </div>
              <textarea
                rows={2}
                value={penutupParagraf}
                onChange={(e) => setPenutupParagraf(e.target.value)}
                placeholder="Tuliskan penutup surat..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed font-serif focus:border-[#c81e28] focus:outline-none"
              />
            </div>

            {/* Salam Penutup (Otomatis) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Salam Penutup (Otomatis)
              </span>
              <p className="text-xs font-serif italic text-slate-800">Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
            </div>

          </div>

          {/* ==================== BAGIAN 3: PENGESAHAN (SEMUA HARUS DIPILIH) ==================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-black text-[#c81e28] uppercase tracking-wider block">
                  Bagian 3: Pengesahan &amp; Penandatangan
                </span>
                <span className="text-[10px] text-slate-500">
                  Semua yang bertanda tangan harus dipilih secara spesifik
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Tanggal ikut surat</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"><div className="space-y-1"><label className="text-[11px] font-bold text-slate-700">Kota pengesahan <span className="text-[#c81e28]">*</span></label><input type="text" value={kotaPengesahan} onChange={(e) => setKotaPengesahan(e.target.value)} required placeholder="Maros" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white" /></div></div>

            {/* 1. DEWAN AMBALAN (OPSIONAL: jika dipilih, nama wajib lengkap) */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              includeDewan ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIncludeDewan(!includeDewan)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                      includeDewan ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs' : 'border-slate-300 bg-white'
                    }`}
                  >
                  </button>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Penandatangan Ambalan / Sangga Kerja / Panitia <span className="text-[10px] text-slate-500 font-normal">(Opsional)</span>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {includeDewan ? 'Aktif — Wajib pilih nama pada dropdown di bawah' : 'Tidak disertakan dalam surat'}
                    </span>
                  </div>
                </div>
              </div>

              {includeDewan && (
                <div className="mt-3 pt-3 border-t border-red-200 space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 block">Pilih Jabatan Penandatangan (Wajib) <span className="text-[#c81e28]">*</span></label>
                  <select
                    value={selectedDewanId}
                    onChange={(e) => setSelectedDewanId(e.target.value)}
                    required={includeDewan}
                    className="w-full text-xs p-2.5 rounded-xl border border-red-300 bg-white text-slate-900 font-bold focus:border-[#c81e28]"
                  >
                    {dewanList.map((d) => <option key={d.id} value={d.id}>{d.jabatan} — {d.memberName} ({d.satuan})</option>)}
                    <option value="ketua_sangga_kerja">Ketua Sangga Kerja</option><option value="sekretaris_sangga_kerja">Sekretaris Sangga Kerja</option><option value="ketua_panitia">Ketua Panitia</option><option value="sekretaris_panitia">Sekretaris Panitia</option>
                  </select>
                  {['ketua_sangga_kerja', 'sekretaris_sangga_kerja', 'ketua_panitia', 'sekretaris_panitia'].includes(selectedDewanId) && <input type="text" value={customSignerName} onChange={(e) => setCustomSignerName(e.target.value)} required placeholder="Nama penandatangan" className="w-full mt-2 text-xs p-2.5 rounded-xl border border-red-300 bg-white text-slate-900" />}
                  <div className="mt-2 space-y-1"><label className="text-[10px] font-bold text-slate-700">Pilihan pengesahan</label><select value={dewanApprovalType} onChange={(e) => setDewanApprovalType(e.target.value as 'Mengetahui' | 'Menyetujui')} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"><option value="Mengetahui">Mengetahui</option><option value="Menyetujui">Menyetujui</option></select></div>
                </div>
              )}
            </div>

            {/* 2. PEMBINA GUGUS DEPAN (BISA DIPILIH & WAJIB DROPDOWN) */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              includePembina ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIncludePembina(!includePembina)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                      includePembina ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs' : 'border-slate-300 bg-white'
                    }`}
                  >
                  </button>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Tanda Tangan Pembina Gugus Depan
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {includePembina ? 'Aktif — Pilih penandatangan pada dropdown' : 'Tidak disertakan dalam surat'}
                    </span>
                  </div>
                </div>
              </div>

              {includePembina && (
                <div className="mt-3 pt-3 border-t border-red-200 space-y-1">
                  <label className="text-[11px] font-bold text-slate-800 block">
                    Pilih Pembina Penandatangan <span className="text-[#c81e28]">*</span>
                  </label>
                  <select
                    value={selectedPembinaRole}
                    onChange={(e) => setSelectedPembinaRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:border-[#c81e28]"
                  >
                    <option value="pembina_pa">Pembina Putra: {officials.pembinaPutra}</option>
                    <option value="pembina_pi">Pembina Putri: {officials.pembinaPutri}</option>
                    <option value="pembantu_pa">Pembantu Pembina Putra: {officials.pembantuPembinaPutra}</option>
                    <option value="pembantu_pi">Pembantu Pembina Putri: {officials.pembantuPembinaPutri}</option>
                  </select>
                  <div className="mt-2 space-y-1"><label className="text-[10px] font-bold text-slate-700">Pilihan pengesahan</label><select value={pembinaApprovalType} onChange={(e) => setPembinaApprovalType(e.target.value as 'Mengetahui' | 'Menyetujui')} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"><option value="Mengetahui">Mengetahui</option><option value="Menyetujui">Menyetujui</option></select></div>
                </div>
              )}
            </div>

            {/* 3. KETUA GUGUS DEPAN (BISA DIPILIH) */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              includeKetuaGudep ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIncludeKetuaGudep(!includeKetuaGudep)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                      includeKetuaGudep ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs' : 'border-slate-300 bg-white'
                    }`}
                  >
                  </button>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Tanda Tangan Kepala Sekolah (Kamabigus)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {includeKetuaGudep ? `${officials.ketuaGudep} (Kepala SMAN 9 Maros)` : 'Tidak disertakan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-1"><label className="text-[10px] font-bold text-slate-700">Pilihan pengesahan</label><select value={ketuaGudepApprovalType} onChange={(e) => setKetuaGudepApprovalType(e.target.value as 'Mengetahui' | 'Menyetujui')} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"><option value="Mengetahui">Mengetahui</option><option value="Menyetujui">Menyetujui</option></select></div>
            <div className="mt-2 space-y-1"><label className="text-[10px] font-bold text-slate-700">Pilihan pengesahan</label><select value={pembinaTambahanApprovalType} onChange={(e) => setPembinaTambahanApprovalType(e.target.value as 'Mengetahui' | 'Menyetujui')} className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"><option value="Mengetahui">Mengetahui</option><option value="Menyetujui">Menyetujui</option></select></div>

            {/* Pilihan Metode Pengesahan: Ttd Biasa, Ttd Digital, Stempel Basah */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 block">
                Pilihan Format Tanda Tangan
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'digital', title: 'Ttd Digital (QR)', sub: 'Barcode Verifikasi' },
                  { id: 'biasa', title: 'Ttd Biasa', sub: 'Ruang Tanda Tangan' },
                  { id: 'stempel', title: 'Stempel Basah', sub: 'Cap Lingkaran' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMetodeTtd(item.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      metodeTtd === item.id
                        ? 'border-[#c81e28] bg-red-50 text-[#b71922] font-black'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs">{item.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>

              {/* Jika Ttd Digital dipilih: Opsi 3 Otoritas */}
              {metodeTtd === 'digital' && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#b71922]">
                      Otoritas Penandatangan Digital (3 Pilihan)
                    </span>
                    <span className="text-[9px] text-slate-500">Scan QR untuk verifikasi</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'kepala_sekolah', label: '1. Kepala Sekolah', name: officials.ketuaGudep },
                      { id: 'pembina_putra', label: '2. Pembina Putra', name: officials.pembinaPutra },
                      { id: 'pembina_putri', label: '3. Pembina Putri', name: officials.pembinaPutri }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setDigitalSigner(s.id as DigitalSignerType)}
                        className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                          digitalSigner === s.id
                            ? 'bg-[#c81e28] text-white border-[#c81e28] font-bold'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-bold">{s.label}</p>
                        <p className={`text-[10px] truncate ${digitalSigner === s.id ? 'text-red-100' : 'text-slate-500'}`}>
                          {s.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Checkbox Stempel Basah */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800">Sertakan Stempel Basah Ambalan</span>
                <button
                  type="button"
                  onClick={() => setIncludeStempel(!includeStempel)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                    includeStempel ? 'border-[#c81e28] bg-[#c81e28] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                </button>
              </div>
            </div>

            {/* Tembusan (Ketik + tombol tambah) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Tembusan Surat <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIncludeTembusan(!includeTembusan)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                    includeTembusan ? 'border-[#c81e28] bg-[#c81e28] text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                </button>
              </div>

              {includeTembusan && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tembusanInput}
                      onChange={(e) => setTembusanInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTembusan();
                        }
                      }}
                      placeholder="Ketik tembusan lalu tekan (+)..."
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]"
                    />
                    <button
                      type="button"
                      onClick={handleAddTembusan}
                      className="px-4 py-2.5 rounded-xl bg-[#c81e28] text-white font-black text-sm hover:bg-[#a91b24] transition-all cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {tembusanList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {tembusanList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-100 text-xs text-slate-800 font-medium"
                        >
                          <span>{idx + 1}. {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTembusan(idx)}
                            className="text-slate-400 hover:text-red-600 font-bold px-2 py-0.5 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          <button type="submit" className="w-full py-3.5 rounded-2xl bg-[#c81e28] hover:bg-[#a91b24] text-white font-extrabold text-sm transition-all cursor-pointer">Generate dan Simpan di Bundel Surat</button>
          <button type="button" onClick={handleSaveDraft} className="w-full py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 font-bold text-sm cursor-pointer">Simpan sebagai Draf</button>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. TAMPILAN PRATINJAU SURAT (KOP ASLI DENGAN INLINE BASE64) */}
      {/* ======================================================== */}
      {viewMode === 'preview' && activeSurat && (
        <div className="space-y-4">
          
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                ← Edit Form
              </button>

              {previewSuratList.length > 1 && (
                <div className="flex items-center gap-1">
                  {previewSuratList.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        activePreviewIndex === idx ? 'bg-[#c81e28] text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Surat {idx + 1} ({s.gudepType})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeSurat.metodeTtd === 'digital' && (
                <button
                  type="button"
                  onClick={() => setVerificationModalSurat(activeSurat)}
                  className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>🔍 Uji Scan QR</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                title="Cetak lewat dialog browser"
              >
                🖨️ Cetak
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPdf(activeSurat)}
                disabled={isExportingPdf}
                className="py-2 px-4 rounded-xl bg-[#c81e28] hover:bg-[#a91b24] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{isExportingPdf ? '⏳ Memproses PDF...' : '📥 Unduh Dokumen PDF'}</span>
              </button>
            </div>
          </div>

          {/* KERTAS RESMI SURAT (STANDAR A4 GERAKAN PRAMUKA) */}
          <div
            ref={letterRef}
            className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-xl max-w-2xl mx-auto text-black font-serif leading-normal select-text"
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt' }}
          >
            {/* KOP SURAT ASLI MENGGUNAKAN INLINE BASE64 LOGO (100% BEBAS DARI MASALAH CORS / JARINGAN) */}
            <div className="border-b-[3px] border-black pb-1">
              <div className="flex items-center justify-between gap-3">
                {/* Logo Tunas Kelapa Kiri */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                  <img
                    src={TUNAS_KELAPA_BASE64}
                    alt="Logo Tunas Kelapa"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Teks Kop Tengah */}
                <div className="text-center flex-1 leading-tight px-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-black">
                    GERAKAN PRAMUKA
                  </h2>
                  <h3 className="text-sm sm:text-lg font-black uppercase tracking-wide text-black mt-0.5">
                    GUGUS DEPAN {activeSurat.gudepType === '10.035' ? '10-035' : activeSurat.gudepType === '10.036' ? '10-036' : '10-035 / 10-036'}
                  </h3>
                  <h1 className="text-base sm:text-xl font-extrabold uppercase tracking-tight text-black mt-0.5">
                    PANGKALAN SMA NEGERI 9 MAROS
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-black mt-1 italic font-sans font-normal leading-tight">
                    ( sekretariat : Jl. Pattene, Desa Pa&apos;bentengang, Dusun ujung bulo, Kec. Marusu, Kab Maros )
                  </p>
                </div>

                {/* Logo WOSM Kanan */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                  <img
                    src={WOSM_BASE64}
                    alt="Logo WOSM Pramuka Dunia"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Garis Ganda Pembatas Kop */}
              <div className="w-full mt-2">
                <div className="w-full border-t-[2.5px] border-black"></div>
                <div className="w-full border-t-[1px] border-black mt-[1.5px]"></div>
              </div>
            </div>

            {/* Identitas Surat: Nomor, Lampiran, Perihal, Keterangan (Kiri) & Tanggal (Kanan Sejajar Nomor) */}
            <div className="pt-4 flex justify-between items-start" style={{ fontSize: '12pt' }}>
              <div className="space-y-1">
                {activeSurat.includeNomor && (
                  <p>
                    <span className="inline-block w-24">Nomor</span> : {activeSurat.nomorSurat}
                  </p>
                )}
                {activeSurat.includeLampiran && (
                  <p>
                    <span className="inline-block w-24">Lampiran</span> : {activeSurat.lampiran}
                  </p>
                )}
                {activeSurat.includePerihal && (
                  <p>
                    <span className="inline-block w-24 font-bold">Perihal</span> : <strong>{activeSurat.perihal}</strong>
                  </p>
                )}
                {activeSurat.includeKeteranganIdentitas && (
                  <p>
                    <span className="inline-block w-24">Keterangan</span> : {activeSurat.keteranganIdentitas}
                  </p>
                )}
              </div>
              <div className="text-right whitespace-nowrap">{activeSurat.kotaPengesahan || 'Maros'}, {activeSurat.tanggalSurat}</div>
            </div>

            {/* Kepada Yth. (Opsional) */}
            {activeSurat.includeKepadaYth && (
              <div className="pt-4 leading-snug" style={{ fontSize: '12pt' }}>
                <p>Kepada Yth.</p>
                <p className="font-bold">{activeSurat.penerimaNama}</p>
                <p>{activeSurat.penerimaTempat}</p>
              </div>
            )}

            {/* Salam Pembuka */}
            <div className="pt-4 space-y-1" style={{ fontSize: '12pt' }}>
              <p className="italic text-center">Assalamu&apos;alaikum warahmatullahi wabarakatuh</p>
              <p className="text-left">Salam Pramuka,</p>
            </div>

            {/* Isi Paragraf Surat */}
            <div className="pt-3 leading-relaxed text-justify space-y-3" style={{ fontSize: '12pt' }}>
              <p>{activeSurat.isiParagraf.replace(/^Salam Pramuka[,.]?\s*/i, '')}</p>

              {/* Rincian Poin-Poin Acara */}
              <div className="pl-6 space-y-1">
                <p>
                  <span className="inline-block w-36 font-bold">Hari / Tanggal</span> : {activeSurat.rincianHariTanggal}
                </p>
                <p>
                  <span className="inline-block w-36 font-bold">Waktu</span> : {activeSurat.rincianWaktu}
                </p>
                {activeSurat.includeTempat && (
                  <p>
                    <span className="inline-block w-36 font-bold">Tempat</span> : {activeSurat.rincianTempat}
                  </p>
                )}
                {activeSurat.includeKeteranganAcara && (
                  <p>
                    <span className="inline-block w-36 font-bold">Agenda</span> : {activeSurat.rincianKeteranganAcara}
                  </p>
                )}
              </div>

              {/* Penutup */}
              <p>{activeSurat.penutupParagraf}</p>
            </div>

            <div className="pt-3 text-center" style={{ fontSize: '12pt' }}><p className="italic">Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p></div>

            {/* TANDA TANGAN PENGESAHAN DENGAN ADAPTASI DINAMIS */}
            <div className="pt-4 text-left font-sans" style={{ fontSize: '11pt' }}>
              
              {/* Jika Dewan DAN Pembina aktif: Render 2 kolom (Dewan Kiri, Pembina Kanan) */}
              {activeSurat.includeDewan && activeSurat.includePembina && (
                <div className="grid grid-cols-2 gap-4 pb-6">
                  <div>
                    <p className="font-bold">{activeSurat.dewanApprovalType || activeSurat.approvalType || 'Mengetahui'},</p>
                    <p className="font-bold">{activeSurat.dewanJabatan},</p>
                    <div className="h-16 flex items-center justify-start">
                      {/* Spasi TTD Dewan */}
                    </div>
                    <p className="font-bold underline">{activeSurat.dewanNama}</p>
                    <p className="text-[10px] text-slate-500">{activeSurat.dewanNta}</p>
                  </div>

                  <div>
                    <p className="font-bold">{activeSurat.pembinaApprovalType || activeSurat.approvalType || 'Mengetahui'},</p>
                    <p className="font-bold">{activeSurat.pembinaJabatan},</p>
                    <div className="h-16 flex items-center justify-start relative">
                      {activeSurat.includeStempel && (
                        <div className="absolute -top-1 right-4 w-20 h-20 rounded-full border-2 border-red-600/80 text-red-600 flex flex-col items-center justify-start text-[7px] font-black uppercase text-left p-1 pointer-events-none rotate-[-8deg] opacity-80">
                          <span>GERAKAN PRAMUKA</span>
                          <span>GUDEP 10-035/10-036</span>
                          <span className="text-[6px]">SMA NEGERI 9 MAROS</span>
                        </div>
                      )}

                      {activeSurat.metodeTtd === 'digital' && activeSurat.qrCodeDataUrl ? (
                        <div
                          onClick={() => setVerificationModalSurat(activeSurat)}
                          className="cursor-pointer text-left group"
                          title="Klik untuk verifikasi keaslian dokumen"
                        >
                          <img src={activeSurat.qrCodeDataUrl} alt="QR Code" className="w-16 h-16 " />
                          <span className="text-[8px] font-mono text-slate-500 block">QR Resmi Terverifikasi</span>
                        </div>
                      ) : (
                        <div className="h-16"></div>
                      )}
                    </div>
                    <p className="font-bold underline">{activeSurat.pembinaNama}</p>
                    {activeSurat.pembinaNip && (
                      <p className="text-[10px] text-slate-500 font-mono">{activeSurat.pembinaNip}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Jika HANYA Dewan yang aktif (Pembina tidak aktif) */}
              {activeSurat.includeDewan && !activeSurat.includePembina && (
                <div className="flex justify-start pb-6">
                  <div className="min-w-[220px] text-left">
                    <p className="font-bold">{activeSurat.dewanApprovalType || activeSurat.approvalType || 'Mengetahui'},</p>
                    <p className="font-bold">{activeSurat.dewanJabatan},</p>
                    <div className="h-16 flex items-center justify-start">
                      {/* Spasi TTD Dewan */}
                    </div>
                    <p className="font-bold underline">{activeSurat.dewanNama}</p>
                    <p className="text-[10px] text-slate-500">{activeSurat.dewanNta}</p>
                  </div>
                </div>
              )}

              {/* Jika HANYA Pembina yang aktif (Dewan TIDAK diceklis - Opsional) */}
              {!activeSurat.includeDewan && activeSurat.includePembina && (
                <div className="flex justify-start pb-6">
                  <div className="min-w-[240px] text-left">
                    <p className="font-bold">{activeSurat.pembinaApprovalType || activeSurat.approvalType || 'Mengetahui'},</p>
                    <p className="font-bold">{activeSurat.pembinaJabatan},</p>
                    <div className="h-16 flex items-center justify-start relative">
                      {activeSurat.includeStempel && (
                        <div className="absolute -top-1 right-2 w-20 h-20 rounded-full border-2 border-red-600/80 text-red-600 flex flex-col items-center justify-start text-[7px] font-black uppercase text-left p-1 pointer-events-none rotate-[-8deg] opacity-80">
                          <span>GERAKAN PRAMUKA</span>
                          <span>GUDEP 10-035/10-036</span>
                          <span className="text-[6px]">SMA NEGERI 9 MAROS</span>
                        </div>
                      )}

                      {activeSurat.metodeTtd === 'digital' && activeSurat.qrCodeDataUrl ? (
                        <div
                          onClick={() => setVerificationModalSurat(activeSurat)}
                          className="cursor-pointer text-left group"
                          title="Klik untuk verifikasi keaslian dokumen"
                        >
                          <img src={activeSurat.qrCodeDataUrl} alt="QR Code" className="w-16 h-16 " />
                          <span className="text-[8px] font-mono text-slate-500 block">QR Resmi Terverifikasi</span>
                        </div>
                      ) : (
                        <div className="h-16"></div>
                      )}
                    </div>
                    <p className="font-bold underline">{activeSurat.pembinaNama}</p>
                    {activeSurat.pembinaNip && (
                      <p className="text-[10px] text-slate-500 font-mono">{activeSurat.pembinaNip}</p>
                    )}
                  </div>
                </div>
              )}


              {activeSurat.includePembinaTambahan && (
                <div className="pt-2 min-w-[240px]">
                  <p className="font-bold">{activeSurat.pembinaTambahanApprovalType || activeSurat.approvalType || 'Mengetahui'},</p>
                  <p className="font-bold">{activeSurat.pembinaTambahanJabatan}</p>
                  <div className="my-2 h-16 flex items-center justify-start">
                    {activeSurat.metodeTtd === 'digital' && activeSurat.qrCodeDataUrl && <img src={activeSurat.qrCodeDataUrl} alt="QR Code tanda tangan digital" className="w-14 h-14" />}
                  </div>
                  <p className="font-bold underline">{activeSurat.pembinaTambahanNama}</p>
                  {activeSurat.pembinaTambahanNip && <p className="text-[10px] text-slate-500">{activeSurat.pembinaTambahanNip}</p>}
                </div>
              )}

              {/* Ketua Gugus Depan */}
              {activeSurat.includeKetuaGudep && (
                <div className="pt-2 inline-block min-w-[280px]">
                  <p className="font-bold">{activeSurat.ketuaGudepApprovalType || activeSurat.approvalType || 'Mengetahui'},</p>
                  <p className="font-bold text-xs">Kepala SMA Negeri 9 Maros (Kamabigus)</p>
                  
                  <div className="my-2 h-16 flex items-center justify-start">
                    {activeSurat.metodeTtd === 'digital' && activeSurat.qrCodeDataUrl ? (
                      <div
                        onClick={() => setVerificationModalSurat(activeSurat)}
                        className="cursor-pointer text-left group"
                        title="Klik untuk verifikasi keaslian dokumen"
                      >
                        <img src={activeSurat.qrCodeDataUrl} alt="QR Code" className="w-14 h-14 " />
                        <span className="text-[7px] font-mono text-slate-400 block">Scan Dokumen Asli</span>
                      </div>
                    ) : (
                      <div className="h-12"></div>
                    )}
                  </div>

                  <p className="font-bold underline text-sm">{activeSurat.ketuaGudepNama}</p>
                  {activeSurat.ketuaGudepNip && (
                    <p className="text-[10px] text-slate-500 font-mono">{activeSurat.ketuaGudepNip}</p>
                  )}
                </div>
              )}
            </div>

            {/* Tembusan (Opsional) */}
            {activeSurat.includeTembusan && activeSurat.tembusanList.length > 0 && (
              <div className="pt-6 text-[10px] sm:text-xs font-sans">
                <p className="font-bold uppercase tracking-wider">Tembusan Kepada Yth :</p>
                <ol className="list-decimal pl-4 space-y-0.5 mt-0.5">
                  {activeSurat.tembusanList.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAMPILAN ARSIP SURAT KELUAR                           */}
      {/* ======================================================== */}
      {viewMode === 'drafts' && (<div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">Draf Surat</h3><button type="button" onClick={() => { setEditingDraftId(null); setViewMode('form'); }} className="text-xs font-bold text-[#b71922]">+ Draf Baru</button></div>{draftSurat.length ? draftSurat.map((draft) => <div key={draft.id} className="flex items-center gap-3 border-t border-slate-100 pt-3"><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-900 truncate">{draft.perihal}</p><p className="text-[10px] text-slate-500">Nomor urut {draft.nomorUrut} · {new Date(draft.savedAt).toLocaleDateString('id-ID')}</p></div><button type="button" onClick={() => handleOpenDraft(draft)} className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-bold">Buka</button><button type="button" onClick={() => handleDeleteDraft(draft.id)} className="px-2 py-2 rounded-lg text-red-600 text-xs font-bold">Hapus</button></div>) : <p className="py-8 text-center text-xs text-slate-500">Belum ada draf surat.</p>}</div>)}

      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Bundel Surat Keluar</h3>
              <p className="text-xs text-slate-500">Judul dan nomor surat yang telah diterbitkan</p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className="py-2 px-3 rounded-xl bg-[#c81e28] text-white font-bold text-xs transition-all cursor-pointer"
            >
              + Buat Surat Baru
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {arsipSurat.length > 0 ? (
              arsipSurat.map((surat) => (
                <div key={surat.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-[#b71922]">
                        {surat.nomorSurat}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                      {surat.perihal}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setVerificationModalSurat(surat)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                      title="Verifikasi QR"
                    >
                      ✓ Verif
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewSuratList([surat]);
                        setActivePreviewIndex(0);
                        setViewMode('preview');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      Buka
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs font-semibold">Belum ada surat yang diterbitkan</p>
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  className="mt-2 text-xs font-bold text-[#c81e28] hover:underline cursor-pointer"
                >
                  + Buat surat pertama sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL PROGRESS GENERATE AI (PERSENTASE 0 - 100%)       */}
      {/* ======================================================== */}
      {isGeneratingAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 text-[#c81e28] flex items-center justify-center text-2xl font-bold shadow-inner">
              {aiProgress === 100 ? '✓' : '✨'}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                {aiGeneratingTitle || 'Merancang Konten Surat...'}
              </h3>
              <p className="text-xs text-slate-500">
                Asisten AI Ambalan sedang memproses tata bahasa kepramukaan resmi
              </p>
            </div>

            {/* Visual Progress Bar 0 - 100% */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-600">Progres Penyusunan</span>
                <span className="text-[#c81e28] font-mono text-sm">{aiProgress}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-[#c81e28] rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${aiProgress}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              {aiProgress < 40 && 'Menganalisis perihal surat dan tata naskah dinas...'}
              {aiProgress >= 40 && aiProgress < 85 && 'Menyusun kalimat baku & santun bernuansa kepramukaan...'}
              {aiProgress >= 85 && aiProgress < 100 && 'Memeriksa ejaan dan kelengkapan redaksi...'}
              {aiProgress === 100 && 'Selesai 100%! Memasukkan teks ke formulir...'}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL VERIFIKASI SCAN QR DOKUMEN RESMI (CENTANG HIJAU) */}
      {/* ======================================================== */}
      {verificationModalSurat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            
            {/* Centang Hijau Besar */}
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-4xl shadow-inner animate-in zoom-in-50 duration-200">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-emerald-700 tracking-wide">
                DOKUMEN TERVERIFIKASI ASLI
              </h3>
              <p className="text-xs text-slate-500">
                Data terdaftar sah di Database Ambalan SMA Negeri 9 Maros
              </p>
            </div>

            {/* Ringkasan Data Surat */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-sans">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Nomor Surat:</span>
                <span className="font-mono font-bold text-slate-900">{verificationModalSurat.nomorSurat}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Perihal:</span>
                <span className="font-bold text-slate-900 text-right max-w-[180px] truncate">{verificationModalSurat.perihal}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Penandatangan:</span>
                <span className="font-bold text-[#b71922] text-right">{verificationModalSurat.digitalSignerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tanggal Rilis:</span>
                <span className="font-bold text-slate-900">{verificationModalSurat.tanggalSurat}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPreviewSuratList([verificationModalSurat]);
                  setActivePreviewIndex(0);
                  setVerificationModalSurat(null);
                  setViewMode('preview');
                }}
                className="w-full py-2.5 rounded-xl bg-[#c81e28] hover:bg-[#a91b24] text-white text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                📥 Buka &amp; Unduh Surat (PDF)
              </button>

              <button
                type="button"
                onClick={() => setVerificationModalSurat(null)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
