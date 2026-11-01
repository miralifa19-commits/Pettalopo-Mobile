import React from 'react';
import { ArrowLeft, Info, X } from 'lucide-react';

interface KeteranganWarnaModalProps {
  onClose: () => void;
}

export const KeteranganWarnaModal: React.FC<KeteranganWarnaModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
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
              Keterangan Warna
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
        <div className="p-6 space-y-6 text-xs">
          
          {/* Section 1: Status Kegiatan */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
              Status Kegiatan
            </h4>

            <div className="space-y-3">
              {/* Selesai */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-900 text-xs">
                    Selesai
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Kegiatan telah dilaksanakan
                  </p>
                </div>
              </div>

              {/* Menunggu */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-900 text-xs">
                    Menunggu
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Menunggu waktu pelaksanaan
                  </p>
                </div>
              </div>

              {/* Belum Terlaksana */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-900 text-xs">
                    Belum terlaksana
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Belum dilaksanakan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Warna Bulan */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
              Warna Bulan
            </h4>

            <div className="space-y-3">
              {/* Bulan ini */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-900 text-xs">
                    Bulan ini
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sedang berjalan
                  </p>
                </div>
              </div>

              {/* Bulan mendatang */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-900 text-xs">
                    Bulan mendatang
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Akan dilaksanakan
                  </p>
                </div>
              </div>

              {/* Bulan lalu */}
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-slate-300 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-extrabold text-slate-900 text-xs">
                    Bulan lalu
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sudah berlalu
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info callout */}
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p className="text-[11px] text-teal-900 font-medium leading-relaxed">
              Klik pada bulan untuk melihat detail kegiatan di bulan tersebut.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-sm transition-all"
          >
            Mengerti
          </button>

        </div>

      </div>
    </div>
  );
};
