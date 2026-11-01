import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery, BatteryCharging } from 'lucide-react';

interface AndroidStatusBarProps {
  dark?: boolean;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({ dark = false }) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-full px-5 pt-2 pb-1.5 flex items-center justify-between text-xs font-semibold select-none z-30 transition-colors ${
      dark ? 'bg-[#e51c24] text-white' : 'bg-white text-slate-800 border-b border-slate-100'
    }`}>
      {/* Clock */}
      <span className="font-mono tracking-wide text-xs">{timeStr || '09:41'}</span>

      {/* Android Camera Notch Simulation (if mobile container) */}
      <div className="w-3.5 h-3.5 rounded-full bg-slate-900/80 mx-auto hidden sm:block border border-slate-700/50 shadow-inner"></div>

      {/* Android System Icons */}
      <div className="flex items-center space-x-1.5">
        <Wifi className="w-3.5 h-3.5" />
        <Signal className="w-3.5 h-3.5" />
        <div className="flex items-center space-x-0.5">
          <span className="text-[10px] font-mono">98%</span>
          <Battery className="w-4 h-4 fill-current" />
        </div>
      </div>
    </div>
  );
};
