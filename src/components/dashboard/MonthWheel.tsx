import React from 'react';

const MONTHS = [
  { code: 'JAN', name: 'Januari', color: '#C5162E' },
  { code: 'FEB', name: 'Februari', color: '#F05A0A' },
  { code: 'MAR', name: 'Maret', color: '#D97706' },
  { code: 'APR', name: 'April', color: '#65A30D' },
  { code: 'MEI', name: 'Mei', color: '#16834A' },
  { code: 'JUN', name: 'Juni', color: '#0891B2' },
  { code: 'JUL', name: 'Juli', color: '#0F766E' },
  { code: 'AGU', name: 'Agustus', color: '#1D4ED8' },
  { code: 'SEP', name: 'September', color: '#1E293B' },
  { code: 'OKT', name: 'Oktober', color: '#6B21A8' },
  { code: 'NOV', name: 'November', color: '#9D174D' },
  { code: 'DES', name: 'Desember', color: '#BE185D' },
];

interface MonthWheelProps {
  selectedMonthIndex: number;
  selectedYear: number;
  activitySummary: string;
  onSelectMonth: (index: number) => void;
  onDetails: () => void;
}

function point(cx: number, cy: number, r: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(start: number, end: number, selected = false) {
  // Enlarge only the selected segment radially; keep its angular edges fixed
  // so it never covers or blocks the neighboring month segments.
  const outer = selected ? 48.5 : 47;
  const inner = selected ? 25.5 : 27;
  const a = point(50, 50, outer, start);
  const b = point(50, 50, outer, end);
  const c = point(50, 50, inner, end);
  const d = point(50, 50, inner, start);
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${inner} ${inner} 0 0 0 ${d.x} ${d.y} Z`;
}

export const MonthWheel: React.FC<MonthWheelProps> = ({
  selectedMonthIndex, selectedYear, activitySummary, onSelectMonth, onDetails
}) => {
  const month = MONTHS[selectedMonthIndex] || MONTHS[0];
  return (
    <div className="w-full max-w-[360px] mx-auto aspect-square relative">
      <svg viewBox="0 0 100 100" className="w-full h-full" role="group" aria-label="Pilih bulan kegiatan">
        {MONTHS.map((item, index) => {
          const start = -89 + index * 30 + 1.5;
          const end = -89 + (index + 1) * 30 - 1.5;
          const mid = (start + end) / 2;
          const label = point(50, 50, 37, mid);
          const selected = selectedMonthIndex === index;
          return (
            <g key={item.code} onClick={() => onSelectMonth(index)} role="button" tabIndex={0}
              aria-label={`Pilih ${item.name}`} aria-pressed={selected}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectMonth(index);
                }
              }}
              className="cursor-pointer focus:outline-none">
              <path d={sectorPath(start, end, selected)} fill={item.color}
                stroke="#ffffff" strokeWidth="0.45"
                className="transition-opacity hover:opacity-85" />
              <text x={label.x} y={label.y + 1.1} textAnchor="middle" dominantBaseline="middle"
                fill="#ffffff" fontSize="3.25" fontWeight="700" pointerEvents="none">{item.code}</text>
            </g>
          );
        })}
        <circle cx="50" cy="50" r="26.5" fill="#ffffff" />
      </svg>
      <div className="absolute inset-[27%] flex flex-col items-center justify-center text-center px-2 overflow-hidden">
        <span className="w-full text-[9px] sm:text-[10px] tracking-[0.12em] font-extrabold text-slate-700 uppercase leading-tight">
          BULAN {String(selectedMonthIndex + 1).padStart(2, '0')}/12
        </span>
        <strong className="w-full text-[clamp(12px,3.8vw,18px)] font-extrabold leading-tight text-[#9D174D]">
          {month.name}
        </strong>
        <span className="w-full max-w-full text-[clamp(8px,2.5vw,11px)] font-semibold text-slate-700 leading-tight line-clamp-2 mt-1 break-words">
          {activitySummary || 'Belum ada kegiatan'}
        </span>
        <span className="text-[9px] font-bold text-slate-700 mt-0.5">{selectedYear}</span>
        <button type="button" onClick={onDetails}
          className="mt-1 min-h-6 text-[10px] sm:text-[11px] font-extrabold text-[#C41E2A] inline-flex items-center gap-1 shrink-0">
          Rincian <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
};
