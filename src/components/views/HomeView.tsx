import React from 'react';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';
import { formatAgendaDate, parseAgendaDate } from '../../utils/agendaDate';

interface HomeViewProps {
  onNavigateMenu?: (menu: ActiveMenu) => void;
  onOpenAgenda?: (agendaId: string) => void;
  user?: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateMenu, onOpenAgenda, programKerjaList = [] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextAgenda = programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date && entry.date >= today)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())[0]?.item;

  return (
    <div className="home-landing">
      <section className="home-hero">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <span className="section-eyebrow">AMBALAN LA SURULLAH PETTA LOPO</span>
            <h1>Bergerak.<br />Berkarya.<br /><span>Mengabdi.</span></h1>
            <p>Ruang kebersamaan untuk tumbuh, berlatih, dan memberi manfaat bagi sesama.</p>
          </div>
          <div className="home-hero-logo" aria-label="Logo Ambalan Petta Lopo">
            <img src={LOGO_IMAGE_PATH} alt="Logo asli Ambalan Petta Lopo" />
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
    </div>
  );
};
