import React from 'react';
import { LOGO_IMAGE_PATH } from '../../data/scoutData';

interface ShiningAmbalanLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
  onClick?: () => void;
}

/**
 * Reusable Shining Logo Ambalan:
 * Memiliki efek kilauan berdurasi 1 detik dan berulang setiap 15 detik (siklus 16s)
 * dengan silhouette mask PNG bersih tanpa kotak di belakangnya.
 */
export const ShiningAmbalanLogo: React.FC<ShiningAmbalanLogoProps> = ({
  className = 'w-9 h-9',
  imgClassName = 'w-full h-full object-contain',
  alt = 'Logo Ambalan La Surullah Petta Lopo',
  onClick
}) => {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      <img
        src={LOGO_IMAGE_PATH}
        alt={alt}
        className={`${imgClassName} relative z-10`}
      />

      {/* Sinar Kilap Berdurasi 1 Detik, Berulang Setiap 15 Detik */}
      <div 
        className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
        style={{
          WebkitMaskImage: `url('${LOGO_IMAGE_PATH}')`,
          maskImage: `url('${LOGO_IMAGE_PATH}')`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      >
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none apk-logo-shine-interval"
        />
      </div>
    </div>
  );
};
