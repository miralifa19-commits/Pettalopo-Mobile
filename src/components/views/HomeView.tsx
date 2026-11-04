import React, { useMemo } from 'react';
import {
  ArrowRight, BookOpen, Users, ChevronRight,
  Crown, UserRound, Shield
} from 'lucide-react';
import { UserAccount, ActiveMenu, ProgramKerjaItem } from '../../types';
import { parseAgendaDate } from '../../utils/agendaDate';
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
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const monthDate = useMemo(() => new Date(currentYear, currentMonth, 1), [currentYear, currentMonth]);
  const rawMonthYear = monthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const monthYearLabel = rawMonthYear.charAt(0).toUpperCase() + rawMonthYear.slice(1);

  const monthAgendas = useMemo(() => programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date && entry.date.getMonth() === currentMonth && entry.date.getFullYear() === currentYear)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime()), [programKerjaList, currentMonth, currentYear]);



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
          <div><span className="section-eyebrow">JADWAL AMBALAN</span><h2>Kegiatan dan Latihan Bulan Ini</h2></div>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-base font-bold text-slate-800 leading-snug">
              {monthYearLabel}
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {monthAgendas.length > 0 ? (
              monthAgendas.map(({ item }) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => onOpenAgenda?.(item.id)}
                  className="flex w-full items-center justify-between py-2.5 text-left text-slate-700 transition active:bg-slate-50"
                >
                  <span className="truncate text-[13px] font-medium text-slate-800">
                    {item.nama}
                  </span>
                </button>
              ))
            ) : (
              <p className="py-3 text-center text-xs text-slate-400">
                Belum ada agenda bulan ini
              </p>
            )}
          </div>
        </div>
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
