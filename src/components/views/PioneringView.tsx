import React, { useState } from 'react';
import { Compass, CheckCircle2, Calculator, Layers, AlertCircle, ArrowRight } from 'lucide-react';
import { SIMPUL_IKATAN } from '../../data/scoutData';

export const PioneringView: React.FC = () => {
  const [selectedKnot, setSelectedKnot] = useState(SIMPUL_IKATAN[0]);
  
  // Menaksir Tinggi State
  const [tongkatTinggi, setTongkatTinggi] = useState<number>(160); // cm
  const [bayanganTongkat, setBayanganTongkat] = useState<number>(80); // cm
  const [bayanganPohon, setBayanganPohon] = useState<number>(450); // cm

  // Calculate: (bayanganPohon / bayanganTongkat) * tongkatTinggi
  const estimasiPohon = bayanganTongkat > 0 
    ? ((bayanganPohon / bayanganTongkat) * tongkatTinggi) / 100 
    : 0;

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <Compass className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
              Keterampilan Lapangan
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              Tali Temali, Pionering & Menaksir
            </h2>
            <p className="text-xs text-slate-500">
              Panduan simpul wajib penegak bantara dan kalkulator penaksir tinggi pohon
            </p>
          </div>
        </div>
      </div>

      {/* Selected Knot Detailed Guide */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
              {selectedKnot.type}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {selectedKnot.name}
            </h3>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
            selectedKnot.difficulty === 'Mudah'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : selectedKnot.difficulty === 'Sedang'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}>
            Tingkat: {selectedKnot.difficulty}
          </span>
        </div>

        {/* Purpose */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <strong className="text-slate-900 font-bold block mb-0.5">Fungsi & Kegunaan Utama:</strong>
          {selectedKnot.purpose}
        </div>

        {/* Steps */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-2">
            Langkah-Langkah Pembuatan:
          </h4>
          <div className="space-y-2">
            {selectedKnot.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-[#e51c24] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Knot Selector Chips */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-2">
          Pilih Simpul atau Ikatan Lainnya:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SIMPUL_IKATAN.map((knot) => (
            <button
              key={knot.name}
              onClick={() => setSelectedKnot(knot)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedKnot.name === knot.name
                  ? 'bg-red-50 border-[#e51c24] ring-1 ring-amber-400 text-[#e51c24] font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400'
              }`}
            >
              <span className="text-[10px] text-slate-400 block truncate">{knot.type}</span>
              <span className="text-xs font-bold block truncate mt-0.5">{knot.name.split(' (')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Menaksir Tinggi Pohon / Tiang Calculator */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#e51c24]" />
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              Kalkulator Menaksir Tinggi (Metode Bayangan)
            </h3>
            <p className="text-[11px] text-slate-500">Materi SKU Penegak Bantara Butir 10</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Tinggi Tongkat Pramuka (cm):
            </label>
            <input
              type="number"
              value={tongkatTinggi}
              onChange={(e) => setTongkatTinggi(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-amber-400 text-xs font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Panjang Bayangan Tongkat (cm):
            </label>
            <input
              type="number"
              value={bayanganTongkat}
              onChange={(e) => setBayanganTongkat(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-amber-400 text-xs font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Panjang Bayangan Objek (cm):
            </label>
            <input
              type="number"
              value={bayanganPohon}
              onChange={(e) => setBayanganPohon(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-amber-400 text-xs font-bold"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-50 to-amber-50 border border-amber-300 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-600 block">Hasil Estimasi Tinggi:</span>
            <span className="text-xl sm:text-2xl font-black text-[#e51c24] font-mono">
              {estimasiPohon.toFixed(2)} Meter
            </span>
          </div>
          <span className="text-[10px] text-amber-900 bg-white/80 px-2 py-1 rounded-lg border border-amber-300 font-mono">
            Rumus: (L.Objek / L.Tongkat) × T.Tongkat
          </span>
        </div>
      </div>

    </div>
  );
};
