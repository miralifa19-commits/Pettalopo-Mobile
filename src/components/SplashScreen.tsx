import React, { useEffect, useRef, useState } from 'react';
import { LOGO_IMAGE_PATH } from '../data/scoutData';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFading, setIsFading] = useState(false);
  const [showShine, setShowShine] = useState(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    // Logo tampil singkat; keseluruhan splash berlangsung 3 detik.
    const shineStartTimeout = setTimeout(() => {
      setShowShine(true);
    }, 450);

    // 2. Kilauan selesai menyapu 1 kali saja setelah 1.8 detik
    const shineStopTimeout = setTimeout(() => {
      setShowShine(false);
    }, 2000);

    // 3. Fading out transisi
    const fadeTimeout = setTimeout(() => {
      setIsFading(true);
    }, 2600);

    const finishTimeout = setTimeout(() => {
      onFinishRef.current();
    }, 3000);

    return () => {
      clearTimeout(shineStartTimeout);
      clearTimeout(shineStopTimeout);
      clearTimeout(fadeTimeout);
      clearTimeout(finishTimeout);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#e51c24] select-none transition-opacity duration-350 font-sans ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        
        {/* LOGO AMBALAN: Tampil biasa dulu, barulah mengkilap 1 kali saja */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center p-2">
          <img
            src={LOGO_IMAGE_PATH}
            alt="Logo Ambalan La Surullah Petta Lopo"
            className="w-full h-full object-contain drop-shadow-2xl relative z-10"
          />

          {/* Sinar Kilap 1 Kali Saja Yang Muncul Setelah Logo Tampil Biasa */}
          {showShine && (
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
                className="absolute inset-0 w-2/3 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none splash-shimmer-smooth"
              />
            </div>
          )}
        </div>

        {/* Identitas Ambalan dan pangkalan */}
        <div className="mt-6 text-center">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide leading-tight">
            Ambalan La Surullah Petta Lopo
          </h1>

          <p className="mt-1.5 text-sm sm:text-base font-bold text-white tracking-wide whitespace-nowrap">
            Gugus Depan 10.035 – 10.036
          </p>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-white/95 tracking-wide">
            Pangkalan UPT SMA Negeri 9 Maros
          </p>
        </div>

      </div>

      {/* WATERMARK DI BAGIAN PALING BAWAH */}
      <div className="absolute bottom-6 inset-x-0 text-center pointer-events-none">
        <p className="text-xs font-semibold text-white tracking-wider">
          by amd studio
        </p>
      </div>

    </div>
  );
};
