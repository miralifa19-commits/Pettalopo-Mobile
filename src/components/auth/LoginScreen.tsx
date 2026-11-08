import React, { useState } from 'react';
import { signInWithGoogle } from '../../services/authService';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Jendela login ditutup sebelum selesai.');
      } else {
        setErrorMessage('Gagal masuk dengan Google. Silakan coba kembali.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between items-center p-6 text-slate-800 font-sans select-none">
      <div className="w-full max-w-sm flex flex-col items-center pt-12 text-center">
        {/* Logo Ambalan */}
        <div className="w-24 h-24 rounded-3xl bg-white border border-slate-200 p-3 shadow-xs flex items-center justify-center mb-6">
          <img 
            src="/assets/pettalopo-logo.png" 
            alt="Logo Pettalopo" 
            className="w-18 h-18 object-contain"
          />
        </div>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Pettalopo Mobile
        </h1>
        <p className="text-xs font-medium text-slate-500 mt-1">
          Gugus Depan 10.035 – 10.036
        </p>
        <p className="text-xs font-semibold text-slate-600 mt-1 whitespace-nowrap">Pangkalan UPT SMA Negeri 9 Maros</p>
        <p className="text-[13px] text-slate-600 mt-4 leading-relaxed max-w-xs">
          Aplikasi resmi Ambalan La Surullah Petta Lopo. Silakan masuk untuk mengakses seluruh agenda, data, dan ruang ambalan.
        </p>
      </div>

      <div className="w-full max-w-sm pb-10 flex flex-col items-center">
        {errorMessage && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-white border border-slate-300 hover:border-slate-400 active:bg-slate-50 rounded-xl shadow-xs font-semibold text-slate-700 text-sm flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#e51c24] border-t-transparent rounded-full animate-spin" />
              <span>Menghubungkan...</span>
            </>
          ) : (
            <>
              {/* Google G icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 mt-4 text-center">
          Khusus anggota & purna Ambalan La Surullah Petta Lopo
        </p>
      </div>
    </div>
  );
};
