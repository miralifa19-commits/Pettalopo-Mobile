import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, CalendarDays, MapPin, BookOpen, Users, Award, ChevronRight,
  Crown, UserRound, Shield
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
  { title: 'Mabigus', description: 'Majelis Pembimbing Gugus Depan', icon: <Shield size={20} />, menu: 'mabigus' },
  { title: 'Anggota', description: 'Daftar anggota putra dan putri', icon: <UserRound size={20} />, menu: 'anggota_ambalan' },
  { title: 'Sangga', description: 'Daftar lima sangga putra dan putri', icon: <Users size={20} />, menu: 'sangga' },
  { title: 'Dewan Ambalan', description: 'Pengurus Dewan Ambalan saat ini', icon: <Crown size={20} />, menu: 'dewan_ambalan' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateMenu, onOpenAgenda, programKerjaList = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const monthStripRef = useRef<HTMLDivElement>(null);
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  useEffect(() => {
    const strip = monthStripRef.current;
    if (strip) strip.scrollLeft = today.getMonth() * strip.clientWidth;
  }, []);
  const monthAgendas = useMemo(() => programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date && entry.date.getMonth() === selectedMonth && entry.date.getFullYear() === today.getFullYear())
    .sort((a, b) => a.date!.getTime() - b.date!.getTime()), [programKerjaList, selectedMonth, today.getFullYear()]);
  const currentMonthLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long', year: 'numeric'
  }).format(new Date(today.getFullYear(), selectedMonth, 1));



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
        <div className="month-agenda-strip" ref={monthStripRef} onScroll={(event) => {
          const element = event.currentTarget;
          const index = Math.round(element.scrollLeft / Math.max(element.clientWidth, 1));
          setSelectedMonth(Math.min(11, Math.max(0, index)));
        }}>
          {monthNames.map((name, index) => {
            const count = programKerjaList.filter((item) => {
              const date = parseAgendaDate(item.waktuPelaksanaan);
              return date && date.getMonth() === index && date.getFullYear() === today.getFullYear();
            }).length;
            return <article className="month-agenda-banner" key={name}>
              <div><span className="month-agenda-kicker">AGENDA AMBALAN</span><strong>{name}</strong><small>{today.getFullYear()} • {count} agenda</small></div>
              <CalendarDays size={34} aria-hidden="true" />
            </article>;
          })}
        </div>
        <div className="month-agenda-controls" aria-label="Pilih bulan">
          <button type="button" onClick={() => monthStripRef.current?.scrollTo({ left: Math.max(0, (selectedMonth - 1) * (monthStripRef.current?.clientWidth || 0)), behavior: 'smooth' })} aria-label="Bulan sebelumnya">‹</button>
          <span>{currentMonthLabel}</span>
          <button type="button" onClick={() => monthStripRef.current?.scrollTo({ left: Math.min(11, selectedMonth + 1) * (monthStripRef.current?.clientWidth || 0), behavior: 'smooth' })} aria-label="Bulan berikutnya">›</button>
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
