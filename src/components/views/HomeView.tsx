import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, BookOpen, Users, MessageCircle, Compass, ChevronRight } from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { formatAgendaDate, parseAgendaDate } from '../../utils/agendaDate';

interface HomeViewProps {
  onNavigateMenu?: (menu: ActiveMenu) => void;
  onOpenAgenda?: (agendaId: string) => void;
  user?: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

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

  const quickLinks: { title: string; description: string; icon: React.ReactNode; menu: ActiveMenu }[] = [
    { title: 'Agenda Kegiatan', description: 'Lihat seluruh jadwal', icon: <CalendarDays size={19} />, menu: 'dashboard' },
    { title: 'SKU & SKK', description: 'Pantau kecakapan', icon: <AwardIcon />, menu: 'sku_skk' },
    { title: 'Data Anggota', description: 'Kenali anggota ambalan', icon: <Users size={19} />, menu: 'database' },
    { title: 'Ruang Belajar', description: 'Materi kepramukaan', icon: <BookOpen size={19} />, menu: 'ruang_belajar' },
  ];

  return (
    <div className="home-landing">
      <section className="home-hero">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <span className="section-eyebrow">AMBALAN LA SURULLAH PETTA LOPO</span>
            <h1>Bergerak.<br />Berkarya.<br /><span>Mengabdi.</span></h1>
            <p>Ruang kebersamaan untuk tumbuh, berlatih, dan memberi manfaat bagi sesama.</p>
          </div>
          <div className="month-wheel-wrap" aria-label="Pilih bulan kegiatan">
            <div className="month-wheel">
              {MONTHS.map((month, index) => (
                <button
                  type="button"
                  key={month}
                  className={selectedMonth === index ? 'month-wheel-item active' : 'month-wheel-item'}
                  style={{ '--month-index': index } as React.CSSProperties}
                  onClick={() => setSelectedMonth(index)}
                  aria-pressed={selectedMonth === index}
                  aria-label={MONTH_NAMES[index]}
                >
                  {month}
                </button>
              ))}
              <div className="month-wheel-center">
                <strong>{MONTHS[selectedMonth]}</strong>
                <small>{today.getFullYear()}</small>
              </div>
            </div>
            <span className="month-wheel-caption">KALENDER AMBALAN</span>
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
            <div><strong>Belum ada kegiatan pada {MONTH_NAMES[selectedMonth]}</strong><p>Pilih bulan lain untuk melihat agenda ambalan.</p></div>
          </div>
        )}
      </section>

      <section className="landing-section quick-menu-section">
        <div className="section-heading">
          <div><span className="section-eyebrow">AKSES PRAKTIS</span><h2>Menu Cepat</h2></div>
        </div>
        <div className="quick-grid">
          {quickLinks.map((link) => (
            <button type="button" className="landing-card quick-card" key={link.title} onClick={() => onNavigateMenu?.(link.menu)}>
              <span className="quick-icon">{link.icon}</span>
              <strong>{link.title}</strong>
              <small>{link.description}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

function AwardIcon() {
  return <Compass size={19} />;
}
