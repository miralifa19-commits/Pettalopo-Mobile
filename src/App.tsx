import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, MessageCircle, Settings, MoreVertical, Megaphone, ClipboardList, UserRound } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { NotificationsModal } from './components/NotificationsModal';

// Views
import { HomeView } from './components/views/HomeView';
import { DashboardView } from './components/views/DashboardView';
import { ProgramKerjaView } from './components/views/ProgramKerjaView';
import { DewanAmbalanView } from './components/views/DewanAmbalanView';
import { SkuSkkView } from './components/views/SkuSkkView';
import { RuangBelajarView } from './components/views/RuangBelajarView';
import { LatihanRutinView } from './components/views/LatihanRutinView';
import { AkunView } from './components/views/AkunView';
import { DatabaseAnggotaView } from './components/views/DatabaseAnggotaView';
import { ProfilAmbalanView } from './components/views/ProfilAmbalanView';
import { MabigusView } from './components/views/MabigusView';
import { AnggotaAmbalanView } from './components/views/AnggotaAmbalanView';
import { DewanAmbalanRosterView } from './components/views/DewanAmbalanRosterView';
import { SanggaView } from './components/views/SanggaView';
import { QuizPramukaView } from './components/views/QuizPramukaView';
import { ChatAmbalanView } from './components/views/ChatAmbalanView';
import { PengaturanView } from './components/views/PengaturanView';
import { LaporanView } from './components/views/LaporanView';
import { ComingSoonView } from './components/views/ComingSoonView';
import { AmbalanAuthModal } from './components/auth/AmbalanAuthModal';
import { UpdateChecker } from './components/UpdateChecker';

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);
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

  // Android hardware/system back button: close overlays first, then return to Home.
  // Pressing Back again while already on Home exits the native application.
  useEffect(() => {
    let cancelled = false;
    let listener: { remove: () => Promise<void> } | undefined;

    CapacitorApp.addListener('backButton', () => {
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        return;
      }
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        return;
      }
      if (isQuickMenuOpen) {
        setIsQuickMenuOpen(false);
        return;
      }
      if (activeMenu !== 'home') {
        setActiveMenu('home');
        setSelectedAgendaId(null);
        return;
      }
      void CapacitorApp.exitApp();
    }).then((handle) => {
      if (cancelled) {
        void handle.remove();
      } else {
        listener = handle;
      }
    }).catch((error) => {
      console.warn('Android back button listener could not be registered:', error);
    });

    return () => {
      cancelled = true;
      if (listener) void listener.remove();
    };
  }, [activeMenu, isAuthModalOpen, isNotificationsOpen, isQuickMenuOpen]);



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

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-800">
      {showPettalopoSplash && (
        <SplashScreen onFinish={() => setShowPettalopoSplash(false)} />
      )}
      
      {/* Main Native App Container */}
      <div className="w-full max-w-lg mx-auto min-h-screen bg-white flex flex-col relative">
        
        <UpdateChecker />

        {/* Dynamic Main Body Scroll View */}
        <header className="pettalopo-topbar">
          <button type="button" className="pettalopo-member-shortcut" onClick={() => setActiveMenu('akun')} aria-label="Buka profil anggota">
            <span className="pettalopo-member-avatar">
              {(user as any).fotoProfil || (user as any).photoURL || (user as any).photo || (user as any).avatarUrl
                ? <img src={(user as any).fotoProfil || (user as any).photoURL || (user as any).photo || (user as any).avatarUrl} alt="" />
                : <span>{(user.nama || 'A').trim().charAt(0).toUpperCase()}</span>}
            </span>
            <span className="pettalopo-member-meta">
              <strong>{user.nama || 'Profil Anggota'}</strong>
              <small>{user.role === 'admin' ? 'Pembina / Admin' : /laksana/i.test(user.tingkat || '') ? 'Penegak Laksana' : /bantara/i.test(user.tingkat || '') ? 'Penegak Bantara' : 'Calon Anggota'}</small>
            </span>
          </button>
          <div className="pettalopo-overflow-wrap">
            <button type="button" className="pettalopo-menu-button" onClick={() => setIsQuickMenuOpen((open) => !open)} aria-label="Buka menu lainnya" aria-expanded={isQuickMenuOpen}>
              <MoreVertical size={21} />
            </button>
            {isQuickMenuOpen && (
              <div className="pettalopo-overflow-menu">
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('pengaturan'); }}>
                  <Settings size={17} /><span>Pengaturan</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('akun'); }}>
                  <UserRound size={17} /><span>Akun</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-3.5 sm:p-4 pt-3 overflow-y-auto bg-white pb-28">
          {activeMenu === 'home' && (
            <HomeView
              user={user}
              onNavigateMenu={(m) => setActiveMenu(m)}
              onOpenAgenda={(id) => {
                setSelectedAgendaId(id);
                setActiveMenu('dashboard');
              }}
              programKerjaList={programKerjaList}
            />
          )}

          {(activeMenu === 'dashboard' || activeMenu === 'kegiatan_latihan') && (
            <DashboardView
              programKerjaList={programKerjaList}
              onNavigateToProgramKerja={() => setActiveMenu('program_kerja')}
              initialSelectedAgendaId={selectedAgendaId}
              onAgendaDetailOpened={() => setSelectedAgendaId(null)}
            />
          )}

          {activeMenu === 'profil_ambalan' && (
            <ProfilAmbalanView allMembers={allMembers} onBack={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'dewan_ambalan' && <DewanAmbalanRosterView allMembers={allMembers} onBack={() => setActiveMenu('home')} />}
          {activeMenu === 'mabigus' && <MabigusView allMembers={allMembers} onBack={() => setActiveMenu('home')} />}
          {activeMenu === 'anggota_ambalan' && <AnggotaAmbalanView allMembers={allMembers} onBack={() => setActiveMenu('home')} />}
          {activeMenu === 'ruang_kerja_dewan' && (
            <DewanAmbalanView currentUser={user} allMembers={allMembers} programKerjaList={programKerjaList} onUpdateProgramKerjaList={setProgramKerjaList} onBack={() => setActiveMenu('home')} />
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
            <RuangBelajarView isAdmin={isAdmin} onOpenQuiz={() => setActiveMenu('quiz')} />
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

          {activeMenu === 'laporan' && (
            <LaporanView
              programKerjaList={programKerjaList}
              currentUser={user}
              allMembers={allMembers}
              onBack={() => setActiveMenu('home')}
            />
          )}

          {activeMenu === 'organisasi' && (
            <ComingSoonView
              title="Organisasi Ambalan"
              subtitle="Informasi organisasi dan tata kelola Ambalan La Surullah Petta Lopo."
              icon="🏕️"
              onBackToDashboard={() => setActiveMenu('home')}
            />
          )}
        </main>

        <nav className="pettalopo-bottom-nav" aria-label="Navigasi utama">
          <button type="button" onClick={() => setActiveMenu('home')} aria-current={activeMenu === 'home' ? 'page' : undefined}><Home size={19}/><span>Home</span></button>
          <button type="button" onClick={() => setActiveMenu('program_kerja')} aria-current={activeMenu === 'program_kerja' ? 'page' : undefined}><ClipboardList size={19}/><span>Program Kerja</span></button>
          <button type="button" className="pettalopo-nav-dewan" onClick={() => setActiveMenu('ruang_kerja_dewan')} aria-current={activeMenu === 'ruang_kerja_dewan' ? 'page' : undefined}>
            <img src="/assets/dewan-gear-logo.png" alt="Dewan" className="dewan-nav-gear" />
            <span>Dewan</span>
          </button>
          <button type="button" onClick={() => setActiveMenu('chat')} aria-current={activeMenu === 'chat' ? 'page' : undefined}><MessageCircle size={19}/><span>Chat</span></button>
          <button type="button" onClick={() => setIsNotificationsOpen(true)}><Megaphone size={19}/><span>Pengumuman</span></button>
        </nav>

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={[]}
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
