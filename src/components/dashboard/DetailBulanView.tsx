import React from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  User, 
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { ProgramKerjaItem } from '../../types';
import { MonthCycleItem } from './SiklusLingkaran';

interface DetailBulanViewProps {
  month: MonthCycleItem;
  activities: ProgramKerjaItem[];
  onBack: () => void;
  onSelectActivity: (activity: ProgramKerjaItem) => void;
  onOpenAllMonths: () => void;
}

export const DetailBulanView: React.FC<DetailBulanViewProps> = ({
  month,
  activities,
  onBack,
  onSelectActivity,
  onOpenAllMonths
}) => {
  const total = activities.length;
  const selesaiCount = activities.filter(
    (a) => a.status === 'Terlaksana' || a.status === 'Selesai'
  ).length;
  const belumCount = activities.filter(
    (a) => a.status === 'Belum Terlaksana' || a.status === 'Tidak Terlaksana' || a.status === 'Direncanakan'
  ).length;

  const percentComplete = total > 0 ? Math.round((selesaiCount / total) * 100) : 0;

  // Monthly inspirational quotes
  const quoteMap: Record<string, string> = {
    Oktober: 'Setiap langkah kecil dalam kebaikan adalah bagian dari perjalanan besar.',
    November: 'Kegiatan hari ini adalah bagian dari perjalanan panjang menuju kepengurusan yang lebih baik.',
    Desember: 'Ikhlas Bakti Bina Bangsa, Berbudi Bawa Laksana.',
    Januari: 'Awal yang kokoh mencerminkan tekad dan keteguhan hati para pejuang ambalan.',
    Februari: 'Kekompakan sangga dibangun dari saling percaya dan rasa persaudaraan yang tulus.',
    Maret: 'Belajar di alam terbuka menempa jiwa mandiri, disiplin, dan pantang menyerah.',
    April: 'Kecakapan sejati lahir dari latihan yang konsisten dan pengabdian tanpa pamrih.',
    Mei: 'Tunaikan janji Tri Satya dan Dasa Darma dalam setiap hembusan pengabdian.',
    Juni: 'Akhir kepengurusan bukanlah perpisahan, melainkan estafet perjuangan bagi generasi penerus.',
    Juli: 'Selamat datang para penerus tradisi luhur Ambalan La Surullah.',
    Agustus: 'Kobarkan semangat Hari Pramuka, tegakkan kehormatan bangsa dan agama.',
    September: 'Pionering dan kepemimpinan adalah seni menata rintangan menjadi karya nyata.'
  };

  const quote = quoteMap[month.name] || 'Jalankan amanah dengan kesungguhan hati dan niat ibadah.';

  // Helper to extract day number from waktuPelaksanaan
  const parseDayNumber = (waktu: string, fallbackIdx: number): string => {
    const match = waktu.match(/\b(\d{1,2})\b/);
    if (match) return match[1];
    return String(10 + fallbackIdx * 7);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* 1. Header with back button, month title, and status pill */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Kembali ke siklus"
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:text-teal-700 hover:border-teal-300 flex items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {month.name} {month.fullYear}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Agenda & Latihan Bulanan Ambalan
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {month.status === 'current' ? (
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              Bulan Ini
            </span>
          ) : month.status === 'upcoming' ? (
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Mendatang
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Bulan Lalu
            </span>
          )}
        </div>
      </div>

      {/* 2. Motivational Quote Banner (Styled like Screen 2 / Screen 5) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-50 via-emerald-50/70 to-teal-50 border border-teal-200/70 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-white text-teal-600 border border-teal-200 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-teal-950 italic leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block font-mono">
              Ambalan La Surullah • Gugus Depan 10-035/10-036
            </span>
          </div>
        </div>
      </div>

      {/* 3. Stat Cards Strip (Screen 2: Total Kegiatan, Selesai, Belum Terlaksana) + Progress gauge */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {/* Total Kegiatan */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center mb-1 shadow-xs">
            {total}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-tight">
            Total Kegiatan
          </span>
        </div>

        {/* Sudah Selesai */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center mb-1 border border-slate-300">
            {selesaiCount}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-tight">
            Sudah Selesai
          </span>
        </div>

        {/* Belum Terlaksana */}
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center mb-1 border border-amber-300">
            {belumCount}
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-tight">
            Belum Terlaksana
          </span>
        </div>
      </div>

      {/* Progress ring card if there are activities */}
      {total > 0 && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-600 transition-all duration-500"
                  strokeDasharray={`${percentComplete}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-black text-slate-900">
                {percentComplete}%
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900">
                Progres {month.name}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {selesaiCount} dari {total} agenda telah diselesaikan
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {month.status === 'current' ? 'Bulan Berjalan' : month.status === 'upcoming' ? 'Menunggu' : 'Telah Berlalu'}
          </span>
        </div>
      )}

      {/* 4. Vertical Date Timeline of Activities (Screen 2) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
          Kegiatan Bulan Ini
        </h3>

        {activities.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
            Belum ada agenda terdaftar untuk bulan {month.name}.
          </div>
        ) : (
          <div className="space-y-3.5 relative">
            {/* Timeline continuous vertical guideline */}
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-200 -z-0" />

            {activities.map((item, idx) => {
              const dayNum = parseDayNumber(item.waktuPelaksanaan, idx);
              const isRutin = item.tipe === 'Latihan Rutin';
              const isTerlaksana = item.status === 'Terlaksana' || item.status === 'Selesai';
              const isMenunggu = item.status === 'Menunggu' || item.status === 'Berjalan';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectActivity(item)}
                  className="flex items-start gap-3.5 group cursor-pointer relative z-10"
                >
                  {/* Left: Date Stamp Node */}
                  <div className="w-12 h-13 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0 group-hover:border-teal-400 transition-colors">
                    <span className="text-base font-black text-slate-900 leading-none">
                      {dayNum}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 font-mono">
                      {month.code}
                    </span>
                  </div>

                  {/* Right: Activity Card */}
                  <div className="flex-1 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 min-w-0">
                        {/* Category tag */}
                        <div className="flex items-center gap-1.5">
                          {isRutin ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                              📖 Latihan Rutin
                            </span>
                          ) : item.nama.toLowerCase().includes('sosial') || item.nama.toLowerCase().includes('bakti') ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              🤝 Kegiatan Sosial
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1">
                              🎓 Materi & Pembekalan
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug line-clamp-1">
                          {item.nama}
                        </h4>

                        {/* PJ */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.penanggungJawab}</span>
                        </div>

                        {/* Status tag */}
                        <div className="pt-0.5">
                          {isTerlaksana ? (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Selesai
                            </span>
                          ) : isMenunggu ? (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              Menunggu
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Belum terlaksana
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Chevron */}
                      <div className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 mt-1">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Bottom Link: "Lihat semua kegiatan - 1 tahun kepengurusan >" */}
      <div
        onClick={onOpenAllMonths}
        className="bg-white rounded-2xl p-4 border border-teal-200/90 shadow-xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 group-hover:text-teal-700 transition-colors">
              Lihat semua kegiatan
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              1 tahun kepengurusan (12 bulan)
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
      </div>

    </div>
  );
};
