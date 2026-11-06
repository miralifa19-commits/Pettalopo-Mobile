import React, { useState } from 'react';
import { UserProfile } from '../../types/auth';
import { completeUserOnboarding } from '../../services/authService';

interface OnboardingTourProps {
  userProfile: UserProfile;
  onFinish: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: string;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ userProfile, onFinish }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  // Sesuaikan langkah pengenalan dengan status / peran
  const steps: TourStep[] = [
    {
      title: 'Selamat Datang di Pettalopo Mobile',
      description: `Halo Kak ${userProfile.namaLengkap}! Aplikasi resmi Ambalan La Surullah Petta Lopo siap menemani seluruh kegiatan kepramukaan Anda.`,
      icon: '⚜️',
    },
    {
      title: 'Beranda & Info Utama',
      description: 'Pantau agenda latihan mingguan, kalender kegiatan, serta profil sangga langsung dari halaman utama.',
      icon: '🏠',
    },
    ...(userProfile.status === 'purna_ambalan'
      ? [
          {
            title: 'Akses Purna Ambalan',
            description: 'Sebagai Purna Ambalan, Anda memiliki akses khusus ke agenda kegiatan, ruang temu ambalan, dan pengumuman resmi.',
            icon: '🎖️',
          },
        ]
      : [
          {
            title: 'Presensi & Latihan Rutin',
            description: 'Isi kehadiran latihan rutin setiap hari Jumat dengan mudah dan pantau riwayat keaktifan Anda.',
            icon: '📋',
          },
          {
            title: 'Ruang Dewan & Sangga',
            description: 'Akses data anggota sangga, program kerja, dan koordinasi ambalan secara terpadu.',
            icon: '👥',
          },
        ]),
    ...(userProfile.peran === 'admin'
      ? [
          {
            title: 'Fitur Khusus Admin',
            description: 'Kelola sandi ambalan, daftar anggota, ubah peran keanggotaan, dan kelola admin ambalan melalui Menu Admin.',
            icon: '🛡️',
          },
        ]
      : []),
    {
      title: 'Ruang Ambalan',
      description: 'Berinteraksi langsung dengan seluruh anggota ambalan melalui ruang obrolan dan berbagi informasi.',
      icon: '💬',
    },
  ];

  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsFinishing(true);
    try {
      await completeUserOnboarding(userProfile.uid);
    } catch (e) {
      console.warn('Gagal menyimpan status onboarding:', e);
    } finally {
      setIsFinishing(false);
      onFinish();
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-6 shadow-xl text-center flex flex-col items-center">
        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex 
                  ? 'w-6 bg-[#e51c24]' 
                  : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl mb-4">
          {currentStep.icon}
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-slate-900 mb-2">
          {currentStep.title}
        </h2>

        {/* Description */}
        <p className="text-xs text-slate-600 leading-relaxed mb-6 px-2 min-h-[50px] flex items-center justify-center">
          {currentStep.description}
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={handleNext}
            disabled={isFinishing}
            className="w-full py-3 bg-[#e51c24] hover:bg-[#c9181f] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-60"
          >
            {currentStepIndex === steps.length - 1 ? (
              isFinishing ? 'Menyiapkan...' : 'Mulai Gunakan Aplikasi'
            ) : (
              'Lanjut'
            )}
          </button>

          {currentStepIndex < steps.length - 1 && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isFinishing}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Lewati Tur
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
