import React from 'react';
import { Bell, X, Calendar, Award, Sparkles, Check } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'Latihan Rutin Sabtu Ini',
      time: '2 jam lalu',
      desc: 'Materi Sandi Morse dan P3K Lapangan. Pukul 15:30 WITA di Sanggar Ambalan. Kenakan seragam pramuka lengkap.',
      unread: true,
      icon: Calendar,
      color: 'bg-red-100 text-[#e51c24]'
    },
    {
      id: 2,
      title: 'Pendaftaran Ujian SKU Bantara',
      time: '1 hari lalu',
      desc: 'Bagi calon penegak yang telah menyelesaikan 14 butir SKU agar segera mendaftar ke Pradana untuk jadwal pelantikan.',
      unread: true,
      icon: Award,
      color: 'bg-amber-100 text-amber-800'
    },
    {
      id: 3,
      title: 'Pemberitahuan Adat Ambalan',
      time: '3 hari lalu',
      desc: 'Selamat datang adik-adik Tamu Ambalan! Jangan lupa pelajari kiasan dasar lambang La Surullah Petta Lopo di aplikasi.',
      unread: false,
      icon: Sparkles,
      color: 'bg-blue-100 text-blue-700'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 border-2 border-amber-400 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#e51c24]" />
            <h3 className="text-sm font-extrabold text-slate-900">Pemberitahuan Ambalan</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border transition-all ${
                  n.unread ? 'bg-red-50/40 border-amber-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
        >
          Tutup Pemberitahuan
        </button>
      </div>
    </div>
  );
};
