import React from 'react';
import { signOutAmbalan } from '../../services/authService';

interface DisabledAccountScreenProps {
  onSignOut: () => void;
}

export const DisabledAccountScreen: React.FC<DisabledAccountScreenProps> = ({ onSignOut }) => {
  const handleLogout = async () => {
    await signOutAmbalan();
    onSignOut();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6 text-slate-800 font-sans select-none">
      <div className="w-full max-w-sm text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center text-3xl mb-4">
          ⛔
        </div>

        <h1 className="text-base font-bold text-slate-900 mb-2">
          Akun Dinonaktifkan
        </h1>

        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          Akun Anda dinonaktifkan. Hubungi Dewan Ambalan.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};
