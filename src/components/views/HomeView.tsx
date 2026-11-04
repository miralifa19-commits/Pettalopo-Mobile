import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight, CalendarDays, MapPin, BookOpen, Users, ChevronLeft, ChevronRight,
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
  const currentYear = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const touchStartX = useRef<number | null>(null);

  const monthGradients = [
    ['#9F1239', '#E11D48'],
    ['#C2410C', '#F97316'],
    ['#B45309', '#F59E0B'],
    ['#4D7C0F', '#84CC16'],
    ['#166534', '#22C55E'],
    ['#0E7490', '#06B6D4'],
    ['#115E59', '#14B8A6'],
    ['#1E3A8A', '#3B82F6'],
    ['#3730A3', '#8B5CF6'],
    ['#581C87', '#A855F7'],
    ['#831843', '#BE185D'],
    ['#9D174D', '#EC4899']
  ] as const;

  const monthAgendas = useMemo(() => programKerjaList
    .map((item) => ({ item, date: parseAgendaDate(item.waktuPelaksanaan) }))
    .filter((entry) => entry.date && entry.date.getMonth() === selectedMonth && entry.date.getFullYear() === currentYear)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime()), [programKerjaList, selectedMonth, currentYear]);

  const monthDate = new Date(currentYear, selectedMonth, 1);
  const currentMonthLabel = monthDate.toLocaleString('id-ID', { month: 'long' });
  const monthYearLabel = monthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  const changeMonth = (direction: -1 | 1) => {
    setSelectedMonth((month) => Math.min(11, Math.max(0, month + direction)));
  };
  const handleAgendaTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };
  const handleAgendaTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 45) changeMonth(deltaX < 0 ? 1 : -1);
    touchStartX.current = null;
  };
  const [gradientStart, gradientEnd] = monthGradients[selectedMonth];



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

        <div
          className="h-[280px] w-full overflow-hidden rounded-[24px] px-4 py-3.5 text-white touch-pan-y select-none"
          style={{ background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)` }}
          onTouchStart={handleAgendaTouchStart}
          onTouchEnd={handleAgendaTouchEnd}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[8px] font-extrabold tracking-[0.16em] text-white/75">AGENDA AMBALAN</span>
              <h3 className="mt-1 text-[19px] font-extrabold leading-tight tracking-tight capitalize">{currentMonthLabel}</h3>
              <p className="mt-0.5 text-[10px] font-medium text-white/85">{currentYear} <span className="mx-1">•</span> {monthAgendas.length} agenda</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" onClick={() => changeMonth(-1)} disabled={selectedMonth === 0} aria-label="Bulan sebelumnya" className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-35">
                <ChevronLeft size={17} />
              </button>
              <button type="button" onClick={() => changeMonth(1)} disabled={selectedMonth === 11} aria-label="Bulan berikutnya" className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-35">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>

          <div className="mt-2.5 max-h-[178px] overflow-y-auto overscroll-contain pr-1">
            {monthAgendas.length > 0 ? monthAgendas.map(({ item, date }, index) => (
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-2.5 border-b border-white/20 py-2 text-left text-white last:border-b-0 active:bg-white/10"
                key={item.id}
                onClick={() => onOpenAgenda?.(item.id)}
              >
                <span className="w-9 shrink-0 text-center leading-tight">
                  <strong className="block text-[16px] font-extrabold">{date!.getDate()}</strong>
                  <small className="block text-[8px] font-semibold uppercase text-white/80">{date!.toLocaleString('id-ID', { month: 'short' }).replace('.', '')}</small>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <strong className="break-words text-[11px] font-bold leading-snug">{item.nama}</strong>
                  <span className="flex min-w-0 items-start gap-1 text-[9px] leading-snug text-white/80">
                    <MapPin size={10} className="mt-[1px] shrink-0" />
                    <span className="break-words">{item.tempat || 'Lokasi menyusul'}</span>
                  </span>
                </span>
                <ChevronRight size={14} className="shrink-0 text-white/75" />
              </button>
            )) : (
              <div className="py-3 text-center">
                <CalendarDays size={20} className="mx-auto mb-1.5 text-white/85" />
                <p className="text-[11px] font-semibold text-white">Belum ada agenda bulan ini</p>
              </div>
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
