import React, { useState, useEffect } from 'react';
import { CalendarDays, Award, Home, MessageCircle, Settings, Bell, MoreVertical, Cog } from 'lucide-react';
import { LOGO_IMAGE_PATH } from './data/scoutData';
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
          <button type="button" className="pettalopo-topbar-brand" onClick={() => setActiveMenu('profil_ambalan')} aria-label="Buka profil Ambalan La Surullah Petta Lopo">
            <img src={LOGO_IMAGE_PATH} alt="Logo kecil Ambalan Petta Lopo" />
            <span className="pettalopo-topbar-title">
              <strong>Ambalan Petta Lopo</strong>
              <small>Gudep 10-035 &amp; 10-036</small>
            </span>
          </button>
          <div className="pettalopo-topbar-motto" aria-label="Bergerak, Berkarya, Mengabdi">
            <span>Bergerak&nbsp; • &nbsp;Berkarya&nbsp; • &nbsp;Mengabdi</span>
          </div>
          <div className="pettalopo-quick-menu-wrap">
            <button type="button" className="pettalopo-menu-button" onClick={() => setIsQuickMenuOpen((open) => !open)} aria-label="Menu lainnya" aria-expanded={isQuickMenuOpen}>
              <MoreVertical size={22} />
            </button>
            {isQuickMenuOpen && (
              <div className="pettalopo-quick-menu">
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('pengaturan'); }}><Settings size={16} /><span>Pengaturan</span></button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('akun'); }}><span className="quick-menu-user">●</span><span>Akun</span></button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setIsNotificationsOpen(true); }}><Bell size={16} /><span>Notifikasi</span></button>
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
          <button type="button" onClick={() => setActiveMenu('home')} aria-current={activeMenu === 'home' ? 'page' : undefined}><Home size={19}/><span>Beranda</span></button>
          <button type="button" onClick={() => setActiveMenu('dashboard')} aria-current={activeMenu === 'dashboard' || activeMenu === 'kegiatan_latihan' ? 'page' : undefined}><CalendarDays size={19}/><span>Agenda</span></button>
          <button type="button" onClick={() => setActiveMenu('sku_skk')} aria-current={activeMenu === 'sku_skk' ? 'page' : undefined}><Award size={19}/><span>SKU</span></button>
          <button type="button" onClick={() => setActiveMenu('ruang_kerja_dewan')} aria-current={activeMenu === 'ruang_kerja_dewan' ? 'page' : undefined}><Cog size={19}/><span>Dewan</span></button>
          <button type="button" onClick={() => setActiveMenu('chat')} aria-current={activeMenu === 'chat' ? 'page' : undefined}><MessageCircle size={19}/><span>Obrolan</span></button>
          <button type="button" onClick={() => setActiveMenu('pengaturan')} aria-current={activeMenu === 'pengaturan' ? 'page' : undefined}><Settings size={19}/><span>Setelan</span></button>
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
