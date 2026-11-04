import React, { useMemo, useState } from 'react';
import {
  ArrowRight, CalendarDays, MapPin, BookOpen, Users, Award, ChevronRight,
  Crown, UserRound, Settings, Shield, ClipboardList, Dumbbell, MessageCircle,
  GraduationCap, Compass, FolderOpen
} from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { formatAgendaDate, parseAgendaDate } from '../../utils/agendaDate';

interface HomeViewProps {
  onNavigateMenu?: (menu: ActiveMenu) => void;
  onOpenAgenda?: (agendaId: string) => void;
  user?: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTH_COLORS = ['#c7192d','#f0520b','#df7900','#64a70b','#13834a','#0794b2','#087d73','#2452d5','#202b3d','#6524a1','#a20e50','#c01663'];

function polarPoint(radius: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: 160 + radius * Math.cos(rad), y: 160 + radius * Math.sin(rad) };
}

function monthSegment(index: number) {
  const centerAngle = index * 30;
  const start = polarPoint(151, centerAngle - 13.2);
  const end = polarPoint(151, centerAngle + 13.2);
  const innerEnd = polarPoint(87, centerAngle + 13.2);
  const innerStart = polarPoint(87, centerAngle - 13.2);
  return `M ${start.x} ${start.y} A 151 151 0 0 1 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A 87 87 0 0 0 ${innerStart.x} ${innerStart.y} Z`;
}

const exploreLinks: { title: string; description: string; icon: React.ReactNode; menu: ActiveMenu }[] = [
  { title: 'Dewan Ambalan', description: 'Struktur dan pengurus', icon: <Crown size={20} />, menu: 'dewan_ambalan' },
  { title: 'Akun Saya', description: 'Profil dan identitas anggota', icon: <UserRound size={20} />, menu: 'akun' },
  { title: 'Ruang Belajar', description: 'Materi kepramukaan', icon: <BookOpen size={20} />, menu: 'ruang_belajar' },
  { title: 'Sangga', description: 'Kelompok dan anggota sangga', icon: <Users size={20} />, menu: 'sangga' },
  { title: 'Program Kerja', description: 'Rencana kegiatan ambalan', icon: <ClipboardList size={20} />, menu: 'program_kerja' },
  { title: 'Latihan Rutin', description: 'Jadwal dan aktivitas latihan', icon: <Dumbbell size={20} />, menu: 'latihan_rutin' },
  { title: 'Data Anggota', description: 'Daftar anggota ambalan', icon: <UserRound size={20} />, menu: 'database' },
  { title: 'Profil Ambalan', description: 'Sejarah, lambang dan adat', icon: <Shield size={20} />, menu: 'profil_ambalan' },
  { title: 'SKU & SKK', description: 'Kecakapan Pramuka Penegak', icon: <Award size={20} />, menu: 'sku_skk' },
  { title: 'Kuis Pramuka', description: 'Uji pengetahuan kepramukaan', icon: <GraduationCap size={20} />, menu: 'quiz' },
  { title: 'Obrolan Ambalan', description: 'Komunikasi anggota', icon: <MessageCircle size={20} />, menu: 'chat' },
  { title: 'Pengaturan', description: 'Pengaturan aplikasi', icon: <Settings size={20} />, menu: 'pengaturan' },
  { title: 'Laporan', description: 'Rekap dan laporan kegiatan', icon: <FolderOpen size={20} />, menu: 'laporan' },
  { title: 'Organisasi', description: 'Informasi organisasi ambalan', icon: <Compass size={20} />, menu: 'organisasi' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateMenu, onOpenAgenda, programKerjaList = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const nextAgenda = programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date && entry.date >= today)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())[0]?.item;

  const monthActivities = useMemo(() => programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date && entry.date.getFullYear() === today.getFullYear() && entry.date.getMonth() === selectedMonth)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .map((entry) => entry.item), [programKerjaList, selectedMonth, today.getFullYear()]);

  return (
    <div className="home-landing">
      <section className="home-hero home-hero-compact">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <span className="section-eyebrow">AMBALAN LA SURULLAH PETTA LOPO</span>
            <h1>Bergerak.<br />Berkarya.<br /><span>Mengabdi.</span></h1>
            <p>Ruang kebersamaan untuk tumbuh, berlatih, dan memberi manfaat bagi sesama.</p>
          </div>
          <div className="month-wheel-wrap" aria-label="Kalender kegiatan ambalan">
            <svg className="month-wheel-graphic" viewBox="0 0 320 320" role="group" aria-label="Pilih bulan kegiatan">
              {MONTHS.map((month, index) => {
                const point = polarPoint(119, index * 30);
                return (
                  <g key={month} className="month-wheel-sector" onClick={() => setSelectedMonth(index)} role="button" tabIndex={0} aria-label={MONTH_NAMES[index]} aria-pressed={selectedMonth === index} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedMonth(index); }}>
                    <path d={monthSegment(index)} fill={MONTH_COLORS[index]} stroke="#ffffff" strokeWidth="2.5" />
                    <text x={point.x} y={point.y + 4} textAnchor="middle">{month}</text>
                  </g>
                );
              })}
              <circle cx="160" cy="160" r="86" fill="#ffffff" />
              <circle cx="160" cy="112" r="18" fill="#a20e50" />
              <text x="160" y="119" textAnchor="middle" className="month-wheel-medal">★</text>
              <text x="160" y="151" textAnchor="middle" className="month-wheel-index">BULAN {selectedMonth + 1}/12</text>
              <text x="160" y="174" textAnchor="middle" className="month-wheel-name">{MONTH_NAMES[selectedMonth]}</text>
              <text x="160" y="193" textAnchor="middle" className="month-wheel-sub">{monthActivities.length ? `${monthActivities.length} KEGIATAN` : 'AGENDA AMBALAN'}</text>
              <text x="160" y="211" textAnchor="middle" className="month-wheel-link">Lihat rincian ›</text>
            </svg>
          </div>
        </div>
        <div className="home-hero-actions">
          <button type="button" className="landing-primary" onClick={() => onNavigateMenu?.('dashboard')}>
            Lihat Kegiatan <ArrowRight size={15} />
          </button>
          <button type="button" className="landing-secondary" onClick={() => onNavigateMenu?.('sku_skk')}>
            Jelajahi SKU
          </button>
        </div>
      </section>

      {nextAgenda ? (
        <button type="button" className="agenda-next-card" onClick={() => onOpenAgenda?.(nextAgenda.id)}>
          <span className="agenda-next-icon"><CalendarDays size={18} /></span>
          <span className="agenda-next-content">
            <span className="agenda-next-label">AGENDA BERIKUTNYA</span>
            <strong>{nextAgenda.nama}</strong>
            <span className="agenda-next-meta">
              <span><CalendarDays size={13} />{formatAgendaDate(nextAgenda.waktuPelaksanaan)}</span>
              <span><MapPin size={13} />{nextAgenda.tempat || 'Lokasi menyusul'}</span>
            </span>
          </span>
          <ArrowRight className="agenda-next-arrow" size={17} />
        </button>
      ) : (
        <div className="agenda-next-card agenda-next-empty">
          <span className="agenda-next-icon"><CalendarDays size={18} /></span>
          <span className="agenda-next-content">
            <span className="agenda-next-label">AGENDA BERIKUTNYA</span>
            <strong>Belum ada agenda mendatang</strong>
          </span>
        </div>
      )}

      <section className="landing-section">
        <div className="section-heading">
          <div><span className="section-eyebrow">RENCANA KEGIATAN</span><h2>Kegiatan {MONTH_NAMES[selectedMonth]}</h2></div>
          <span className="month-count">{monthActivities.length} agenda</span>
        </div>
        {monthActivities.length ? (
          <div className="landing-list">
            {monthActivities.map((item) => (
              <button type="button" className="landing-card agenda-card" key={item.id} onClick={() => onOpenAgenda?.(item.id)}>
                <span className="agenda-icon"><CalendarDays size={18} /></span>
                <span className="agenda-copy">
                  <strong>{item.nama}</strong>
                  <span><CalendarDays size={12} />{formatAgendaDate(item.waktuPelaksanaan)}</span>
                  <span><MapPin size={12} />{item.tempat || 'Lokasi menyusul'}</span>
                </span>
                <ChevronRight className="agenda-arrow" size={17} />
              </button>
            ))}
          </div>
        ) : (
          <div className="landing-card empty-agenda">
            <CalendarDays size={20} />
            <div><strong>Belum ada kegiatan pada {MONTH_NAMES[selectedMonth]}</strong><p>Pilih bulan lain pada roda kalender untuk melihat agenda ambalan.</p></div>
          </div>
        )}
      </section>

      <section className="landing-section explore-ambalan-section">
        <div className="section-heading">
          <div><span className="section-eyebrow">KENALI DAN JELAJAHI</span><h2>Jelajahi Ambalan</h2></div>
          <span className="month-count">{exploreLinks.length} menu</span>
        </div>
        <div className="explore-ambalan-grid">
          {exploreLinks.map((link) => (
            <button type="button" className="landing-card explore-ambalan-card" key={link.menu} onClick={() => onNavigateMenu?.(link.menu)}>
              <span className="quick-icon">{link.icon}</span>
              <span className="explore-ambalan-copy"><strong>{link.title}</strong><small>{link.description}</small></span>
              <ChevronRight size={16} className="explore-ambalan-arrow" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
