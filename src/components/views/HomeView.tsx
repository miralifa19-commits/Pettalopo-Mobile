import React, { useState, useRef } from 'react';
import { 
  Award, 
  Brain, 
  ChevronRight, 
  X, 
  ArrowRight,
  Shield,
  Crown,
  CalendarCheck,
  FileText,
  Users,
  GraduationCap,
  Home,
  MessageCircle,
  Settings,
  UserCheck
} from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { DEFAULT_PROGRAM_KERJA_ITEMS } from '../../data/defaultProgramKerja';
import { ShiningAmbalanLogo } from '../common/ShiningAmbalanLogo';

interface HomeViewProps {
  onNavigateMenu?: (menu: ActiveMenu) => void;
  user?: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
}

interface KalenderBulanItem {
  id: number;
  bulan: string;
  singkatan: string;
  bgHex: string;
  iconSymbol: string;
  kegiatanUtama: string;
  deskripsi: string;
}

// 12 Bulan sesuai lingkaran SDGs (Januari s.d. Desember)
const BULAN_LINGKARAN_SDG: KalenderBulanItem[] = [
  {
    id: 1,
    bulan: 'Januari',
    singkatan: 'JAN',
    bgHex: '#C5192D', // Merah Tua
    iconSymbol: '🚩',
    kegiatanUtama: 'Pelantikan Penggalang & Penegak',
    deskripsi: 'Upacara kenaikan tingkat Penegak Bantara, pindah golongan, dan penerimaan tamu ambalan baru.'
  },
  {
    id: 2,
    bulan: 'Februari',
    singkatan: 'FEB',
    bgHex: '#EA580C', // Oranye
    iconSymbol: '🌱',
    kegiatanUtama: 'Bakti Sosial Peduli Lingkungan',
    deskripsi: 'Aksi penghijauan pangkalan, penanaman pohon, dan bakti pembersihan lingkungan hidup.'
  },
  {
    id: 3,
    bulan: 'Maret',
    singkatan: 'MAR',
    bgHex: '#D97706', // Kuning Emas
    iconSymbol: '🪢',
    kegiatanUtama: 'Pelatihan Tali Temali dan Simpul',
    deskripsi: 'Pendalaman simpul mati, pangkal, jangkar, kembar, dan ikatan pionering tiang bendera.'
  },
  {
    id: 4,
    bulan: 'April',
    singkatan: 'APR',
    bgHex: '#65A30D', // Hijau Muda
    iconSymbol: '🎒',
    kegiatanUtama: 'Menjelajah Alam dan Hiking',
    deskripsi: 'Lintas alam pedesaan/hutan, penjelajahan rute jejak kompas, dan survival dasar penegak.'
  },
  {
    id: 5,
    bulan: 'Mei',
    singkatan: 'MEI',
    bgHex: '#15803D', // Hijau Tua
    iconSymbol: '🧗',
    kegiatanUtama: 'Lomba Ketangkasan & Pionering',
    deskripsi: 'Kompetisi pembuatan jembatan darurat, menara pandang cepat, dan ketangkasan fisik sangga.'
  },
  {
    id: 6,
    bulan: 'Juni',
    singkatan: 'JUN',
    bgHex: '#0891B2', // Cyan / Biru Muda
    iconSymbol: '🏕️',
    kegiatanUtama: 'Perkemahan dan Api Unggun',
    deskripsi: 'Perkemahan akbar penutupan tahun ajaran, upacara malam api unggun, dan malam apresiasi budaya.'
  },
  {
    id: 7,
    bulan: 'Juli',
    singkatan: 'JUL',
    bgHex: '#0F766E', // Teal / Hijau Laut
    iconSymbol: '🩹',
    kegiatanUtama: 'Simulasi Pertolongan Pertama (PMR)',
    deskripsi: 'Pelatihan P3K darurat, pembalutan mitela luka, pembuatan tandu darurat, dan evakuasi korban.'
  },
  {
    id: 8,
    bulan: 'Agustus',
    singkatan: 'AGU',
    bgHex: '#1D4ED8', // Biru
    iconSymbol: '🔥',
    kegiatanUtama: 'Pesta Pramuka & Syukur HUT',
    deskripsi: 'Peringatan Hari Pramuka ke-65, karnaval ambalan, dan renungan suci Trisatya & Dasa Darma.'
  },
  {
    id: 9,
    bulan: 'September',
    singkatan: 'SEP',
    bgHex: '#1E293B', // Navy Gelap
    iconSymbol: '🧭',
    kegiatanUtama: 'Orientering & Baca Peta Kompas',
    deskripsi: 'Navigasi darat, membaca peta topografi kontur, penentuan posisi resection, dan orientering.'
  },
  {
    id: 10,
    bulan: 'Oktober',
    singkatan: 'OKT',
    bgHex: '#6B21A8', // Ungu
    iconSymbol: '🎭',
    kegiatanUtama: 'Pengembangan Bakat Seni Budaya',
    deskripsi: 'Pentas seni ambalan, teater kearifan lokal Siri\' na Pacce, musik bambu, dan pameran sangga.'
  },
  {
    id: 11,
    bulan: 'November',
    singkatan: 'NOV',
    bgHex: '#9D174D', // Magenta / Plum
    iconSymbol: '🎖️',
    kegiatanUtama: 'Kegiatan Baris Berbaris (PBB)',
    deskripsi: 'Latihan baris berbaris tongkat resmi, variasi formasi lapangan, dan penanaman disiplin diri.'
  },
  {
    id: 12,
    bulan: 'Desember',
    singkatan: 'DES',
    bgHex: '#BE185D', // Rose Pink
    iconSymbol: '📜',
    kegiatanUtama: 'Evaluasi Tahunan & Lencana',
    deskripsi: 'Musyawarah ambalan tahunan, penganugerahan bintang tahunan, dan penghargaan lencana teladan.'
  }
];

// Helper kalkulasi geometri SVG Donut Arc (12 Sektor Lingkaran SDGs)
function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  };
}

function describeArcSegment(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z'
  ].join(' ');
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateMenu,
  user,
  programKerjaList = DEFAULT_PROGRAM_KERJA_ITEMS,
}) => {

  // Current calendar month (0 = Januari, 9 = Oktober)
  const currentMonthIdx = new Date().getMonth();
  const [selectedIdx, setSelectedIdx] = useState<number>(currentMonthIdx);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // State untuk melihat/sembunyikan semua kegiatan (12 bulan)
  const [showAllActivities, setShowAllActivities] = useState(false);

  const activeItem = BULAN_LINGKARAN_SDG[selectedIdx] || BULAN_LINGKARAN_SDG[0];

  // Related proker from database for active month
  const relatedProker = programKerjaList.filter(
    p => p.bulan?.toLowerCase() === activeItem.bulan.toLowerCase()
  );

  const handleSelectMonth = (idx: number) => {
    setSelectedIdx(idx);
  };

  // SVG Dimension constants
  const size = 320;
  const center = size / 2; // 160
  const outerR = 142;
  const innerR = 86;
  const gapDegree = 3; // White gap between 12 SDG segments
  const sliceDegree = 360 / 12; // 30 degrees per month

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* IDENTITAS PORTAL AMBALAN */}
      <section className="rounded-[26px] bg-white border border-slate-200/80 p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <ShiningAmbalanLogo className="w-12 h-12" />
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Ambalan La Surullah</p>
            <h1 className="text-[23px] font-black tracking-tight text-slate-900">Petta Lopo</h1>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e51c24]">Portal Informasi Ambalan</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">Satu tempat untuk seluruh informasi dan aktivitas ambalan.</p>
        </div>
      </section>

      {/* ILUSTRASI VECTOR PRAMUKA */}
      <section data-keep-color="true" className="relative overflow-hidden rounded-[28px] bg-[#e51c24] text-white min-h-[190px] shadow-md">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 85% 15%, #ffb8bb 0, transparent 34%), radial-gradient(circle at 10% 100%, #9f1118 0, transparent 38%)'}} />
        <div className="relative z-10 flex min-h-[190px] items-center">
          <div className="w-[57%] p-4 pr-0">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-bold tracking-wider text-red-50">SATU AMBALAN · SATU SEMANGAT</span>
            <h2 className="mt-3 text-xl font-black leading-tight">Bergerak.<br/>Berkarya.<br/><span className="text-[#F4C66A]">Mengabdi.</span></h2>
            <p className="mt-2 text-[10px] leading-relaxed text-red-50/90">Ruang informasi dan aktivitas Pramuka kita.</p>
          </div>
          <div className="absolute right-0 bottom-0 w-[52%] h-full flex items-end justify-center">
            <svg viewBox="0 0 220 190" className="w-full h-full" role="img" aria-label="Ilustrasi vektor perkemahan Pramuka di alam terbuka">
              <circle cx="164" cy="42" r="21" fill="#F4C66A" opacity=".95"/>
              <path d="M0 145 L54 72 L100 133 L145 65 L220 151 V190 H0Z" fill="#9f1118"/>
              <path d="M0 160 L65 105 L111 151 L163 105 L220 157 V190 H0Z" fill="#c9161d"/>
              <path d="M22 174 L54 124 L86 174Z" fill="#E9D7B5"/>
              <path d="M54 124 L86 174 H54Z" fill="#C69B61"/>
              <path d="M39 174 L54 148 L69 174Z" fill="#650b10"/>
              <path d="M117 176 L145 119 L173 176Z" fill="#D9C49B"/>
              <path d="M145 119 L173 176 H145Z" fill="#B88951"/>
              <path d="M135 176 L145 153 L156 176Z" fill="#650b10"/>
              <path d="M185 153 L199 111 L213 153Z" fill="#7f1016"/>
              <path d="M199 111 V169" stroke="#E8E2D2" strokeWidth="2"/>
              <path d="M200 112 L220 119 L200 127Z" fill="#E51C24"/>
              <path d="M8 158 L21 121 L34 158Z" fill="#7f1016"/>
              <path d="M21 121 V171" stroke="#7f1016" strokeWidth="3"/>
              <path d="M8 143 L21 105 L34 143Z" fill="#a3151b"/>
              <path d="M21 105 V171" stroke="#7f1016" strokeWidth="3"/>
              <path d="M0 180 Q65 166 115 180 T220 178 V190 H0Z" fill="#650b10"/>
            </svg>
          </div>
        </div>
      </section>

      {/* AGENDA UTAMA */}
      <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#e51c24]">Agenda Utama</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Kegiatan Ambalan</h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CalendarCheck className="h-5 w-5"/>
          </div>
        </div>
        <div className="px-4 pb-4 pt-2">
          <p className="text-xs leading-relaxed text-slate-500">Pantau agenda kegiatan, jadwal, dan latihan rutin Ambalan La Surullah.</p>
          <button onClick={() => onNavigateMenu?.('dashboard')} className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#e51c24] px-3.5 py-3 text-left text-xs font-bold text-white transition active:scale-[0.99]">
            <span>Lihat semua kegiatan dan latihan rutin</span>
            <ArrowRight className="h-4 w-4"/>
          </button>
        </div>
      </section>

      {/* RUANG BELAJAR */}
      <button onClick={() => onNavigateMenu?.('ruang_belajar')} className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[26px] bg-white p-4 text-left border border-slate-200 transition active:scale-[0.99]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e51c24] text-white shadow-sm">
          <GraduationCap className="h-6 w-6"/>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#e51c24]">Ruang Belajar Ambalan</p>
          <h2 className="mt-1 text-sm font-black text-slate-900">Asah pengetahuanmu</h2>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-600">di ruang belajar ambalan</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-[#e51c24] transition-transform group-hover:translate-x-1"/>
      </button>

      {/* 2. RODA 12 BULAN: SEKARANG BERNAMA "Kegiatan dan Latihan Rutin" */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Header Roda yang Diperbarui */}
        <div className="text-center">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Agenda Ambalan
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight mt-1">
            Kegiatan dan Latihan Rutin
          </h3>
          <p className="text-[11px] text-slate-500">
            Sentuh segmen bulan untuk melihat agenda
          </p>
        </div>

        {/* Lingkaran Donut 12 Bulan Statis (Tidak Diputar) */}
        <div className="flex justify-center items-center py-2 relative select-none">
          <div 
            className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex items-center justify-center"
          >
            {/* SVG Roda Statis Tetap pada Posisinya */}
            <svg 
              viewBox={`0 0 ${size} ${size}`} 
              className="w-full h-full"
            >
              {BULAN_LINGKARAN_SDG.map((m, idx) => {
                const isSelected = selectedIdx === idx;
                // Calculate segment angles starting at top 12 o'clock (-90 deg)
                const startAngle = idx * sliceDegree - 90 + gapDegree / 2;
                const endAngle = (idx + 1) * sliceDegree - 90 - gapDegree / 2;

                const pathData = describeArcSegment(
                  center,
                  center,
                  isSelected ? innerR - 4 : innerR,
                  isSelected ? outerR + 5 : outerR,
                  startAngle,
                  endAngle
                );

                // Label position in middle of segment
                const midAngle = (startAngle + endAngle) / 2;
                const labelPos = polarToCartesian(center, center, (innerR + outerR) / 2, midAngle);

                return (
                  <g 
                    key={m.id} 
                    className="cursor-pointer" 
                    onClick={() => handleSelectMonth(idx)}
                  >
                    {/* Sektor Donut Lingkaran */}
                    <path
                      d={pathData}
                      fill={m.bgHex}
                      className="transition-all duration-200 hover:opacity-90 active:scale-[0.98] origin-center"
                      filter={isSelected ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' : undefined}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth={isSelected ? '2.5' : '0'}
                    />

                    {/* Teks Singkatan Bulan di dalam Segmen */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={isSelected ? '10.5' : '9'}
                      fontWeight="900"
                      fontFamily="sans-serif"
                      className="pointer-events-none select-none tracking-tighter"
                    >
                      {m.singkatan}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bagian Tengah Lingkaran (Center Hub): Tetap stabil dan menampilkan bulan terpilih */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailModalOpen(true);
              }}
              className="absolute inset-0 m-auto w-[150px] h-[150px] sm:w-[160px] sm:h-[160px] rounded-full bg-white shadow-md flex flex-col items-center justify-center p-3 text-center cursor-pointer border border-slate-100 hover:scale-105 active:scale-95 transition-all group z-10"
              title="Klik untuk membuka rincian bulan ini"
            >
              <div 
                style={{ backgroundColor: activeItem.bgHex }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-base shadow-xs mb-1 text-white border-2 border-white"
              >
                {activeItem.iconSymbol}
              </div>

              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest leading-none">
                Bulan {activeItem.id}/12
              </span>

              <h4 
                style={{ color: activeItem.bgHex }}
                className="text-sm font-black leading-tight mt-0.5"
              >
                {activeItem.bulan}
              </h4>

              <span className="text-[9px] text-slate-700 font-bold line-clamp-2 leading-tight px-1 mt-0.5">
                {activeItem.kegiatanUtama}
              </span>

              <span className="text-[8px] text-[#e51c24] font-bold mt-1 group-hover:underline flex items-center gap-0.5">
                <span>Rincian</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </span>
            </div>

          </div>
        </div>

        {/* KONTEN DI BAWAH RODA: TULISAN BULAN DAN LIST KEGIATAN */}
        <div 
          style={{ borderLeftColor: activeItem.bgHex }}
          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 border-l-4 space-y-3 text-xs transition-all animate-in fade-in duration-150"
        >
          {/* Header Bulan Terpilih */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span 
                  style={{ backgroundColor: activeItem.bgHex }}
                  className="px-2.5 py-0.5 rounded-full text-white font-mono font-bold text-[10px] uppercase tracking-wider"
                >
                  Bulan {activeItem.bulan}
                </span>
                <span className="text-slate-500 font-mono text-[10px] font-bold">
                  {relatedProker.length} Kegiatan Terjadwal
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                {activeItem.kegiatanUtama}
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed mt-1">
                {activeItem.deskripsi}
              </p>
            </div>

            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#e51c24] transition-colors shrink-0 shadow-2xs"
              title="Buka Rincian Lengkap"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* List Kegiatan & Latihan Rutin Bulan Terpilih */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <span>📋</span>
              <span>Daftar Kegiatan & Latihan Bulan {activeItem.bulan}:</span>
            </h5>

            {relatedProker.length === 0 ? (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-[11px] space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{activeItem.kegiatanUtama}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] text-slate-600 font-mono">
                    Agenda Rutin
                  </span>
                </div>
                <p className="text-slate-500">
                  Waktu: Menyesuaikan kalender latihan ambalan semester ini.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {relatedProker.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-red-300 transition-all shadow-2xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          p.tipe === 'Latihan Rutin' ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'
                        }`}>
                          {p.tipe}
                        </span>
                        <strong className="text-xs font-bold text-slate-900 truncate">
                          {p.nama}
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        📅 {p.waktuPelaksanaan} {p.tempat ? `• 📍 ${p.tempat}` : ''}
                      </p>
                      {p.penanggungJawab && (
                        <p className="text-[10px] text-slate-400">
                          PJ: {p.penanggungJawab}
                        </p>
                      )}
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-700 border border-slate-200 shrink-0">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Geser 12 Bulan */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 -mx-2 px-2 scrollbar-thin">
          {BULAN_LINGKARAN_SDG.map((m, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectMonth(idx)}
                style={{
                  backgroundColor: isSelected ? m.bgHex : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#475569'
                }}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold font-mono shrink-0 transition-all hover:opacity-90 active:scale-95 shadow-2xs"
              >
                {m.singkatan}
              </button>
            );
          })}
        </div>

        {/* ========================================================
            TOMBOL TOGGLE: LIHAT / SEMBUNYIKAN SEMUA KEGIATAN (12 BULAN)
            ======================================================== */}
        <div className="pt-2 border-t border-slate-200 space-y-3">
          <button
            onClick={() => setShowAllActivities(prev => !prev)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold text-xs shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{showAllActivities ? '🙈' : '📅'}</span>
              <span>
                {showAllActivities ? 'Sembunyikan Semua Kegiatan' : 'Lihat Semua Kegiatan (Semua Bulan)'}
              </span>
            </div>

            {/* Icon Klik Toggle */}
            <div className="p-1.5 rounded-xl bg-white/15 text-white flex items-center justify-center font-bold text-xs">
              <span>{showAllActivities ? '▲' : '▼'}</span>
            </div>
          </button>

          {/* DAFTAR SEMUA KEGIATAN DARI SELURUH 12 BULAN (JIKA DIBUKA) */}
          {showAllActivities && (
            <div className="space-y-3 pt-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-800">
                  Daftar Kegiatan Lengkap (12 Bulan Ambalan)
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  Total: {programKerjaList.length} Program Kerja
                </span>
              </div>

              <div className="space-y-3">
                {BULAN_LINGKARAN_SDG.map((b) => {
                  const prokerBulan = programKerjaList.filter(
                    (p) => p.bulan?.toLowerCase() === b.bulan.toLowerCase()
                  );

                  return (
                    <div
                      key={b.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs"
                    >
                      {/* Header Tiap Bulan */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span 
                            style={{ backgroundColor: b.bgHex }}
                            className="w-6 h-6 rounded-lg text-white text-xs flex items-center justify-center font-bold"
                          >
                            {b.id}
                          </span>
                          <strong className="text-xs font-bold text-slate-900">
                            {b.bulan}
                          </strong>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({prokerBulan.length} Kegiatan)
                          </span>
                        </div>

                        <button
                          onClick={() => handleSelectMonth(b.id - 1)}
                          className="text-[10px] text-red-600 font-bold hover:underline"
                        >
                          Pilih di Roda
                        </button>
                      </div>

                      {/* Agenda Utama */}
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <strong>Agenda:</strong> {b.kegiatanUtama}
                      </p>

                      {/* List Kegiatan Terdaftar di Bulan Ini */}
                      {prokerBulan.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {prokerBulan.map((p) => (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-2"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    p.tipe === 'Latihan Rutin' ? 'bg-amber-100 text-amber-900' : 'bg-red-100 text-red-900'
                                  }`}>
                                    {p.tipe}
                                  </span>
                                  <strong className="text-xs font-bold text-slate-900 truncate">
                                    {p.nama}
                                  </strong>
                                </div>
                                <span className="text-[10px] text-slate-500 block">
                                  📅 {p.waktuPelaksanaan} {p.tempat ? `• 📍 ${p.tempat}` : ''}
                                </span>
                              </div>

                              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[9px] font-bold text-slate-700 shrink-0">
                                {p.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* JELAJAHI AMBALAN - MENU UTAMA DI BAGIAN PALING BAWAH */}
      <section className="relative overflow-hidden rounded-[28px] border border-red-200 bg-gradient-to-br from-white via-red-50 to-white p-4 shadow-[0_8px_30px_rgba(225,28,36,0.12)]">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-red-200/40 blur-3xl"/>
        <div className="relative mb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e51c24]">Menu Ambalan</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Jelajahi Ambalan</h2>
        </div>
        <div className="relative grid grid-cols-5 items-end gap-1">
          {[
            { id: 'dashboard' as ActiveMenu, label: 'Kegiatan & Latihan', icon: CalendarCheck, size: 'h-12 w-12', tone: 'from-red-500 to-rose-700' },
            { id: 'sku_skk' as ActiveMenu, label: 'SKU / SKK', icon: Award, size: 'h-12 w-12', tone: 'from-rose-500 to-red-700' },
            { id: 'home' as ActiveMenu, label: 'Home', icon: Home, size: 'h-[62px] w-[62px]', tone: 'from-[#ff343b] to-[#b90012]' },
            { id: 'chat' as ActiveMenu, label: 'Obrolan', icon: MessageCircle, size: 'h-12 w-12', tone: 'from-red-500 to-orange-600' },
            { id: 'pengaturan' as ActiveMenu, label: 'Pengaturan', icon: Settings, size: 'h-12 w-12', tone: 'from-red-600 to-rose-800' }
          ].map((item) => {
            const Icon = item.icon;
            const isHome = item.id === 'home';
            return (
              <button key={item.id} onClick={() => onNavigateMenu?.(item.id)} className={`group flex min-w-0 flex-col items-center justify-end gap-2 rounded-2xl px-0.5 py-2 transition-all duration-200 active:scale-90 ${isHome ? '-translate-y-1' : ''}`}>
                <span className={`relative flex ${item.size} items-center justify-center rounded-full bg-gradient-to-br ${item.tone} text-white ring-4 ring-white shadow-[0_5px_16px_rgba(225,28,36,0.28)] transition-all duration-200 group-hover:scale-110 group-hover:shadow-[0_0_22px_rgba(225,28,36,0.55)]`}>
                  <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-md transition-opacity group-hover:opacity-100"/>
                  <Icon className={`relative ${isHome ? 'h-7 w-7' : 'h-5 w-5'} drop-shadow-sm`}/>
                </span>
                <span className={`text-center font-bold leading-tight text-slate-700 ${isHome ? 'text-[11px] text-[#c91520]' : 'text-[9px]'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* MODAL POPUP DETAIL AGENDA BULAN */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* Header Modal */}
            <div 
              style={{ backgroundColor: activeItem.bgHex }}
              className="p-4 -m-5 mb-4 text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl border border-white/40">
                  {activeItem.iconSymbol}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-90 block">
                    Bulan {activeItem.bulan} ({activeItem.id}/12)
                  </span>
                  <h3 className="text-xs sm:text-sm font-black leading-tight">
                    {activeItem.kegiatanUtama}
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Isi Rincian */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block mb-1">
                  Materi & Agenda Utama:
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {activeItem.deskripsi}
                </p>
              </div>

              {/* Rincian Tambahan Proker Terjadwal */}
              {relatedProker.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase font-mono block">
                    Agenda Terdaftar ({relatedProker.length} Program):
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {relatedProker.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-red-50/50 border border-red-100 flex items-start justify-between gap-2"
                      >
                        <div>
                          <strong className="text-slate-900 block font-bold text-xs">{p.nama}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">Waktu: {p.waktuPelaksanaan}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white text-[9px] font-bold text-slate-700 border border-slate-200 shrink-0">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>

              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onNavigateMenu?.('dashboard');
                }}
                className="px-4 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-bold hover:bg-[#c9141b] transition-colors"
              >
                Buka Kegiatan & Latihan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
