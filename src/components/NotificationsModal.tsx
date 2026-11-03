import React from 'react';
import { ActiveKegiatanSession, AmbalanNotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKegiatan?: ActiveKegiatanSession | null;
  notifications?: AmbalanNotificationItem[];
  onOpenPresensi?: (kegiatanId?: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  activeKegiatan,
  notifications = [],
  onOpenPresensi
}) => {
  if (!isOpen) return null;

  const defaultNotifications: AmbalanNotificationItem[] = [
    {
      id: 'default_1',
      title: 'Latihan Rutin Sabtu Ini',
      time: 'Hari Ini',
      desc: 'Materi Sandi Morse dan P3K Lapangan. Pukul 15:30 WITA di Sanggar Ambalan. Kenakan seragam pramuka lengkap.',
      unread: true,
      type: 'general'
    },
    {
      id: 'default_2',
      title: 'Pendaftaran Ujian SKU Bantara',
      time: 'Kemarin',
      desc: 'Bagi calon penegak yang telah menyelesaikan butir SKU agar mendaftar ke Pradana untuk jadwal pelantikan.',
      unread: false,
      type: 'general'
    },
    {
      id: 'default_3',
      title: 'Pemberitahuan Adat Ambalan',
      time: '3 hari lalu',
      desc: 'Selamat datang adik-adik Tamu Ambalan! Pelajari kiasan dasar dan filosofi La Surullah Petta Lopo di aplikasi.',
      unread: false,
      type: 'general'
    }
  ];

  const displayList = notifications.length > 0 ? notifications : defaultNotifications;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-red-200 shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#e51c24] flex items-center justify-center text-white shrink-0">
              <svg className="w-3.5 h-3.5 fill-none stroke-white stroke-[2.2]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Pemberitahuan Ambalan</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          
          {/* Active Running Kegiatan Highlight Card (User request: cukup masuk di pemberitahuan, klik dan lakukan presensi) */}
          {activeKegiatan && activeKegiatan.isRunning && (
            <div 
              onClick={() => {
                if (onOpenPresensi) onOpenPresensi(activeKegiatan.kegiatanId);
                onClose();
              }}
              className="p-3.5 rounded-2xl bg-red-50 border-2 border-[#e51c24] cursor-pointer hover:bg-red-100/80 transition-all space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#e51c24] font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  Presensi Dibuka Sekarang!
                </span>
                <span className="text-[10px] bg-[#e51c24] text-white px-2 py-0.5 rounded-full font-bold">
                  Isi Presensi ➔
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                {activeKegiatan.kegiatanNama}
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                Ketuk di sini untuk mengisi kehadiran, memberi rating bintang, dan evaluasi kegiatan.
              </p>
            </div>
          )}

          {/* List Notifications */}
          {displayList.map((n) => {
            const isPresensi = n.type === 'presensi';

            return (
              <div
                key={n.id}
                onClick={() => {
                  if (isPresensi && onOpenPresensi) {
                    onOpenPresensi(n.kegiatanId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl border transition-all ${
                  isPresensi ? 'cursor-pointer hover:border-red-400' : ''
                } ${
                  n.unread ? 'bg-red-50/40 border-red-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                    isPresensi ? 'bg-red-100 text-[#e51c24]' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isPresensi ? '📋' : '📢'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.desc}</p>
                    {isPresensi && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-[#e51c24]">
                        👉 Ketuk untuk isi presensi & evaluasi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Tutup Pemberitahuan
        </button>
      </div>
    </div>
  );
};
