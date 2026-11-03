import React from 'react';
import { ArrowRight, CalendarDays, MapPin, Award, Compass, MessageCircle, Crown, Bell } from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { ShiningAmbalanLogo } from '../common/ShiningAmbalanLogo';

interface HomeViewProps {
  onNavigateMenu?: (menu: ActiveMenu) => void;
  user?: UserAccount;
  programKerjaList?: ProgramKerjaItem[];
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateMenu, programKerjaList = [] }) => {
  const agenda = [...programKerjaList].slice(0, 3);
  const quickLinks = [
    { label: 'SKU / SKK', detail: 'Kecakapan penegak', icon: Award, menu: 'sku_skk' as ActiveMenu },
    { label: 'Kegiatan', detail: 'Agenda ambalan', icon: Compass, menu: 'dashboard' as ActiveMenu },
    { label: 'Obrolan', detail: 'Ruang komunikasi', icon: MessageCircle, menu: 'chat' as ActiveMenu },
    { label: 'Dewan', detail: 'Pengurus ambalan', icon: Crown, menu: 'dewan_ambalan' as ActiveMenu }
  ];
  return (
    <div className="home-landing">
      <section className="home-hero">
        <div className="home-logo-wrap"><ShiningAmbalanLogo /></div>
        <span className="section-eyebrow">AMBALAN LA SURULLAH PETTA LOPO</span>
        <h1>Bergerak.<br/>Berkarya.<br/><span>Mengabdi.</span></h1>
        <p>Ruang kebersamaan untuk tumbuh, berlatih, dan memberi manfaat bagi sesama.</p>
        <div className="home-hero-actions">
          <button className="landing-primary" onClick={() => onNavigateMenu?.('dashboard')}>Lihat Kegiatan <ArrowRight size={17}/></button>
          <button className="landing-secondary" onClick={() => onNavigateMenu?.('sku_skk')}>Jelajahi SKU</button>
        </div>
        <div className="hero-line-art" aria-hidden="true"><span/><span/><span/></div>
      </section>

      <section className="landing-section">
        <div className="section-heading"><div><span className="section-eyebrow">JANGAN LEWATKAN</span><h2>Agenda Terdekat</h2></div><button onClick={() => onNavigateMenu?.('dashboard')} className="text-link">Semua agenda <ArrowRight size={15}/></button></div>
        <div className="landing-list">
          {agenda.length ? agenda.map((item) => (
            <article className="landing-card agenda-card" key={item.id}>
              <div className="agenda-icon"><CalendarDays size={19}/></div>
              <div className="agenda-copy"><strong>{item.nama}</strong><span><CalendarDays size={13}/> {item.waktuPelaksanaan || item.bulan}</span><span><MapPin size={13}/> {item.tempat || 'Lokasi menyusul'}</span></div>
              <ArrowRight className="agenda-arrow" size={17}/>
            </article>
          )) : <article className="landing-card empty-agenda"><CalendarDays size={20}/><div><strong>Agenda sedang disiapkan</strong><p>Kegiatan terbaru akan tampil di bagian ini.</p></div></article>}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading"><div><span className="section-eyebrow">AKSES CEPAT</span><h2>Mulai dari sini</h2></div></div>
        <div className="quick-grid">{quickLinks.map(({label,detail,icon:Icon,menu}) => <button className="landing-card quick-card" key={label} onClick={() => onNavigateMenu?.(menu)}><span className="quick-icon"><Icon size={21}/></span><strong>{label}</strong><small>{detail}</small></button>)}</div>
      </section>

      <section className="landing-section">
        <div className="section-heading"><div><span className="section-eyebrow">INFORMASI AMBALAN</span><h2>Pengumuman</h2></div></div>
        <button className="landing-card announcement-card" onClick={() => onNavigateMenu?.('chat')}>
          <span className="announcement-icon"><Bell size={19}/></span><span><strong>Ikuti informasi terbaru</strong><small>Pantau kabar, arahan, dan informasi kegiatan melalui Obrolan Ambalan.</small></span><ArrowRight size={17}/>
        </button>
      </section>
    </div>
  );
};
