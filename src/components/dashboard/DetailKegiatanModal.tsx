import React from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Users, 
  Play, 
  CheckCircle2, 
  X,
  ExternalLink,
  Coins
} from 'lucide-react';
import { ProgramKerjaItem } from '../../types';

interface DetailKegiatanModalProps {
  item: ProgramKerjaItem | null;
  onClose: () => void;
  onNavigateToProgramKerja: () => void;
}

export const DetailKegiatanModal: React.FC<DetailKegiatanModalProps> = ({
  item,
  onClose,
  onNavigateToProgramKerja
}) => {
  if (!item) return null;

  const isRutin = item.tipe === 'Latihan Rutin';
  const isTerlaksana = item.status === 'Terlaksana' || item.status === 'Selesai';
  const isMenunggu = item.status === 'Menunggu' || item.status === 'Berjalan';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto animate-in zoom-in-95 duration-150">
        
        {/* Top Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              aria-label="Kembali"
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Detail Kegiatan
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Category Pill */}
          <div>
            {isRutin ? (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 inline-flex items-center gap-1.5">
                📖 Latihan Rutin
              </span>
            ) : item.nama.toLowerCase().includes('sosial') || item.nama.toLowerCase().includes('bakti') ? (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                🤝 Kegiatan Sosial
              </span>
            ) : (
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-1.5">
                🎓 Materi & Pembekalan
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-snug">
              {item.nama}
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-normal">
              {item.deskripsi || 'Melatih anggota ambalan dalam materi dan keterampilan kepramukaan sesuai adat ambalan.'}
            </p>
          </div>

          {/* Information Rows */}
          <div className="space-y-3.5 pt-2 border-t border-slate-100">
            
            {/* Tanggal */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Tanggal
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {item.waktuPelaksanaan}
                </span>
              </div>
            </div>

            {/* Penanggung Jawab */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Penanggung Jawab
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {item.penanggungJawab}
                </span>
              </div>
            </div>

            {/* Tempat */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Tempat
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {item.tempat || 'Aula / Lapangan Sekolah'}
                </span>
              </div>
            </div>

            {/* Sasaran */}
            {item.sasaran && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Sasaran Peserta
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {item.sasaran}
                  </span>
                </div>
              </div>
            )}

            {/* Anggaran if present */}
            {item.anggaran && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Anggaran Biaya
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {item.anggaran}
                  </span>
                </div>
              </div>
            )}

            {/* Status row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500">
                Status
              </span>
              <div>
                {isTerlaksana ? (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Selesai
                  </span>
                ) : isMenunggu ? (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Menunggu
                  </span>
                ) : (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    Belum terlaksana
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Primary Action Button (Screen 4: "▶ Mulai Kegiatan" or "Buka di Program Kerja") */}
          <div className="pt-3 space-y-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToProgramKerja();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Buka di Program Kerja</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors text-center"
            >
              Tutup
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
