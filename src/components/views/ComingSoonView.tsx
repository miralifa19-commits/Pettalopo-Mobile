import React from 'react';
import { ShiningAmbalanLogo } from '../common/ShiningAmbalanLogo';

interface ComingSoonViewProps {
  title: string;
  subtitle: string;
  icon?: string;
  onBackToDashboard?: () => void;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  title,
  subtitle,
  icon = '✨',
  onBackToDashboard
}) => {
  return (
    <div className="space-y-4 pb-24 font-sans">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-4 shadow-xs">
        
        {/* Transparent Ambalan Logo with 1s shine and 15s interval */}
        <div className="w-24 h-24 mx-auto flex items-center justify-center">
          <ShiningAmbalanLogo className="w-20 h-20" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold tracking-wide">
            <span>{icon}</span>
            <span>COMING SOON</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 max-w-xs mx-auto text-xs font-medium text-slate-600">
          ⏳ Fitur ini sedang disiapkan oleh Tim Dewan Ambalan La Surullah Petta Lopo.
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>←</span>
            <span>Kembali ke Beranda</span>
          </button>
        )}
      </div>
    </div>
  );
};

