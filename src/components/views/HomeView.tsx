import React, { useMemo, useState } from 'react';
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

  const monthGradients = [
    ['#9F1239', '#E11D48'],
    ['#C2410C', '#F97316'],
    ['#B45309', '#F59E0B'],
    ['#4D7C0F', '#84CC16'],
    ['#166534', '#22C55E'],
    ['#0E7490', '#06B6D4'],
    ['#115E59', '#14B8A6'],
    ['#1E3A8A', '#3B82F6'],
    ['#0F172A', '#475569'],
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
          <div><span className="section-eyebrow">JADWAL AMBALAN</span><h2>Agenda Bulan Ini</h2></div>
          <span className="month-count">{monthYearLabel}</span>
        </div>

        <div
          className="w-full overflow-hidden rounded-[26px] p-4 sm:p-5 text-white"
          style={{ background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="block text-[9px] font-extrabold tracking-[0.18em] text-white/75">AGENDA AMBALAN</span>
              <h3 className="mt-2 text-[30px] font-black leading-none tracking-tight capitalize">
                {currentMonthLabel}
              </h3>
              <p className="mt-2 text-[11px] font-medium text-white/85">
                {currentYear} <span className="mx-1">•</span> {monthAgendas.length} agenda
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                disabled={selectedMonth === 0}
                aria-label="Bulan sebelumnya"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                disabled={selectedMonth === 11}
                aria-label="Bulan berikutnya"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {monthAgendas.length > 0 ? monthAgendas.map(({ item, date }) => (
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/20 p-3 text-left text-white transition active:bg-white/25"
                key={item.id}
                onClick={() => onOpenAgenda?.(item.id)}
              >
                <span className="flex h-[54px] w-[52px] shrink-0 flex-col items-center justify-center rounded-xl bg-white/20 text-white">
                  <strong className="text-[21px] font-black leading-none">{date!.getDate()}</strong>
                  <small className="mt-1 text-[9px] font-bold uppercase tracking-wide">
                    {date!.toLocaleString('id-ID', { month: 'short' }).replace('.', '')}
                  </small>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <strong className="break-words text-[12px] font-extrabold leading-snug">{item.nama}</strong>
                  <span className="flex min-w-0 items-start gap-1.5 text-[10px] leading-snug text-white/85">
                    <MapPin size={12} className="mt-[1px] shrink-0" />
                    <span className="break-words">{item.tempat || 'Lokasi menyusul'}</span>
                  </span>
                </span>
                <ChevronRight size={17} className="shrink-0 text-white/80" />
              </button>
            )) : (
              <div className="rounded-2xl border border-white/15 bg-white/20 px-4 py-5 text-center">
                <CalendarDays size={24} className="mx-auto mb-2 text-white/85" />
                <p className="text-[12px] font-bold text-white">Belum ada agenda bulan ini</p>
              </div>
            )}
          </div>
        </div>

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
