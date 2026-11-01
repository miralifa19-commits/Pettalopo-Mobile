import React, { useRef } from 'react';
import { 
  Home,
  Shield, 
  CalendarCheck, 
  Users, 
  Award, 
  GraduationCap, 
  Brain,
  Settings,
  UserCheck,
  X, 
  ChevronRight,
  Camera
} from 'lucide-react';
import { ActiveMenu, UserAccount } from '../types';

interface AndroidSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  user: UserAccount;
  onUpdateUser?: (updated: UserAccount) => void;
  onOpenAuthModal?: () => void;
}

export const AndroidSidebar: React.FC<AndroidSidebarProps> = ({
  isOpen,
  onClose,
  activeMenu,
  onSelectMenu,
  user,
  onUpdateUser
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Golongan: calon penegak, penegak bantara, penegak laksana, atau pradana, pemangku adat, kerani, juru uang, pembina
  const getGolongan = (u: UserAccount) => {
    if (u.jabatan && u.jabatan.toLowerCase() !== 'anggota' && u.jabatan.toLowerCase() !== 'anggota sangga') {
      return u.jabatan;
    }
    return u.tingkat || 'Penegak Bantara';
  };

  // Upload Foto Profil
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateUser) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          onUpdateUser({
            ...user,
            foto: dataUrl
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Susunan Menu Sidebar sesuai instruksi user:
  // 1. Home (Paling atas)
  // 2. Profil Ambalan
  // 3. Kegiatan dan Latihan
  // 4. Sangga
  // 5. SKU dan SKK
  // 6. Ruang Belajar
  // 7. Chat Ambalan (Grup WA tema merah putih)
  // 8. Pengaturan (Dibawah ruang belajar/chat)
  // 9. Akun (Dibawah pengaturan)
  const sidebarMenus = [
    {
      id: 'home' as ActiveMenu,
      label: 'Home',
      icon: Home
    },
    {
      id: 'profil_ambalan' as ActiveMenu,
      label: 'Profil Ambalan',
      icon: Shield
    },
    {
      id: 'dashboard' as ActiveMenu,
      label: 'Kegiatan dan Latihan',
      icon: CalendarCheck
    },
    {
      id: 'sangga' as ActiveMenu,
      label: 'Sangga',
      icon: Users
    },
    {
      id: 'sku_skk' as ActiveMenu,
      label: 'SKU dan SKK',
      icon: Award
    },
    {
      id: 'ruang_belajar' as ActiveMenu,
      label: 'Ruang Belajar',
      icon: GraduationCap
    },
    {
      id: 'quiz' as ActiveMenu,
      label: 'Quiz Pramuka',
      icon: Brain
    },
    {
      id: 'pengaturan' as ActiveMenu,
      label: 'Pengaturan',
      icon: Settings
    },
    {
      id: 'akun' as ActiveMenu,
      label: 'Akun',
      icon: UserCheck
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="fixed inset-y-0 left-0 max-w-[280px] w-full bg-white shadow-2xl flex flex-col z-10 border-r border-slate-200 animate-in slide-in-from-left duration-200">
        
        {/* BAGIAN WARNA MERAH: DIPERKECIL & HANYA FOTO, NAMA BOLD, GOLONGAN */}
        <div className="relative bg-gradient-to-r from-[#e51c24] to-[#c9141b] text-white px-4 py-3.5 border-b border-red-700">
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 pr-5">
            {/* Foto Anggota (Bisa upload foto) */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-11 h-11 shrink-0 rounded-full cursor-pointer group"
              title="Klik untuk ganti foto"
            >
              {user.foto ? (
                <img
                  src={user.foto}
                  alt={user.nama}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-red-700 text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-sm">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Camera Overlay Icon */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Nama dengan bold, dibawahnya kecil golongan */}
            <div className="min-w-0">
              <strong className="block text-sm font-bold text-white truncate leading-tight">
                {user.nama}
              </strong>
              <span className="block text-[11px] text-white/90 font-medium truncate leading-tight mt-0.5">
                {getGolongan(user)}
              </span>
            </div>
          </div>
        </div>

        {/* SUSUNAN MENU SIDEBAR */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-1">
          {sidebarMenus.map((item) => {
            const isActive = activeMenu === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectMenu(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all text-left group ${
                  isActive
                    ? 'bg-red-50 text-[#e51c24] border-l-4 border-l-[#e51c24] font-black shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#e51c24] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-red-100 group-hover:text-[#e51c24]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-[#e51c24] translate-x-0.5' : 'text-slate-300'
                }`} />
              </button>
            );
          })}
        </div>

        {/* BAGIAN BAWAH BERSIH */}
        <div className="p-2 border-t border-slate-100">
        </div>

      </div>
    </div>
  );
};
