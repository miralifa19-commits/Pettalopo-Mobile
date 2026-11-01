import React from 'react';
import { Clock, Shield, Users, ArrowLeft } from 'lucide-react';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';

interface ComingSoonViewProps {
  title: string;
  subtitle: string;
  type: 'profil' | 'organisasi' | 'sku_skk';
  onBackToDashboard: () => void;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  title,
  subtitle,
  type,
  onBackToDashboard
}) => {
  return (
    <div className="space-y-4 pb-24">
      <div className="bg-white rounded-3xl p-8 border-2 border-amber-400 text-center space-y-4 shadow-sm">
        
        {/* Transparent logo directly placed */}
        <div className="w-24 h-24 mx-auto flex items-center justify-center">
          <img
            src={LOGO_IMAGE_PATH}
            alt="Logo Ambalan"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </div>

        <div>
          <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono">
            COMING SOON
          </span>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
            {title}
          </h1>
          <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-red-50 border border-amber-300 max-w-xs mx-auto text-xs font-semibold text-[#e51c24]">
          ⏳ Fitur ini sedang disiapkan oleh Tim Dewan Ambalan La Surullah Petta Lopo.
        </div>

        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>
      </div>
    </div>
  );
};
