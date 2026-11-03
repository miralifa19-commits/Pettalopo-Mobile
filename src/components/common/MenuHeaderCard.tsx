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
    <div className="bg-[#e51c24] text-white rounded-3xl p-4 sm:p-5 shadow-xs relative overflow-hidden border border-red-700">
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all border border-white/30 shrink-0 cursor-pointer shadow-2xs"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-white stroke-[2.5]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-white leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-red-100 font-medium truncate mt-0.5">
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
