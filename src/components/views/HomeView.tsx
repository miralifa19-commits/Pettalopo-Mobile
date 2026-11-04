import React from 'react';
import {
  ArrowRight, CalendarDays, MapPin, BookOpen, Users, Award, ChevronRight,
  Crown, UserRound, Settings, Shield, ClipboardList, MessageCircle, GraduationCap
} from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { formatAgendaDate, parseAgendaDate } from '../../utils/agendaDate';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';

interface HomeViewProps {
  onNavigateMenu?: (menu: ActiveMenu) => void;
  onOpenAgenda?: (agendaId: string) => void;
  user?: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
}

const exploreLinks: { title: string; description: string; icon: React.ReactNode; menu: ActiveMenu }[] = [
  { title: 'Dewan Ambalan', description: 'Struktur dan pengurus', icon: <Crown size={20} />, menu: 'dewan_ambalan' },
  { title: 'Akun Saya', description: 'Profil dan identitas anggota', icon: <UserRound size={20} />, menu: 'akun' },
  { title: 'Ruang Belajar', description: 'Materi kepramukaan', icon: <BookOpen size={20} />, menu: 'ruang_belajar' },
  { title: 'Sangga', description: 'Kelompok dan anggota sangga', icon: <Users size={20} />, menu: 'sangga' },
  { title: 'Program Kerja', description: 'Kegiatan dan latihan rutin ambalan', icon: <ClipboardList size={20} />, menu: 'program_kerja' },
  { title: 'Data Anggota', description: 'Daftar anggota ambalan', icon: <UserRound size={20} />, menu: 'database' },
  { title: 'Profil Ambalan', description: 'Sejarah, lambang dan adat', icon: <Shield size={20} />, menu: 'profil_ambalan' },
  { title: 'SKU & SKK', description: 'Kecakapan Pramuka Penegak', icon: <Award size={20} />, menu: 'sku_skk' },
  { title: 'Kuis Pramuka', description: 'Uji pengetahuan kepramukaan', icon: <GraduationCap size={20} />, menu: 'quiz' },
  { title: 'Obrolan Ambalan', description: 'Komunikasi anggota', icon: <MessageCircle size={20} />, menu: 'chat' },
  { title: 'Pengaturan', description: 'Pengaturan aplikasi', icon: <Settings size={20} />, menu: 'pengaturan' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateMenu, onOpenAgenda, programKerjaList = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthAgendas = programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date
      && entry.date.getMonth() === today.getMonth()
      && entry.date.getFullYear() === today.getFullYear())
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());
  const currentMonthLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long', year: 'numeric'
  }).format(today);



  return (
    <div className="home-landing">
      <section className="home-hero home-hero-compact">
        <div className="home-hero-brandline">
          <span>AMBALAN LA SURULLAH PETTA LOPO</span>
        </div>
        <div className="home-hero-main">
          <div className="home-hero-copy">
            <h1>Bergerak.<br />Berkarya.<br /><span>Mengabdi.</span></h1>
            <p>Ruang kebersamaan untuk tumbuh, berlatih, dan memberi manfaat bagi sesama.</p>
          </div>
          <button type="button" className="home-hero-logo" onClick={() => onNavigateMenu?.('profil_ambalan')} aria-label="Buka profil Ambalan La Surullah Petta Lopo">
            <img src={LOGO_IMAGE_PATH} alt="Logo Ambalan La Surullah Petta Lopo" />
          </button>
        </div>
        <div className="home-hero-actions">
          <button type="button" className="landing-primary" onClick={() => onNavigateMenu?.('dashboard')}>
            Lihat Kegiatan <ArrowRight size={18} />
          </button>
          <button type="button" className="landing-secondary" onClick={() => onNavigateMenu?.('sku_skk')}>
            Jelajahi SKU
          </button>
        </div>
      </section>
      <section className="landing-section">
        <div className="section-heading">
          <div><span className="section-eyebrow">JADWAL AMBALAN</span><h2>Agenda Bulan Ini</h2></div>
          <span className="month-count">{currentMonthLabel}</span>
        </div>
        {monthAgendas.length > 0 ? (
          <div className="agenda-month-list">
            {monthAgendas.map(({ item, date }) => (
              <button type="button" className="agenda-month-item" key={item.id} onClick={() => onOpenAgenda?.(item.id)}>
                <span className="agenda-month-date">
                  <strong>{date!.getDate()}</strong>
                  <small>{new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date!)}</small>
                </span>
                <span className="agenda-month-copy">
                  <strong>{item.nama}</strong>
                  <small>{formatAgendaDate(item.waktuPelaksanaan)} · {item.tempat || 'Lokasi menyusul'}</small>
                </span>
                <ChevronRight size={17} className="agenda-next-arrow" />
              </button>
            ))}
          </div>
        ) : (
          <div className="agenda-month-empty">
            <span className="agenda-next-icon"><CalendarDays size={18} /></span>
            <span><strong>Belum ada agenda bulan ini</strong><small>Agenda yang dijadwalkan pada {currentMonthLabel} akan tampil di sini.</small></span>
          </div>
        )}
        <button type="button" className="all-program-works-button" onClick={() => onNavigateMenu?.('program_kerja')}>
          Lihat Semua Program Kerja <ArrowRight size={17} />
        </button>
      </section>

      <button type="button" className="ruang-belajar-wide" onClick={() => onNavigateMenu?.('ruang_belajar')}>
        <span className="ruang-belajar-wide-icon"><BookOpen size={22} /></span>
        <span className="ruang-belajar-wide-copy"><strong>Ruang Belajar</strong><small>Materi, panduan, dan pengetahuan kepramukaan</small></span>
        <ChevronRight size={19} />
      </button>



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
