import React, { useEffect, useState } from 'react';
import { LOGO_IMAGE_PATH } from '../data/scoutData';

interface SplashScreenProps {
  onFinish: () => void;
  onReady: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, onReady }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Wait until the React splash has been painted before hiding Android's native launch layer.
    let readyFrame = window.requestAnimationFrame(() => {
      readyFrame = window.requestAnimationFrame(() => onReady());
    });

    // Memberikan waktu yang cukup agar efek kilap pelan selesai dinikmati
    const fadeTimeout = setTimeout(() => {
      setIsFading(true);
    }, 3800);

    const finishTimeout = setTimeout(() => {
      onFinish();
    }, 4200);

    return () => {
      window.cancelAnimationFrame(readyFrame);
      clearTimeout(fadeTimeout);
      clearTimeout(finishTimeout);
    };
  }, [onFinish, onReady]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#e51c24] select-none transition-opacity duration-300 font-sans ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* CSS Keyframes untuk Efek Mengkilap Miring Pelan-Pelan (Satu Kali) */}
      <style>{`
        @keyframes shineSweepSlow {
          0% {
            transform: translateX(-180%) skewX(-25deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(300%) skewX(-25deg);
            opacity: 0;
          }
        }
        .shimmer-effect-slow {
          animation: shineSweepSlow 2.8s cubic-bezier(0.25, 1, 0.5, 1) 0.5s 1 forwards;
        }
      `}</style>

      <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        
        {/* LOGO AMBALAN BERSIH TANPA KOTAK DENGAN KILAUAN YANG MENGIKUTI BENTUK LOGO */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center p-2">
          <img
            src={LOGO_IMAGE_PATH}
            alt="Logo Ambalan La Surullah Petta Lopo"
            className="w-full h-full object-contain drop-shadow-2xl relative z-10"
          />

          {/* Sinar Kilap Pelan yang dimasker persis ke bentuk siluet PNG logo (tidak ada kotak sama sekali) */}
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
              className="absolute inset-0 w-2/3 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none shimmer-effect-slow"
            />
          </div>
        </div>

        {/* TULISAN: Ambalan La Surullah Petta Lopo */}
        <h1 className="mt-6 text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
          Ambalan La Surullah Petta Lopo
        </h1>

        {/* TULISAN: Gugus depan 10.035-10.036 (MENGKILAP PELAN SEIRAMA) */}
        <div className="relative overflow-hidden inline-block mt-2 px-4 py-1 rounded-full bg-black/15 border border-white/25">
          <span className="text-xs sm:text-sm font-extrabold text-white tracking-widest uppercase block relative z-10 font-mono">
            Gugus depan 10.035-10.036
          </span>

          {/* Sinar Kilap Miring Pelan pada Tulisan Gugus Depan */}
          <div 
            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none shimmer-effect-slow z-20"
          />
        </div>

      </div>

      {/* WATERMARK DI BAGIAN PALING BAWAH */}
      <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none">
        <p className="text-xs font-semibold text-white/80 tracking-widest uppercase font-mono">
          by amd studio
        </p>
      </div>

    </div>
  );
};
