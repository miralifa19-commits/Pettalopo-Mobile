import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Filter, Calendar } from 'lucide-react';
import { MonthCycleItem } from './SiklusLingkaran';

interface SemuaKegiatanViewProps {
  months: MonthCycleItem[];
  onBack: () => void;
  onSelectMonth: (month: MonthCycleItem) => void;
  academicYear?: string;
}

export const SemuaKegiatanView: React.FC<SemuaKegiatanViewProps> = ({
  months,
  onBack,
  onSelectMonth,
  academicYear = '2026/2027'
}) => {
  const [filter, setFilter] = useState<'tahun_ini' | 'semua'>('tahun_ini');

  // Order months from Juli (urutan 1) to Juni (urutan 12) or chronological
  const monthOrder = [
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
  ];

  const sortedMonths = [...months].sort((a, b) => {
    return monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name);
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Kembali"
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-teal-700 flex items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Semua Kegiatan
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Siklus 1 Tahun Kepengurusan ({academicYear})
            </p>
          </div>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
          <Filter className="w-4 h-4" />
        </div>
      </div>

      {/* Segmented Filter Buttons (Screen 3: [Tahun Ini] | [Semua]) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setFilter('tahun_ini')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            filter === 'tahun_ini'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tahun Ini
        </button>
        <button
          onClick={() => setFilter('semua')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            filter === 'semua'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua
        </button>
      </div>

      {/* List of 12 Months */}
      <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {sortedMonths.map((m) => {
          let dotColor = 'bg-slate-300';
          if (m.status === 'current') {
            dotColor = 'bg-teal-600 ring-4 ring-teal-100';
          } else if (m.status === 'upcoming') {
            dotColor = 'bg-amber-400';
          }

          return (
            <div
              key={m.code}
              onClick={() => onSelectMonth(m)}
              className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${dotColor}`} />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {m.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {m.kegiatanCount} kegiatan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {m.status === 'current' && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    Bulan Ini
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
