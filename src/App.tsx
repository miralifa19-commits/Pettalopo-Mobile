import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, MessageCircle, Settings, MoreVertical, Megaphone, CalendarCheck, UserRound, Users } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { NotificationsModal } from './components/NotificationsModal';

// Views
import { HomeView } from './components/views/HomeView';
import { DashboardView } from './components/views/DashboardView';
import { ProgramKerjaView } from './components/views/ProgramKerjaView';
import { DewanAmbalanView } from './components/views/DewanAmbalanView';
import { LatihanRutinView } from './components/views/LatihanRutinView';
import { AkunView } from './components/views/AkunView';
import { DatabaseAnggotaView } from './components/views/DatabaseAnggotaView';
import { AnggotaAmbalanView } from './components/views/AnggotaAmbalanView';
import { DewanAmbalanRosterView } from './components/views/DewanAmbalanRosterView';
import { SanggaView } from './components/views/SanggaView';
import { QuizPramukaView } from './components/views/QuizPramukaView';
import { ChatAmbalanView } from './components/views/ChatAmbalanView';
import { PengaturanView } from './components/views/PengaturanView';
import { LaporanView } from './components/views/LaporanView';
import { ComingSoonView } from './components/views/ComingSoonView';
import { AmbalanAuthModal } from './components/auth/AmbalanAuthModal';
import { KelolaAplikasiView } from './components/views/KelolaAplikasiView';
import { ApkUpdater } from './components/ApkUpdater';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './firebase/config';

import { ActiveMenu, ProgramKerjaItem, UserAccount } from './types';
import { get8DewanPositions, subscribeTo8DewanPositions, Dewan8Position } from './data/dewanStructure';
import { 
  subscribeToProgramKerja, 
  syncUserProfile, 
  subscribeToAllMembers,
  DEFAULT_ADMIN_ACCOUNT 
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
  const [allMembers, setAllMembers] = useState<UserAccount[]>([]);
  const [dewanPositions, setDewanPositions] = useState<Dewan8Position[]>(() => get8DewanPositions());

  // User Account State with Role (Admin vs Anggota)
  // Mode akses terbuka sementara: setiap instalasi memakai Firebase Anonymous Auth
  // agar Firestore tetap menerima request yang mensyaratkan request.auth != null.
  const [user, setUser] = useState<UserAccount>(() => ({ ...DEFAULT_ADMIN_ACCOUNT, email: '' }));

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
  // Semua instalasi sementara mendapat akses Admin dan Ruang Kerja Dewan.
  const isDewanAccount = true;

  useEffect(() => {
    if (activeMenu === 'ruang_kerja_dewan' && !isDewanAccount) setActiveMenu('home');
  }, [activeMenu, isDewanAccount]);

  // Tidak ada layar login/logout pada mode akses terbuka; tombol keluar kembali ke Home.
  const handleLogout = async () => {
    setActiveMenu('home');
    setIsQuickMenuOpen(false);
  };

  // Buat atau pulihkan sesi Firebase anonim otomatis tanpa layar Login Google.
  // Provider Anonymous harus diaktifkan di Firebase Authentication.
  useEffect(() => {
    let signingIn = false;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          ...DEFAULT_ADMIN_ACCOUNT,
          uid: firebaseUser.uid,
          email: '',
          username: 'akses_bersama',
          nama: 'Admin Pettalopo',
          role: 'admin'
        });
        return;
      }
      if (signingIn) return;
      signingIn = true;
      signInAnonymously(auth).catch((error) => {
        signingIn = false;
        console.error('Firebase Anonymous Auth gagal. Aplikasi tetap terbuka dalam mode lokal; aktifkan provider Anonymous untuk sinkronisasi Firestore:', error);
      });
    });
    return unsubscribe;
  }, []);

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



  // Persist locally and sync to Firestore when the anonymous Firebase session is ready.
  useEffect(() => {
    localStorage.setItem('ambalan_user_account_v3', JSON.stringify(user));
    if (auth.currentUser?.uid === user.uid) {
      syncUserProfile(user).catch((error) => {
        console.error('Authenticated profile sync failed:', error);
      });
    }
  }, [user]);

  // Persist program kerja locally
  useEffect(() => {
    localStorage.setItem('ambalan_program_kerja', JSON.stringify(programKerjaList));
  }, [programKerjaList]);

  useEffect(() => {
    if (!auth.currentUser) return;
    return subscribeTo8DewanPositions(setDewanPositions);
  }, [user.uid]);

  // Read the public member directory after Firebase Anonymous Auth is ready.
  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
      setAllMembers([]);
      return;
    }

    const unsubscribe = subscribeToAllMembers((members) => {
      setAllMembers(members || []);
      const latestUser = members?.find((member) => member.uid === user.uid);
      if (latestUser) {
        setUser((current) => ({
          ...current,
          role: latestUser.role || current.role,
          isDewan: latestUser.isDewan === true,
          dewanJabatan: latestUser.dewanJabatan || '',
          jabatan: latestUser.jabatan || current.jabatan
        }));
      }
    }, (error) => {
      console.error('Public member directory read failed:', error);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user.uid]);

  // Shared program data is read after Firebase Anonymous Auth is ready.
  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.uid !== user.uid) return;

    const unsubscribe = subscribeToProgramKerja(
      (items) => {
        if (items && items.length > 0) setProgramKerjaList(items);
      },
      (err) => {
        console.error('Authenticated program kerja read failed:', err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user.uid]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-800">
      {showPettalopoSplash && (
        <SplashScreen onFinish={() => setShowPettalopoSplash(false)} />
      )}
      
      {/* Main Native App Container */}
      <div className="w-full max-w-lg mx-auto min-h-screen bg-white flex flex-col relative">
        
        <ApkUpdater />

        {/* Dynamic Main Body Scroll View */}
        {activeMenu === 'home' && (
        <header className="pettalopo-topbar pettalopo-topbar-home">
          <button type="button" className="pettalopo-member-shortcut" onClick={() => setActiveMenu('akun')} aria-label="Buka profil anggota">
            <span className="pettalopo-member-avatar">
              {(user as any).fotoProfil || (user as any).fotoUrl || (user as any).foto || (user as any).photoURL || (user as any).photo || (user as any).avatarUrl
                ? <img src={(user as any).fotoProfil || (user as any).fotoUrl || (user as any).foto || (user as any).photoURL || (user as any).photo || (user as any).avatarUrl} alt="" />
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
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickMenuOpen(false);
                    setActiveMenu('kelola_aplikasi');
                  }}
                  className="font-bold text-[#e51c24]"
                >
                  <span>🛠️</span><span>Kelola Aplikasi</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('akun'); }}>
                  <UserRound size={17} /><span>Akun</span>
                </button>
              </div>
            )}
          </div>
        </header>
        )}
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
            <ComingSoonView title="Profil Ambalan" subtitle="Profil dan identitas Ambalan La Surullah Petta Lopo sedang disiapkan." icon="🏕️" onBackToDashboard={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'dewan_ambalan' && <DewanAmbalanRosterView allMembers={allMembers} onBack={() => setActiveMenu('home')} />}
          {activeMenu === 'mabigus' && <ComingSoonView title="Mabigus" subtitle="Informasi Majelis Pembimbing Gugus Depan sedang disiapkan." icon="🛡️" onBackToDashboard={() => setActiveMenu('home')} />}
          {activeMenu === 'anggota_ambalan' && <AnggotaAmbalanView allMembers={allMembers} onBack={() => setActiveMenu('home')} />}
          {activeMenu === 'ruang_kerja_dewan' && isDewanAccount && (
            <DewanAmbalanView currentUser={user} allMembers={allMembers} programKerjaList={programKerjaList} onUpdateProgramKerjaList={setProgramKerjaList} onBack={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'sangga' && (
            <SanggaView
              currentUser={user}
              allMembers={allMembers}
            />
          )}

          {activeMenu === 'sku_skk' && (
            <ComingSoonView title="Jelajahi SKU" subtitle="Fitur penjelajahan Syarat Kecakapan Umum sedang disiapkan." icon="🎖️" onBackToDashboard={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'ruang_belajar' && (
            <ComingSoonView title="Ruang Belajar" subtitle="Materi, panduan, dan pengetahuan kepramukaan sedang disiapkan." icon="📚" onBackToDashboard={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'quiz' && (
            <QuizPramukaView
              currentUser={user}
              onBackToHome={() => setActiveMenu('home')}
            />
          )}

          {activeMenu === 'chat' && (
            <ChatAmbalanView 
              currentUser={user} 
              programKerjaList={programKerjaList}
              onBack={() => setActiveMenu('home')}
            />
          )}

          {activeMenu === 'presensi' && (
            <ComingSoonView title="Presensi" subtitle="Fitur presensi Ambalan sedang disiapkan." icon="📋" onBackToDashboard={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'misi_pramuka' && (
            <ComingSoonView title="Misi Pramuka" subtitle="Tantangan bakti dan misi kepramukaan sedang disiapkan." icon="🎯" onBackToDashboard={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'games' && (
            <ComingSoonView title="Games" subtitle="Kuis dan permainan kepramukaan sedang disiapkan." icon="🎮" onBackToDashboard={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'pengumuman' && (
            <ComingSoonView title="Pengumuman" subtitle="Pusat informasi dan pengumuman Ambalan sedang disiapkan." icon="📢" onBackToDashboard={() => setActiveMenu('home')} />
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
              onLogout={handleLogout}
              onBack={() => setActiveMenu('home')}
            />
          )}

          {activeMenu === 'kelola_aplikasi' && (
            <KelolaAplikasiView
              currentUser={user}
              onBack={() => setActiveMenu('home')}
              onTriggerReLogin={() => {
                handleLogout();
              }}
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

        {activeMenu !== 'chat' && (
          <nav className={`pettalopo-bottom-nav ${isDewanAccount ? 'pettalopo-bottom-nav-dewan' : 'pettalopo-bottom-nav-four'}`} aria-label="Navigasi utama">
            <button type="button" onClick={() => setActiveMenu('home')} aria-current={activeMenu === 'home' ? 'page' : undefined}><Home size={19}/><span>Home</span></button>
            <button type="button" onClick={() => setActiveMenu('presensi')} aria-current={activeMenu === 'presensi' ? 'page' : undefined}><CalendarCheck size={19}/><span>Presensi</span></button>
            {isDewanAccount && (
              <button type="button" className="pettalopo-nav-dewan" onClick={() => setActiveMenu('ruang_kerja_dewan')} aria-current={activeMenu === 'ruang_kerja_dewan' ? 'page' : undefined}>
                <Users size={19} />
                <span>Ruang Kerja<br />Dewan Ambalan</span>
              </button>
            )}
            <button type="button" onClick={() => setActiveMenu('chat')}><MessageCircle size={19}/><span>Ruang Ambalan</span></button>
            <button type="button" onClick={() => setActiveMenu('pengumuman')} aria-current={activeMenu === 'pengumuman' ? 'page' : undefined}><Megaphone size={19}/><span>Pengumuman</span></button>
          </nav>
        )}

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
