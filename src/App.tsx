import React, { useState, useEffect } from 'react';
import { SplashScreen as NativeSplashScreen } from '@capacitor/splash-screen';
import { CleanTopAppBar } from './components/CleanTopAppBar';
import { AndroidSidebar } from './components/AndroidSidebar';
import { FloatingBottomNav } from './components/FloatingBottomNav';

// Views
import { HomeView } from './components/views/HomeView';
import { DashboardView } from './components/views/DashboardView';
import { ProgramKerjaView } from './components/views/ProgramKerjaView';
import { SkuSkkView } from './components/views/SkuSkkView';
import { RuangBelajarView } from './components/views/RuangBelajarView';
import { LatihanRutinView } from './components/views/LatihanRutinView';
import { AkunView } from './components/views/AkunView';
import { DatabaseAnggotaView } from './components/views/DatabaseAnggotaView';
import { ProfilAmbalanView } from './components/views/ProfilAmbalanView';
import { SanggaView } from './components/views/SanggaView';
import { QuizPramukaView } from './components/views/QuizPramukaView';
import { ChatAmbalanView } from './components/views/ChatAmbalanView';
import { PengaturanView } from './components/views/PengaturanView';
import { AmbalanAuthModal } from './components/auth/AmbalanAuthModal';
import { UpdateChecker } from './components/UpdateChecker';
import { SplashScreen } from './components/SplashScreen';

import { ActiveMenu, ProgramKerjaItem, UserAccount } from './types';
import { 
  subscribeToProgramKerja, 
  syncUserProfile, 
  subscribeToAllMembers,
  DEFAULT_SEED_MEMBERS 
} from './services/firebaseService';
import { DEFAULT_PROGRAM_KERJA_ITEMS } from './data/defaultProgramKerja';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showPettalopoSplash, setShowPettalopoSplash] = useState(true);

  // Live All Members in Ambalan
  const [allMembers, setAllMembers] = useState<UserAccount[]>(DEFAULT_SEED_MEMBERS);

  // User Account State with Role (Admin vs Anggota)
  const [user, setUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('ambalan_user_account_v3');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      } catch {}
    }
    // Default bootstrapped admin based on user credentials
    return {
      uid: 'admin_pembina_01',
      username: 'admin',
      password: 'ambalan10035',
      email: 'amiruddin@smpialwasi-maros.sch.id',
      nama: 'Amiruddin S., S.Pd.',
      role: 'admin',
      gudep: '10-035',
      satuan: 'Putra',
      tingkat: 'Penegak Garuda',
      sangga: 'Perintis',
      jabatan: 'Pembina Gugus Depan',
      nomorKta: '10.035.1985.001',
      createdAt: '2026-07-01'
    };
  });

  // Program Kerja List State
  const [programKerjaList, setProgramKerjaList] = useState<ProgramKerjaItem[]>(() => {
    const saved = localStorage.getItem('ambalan_program_kerja');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_PROGRAM_KERJA_ITEMS;
  });

  const isAdmin = user.role === 'admin';

  // Keep the single native Android splash visible until the first React frame is mounted.
  useEffect(() => {
    NativeSplashScreen.hide().catch(() => {});
  }, []);

  // Persist and sync user
  useEffect(() => {
    localStorage.setItem('ambalan_user_account_v3', JSON.stringify(user));
    syncUserProfile(user).catch(() => {});
  }, [user]);

  // Persist program kerja locally
  useEffect(() => {
    localStorage.setItem('ambalan_program_kerja', JSON.stringify(programKerjaList));
  }, [programKerjaList]);

  // Real-time Firestore sync for Members
  useEffect(() => {
    const unsubscribe = subscribeToAllMembers((members) => {
      if (members && members.length > 0) {
        setAllMembers(members);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-time Firestore sync for Program Kerja
  useEffect(() => {
    const unsubscribe = subscribeToProgramKerja(
      (items) => {
        if (items && items.length > 0) {
          setProgramKerjaList(items);
        }
      },
      (err) => {
        console.warn('Real-time proker sync falling back to local storage:', err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Page title mapper
  const getHeaderTitle = () => {
    switch (activeMenu) {
      case 'home': return 'Beranda';
      case 'dashboard':
      case 'kegiatan_latihan':
        return 'Kegiatan dan Latihan';
      case 'profil_ambalan': return 'Profil Ambalan';
      case 'sangga': return 'Sangga Ambalan';
      case 'sku_skk': return 'SKU dan SKK Penegak';
      case 'ruang_belajar': return 'Ruang Belajar Digital';
      case 'quiz': return 'Quiz Kepramukaan';
      case 'chat': return 'Obrolan Ambalan';
      case 'pengaturan': return 'Pengaturan';
      case 'program_kerja': return 'Program Kerja Tahunan';
      case 'latihan_rutin': return 'Jadwal & Absensi Latihan';
      case 'akun': return 'Akun & Profil Anggota';
      case 'database': return 'Database Akun & Anggota';
      default: return 'Ambalan La Surullah';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Main Native App Container */}
      <div className="w-full max-w-lg mx-auto min-h-screen bg-white shadow-xl flex flex-col relative">
        
        <UpdateChecker />

        {showPettalopoSplash && <SplashScreen onFinish={() => setShowPettalopoSplash(false)} />}

        {/* Top App Bar with Role Badge */}
        <CleanTopAppBar
          title={getHeaderTitle()}
          subtitle={`Gudep ${user.gudep}`}
          userRole={user.role}
          onNavigateToAkun={() => setActiveMenu('akun')}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dynamic Main Body Scroll View */}
        <main className="flex-1 p-3.5 sm:p-4 overflow-y-auto bg-slate-50/70">
          {activeMenu === 'home' && (
            <HomeView
              user={user}
              onNavigateMenu={(m) => setActiveMenu(m)}
              programKerjaList={programKerjaList}
            />
          )}

          {(activeMenu === 'dashboard' || activeMenu === 'kegiatan_latihan') && (
            <DashboardView
              programKerjaList={programKerjaList}
              onNavigateToProgramKerja={() => setActiveMenu('program_kerja')}
            />
          )}

          {activeMenu === 'profil_ambalan' && (
            <ProfilAmbalanView />
          )}

          {activeMenu === 'sangga' && (
            <SanggaView
              currentUser={user}
              allMembers={allMembers}
            />
          )}

          {activeMenu === 'sku_skk' && (
            <SkuSkkView />
          )}

          {activeMenu === 'ruang_belajar' && (
            <RuangBelajarView isAdmin={isAdmin} />
          )}

          {activeMenu === 'quiz' && (
            <QuizPramukaView
              currentUser={user}
              onBackToHome={() => setActiveMenu('home')}
            />
          )}

          {activeMenu === 'chat' && (
            <ChatAmbalanView currentUser={user} />
          )}

          {activeMenu === 'pengaturan' && (
            <PengaturanView
              currentUser={user}
              onNavigateToAkun={() => setActiveMenu('akun')}
            />
          )}

          {activeMenu === 'program_kerja' && (
            <ProgramKerjaView
              programKerjaList={programKerjaList}
              onUpdateList={setProgramKerjaList}
              isAdmin={isAdmin}
            />
          )}

          {activeMenu === 'latihan_rutin' && (
            <LatihanRutinView
              programKerjaList={programKerjaList}
              currentUser={user}
              isAdmin={isAdmin}
              onNavigateToProgramKerja={() => setActiveMenu('program_kerja')}
            />
          )}

          {activeMenu === 'akun' && (
            <AkunView
              user={user}
              onUpdateUser={setUser}
              onNavigateToDatabase={() => setActiveMenu('database')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeMenu === 'database' && (
            <DatabaseAnggotaView
              allMembers={allMembers}
              currentUser={user}
              onSelectUserForTesting={(selectedUser) => {
                setUser(selectedUser);
              }}
            />
          )}
        </main>

        {/* Floating Bottom Navigation Bar */}
        <FloatingBottomNav
          activeMenu={activeMenu === 'kegiatan_latihan' ? 'dashboard' : activeMenu}
          onSelectMenu={(m) => setActiveMenu(m)}
        />

        {/* Sidebar Navigation Drawer */}
        <AndroidSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeMenu={activeMenu === 'kegiatan_latihan' ? 'dashboard' : activeMenu}
          onSelectMenu={(m) => setActiveMenu(m)}
          user={user}
          onUpdateUser={setUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Dedicated Ambalan Login / Register Modal */}
        <AmbalanAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={user}
          allMembers={allMembers}
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
          }}
        />

      </div>

    </div>
  );
}
