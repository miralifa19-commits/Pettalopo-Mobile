import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface MenuHeaderCardProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  actionRight?: React.ReactNode;
}

export const MenuHeaderCard: React.FC<MenuHeaderCardProps> = ({
  title,
  subtitle,
  onBack,
  actionRight
}) => {
  return (
    <div className="bg-white text-slate-900 rounded-[20px] p-4 sm:p-5 relative overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#fcebed] hover:bg-[#f7dadd] active:scale-95 text-[#c8202b] flex items-center justify-center transition-all border border-transparent shrink-0 cursor-pointer"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-[#c8202b] stroke-[2.5]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actionRight && (
          <div className="shrink-0">
            {actionRight}
          </div>
        )}
      </div>
    </div>
  );
};
