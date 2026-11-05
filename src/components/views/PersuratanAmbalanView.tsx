import React, { useState, useEffect } from 'react';
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

const STORAGE_KEY_SETTINGS = 'pettalopo_pengaturan_surat_v1';
const DEFAULT_SURAT_SETTINGS = {
  ketuaMabigus: 'Kepala Sekolah / Ketua Mabigus',
  pembinaPutra: 'Pembina Putra',
  pembinaPutri: 'Pembina Putri',
  pembantuPutra: 'Pembantu Pembina Putra',
  pembantuPutri: 'Pembantu Pembina Putri',
};
type SuratSettings = typeof DEFAULT_SURAT_SETTINGS;

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
  includeKeteranganDetail?: boolean;
  rincianKeteranganDetail?: string;
  penutupParagraf: string;

  // Pengesahan (Semua yang bertanda tangan harus dipilih)
  includeDewan: boolean; // Opsional
  dewanJabatan: string;
  dewanNama: string;
  dewanNta: string;
  
  includePembina: boolean;
  includePembantuPutra?: boolean;
  includePembantuPutri?: boolean;
  pembantuPutraNama?: string;
  pembantuPutraJabatan?: string;
  pembantuPutriNama?: string;
  pembantuPutriJabatan?: string;
  pembantuPutraApprovalType?: 'Mengetahui' | 'Menyetujui' | '';
  pembantuPutriApprovalType?: 'Mengetahui' | 'Menyetujui' | '';
  pembinaJabatan: string;
  pembinaNama: string;
  pembinaNip?: string;
  includePembinaTambahan?: boolean;
  pembinaTambahanJabatan?: string;
  pembinaTambahanNama?: string;
  pembinaTambahanNip?: string;

  includeKetuaGudep: boolean; // Pilihan
  ketuaGudepNama: string;
  ketuaGudepJabatan?: string;
  ketuaGudepNip?: string;

  metodeTtd: 'biasa' | 'digital';
  digitalSigner: DigitalSignerType;
  digitalSignerName: string;
  digitalSignerTitle: string;
  
  qrCodeDataUrl?: string;
  digitalSignerIds?: string[];
  includeStempel: boolean;
  
  includeTembusan: boolean;
  tembusanList: string[];
  signatureGapCm?: number;
  approvalType?: 'Mengetahui' | 'Menyetujui' | '';
  dewanApprovalType?: 'Mengetahui' | 'Menyetujui' | '';
  pembinaApprovalType?: 'Mengetahui' | 'Menyetujui' | '';
  pembinaTambahanApprovalType?: 'Mengetahui' | 'Menyetujui' | '';
  ketuaGudepApprovalType?: 'Mengetahui' | 'Menyetujui' | '';
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
  const [viewMode, setViewMode] = useState<'dashboard' | 'form' | 'preview' | 'list' | 'drafts' | 'settings'>('dashboard');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Setiap berpindah langkah, tampilkan bagian paling atas pada layar HP.
  useEffect(() => {
    if (viewMode !== 'form') return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      let element: HTMLElement | null = document.querySelector('form');
      while (element) {
        if (element.scrollHeight > element.clientHeight + 2) {
          element.scrollTop = 0;
        }
        element = element.parentElement;
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [wizardStep, viewMode]);

  // Tombol kembali perangkat menelusuri wizard satu langkah demi satu langkah.
  useEffect(() => {
    if (viewMode !== 'form' && viewMode !== 'preview') return;
    window.history.pushState({ pettalopoLetter: true, viewMode, wizardStep }, '', window.location.href);
    const handleBack = () => {
      if (viewMode === 'preview') {
        setViewMode('form');
        setWizardStep(3);
      } else if (wizardStep > 1) {
        setWizardStep((current) => (current === 3 ? 2 : 1));
      } else {
        setViewMode('dashboard');
      }
    };
    window.addEventListener('popstate', handleBack);
    return () => window.removeEventListener('popstate', handleBack);
  }, [viewMode, wizardStep]);

  const [officials, setOfficials] = useState<MabigusOfficials>(getMabigusOfficials());
  const [suratSettings, setSuratSettings] = useState<SuratSettings>(() => {
    try { return { ...DEFAULT_SURAT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}') }; }
    catch { return DEFAULT_SURAT_SETTINGS; }
  });
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

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(suratSettings)); } catch {}
  }, [suratSettings]);

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

  const [includeLampiran, setIncludeLampiran] = useState(true);
  const [lampiran, setLampiran] = useState('1 (Satu) Berkas Proposal');

  const [includeKeteranganIdentitas, setIncludeKeteranganIdentitas] = useState(false);
  const [keteranganIdentitas, setKeteranganIdentitas] = useState('Penting / Segera');

  const [includeKepadaYth, setIncludeKepadaYth] = useState(true);
  const [penerimaNama, setPenerimaNama] = useState('Kepala SMA Negeri 9 Maros');
  const [penerimaTempat, setPenerimaTempat] = useState('Tempat,');

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
  const [includeKeteranganDetail, setIncludeKeteranganDetail] = useState(false);
  const [rincianKeteranganDetail, setRincianKeteranganDetail] = useState('');

  const [penutupParagraf, setPenutupParagraf] = useState(
    'Demikian surat ini kami sampaikan, atas perhatian, dukungan, dan kerja sama Kakak kami ucapkan terima kasih.'
  );

  // --- BAGIAN 3: PENGESAHAN & PENANDATANGAN ---
  // Dewan Ambalan (OPSIONAL: jika diceklis, WAJIB pilih nama via dropdown)
  const [includeDewan, setIncludeDewan] = useState(false); // Opsional
  const [selectedDewanId, setSelectedDewanId] = useState<string>('pradana_pa');
  const [customSignerName, setCustomSignerName] = useState('');

  // Pembina (BISA DIPILIH: default aktif)
  const [includePembina, setIncludePembina] = useState(false);
  const [includePembinaPutri, setIncludePembinaPutri] = useState(false);
  const [includePembantuPutra, setIncludePembantuPutra] = useState(false);
  const [includePembantuPutri, setIncludePembantuPutri] = useState(false);
  const [selectedPembinaRole, setSelectedPembinaRole] = useState<'pembina_pa' | 'pembina_pi' | 'pembantu_pa' | 'pembantu_pi'>('pembina_pa');
  const [includeKetuaGudep, setIncludeKetuaGudep] = useState(false);
  const [approvalType, setApprovalType] = useState<'Mengetahui' | 'Menyetujui' | ''>('Mengetahui');
  const [dewanApprovalType, setDewanApprovalType] = useState<'Mengetahui' | 'Menyetujui' | ''>('Mengetahui');
  const [pembinaApprovalType, setPembinaApprovalType] = useState<'Mengetahui' | 'Menyetujui' | ''>('Mengetahui');
  const [pembinaTambahanApprovalType, setPembinaTambahanApprovalType] = useState<'Mengetahui' | 'Menyetujui' | ''>('Mengetahui');
  const [pembantuPutraApprovalType, setPembantuPutraApprovalType] = useState<'Mengetahui' | 'Menyetujui' | ''>('Mengetahui');
  const [pembantuPutriApprovalType, setPembantuPutriApprovalType] = useState<'Mengetahui' | 'Menyetujui' | ''>('Mengetahui');
  const [ketuaGudepApprovalType, setKetuaGudepApprovalType] = useState<'Mengetahui' | 'Menyetujui' | ''>('Mengetahui');
  const [kotaPengesahan, setKotaPengesahan] = useState('Maros');
  const [signatureGapCm, setSignatureGapCm] = useState(0);

  // Metode Pengesahan
  const [metodeTtd, setMetodeTtd] = useState<'biasa' | 'digital' >('digital');
  const [digitalSigner, setDigitalSigner] = useState<DigitalSignerType>('pembina_putra');
  const [digitalSignerIds, setDigitalSignerIds] = useState<string[]>(['pembina_putra']);
  const toggleDigitalSigner = (id: string, checked: boolean) => setDigitalSignerIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  const selectedDigitalSignerIds = digitalSignerIds.filter((id) => ({ dewan: includeDewan, pembantu_putra: includePembantuPutra, pembantu_putri: includePembantuPutri, pembina_putra: includePembina, pembina_putri: includePembinaPutri, kepala_sekolah: includeKetuaGudep } as Record<string, boolean>)[id]);
  const isiTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const penutupTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const applyPenutupFormat = (marker: '**' | '*') => { const el = penutupTextareaRef.current; if (!el) return; const start = el.selectionStart, end = el.selectionEnd; const selected = penutupParagraf.slice(start, end); if (!selected) return; setPenutupParagraf(`${penutupParagraf.slice(0,start)}${marker}${selected}${marker}${penutupParagraf.slice(end)}`); requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start+marker.length,end+marker.length); }); };
  const insertPenutupBullet = () => { const el = penutupTextareaRef.current; if (!el) return; const start = el.selectionStart; const lineStart = penutupParagraf.lastIndexOf('\\n',start-1)+1; setPenutupParagraf(`${penutupParagraf.slice(0,lineStart)}• ${penutupParagraf.slice(lineStart)}`); requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start+2,start+2); }); };
  const applyIsiFormat = (marker: '**' | '*') => {
    const el = isiTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const selected = isiParagraf.slice(start, end);
    if (!selected) return;
    setIsiParagraf(`${isiParagraf.slice(0, start)}${marker}${selected}${marker}${isiParagraf.slice(end)}`);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + marker.length, end + marker.length); });
  };
  const insertIsiBullet = () => {
    const el = isiTextareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = isiParagraf.lastIndexOf('\n', start - 1) + 1;
    setIsiParagraf(`${isiParagraf.slice(0, lineStart)}• ${isiParagraf.slice(lineStart)}`);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + 2, start + 2); });
  };

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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [previewPdfError, setPreviewPdfError] = useState('');
  
  // AI Generation Progress State (0 - 100%)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGeneratingTitle, setAiGeneratingTitle] = useState('');
  
  // Verification Modal State
  const [verificationModalSurat, setVerificationModalSurat] = useState<GeneratedSurat | null>(null);

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
            setIsiParagraf(res.trim());
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
  const handleGenerateSurat = async () => {

    // Resolve Dewan (Hanya jika includeDewan aktif)
    const dewanOptions: Record<string, { title: string; member?: string; nta?: string }> = {
      pradana_pa: { title: 'Pradana', member: dewanList.find(d => d.id === 'pradana_pa')?.memberName, nta: 'NTA. 10.035.001' },
      pemangku_adat: { title: 'Pemangku Adat', member: dewanList.find(d => d.id === 'pemangku_adat_pa')?.memberName, nta: 'NTA. 10.035.001' },
      kerani: { title: 'Kerani', member: dewanList.find(d => d.id === 'kerani_pa')?.memberName, nta: 'NTA. 10.035.001' },
      bendahara: { title: 'Bendahara', member: dewanList.find(d => d.id === 'juru_uang_pa')?.memberName, nta: 'NTA. 10.035.001' },
      ketua_sangga_kerja_pa: { title: 'Ketua Sangga Kerja Putra' }, sekretaris_sangga_kerja_pa: { title: 'Sekretaris Sangga Kerja Putra' },
      ketua_sangga_kerja_pi: { title: 'Ketua Sangga Kerja Putri' }, sekretaris_sangga_kerja_pi: { title: 'Sekretaris Sangga Kerja Putri' },
      ketua_panitia: { title: 'Ketua Panitia' }, sekretaris_panitia: { title: 'Sekretaris Panitia' }
    };
    const currentDewan = dewanOptions[selectedDewanId];
    const dewanNama = currentDewan?.member || customSignerName.trim();
    const dewanJabatan = currentDewan?.title || '';
    const dewanNta = currentDewan?.nta || '';

    // Resolve Pembina
    const pembinaNama = officials.pembinaPutra;
    const pembinaJabatan = 'Pembina Gugus Depan 10.035';
    const pembinaNip = officials.nipPembinaPutra;

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
    if (includeDewan && !dewanOptions[selectedDewanId]?.member && !customSignerName.trim()) { alert('Nama penandatangan wajib diisi untuk jabatan yang dipilih.'); return; }
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
        includeNomor: true,
        includeTanggal: true,
        includePerihal: true,
        includeLampiran: true,
        includeKeteranganIdentitas: Boolean(keteranganIdentitas.trim()),
        includeKepadaYth,
        penerimaNama,
        penerimaTempat,
        isiParagraf: isiParagraf,
        bulletStyle,
        rincianHariTanggal,
        rincianWaktu,
        includeTempat: true,
        rincianTempat,
        includeKeteranganAcara: Boolean(rincianKeteranganDetail.trim()),
        rincianKeteranganAcara: rincianKeteranganDetail,
        includeKeteranganDetail: false,
        rincianKeteranganDetail: '',
        penutupParagraf,
        includeDewan,
        dewanJabatan,
        dewanNama,
        dewanNta,
        approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, ketuaGudepApprovalType, kotaPengesahan,
        includePembina,
        includePembantuPutra,
        includePembantuPutri: false,
        pembantuPutraNama: officials.pembantuPembinaPutra,
        pembantuPutraJabatan: suratSettings.pembantuPutra,
        pembantuPutriNama: officials.pembantuPembinaPutri,
        pembantuPutriJabatan: suratSettings.pembantuPutri,
        pembantuPutraApprovalType, pembantuPutriApprovalType,
        pembinaJabatan: suratSettings.pembinaPutra,
        pembinaNama: officials.pembinaPutra,
        pembinaNip: officials.nipPembinaPutra,
        includeKetuaGudep,
        ketuaGudepNama: officials.ketuaGudep,
        ketuaGudepJabatan: suratSettings.ketuaMabigus,
        ketuaGudepNip: officials.nipKetuaGudep,
        metodeTtd,
        digitalSigner: 'pembina_putra',
        digitalSignerIds: selectedDigitalSignerIds.filter((id) => ['dewan', 'pembantu_putra', 'pembina_putra', 'kepala_sekolah'].includes(id)),
        digitalSignerName: officials.pembinaPutra,
        digitalSignerTitle: 'Pembina Putra Gugus Depan 10.035',
        qrCodeDataUrl: qrDataUrlPa,
        includeStempel: false,
        includeTembusan,
        tembusanList,
        signatureGapCm,
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
        includeNomor: true,
        includeTanggal: true,
        includePerihal: true,
        includeLampiran: true,
        includeKeteranganIdentitas: Boolean(keteranganIdentitas.trim()),
        includeKepadaYth,
        penerimaNama,
        penerimaTempat,
        isiParagraf: isiParagraf,
        bulletStyle,
        rincianHariTanggal,
        rincianWaktu,
        includeTempat: true,
        rincianTempat,
        includeKeteranganAcara: Boolean(rincianKeteranganDetail.trim()),
        rincianKeteranganAcara: rincianKeteranganDetail,
        includeKeteranganDetail: false,
        rincianKeteranganDetail: '',
        penutupParagraf,
        includeDewan,
        dewanJabatan,
        dewanNama,
        dewanNta,
        approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, ketuaGudepApprovalType, kotaPengesahan,
        includePembina: false,
        includePembinaTambahan: includePembinaPutri,
        includePembantuPutra: false,
        includePembantuPutri,
        pembantuPutraNama: officials.pembantuPembinaPutra,
        pembantuPutraJabatan: suratSettings.pembantuPutra,
        pembantuPutriNama: officials.pembantuPembinaPutri,
        pembantuPutriJabatan: suratSettings.pembantuPutri,
        pembantuPutraApprovalType, pembantuPutriApprovalType,
        pembinaJabatan: suratSettings.pembinaPutri,
        pembinaNama: officials.pembinaPutri,
        pembinaNip: officials.nipPembinaPutri,
        includeKetuaGudep,
        ketuaGudepNama: officials.ketuaGudep,
        ketuaGudepJabatan: suratSettings.ketuaMabigus,
        ketuaGudepNip: officials.nipKetuaGudep,
        metodeTtd,
        digitalSigner: 'pembina_putri',
        digitalSignerIds: selectedDigitalSignerIds.filter((id) => ['dewan', 'pembantu_putri', 'pembina_putri', 'kepala_sekolah'].includes(id)),
        digitalSignerName: officials.pembinaPutri,
        digitalSignerTitle: 'Pembina Putri Gugus Depan 10.036',
        qrCodeDataUrl: qrDataUrlPi,
        includeStempel: false,
        includeTembusan,
        tembusanList,
        signatureGapCm,
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
        includeNomor: true,
        includeTanggal: true,
        includePerihal: true,
        includeLampiran: true,
        includeKeteranganIdentitas: Boolean(keteranganIdentitas.trim()),
        includeKepadaYth,
        penerimaNama,
        penerimaTempat,
        isiParagraf: isiParagraf,
        bulletStyle,
        rincianHariTanggal,
        rincianWaktu,
        includeTempat: true,
        rincianTempat,
        includeKeteranganAcara: Boolean(rincianKeteranganDetail.trim()),
        rincianKeteranganAcara: rincianKeteranganDetail,
        includeKeteranganDetail: false,
        rincianKeteranganDetail: '',
        penutupParagraf,
        includeDewan,
        dewanJabatan,
        dewanNama,
        dewanNta,
        approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, ketuaGudepApprovalType, kotaPengesahan,
        includePembina,
        pembinaJabatan: suratSettings.pembinaPutra,
        pembinaNama: officials.pembinaPutra,
        pembinaNip: officials.nipPembinaPutra,
        includePembinaTambahan: includePembinaPutri,
        includePembantuPutra,
        includePembantuPutri,
        pembantuPutraNama: officials.pembantuPembinaPutra,
        pembantuPutraJabatan: suratSettings.pembantuPutra,
        pembantuPutriNama: officials.pembantuPembinaPutri,
        pembantuPutriJabatan: suratSettings.pembantuPutri,
        pembantuPutraApprovalType, pembantuPutriApprovalType,
        pembinaTambahanJabatan: suratSettings.pembinaPutri,
        pembinaTambahanNama: officials.pembinaPutri,
        pembinaTambahanNip: officials.nipPembinaPutri,
        includeKetuaGudep,
        ketuaGudepNama: officials.ketuaGudep,
        ketuaGudepNip: officials.nipKetuaGudep,
        metodeTtd,
        digitalSigner,
        digitalSignerIds: selectedDigitalSignerIds,
        digitalSignerName: signerName,
        digitalSignerTitle: signerTitle,
        qrCodeDataUrl: qrDataUrl,
        includeStempel: false,
        includeTembusan,
        tembusanList,
        signatureGapCm,
        createdAt: new Date().toISOString()
      });
    }

    const updated = [...createdList, ...arsipSurat];
    setArsipSurat(updated);
    try { localStorage.setItem(STORAGE_KEY_SURAT, JSON.stringify(updated)); } catch {}
    if (editingDraftId) { const remainingDrafts = draftSurat.filter((draft) => draft.id !== editingDraftId); setDraftSurat(remainingDrafts); try { localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(remainingDrafts)); } catch {} setEditingDraftId(null); }
    setPreviewSuratList(createdList);
    setActivePreviewIndex(0);
    setWizardStep(4);
    setViewMode('preview');
  };


  const currentDraftData = { includeNomor, nomorUrut, gudepPilihan, ceklisDuaDua, includeTanggal, tanggalSurat, includePerihal, perihal, includeLampiran, lampiran, includeKeteranganIdentitas, keteranganIdentitas, includeKepadaYth, penerimaNama, penerimaTempat, isiParagraf, bulletStyle, rincianHariTanggal, rincianWaktu, includeTempat, rincianTempat, includeKeteranganAcara, rincianKeteranganAcara, includeKeteranganDetail, rincianKeteranganDetail, penutupParagraf, includeDewan, selectedDewanId, customSignerName, includePembina, includePembinaPutri, includePembantuPutra, includePembantuPutri, selectedPembinaRole, includeKetuaGudep, approvalType, dewanApprovalType, pembinaApprovalType, pembinaTambahanApprovalType, pembantuPutraApprovalType, pembantuPutriApprovalType, ketuaGudepApprovalType, kotaPengesahan, signatureGapCm, metodeTtd, digitalSigner, digitalSignerIds, includeTembusan, tembusanList };
  const persistDraftSnapshot = () => {
    const id = editingDraftId || `draft_${Date.now()}`;
    const draft: FormDraft = { id, perihal: perihal.trim() || 'Draf tanpa judul', nomorUrut, savedAt: new Date().toISOString(), data: currentDraftData };
    let existing: FormDraft[] = [];
    try { existing = JSON.parse(localStorage.getItem(STORAGE_KEY_DRAFT) || '[]'); } catch {}
    const updated = [draft, ...existing.filter((item) => item.id !== id)];
    try { localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(updated)); } catch {}
    setDraftSurat(updated);
    setEditingDraftId(id);
    return draft;
  };

  // Simpan otomatis setiap perubahan saat formulir sedang dibuka.
  // Dengan demikian, keluar aplikasi/tab secara mendadak tidak menghilangkan isian terakhir.
  const currentDraftSerialized = JSON.stringify(currentDraftData);
  useEffect(() => {
    if (viewMode !== 'form') return;
    persistDraftSnapshot();
  }, [viewMode, currentDraftSerialized, editingDraftId]);

  const handleSaveDraft = () => {
    persistDraftSnapshot();
    setViewMode('drafts');
  };
  const handleOpenDraft = (draft: FormDraft) => {
    const d = draft.data as any;
    setIncludeNomor(true); setNomorUrut(d.nomorUrut ?? '024'); setGudepPilihan(d.gudepPilihan ?? '10.035-10.036'); setCeklisDuaDua(false);
    setIncludeTanggal(true); setTanggalSurat(d.tanggalSurat ?? ''); setIncludePerihal(true); setPerihal(d.perihal ?? draft.perihal);
    setIncludeLampiran(true); setLampiran(d.lampiran ?? ''); setIncludeKeteranganIdentitas(d.includeKeteranganIdentitas ?? false); setKeteranganIdentitas(d.keteranganIdentitas ?? '');
    setIncludeKepadaYth(d.includeKepadaYth ?? true); setPenerimaNama(d.penerimaNama ?? ''); setPenerimaTempat(d.penerimaTempat ?? '');
    setIsiParagraf(String(d.isiParagraf ?? '')); setBulletStyle(d.bulletStyle ?? 'titik');
    setRincianHariTanggal(d.rincianHariTanggal ?? ''); setRincianWaktu(d.rincianWaktu ?? ''); setIncludeTempat(d.includeTempat ?? true); setRincianTempat(d.rincianTempat ?? '');
    setIncludeKeteranganAcara(d.includeKeteranganAcara ?? true); setRincianKeteranganAcara(d.rincianKeteranganAcara ?? ''); setIncludeKeteranganDetail(d.includeKeteranganDetail ?? false); setRincianKeteranganDetail(d.rincianKeteranganDetail ?? ''); setPenutupParagraf(d.penutupParagraf ?? '');
    setIncludeDewan(d.includeDewan ?? false); setSelectedDewanId(d.selectedDewanId ?? 'pradana_pa'); setCustomSignerName(d.customSignerName ?? '');
    setIncludePembina(d.includePembina ?? false); setIncludePembinaPutri(d.includePembinaPutri ?? false); setIncludePembantuPutra(d.includePembantuPutra ?? false); setIncludePembantuPutri(d.includePembantuPutri ?? false); setIncludeKetuaGudep(d.includeKetuaGudep ?? false);
    setApprovalType(d.approvalType ?? 'Mengetahui'); setDewanApprovalType(d.dewanApprovalType ?? d.approvalType ?? 'Mengetahui'); setPembinaApprovalType(d.pembinaApprovalType ?? d.approvalType ?? 'Mengetahui'); setPembinaTambahanApprovalType(d.pembinaTambahanApprovalType ?? d.approvalType ?? 'Mengetahui'); setPembantuPutraApprovalType(d.pembantuPutraApprovalType ?? 'Mengetahui'); setPembantuPutriApprovalType(d.pembantuPutriApprovalType ?? 'Mengetahui'); setKetuaGudepApprovalType(d.ketuaGudepApprovalType ?? d.approvalType ?? 'Mengetahui'); setKotaPengesahan(d.kotaPengesahan ?? 'Maros'); setSignatureGapCm(d.signatureGapCm ?? 0); setMetodeTtd(d.metodeTtd ?? 'digital'); setDigitalSigner(d.digitalSigner ?? 'pembina_putra'); setDigitalSignerIds(d.digitalSignerIds ?? ['pembina_putra']);
    setIncludeTembusan(d.includeTembusan ?? true); setTembusanList(d.tembusanList ?? []);
    setEditingDraftId(draft.id); setWizardStep(1); setViewMode('form');
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

      const safePerihal = (surat.perihal || 'Surat Ambalan')
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9 _-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .slice(0, 90) || 'Surat_Ambalan';
      const fileName = `${safePerihal}.pdf`;

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

  useEffect(() => {
    if (viewMode !== 'preview' || !activeSurat) {
      setPdfPreviewUrl('');
      setPreviewPdfError('');
      setIsPreparingPreview(false);
      return;
    }
    let cancelled = false;
    let objectUrl = '';
    setIsPreparingPreview(true);
    setPreviewPdfError('');
    setPdfPreviewUrl('');
    createLetterPdf(activeSurat).then((bytes) => {
      if (cancelled) return;
      const blob = new Blob([new Uint8Array(bytes).buffer as ArrayBuffer], { type: 'application/pdf' });
      objectUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(objectUrl);
    }).catch((error) => {
      if (!cancelled) setPreviewPdfError(error instanceof Error ? error.message : String(error));
    }).finally(() => {
      if (!cancelled) setIsPreparingPreview(false);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [viewMode, activeSurat?.id, activeSurat?.createdAt]);

  return (
    <div className="space-y-4 pb-28 font-sans">
      <div className="flex items-center justify-center py-2"><h1 className="text-lg font-extrabold text-slate-900 text-center">Kelola Surat Ambalan</h1></div>
      {viewMode === 'dashboard' && (
        <div className="grid grid-cols-1 gap-3">
          <button type="button" onClick={() => { setEditingDraftId(null); setWizardStep(1); setViewMode('form'); }} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left flex items-center gap-4"><span className="w-12 h-12 rounded-xl bg-red-50 text-[#b71922] flex items-center justify-center text-2xl">＋</span><span className="min-w-0"><strong className="block text-sm text-slate-900">Buat Surat Baru</strong><span className="block text-xs text-slate-500 mt-1">Isi, generate, dan simpan surat ke bundel keluar</span></span><span className="ml-auto text-slate-400">›</span></button>
          <button type="button" onClick={() => setViewMode('drafts')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left flex items-center gap-4"><span className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl">▤</span><span className="min-w-0"><strong className="block text-sm text-slate-900">Draf Surat</strong><span className="block text-xs text-slate-500 mt-1">{draftSurat.length} draf tersimpan</span></span><span className="ml-auto text-slate-400">›</span></button>
          <button type="button" onClick={() => setViewMode('list')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left flex items-center gap-4"><span className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl">▣</span><span className="min-w-0"><strong className="block text-sm text-slate-900">Bundel Surat Keluar</strong><span className="block text-xs text-slate-500 mt-1">{arsipSurat.length} surat tersimpan</span></span><span className="ml-auto text-slate-400">›</span></button>
          <button type="button" onClick={() => setViewMode('settings')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left flex items-center gap-4"><span className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-2xl">⚙</span><span className="min-w-0"><strong className="block text-sm text-slate-900">Pengaturan Surat</strong><span className="block text-xs text-slate-500 mt-1">Atur kalimat jabatan pada pengesahan</span></span><span className="ml-auto text-slate-400">›</span></button>
        </div>
      )}
      {viewMode === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Pengaturan Surat</h2>
            <p className="text-xs text-slate-500 mt-1">Ubah kalimat jabatan yang akan tampil pada bagian pengesahan surat. Perubahan disimpan otomatis.</p>
          </div>
          {([
            ['ketuaMabigus', 'Jabatan Kepala Sekolah / Ketua Mabigus'],
            ['pembinaPutra', 'Jabatan Pembina Putra'],
            ['pembinaPutri', 'Jabatan Pembina Putri'],
            ['pembantuPutra', 'Jabatan Pembantu Pembina Putra'],
            ['pembantuPutri', 'Jabatan Pembantu Pembina Putri'],
          ] as const).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-xs font-bold text-slate-700">{label}</span>
              <textarea
                rows={2}
                value={suratSettings[key]}
                onChange={(e) => setSuratSettings((current) => ({ ...current, [key]: e.target.value }))}
                placeholder={`Masukkan ${label.toLowerCase()}`}
                className="w-full h-[4.5rem] min-h-[4.5rem] max-h-[4.5rem] text-sm p-3 rounded-xl border border-slate-200 bg-white resize-none overflow-y-auto leading-6"
              />
            </label>
          ))}
          <button type="button" onClick={() => setViewMode('dashboard')} className="w-full py-3 rounded-xl bg-[#c81e28] text-white text-sm font-bold">Selesai</button>
        </div>
      )}

      {/* Download Success Notification Toast */}
      {downloadSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <span>✅ {downloadSuccessMessage || 'PDF siap diunduh.'}</span>
          <button type="button" onClick={() => setDownloadSuccessToast(false)} className="text-emerald-700 font-bold px-1.5">✕</button>
        </div>
      )}

      {(viewMode === 'form' || viewMode === 'preview') && (<div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 space-y-2"><div className="flex items-center justify-between gap-2">{[{step:1,title:'Identitas'},{step:2,title:'Isi Surat'},{step:3,title:'Penandatanganan'},{step:4,title:'Pratinjau'}].map(item=><button type="button" key={item.step} onClick={()=>{if(item.step===4)return;setWizardStep(item.step as 1|2|3);setViewMode('form');}} className="flex-1 min-w-0 text-center"><div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${wizardStep===item.step?'bg-[#c81e28] text-white':wizardStep>item.step?'bg-red-100 text-[#b71922]':'bg-slate-100 text-slate-400'}`}>{item.step}</div><p className={`mt-1 text-[9px] font-semibold truncate ${wizardStep===item.step?'text-[#b71922]':'text-slate-500'}`}>{item.title}</p></button>)}</div><div className="h-1 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-[#c81e28] transition-all" style={{width:`${wizardStep/4*100}%`}} /></div></div>)}
      {/* ======================================================== */}
      {/* 1. GOOGLE FORM STYLE: DUA BAGIAN (IDENTITAS & ISI SURAT)  */}
      {/* ======================================================== */}
      {viewMode === 'form' && (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* ==================== BAGIAN 1: IDENTITAS ==================== */}
          {wizardStep === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-[#c81e28]">Identitas Surat</span>
            </div>

            

            <div className="space-y-1 pt-2"><label className="text-xs font-bold text-slate-800">Tanggal Surat <span className="text-[#c81e28]">*</span></label><input type="text" value={tanggalSurat} onChange={(e) => setTanggalSurat(e.target.value)} placeholder="Contoh: 10 November 2026" required className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-800">Nomor Surat <span className="text-[#c81e28]">*</span></label><div className="flex items-center gap-2"><input type="text" value={nomorUrut} onChange={(e) => setNomorUrut(e.target.value)} placeholder="Contoh: 015" required className="w-24 text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono focus:border-[#c81e28]" /><span className="text-xs font-mono text-slate-500">/{gudepPilihan}/C/2026</span></div></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-800">Lampiran <span className="text-[#c81e28]">*</span></label><input type="text" value={lampiran} onChange={(e) => setLampiran(e.target.value)} placeholder="Isi jumlah lampiran atau tanda -" required className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-800">Perihal <span className="text-[#c81e28]">*</span></label><input type="text" value={perihal} onChange={(e) => setPerihal(e.target.value)} placeholder="Contoh: Undangan Kegiatan Latihan Gabungan" required className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]" /></div>

            <div className="space-y-1"><label className="text-xs font-bold text-slate-800">Keterangan <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span></label><input type="text" value={keteranganIdentitas} onChange={(e) => setKeteranganIdentitas(e.target.value)} placeholder="Contoh: Penting / Segera" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28]" /></div>

            {/* 6. Kepada Yth. (Opsional, dengan lingkaran opsi) */}
            <div className="flex items-start gap-3 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIncludeKepadaYth(!includeKepadaYth)}
                title="Pilih untuk memasukkan Kepada Yth"
                className={`mt-6 w-6 h-6 rounded-md shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                  includeKepadaYth
                    ? 'border-[#c81e28] bg-[#c81e28] text-white shadow-xs'
                    : 'border-slate-300 bg-white'
                }`}
              >
              </button>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Kepada Yth.</label>
                </div>
                {includeKepadaYth && (
                  <textarea rows={3} value={penerimaNama} onChange={(e) => setPenerimaNama(e.target.value)} placeholder="Nama / Instansi Penerima (bisa beberapa baris)" className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#c81e28] resize-y" />
                )}
              </div>
            </div>

          </div>
          )}

          {/* ==================== BAGIAN 2: ISI SURAT ==================== */}
          {wizardStep === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-[#c81e28]">Isi Surat</span>
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
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => applyIsiFormat('**')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black" title="Tebal">B</button>
                <button type="button" onClick={() => applyIsiFormat('*')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs italic" title="Miring">I</button>
                <button type="button" onClick={insertIsiBullet} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs" title="Sisipkan poin">• Poin</button>
                <span className="text-[10px] text-slate-400">Pilih teks lalu tekan B atau I untuk memformat.</span>
              </div>
              <textarea
                ref={isiTextareaRef}
                rows={5}
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

              <div className="space-y-2"><label className="text-[11px] font-bold text-slate-700 block">Tempat <span className="text-[#c81e28]">*</span></label><input type="text" value={rincianTempat} onChange={(e) => setRincianTempat(e.target.value)} required placeholder="Tempat kegiatan" className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-900" /><label className="text-[11px] font-bold text-slate-700 block">Keterangan <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span></label><input type="text" value={rincianKeteranganDetail} onChange={(e) => setRincianKeteranganDetail(e.target.value)} placeholder="Keterangan tambahan" className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white text-slate-900" /></div>

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
              <div className="flex flex-wrap items-center gap-1.5"><button type="button" onClick={() => applyPenutupFormat('**')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black">B</button><button type="button" onClick={() => applyPenutupFormat('*')} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs italic">I</button><button type="button" onClick={insertPenutupBullet} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">• Poin</button></div>
              <textarea
                ref={penutupTextareaRef}
                rows={2}
                value={penutupParagraf}
                onChange={(e) => setPenutupParagraf(e.target.value)}
                placeholder="Tuliskan penutup surat..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed font-serif focus:border-[#c81e28] focus:outline-none"
              />
            </div>

          </div>
          )}

          {/* ==================== BAGIAN 3: PENGESAHAN (SEMUA HARUS DIPILIH) ==================== */}
          {wizardStep === 3 && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-black text-[#c81e28] uppercase tracking-wider block">
                  Penandatanganan
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Tanggal ikut surat</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"><div className="space-y-1"><label className="text-[11px] font-bold text-slate-700">Kota pengesahan <span className="text-[#c81e28]">*</span></label><input type="text" value={kotaPengesahan} onChange={(e) => setKotaPengesahan(e.target.value)} required placeholder="Maros" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white" /></div></div>

            {/* Jarak hanya diatur ketika tepat dua penandatangan dipilih */}
            { [includeDewan, includePembantuPutra, includePembantuPutri, includePembina, includePembinaPutri, includeKetuaGudep].filter(Boolean).length === 2 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">Jarak antara dua TTD</label>
                  <span className="text-xs font-bold text-[#c81e28]">{signatureGapCm.toFixed(1)} cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={signatureGapCm}
                  onChange={(e) => setSignatureGapCm(Number(e.target.value))}
                  className="w-full accent-[#c81e28]"
                />
                <p className="text-[10px] text-slate-500">Geser untuk mengatur posisi TTD kanan. Tulisan Mengetahui/Menyetujui otomatis tetap berada di titik tengah kedua TTD.</p>
              </div>
            )}

            {/* Semua pilihan penandatangan bersifat opsional dan independen */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-bold">1. Dewan / Sangga Kerja (opsional)</label>
                <label className="text-[10px] flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-[#c81e28] checked:bg-[#c81e28] checked:ring-2 checked:ring-red-100" checked={includeDewan} onChange={e=>setIncludeDewan(e.target.checked)}/> Sertakan penandatangan</label>
                {includeDewan && <><select value={selectedDewanId} onChange={e=>setSelectedDewanId(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border">
                  <option value="pradana_pa">Pradana</option><option value="pemangku_adat">Pemangku Adat</option><option value="kerani">Kerani</option><option value="bendahara">Bendahara</option><option value="ketua_sangga_kerja_pa">Ketua Sangga Kerja Putra</option><option value="sekretaris_sangga_kerja_pa">Sekretaris Sangga Kerja Putra</option><option value="ketua_sangga_kerja_pi">Ketua Sangga Kerja Putri</option><option value="sekretaris_sangga_kerja_pi">Sekretaris Sangga Kerja Putri</option><option value="ketua_panitia">Ketua Panitia</option><option value="sekretaris_panitia">Sekretaris Panitia</option>
                </select><input value={customSignerName} onChange={e=>setCustomSignerName(e.target.value)} placeholder={dewanList.find(d=>d.id===selectedDewanId)?.memberName || 'Nama penandatangan'} className="w-full text-xs p-2.5 rounded-xl border"/><p className="text-xs font-semibold text-slate-600">Hormat kami</p><label className="block text-[10px] font-semibold text-slate-600">Format TTD</label><select value={digitalSignerIds.includes('dewan')?'digital':'biasa'} onChange={e=>toggleDigitalSigner('dewan',e.target.value==='digital')} className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"><option value="biasa">Biasa (tanda tangan basah)</option><option value="digital">Digital (QR)</option></select></>}
              </div>
              <div className="border-t pt-3 space-y-2"><label className="text-xs font-bold">2. Pembantu Pembina Gugus Depan 10.035 (Putra)</label><label className="text-[10px] flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-[#c81e28] checked:bg-[#c81e28] checked:ring-2 checked:ring-red-100" checked={includePembantuPutra} onChange={e=>setIncludePembantuPutra(e.target.checked)}/> Sertakan (opsional)</label>{includePembantuPutra && <><p className="text-xs">{officials.pembantuPembinaPutra}</p><select value={pembantuPutraApprovalType} onChange={e=>setPembantuPutraApprovalType(e.target.value as any)} className="w-full text-xs p-2 border rounded"><option value="">Tanpa keterangan</option><option>Mengetahui</option><option>Menyetujui</option></select><label className="block text-[10px] font-semibold text-slate-600">Format TTD</label><select value={digitalSignerIds.includes('pembantu_putra')?'digital':'biasa'} onChange={e=>toggleDigitalSigner('pembantu_putra',e.target.value==='digital')} className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"><option value="biasa">Biasa (tanda tangan basah)</option><option value="digital">Digital (QR)</option></select></>}</div>
              <div className="border-t pt-3 space-y-2"><label className="text-xs font-bold">3. Pembantu Pembina Gugus Depan 10.036 (Putri)</label><label className="text-[10px] flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-[#c81e28] checked:bg-[#c81e28] checked:ring-2 checked:ring-red-100" checked={includePembantuPutri} onChange={e=>setIncludePembantuPutri(e.target.checked)}/> Sertakan (opsional)</label>{includePembantuPutri && <><p className="text-xs">{officials.pembantuPembinaPutri}</p><select value={pembantuPutriApprovalType} onChange={e=>setPembantuPutriApprovalType(e.target.value as any)} className="w-full text-xs p-2 border rounded"><option value="">Tanpa keterangan</option><option>Mengetahui</option><option>Menyetujui</option></select><label className="block text-[10px] font-semibold text-slate-600">Format TTD</label><select value={digitalSignerIds.includes('pembantu_putri')?'digital':'biasa'} onChange={e=>toggleDigitalSigner('pembantu_putri',e.target.value==='digital')} className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"><option value="biasa">Biasa (tanda tangan basah)</option><option value="digital">Digital (QR)</option></select></>}</div>
              <div className="border-t pt-3 space-y-2"><label className="text-xs font-bold">4. Pembina Gugus Depan 10.035 (Putra)</label><label className="text-[10px] flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-[#c81e28] checked:bg-[#c81e28] checked:ring-2 checked:ring-red-100" checked={includePembina} onChange={e=>setIncludePembina(e.target.checked)}/> Sertakan (opsional)</label>{includePembina && <><p className="text-xs">{officials.pembinaPutra}</p><select value={pembinaApprovalType} onChange={e=>setPembinaApprovalType(e.target.value as any)} className="w-full text-xs p-2 border rounded"><option value="">Tanpa keterangan</option><option>Mengetahui</option><option>Menyetujui</option></select><label className="block text-[10px] font-semibold text-slate-600">Format TTD</label><select value={digitalSignerIds.includes('pembina_putra')?'digital':'biasa'} onChange={e=>toggleDigitalSigner('pembina_putra',e.target.value==='digital')} className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"><option value="biasa">Biasa (tanda tangan basah)</option><option value="digital">Digital (QR)</option></select></>}</div>
              <div className="border-t pt-3 space-y-2"><label className="text-xs font-bold">5. Pembina Gugus Depan 10.036 (Putri)</label><label className="text-[10px] flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-[#c81e28] checked:bg-[#c81e28] checked:ring-2 checked:ring-red-100" checked={includePembinaPutri} onChange={e=>setIncludePembinaPutri(e.target.checked)}/> Sertakan (opsional)</label>{includePembinaPutri && <><p className="text-xs">{officials.pembinaPutri}</p><select value={pembinaTambahanApprovalType} onChange={e=>setPembinaTambahanApprovalType(e.target.value as any)} className="w-full text-xs p-2 border rounded"><option value="">Tanpa keterangan</option><option>Mengetahui</option><option>Menyetujui</option></select><label className="block text-[10px] font-semibold text-slate-600">Format TTD</label><select value={digitalSignerIds.includes('pembina_putri')?'digital':'biasa'} onChange={e=>toggleDigitalSigner('pembina_putri',e.target.value==='digital')} className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"><option value="biasa">Biasa (tanda tangan basah)</option><option value="digital">Digital (QR)</option></select></>}</div>
              <div className="border-t pt-3 space-y-2"><label className="text-xs font-bold">6. Ketua Mabigus UPT SMA Negeri 9 Maros</label><label className="text-[10px] flex items-center gap-2"><input type="checkbox" className="h-3.5 w-3.5 shrink-0 appearance-none rounded-full border border-[#c81e28] checked:bg-[#c81e28] checked:ring-2 checked:ring-red-100" checked={includeKetuaGudep} onChange={e=>setIncludeKetuaGudep(e.target.checked)}/> Sertakan (opsional)</label>{includeKetuaGudep && <><p className="text-xs">{officials.ketuaGudep}</p><select value={ketuaGudepApprovalType} onChange={e=>setKetuaGudepApprovalType(e.target.value as any)} className="w-full text-xs p-2 border rounded"><option value="">Tanpa keterangan</option><option>Mengetahui</option><option>Menyetujui</option></select><label className="block text-[10px] font-semibold text-slate-600">Format TTD</label><select value={digitalSignerIds.includes('kepala_sekolah')?'digital':'biasa'} onChange={e=>toggleDigitalSigner('kepala_sekolah',e.target.value==='digital')} className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"><option value="biasa">Biasa (tanda tangan basah)</option><option value="digital">Digital (QR)</option></select></>}</div>
            </div>

            <p className="text-[10px] text-slate-500">Tentukan format tanda tangan masing-masing penandatangan.</p>

            {/* Tembusan (Ketik + tombol tambah) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-start gap-2"><button type="button" onClick={() => setIncludeTembusan(!includeTembusan)} aria-label="Aktifkan tembusan" className={`w-3.5 h-3.5 shrink-0 rounded-full border border-[#c81e28] ${includeTembusan?'bg-[#c81e28] ring-2 ring-red-100':'bg-white'}`} /><label className="text-xs font-bold text-slate-800">Tembusan Surat <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span></label></div>

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
          </div>
          )}

          <div className="flex gap-2 pt-1">
            {wizardStep > 1 && (
              <button type="button" onClick={() => setWizardStep(wizardStep === 3 ? 2 : 1)} className="flex-1 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold">Kembali</button>
            )}
            {wizardStep < 3 ? (
              <button type="button" onClick={() => setWizardStep(wizardStep === 1 ? 2 : 3)} className="flex-1 py-3 rounded-xl bg-[#c81e28] text-white text-sm font-extrabold">Lanjutkan</button>
            ) : (
              <button type="button" onClick={(e) => { const form = e.currentTarget.closest("form"); if (form && !form.reportValidity()) return; void handleGenerateSurat(); }} className="flex-1 py-3 rounded-xl bg-[#c81e28] hover:bg-[#a91b24] text-white text-sm font-extrabold">Lanjut ke Pratinjau</button>
            )}
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. TAMPILAN PRATINJAU SURAT (KOP ASLI DENGAN INLINE BASE64) */}
      {/* ======================================================== */}
      {viewMode === 'preview' && activeSurat && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3"><h2 className="text-sm font-extrabold text-slate-900 text-center">Pratinjau Surat</h2></div>
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold"
              >
                Simpan Draft
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(activeSurat)}
                disabled={isExportingPdf}
                className="py-2 px-4 rounded-xl bg-[#c81e28] hover:bg-[#a91b24] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{isExportingPdf ? '⏳ Memproses PDF...' : '📥 Unduh PDF'}</span>
              </button>
            </div>
          </div>

          {/* Pratinjau memakai PDF yang sama persis dengan hasil unduhan dan kop surat asli */}
          <div className="w-full max-w-[900px] mx-auto bg-slate-100 border border-slate-200 rounded-2xl p-2 sm:p-3">
            {isPreparingPreview && (
              <div className="min-h-[60vh] flex items-center justify-center text-sm text-slate-500">
                Menyusun pratinjau surat asli...
              </div>
            )}
            {previewPdfError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                Pratinjau PDF belum dapat ditampilkan: {previewPdfError}
              </div>
            )}
            {pdfPreviewUrl && !isPreparingPreview && (
              <iframe
                title={`Pratinjau surat ${activeSurat.perihal}`}
                src={pdfPreviewUrl}
                className="w-full h-[78vh] min-h-[620px] bg-white border border-slate-300"
              />
            )}
          </div>
          <button type="button" onClick={() => { setWizardStep(3); setViewMode('form'); }} className="w-full py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold">Kembali</button>
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
                        setWizardStep(4);
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
                  setWizardStep(4);
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
