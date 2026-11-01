import React, { useState } from 'react';
import { Plus, Radio, FileText, CheckSquare, Sparkles, X, Volume2 } from 'lucide-react';
import { NavigationTab } from '../types';

interface AndroidFABProps {
  onSelectTab: (tab: NavigationTab) => void;
  onTriggerSos: () => void;
}

export const AndroidFAB: React.FC<AndroidFABProps> = ({ onSelectTab, onTriggerSos }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-18 right-4 sm:right-6 z-30 flex flex-col items-end">
      {/* Speed Dial Menu Items */}
      {isOpen && (
        <div className="mb-3 space-y-2 flex flex-col items-end animate-in slide-in-from-bottom-2 duration-200">
          
          {/* Quick SOS Whistle */}
          <button
            onClick={() => {
              setIsOpen(false);
              onTriggerSos();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white text-rose-600 border-2 border-rose-500 shadow-lg text-xs font-bold hover:bg-rose-50 active:scale-95 transition-all"
          >
            <Volume2 className="w-4 h-4 text-rose-600 animate-bounce" />
            <span>Bunyikan Morse S.O.S</span>
          </button>

          {/* Quick Logbook */}
          <button
            onClick={() => {
              setIsOpen(false);
              onSelectTab('logbook');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white text-slate-800 border-2 border-amber-400 shadow-lg text-xs font-bold hover:bg-amber-50 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Tulis Logbook Baru</span>
          </button>

          {/* Quick SKU */}
          <button
            onClick={() => {
              setIsOpen(false);
              onSelectTab('sku');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white text-slate-800 border-2 border-[#e51c24] shadow-lg text-xs font-bold hover:bg-red-50 active:scale-95 transition-all"
          >
            <CheckSquare className="w-4 h-4 text-[#e51c24]" />
            <span>Uji SKU Penegak</span>
          </button>
        </div>
      )}

      {/* Main Trigger Button: Yellow & Red Logo colors */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Aksi Cepat Pramuka"
        className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 flex items-center justify-center shadow-xl border-2 border-[#e51c24] active:scale-90 transition-all focus:outline-none"
      >
        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5] text-[#e51c24]" />
        ) : (
          <Plus className="w-7 h-7 stroke-[2.5] text-[#e51c24]" />
        )}
      </button>
    </div>
  );
};
