import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';

export interface MonthCycleItem {
  code: string;
  name: string;
  fullYear: string;
  angle: number; // in degrees (-90 = top)
  status: 'current' | 'upcoming' | 'past';
  kegiatanCount: number;
}

interface SiklusLingkaranProps {
  months: MonthCycleItem[];
  selectedMonthCode: string;
  currentMonthCode?: string;
  onSelectMonth: (month: MonthCycleItem) => void;
  totalActivities: number;
  academicYear?: string;
}

export const SiklusLingkaran: React.FC<SiklusLingkaranProps> = ({
  months,
  selectedMonthCode,
  currentMonthCode = 'OKT',
  onSelectMonth,
  totalActivities,
  academicYear = '2026/2027'
}) => {
  // Radius percentage for month nodes
  const RADIUS_PERCENT = 40.5;

  return (
    <div className="relative w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[400px] aspect-square mx-auto flex items-center justify-center select-none py-2">
      {/* Decorative Outer Aura / Subtle Ring */}
      <div className="absolute inset-2 sm:inset-3 rounded-full bg-gradient-to-br from-teal-50/60 via-slate-50/40 to-amber-50/40 pointer-events-none -z-10" />

      {/* Orbit Track Rings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40.5"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />
        <circle
          cx="50"
          cy="50"
          r="28"
          fill="none"
          stroke="#ccfbf1"
          strokeWidth="0.8"
        />
      </svg>

      {/* Central Hub Card */}
      <div className="w-36 h-36 xs:w-40 xs:h-40 sm:w-44 sm:h-44 rounded-full bg-white shadow-xl shadow-teal-950/5 border-2 border-teal-100 flex flex-col items-center justify-center p-3 text-center z-10 transition-all hover:scale-[1.02]">
        
        {/* Emblem / Logo */}
        <div className="w-9 h-9 sm:w-11 sm:h-11 mb-1 flex items-center justify-center">
          <img
            src={LOGO_IMAGE_PATH}
            alt="Ambalan Emblem"
            className="w-full h-full object-contain drop-shadow-xs"
          />
        </div>

        {/* Text Details */}
        <span className="text-[10px] xs:text-[11px] font-black tracking-wider text-slate-800 uppercase leading-none font-sans">
          SIKLUS
        </span>
        <span className="text-[10px] xs:text-[11px] font-black tracking-wider text-teal-700 uppercase leading-tight font-sans">
          KEGIATAN
        </span>
        <span className="text-[11px] xs:text-xs font-bold text-slate-600 mt-0.5">
          {academicYear}
        </span>

        {/* Stat Pills in Center */}
        <div className="mt-1.5 flex flex-col items-center gap-0.5 text-[9px] xs:text-[10px] font-semibold text-slate-600">
          <span className="flex items-center gap-1 text-teal-800 font-bold">
            <Calendar className="w-3 h-3 text-teal-600" />
            12 Bulan
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <CheckCircle2 className="w-3 h-3 text-amber-500" />
            {totalActivities} Kegiatan
          </span>
        </div>
      </div>

      {/* 12 Month Nodes arranged in a circle */}
      {months.map((m) => {
        const rad = (m.angle * Math.PI) / 180;
        const leftPercent = 50 + RADIUS_PERCENT * Math.cos(rad);
        const topPercent = 50 + RADIUS_PERCENT * Math.sin(rad);

        const isCurrent = m.code === currentMonthCode;
        const isSelected = m.code === selectedMonthCode;

        // Styling according to Screen 1 & Screen 6:
        // Bulan ini: Teal / green
        // Bulan mendatang: Amber / yellow
        // Bulan lalu: Light gray
        let buttonStyles = '';
        if (isCurrent) {
          buttonStyles = 'bg-[#0d9488] text-white shadow-md shadow-teal-700/30 ring-4 ring-teal-100/90 font-black';
        } else if (m.status === 'upcoming') {
          buttonStyles = 'bg-amber-100 text-amber-800 border border-amber-300 font-bold hover:bg-amber-200';
        } else {
          buttonStyles = 'bg-slate-200 text-slate-600 border border-slate-300 font-medium hover:bg-slate-300';
        }

        if (isSelected && !isCurrent) {
          buttonStyles += ' ring-3 ring-teal-500 scale-110';
        }

        return (
          <div
            key={m.code}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`
            }}
          >
            {/* "Saat ini" marker pointing to the current month (e.g. OKT) */}
            {isCurrent && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-1 sm:mr-1.5 flex items-center pointer-events-none z-30">
                <span className="bg-[#0d9488] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                  Saat ini
                </span>
                <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-[#0d9488]" />
              </div>
            )}

            <button
              onClick={() => onSelectMonth(m)}
              aria-label={`Pilih bulan ${m.name} (${m.kegiatanCount} kegiatan)`}
              className={`w-9 h-9 xs:w-10 xs:h-10 rounded-full flex items-center justify-center text-[10px] xs:text-[11px] transition-all transform active:scale-90 hover:scale-110 cursor-pointer ${buttonStyles}`}
            >
              {m.code}
            </button>
          </div>
        );
      })}
    </div>
  );
};
