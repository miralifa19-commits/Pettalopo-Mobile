import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ArrowRight, CalendarDays, MapPin, BookOpen, Users, Award, ChevronRight,
  Crown, UserRound, Shield, Target, Gamepad2
} from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { formatAgendaDate, parseAgendaDate } from '../../utils/agendaDate';

interface HomeViewProps {
  onNavigateMenu?: (menu: ActiveMenu) => void;
  onOpenAgenda?: (agendaId: string) => void;
  user?: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const exploreLinks: { title: string; description: string; icon: React.ReactNode; menu: ActiveMenu }[] = [
  { title: 'Mabigus', description: 'Majelis Pembimbing Gugus Depan', icon: <Shield size={20} />, menu: 'mabigus' },
  { title: 'Anggota', description: 'Daftar anggota putra dan putri', icon: <UserRound size={20} />, menu: 'anggota_ambalan' },
  { title: 'Sangga', description: 'Daftar lima sangga putra dan putri', icon: <Users size={20} />, menu: 'sangga' },
  { title: 'Dewan Ambalan', description: 'Pengurus Dewan Ambalan saat ini', icon: <Crown size={20} />, menu: 'dewan_ambalan' },
  { title: 'Misi Pramuka', description: 'Selesaikan misi dan tantangan kepramukaan', icon: <Target size={20} />, menu: 'misi_pramuka' },
  { title: 'Games', description: 'Mainkan kuis dan permainan Pramuka', icon: <Gamepad2 size={20} />, menu: 'quiz' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateMenu, onOpenAgenda, programKerjaList = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const monthStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = monthStripRef.current;
    if (strip) strip.scrollLeft = today.getMonth() * strip.clientWidth;
  }, []);
  const monthActivities = useMemo(() => programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date && entry.date.getFullYear() === today.getFullYear() && entry.date.getMonth() === selectedMonth)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .map((entry) => entry.item), [programKerjaList, selectedMonth, today.getFullYear()]);

  return (
    <div className="home-landing">
      <section className="home-hero home-hero-compact">
        <div className="home-hero-copy">
          <span className="section-eyebrow">AMBALAN LA SURULLAH PETTA LOPO</span>
          <h1>Bergerak.<br />Berkarya.<br /><span>Mengabdi.</span></h1>
          <p>Ruang kebersamaan untuk tumbuh, berlatih, dan memberi manfaat bagi sesama.</p>
        </div>
        <div className="home-hero-actions">
          <button type="button" className="landing-primary" onClick={() => onNavigateMenu?.('program_kerja')}>
            Lihat Kegiatan <ArrowRight size={15} />
          </button>
          <button type="button" className="landing-secondary" onClick={() => onNavigateMenu?.('sku_skk')}>
            Jelajahi SKU
          </button>
        </div>
      </section>

      <section className="month-agenda-section" aria-label="Agenda bulan ini">
        <div className="month-agenda-heading">
          <div><span className="section-eyebrow">KALENDER AMBALAN</span><h2>Agenda Bulan Ini</h2></div>
          <span className="month-count">{today.getFullYear()}</span>
        </div>
        <div className="month-agenda-strip" ref={monthStripRef} onScroll={(event) => {
          const element = event.currentTarget;
          const index = Math.round(element.scrollLeft / Math.max(element.clientWidth, 1));
          setSelectedMonth(Math.min(11, Math.max(0, index)));
        }}>
          {MONTH_NAMES.map((name, index) => {
            const count = programKerjaList.filter((item) => {
              const date = parseAgendaDate(item.waktuPelaksanaan);
              return date && date.getFullYear() === today.getFullYear() && date.getMonth() === index;
            }).length;
            return <article className="month-agenda-banner" key={name} aria-label={`Agenda ${name}`}>
              <div><span className="month-agenda-kicker">AGENDA AMBALAN</span><strong>{name}</strong><small>{today.getFullYear()} • {count} agenda</small></div>
              <CalendarDays size={34} aria-hidden="true" />
            </article>;
          })}
        </div>
        <div className="month-agenda-controls" aria-label="Pilih bulan">
          <button type="button" onClick={() => monthStripRef.current?.scrollTo({ left: Math.max(0, (selectedMonth - 1) * (monthStripRef.current?.clientWidth || 0)), behavior: 'smooth' })} aria-label="Bulan sebelumnya">‹</button>
          <span>{MONTH_NAMES[selectedMonth]}</span>
          <button type="button" onClick={() => monthStripRef.current?.scrollTo({ left: Math.min(11, selectedMonth + 1) * (monthStripRef.current?.clientWidth || 0), behavior: 'smooth' })} aria-label="Bulan berikutnya">›</button>
        </div>
      </section>

      <section className="landing-section" id="month-activities">
        <div className="section-heading">
          <div><span className="section-eyebrow">RENCANA KEGIATAN</span><h2>Agenda {MONTH_NAMES[selectedMonth]}</h2></div>
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
            <div><strong>Belum ada kegiatan pada {MONTH_NAMES[selectedMonth]}</strong><p>Geser banner bulan di atas untuk melihat agenda bulan lainnya.</p></div>
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
