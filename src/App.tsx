import React, { useState, useEffect, useRef } from 'react';
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
import { ApkUpdater } from './components/ApkUpdater';

import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase/config';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { DisabledAccountScreen } from './components/auth/DisabledAccountScreen';
import { OnboardingTour } from './components/auth/OnboardingTour';
import { AdminMenuView } from './components/views/AdminMenuView';
import { UserProfile } from './types/auth';
import { fetchUserProfile, isPrimaryAdminEmail, signOutAmbalan } from './services/authService';

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
  const [authChecked, setAuthChecked] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const pullStartY = useRef<number | null>(null);

  // Pantau status login Firebase Auth secara realtime
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (authUser) => {
      setFirebaseUser(authUser);
      if (authUser) {
        try {
          const profile = await fetchUserProfile(authUser.uid);
          if (profile) {
            if (isPrimaryAdminEmail(authUser.email) && profile.peran !== 'admin') {
              profile.peran = 'admin';
            }
            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
        } catch (err) {
          console.warn('Gagal membaca profil pengguna:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setAuthChecked(true);
    });

    return () => unsub();
  }, []);

  // Sinkronisasi profil ke objek user ambalan lokal
  useEffect(() => {
    if (userProfile) {
      setUser((prev) => ({
        ...prev,
        uid: userProfile.uid,
        nama: userProfile.namaLengkap,
        role: userProfile.peran,
        email: userProfile.email,
        foto: userProfile.fotoUrl,
        jabatan: userProfile.peran === 'admin'
          ? 'Pembina / Admin'
          : userProfile.peran === 'dewan'
          ? 'Dewan Ambalan'
          : userProfile.status === 'purna_ambalan'
          ? 'Purna Ambalan'
          : 'Anggota Ambalan',
      }));
    }
  }, [userProfile]);

  const handleLogout = async () => {
    if (window.confirm('Apakah Kakak yakin ingin keluar dari akun?')) {
      await signOutAmbalan();
      setFirebaseUser(null);
      setUserProfile(null);
      setActiveMenu('home');
    }
  };

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



  // Persist and sync user lokal
  useEffect(() => {
    localStorage.setItem('ambalan_user_account_v3', JSON.stringify(user));
    if (firebaseUser && userProfile && user.uid === firebaseUser.uid && user.uid !== 'admin_pembina_01') {
      syncUserProfile(user).catch(() => {});
    }
  }, [user, firebaseUser, userProfile]);

  // Persist program kerja locally
  useEffect(() => {
    localStorage.setItem('ambalan_program_kerja', JSON.stringify(programKerjaList));
  }, [programKerjaList]);

  // Real-time Firestore sync for Members (hanya untuk Admin terverifikasi)
  useEffect(() => {
    if (!firebaseUser || !userProfile || userProfile.peran !== 'admin') {
      return;
    }

    const unsubscribe = subscribeToAllMembers((members) => {
      if (members && members.length > 0) {
        setAllMembers(members);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser, userProfile]);

  // Real-time Firestore sync for Program Kerja (hanya setelah akun masuk & terdaftar)
  useEffect(() => {
    if (!firebaseUser || !userProfile || userProfile.nonaktif || !userProfile.onboardingSelesai) {
      return;
    }

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
  }, [firebaseUser, userProfile]);

  if (showPettalopoSplash) {
    return <SplashScreen onFinish={() => setShowPettalopoSplash(false)} />;
  }

  // 1. Setelah flash screen selesai, periksa status login (jangan tampilkan beranda atau menu apa pun sebelum selesai)
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 shadow-xs mb-3 flex items-center justify-center">
          <img src="/assets/pettalopo-logo.png" alt="Logo" className="w-12 h-12 object-contain" />
        </div>
        <div className="w-6 h-6 border-2 border-[#e51c24] border-t-transparent rounded-full animate-spin my-2" />
        <p className="text-xs font-bold text-slate-600 mt-1">Memeriksa status akun...</p>
      </div>
    );
  }

  // 2. Belum login: tampilkan HALAMAN LOGIN (hanya tombol Masuk dengan Google)
  if (!firebaseUser) {
    return (
      <LoginScreen
        onSuccess={() => {}}
      />
    );
  }

  // 3. Sudah login tapi profil belum ada: tampilkan LAYAR PENDAFTARAN
  if (!userProfile) {
    return (
      <RegisterScreen
        firebaseUser={firebaseUser}
        onProfileCreated={(createdProfile) => {
          setUserProfile(createdProfile);
        }}
        onSignOut={() => {
          setFirebaseUser(null);
          setUserProfile(null);
        }}
      />
    );
  }

  // 4. Akun dinonaktifkan
  if (userProfile.nonaktif) {
    return (
      <DisabledAccountScreen
        onSignOut={() => {
          setFirebaseUser(null);
          setUserProfile(null);
        }}
      />
    );
  }

  // 5. Onboarding belum selesai: tampilkan Tur Panduan SATU KALI
  if (!userProfile.onboardingSelesai) {
    return (
      <OnboardingTour
        userProfile={userProfile}
        onFinish={() => {
          setUserProfile((prev) => (prev ? { ...prev, onboardingSelesai: true } : null));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans antialiased text-slate-800">
      {/* Main Native App Container */}
      <div className="w-full max-w-lg mx-auto min-h-screen bg-white flex flex-col relative">
        
        <ApkUpdater />

        {/* Dynamic Main Body Scroll View */}
        {activeMenu === 'home' && (
        <header className="pettalopo-topbar pettalopo-topbar-home">
          <button type="button" className="pettalopo-member-shortcut" onClick={() => setActiveMenu('akun')} aria-label="Buka profil anggota">
            <span className="pettalopo-member-avatar">
              {userProfile.fotoUrl || (user as any).fotoProfil || (user as any).photoURL || (user as any).photo || (user as any).avatarUrl
                ? <img src={userProfile.fotoUrl || (user as any).fotoProfil || (user as any).photoURL || (user as any).photo || (user as any).avatarUrl} alt="" />
                : <span>{(user.nama || 'A').trim().charAt(0).toUpperCase()}</span>}
            </span>
            <span className="pettalopo-member-meta">
              <strong>{user.nama || 'Profil Anggota'}</strong>
              <small>
                {userProfile.peran === 'admin'
                  ? 'Pembina / Admin'
                  : userProfile.peran === 'dewan'
                  ? 'Dewan Ambalan'
                  : userProfile.status === 'purna_ambalan'
                  ? 'Purna Ambalan'
                  : 'Anggota Ambalan'}
              </small>
            </span>
          </button>

          <div className="flex items-center gap-2">
            {userProfile.peran === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveMenu('admin_menu')}
                className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-black border border-white/30 shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                title="Buka Menu Admin"
              >
                <span>🛡️</span>
                <span>Admin</span>
              </button>
            )}

            <div className="pettalopo-overflow-wrap">
              <button type="button" className="pettalopo-menu-button" onClick={() => setIsQuickMenuOpen((open) => !open)} aria-label="Buka menu lainnya" aria-expanded={isQuickMenuOpen}>
                <MoreVertical size={21} />
              </button>
              {isQuickMenuOpen && (
                <div className="pettalopo-overflow-menu">
                  {userProfile.peran === 'admin' && (
                    <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('admin_menu'); }}>
                      <span className="text-sm">🛡️</span><strong>Menu Admin</strong>
                    </button>
                  )}
                  <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('pengaturan'); }}>
                    <Settings size={17} /><span>Pengaturan</span>
                  </button>
                  <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('akun'); }}>
                    <UserRound size={17} /><span>Akun</span>
                  </button>
                  <button type="button" onClick={() => { setIsQuickMenuOpen(false); handleLogout(); }} className="text-red-600">
                    <span className="text-sm">🚪</span><span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        )}
        <main
          className="flex-1 p-3.5 sm:p-4 pt-3 overflow-y-auto bg-white pb-28"
          onTouchStart={(event) => {
            pullStartY.current = event.currentTarget.scrollTop <= 0
              ? (event.touches[0]?.clientY ?? null)
              : null;
          }}
          onTouchEnd={(event) => {
            const startY = pullStartY.current;
            pullStartY.current = null;
            const endY = event.changedTouches[0]?.clientY;
            if (startY !== null && endY !== undefined &&
                endY - startY > 100 && event.currentTarget.scrollTop <= 0) {
              window.location.reload();
            }
          }}
        >
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

          {activeMenu === 'admin_menu' && (
            <AdminMenuView onBack={() => setActiveMenu('home')} />
          )}

          {activeMenu === 'akun' && (
            <AkunView
              user={user}
              onUpdateUser={setUser}
              onNavigateToDatabase={() => setActiveMenu('database')}
              onLogout={handleLogout}
              onBack={() => setActiveMenu('home')}
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
          <nav className="pettalopo-bottom-nav" aria-label="Navigasi utama">
            <button type="button" onClick={() => setActiveMenu('home')} aria-current={activeMenu === 'home' ? 'page' : undefined}><Home size={19}/><span>Home</span></button>
            {userProfile?.status === 'purna_ambalan' ? (
              <button type="button" onClick={() => setActiveMenu('dashboard')} aria-current={activeMenu === 'dashboard' ? 'page' : undefined}><CalendarCheck size={19}/><span>Agenda</span></button>
            ) : (
              <button type="button" onClick={() => setActiveMenu('presensi')} aria-current={activeMenu === 'presensi' ? 'page' : undefined}><CalendarCheck size={19}/><span>Presensi</span></button>
            )}
            {userProfile?.status !== 'purna_ambalan' && (
              <button
                type="button"
                className="pettalopo-nav-dewan"
                onClick={() => {
                  if (userProfile?.peran === 'dewan' || userProfile?.peran === 'admin') {
                    setActiveMenu('ruang_kerja_dewan');
                  } else {
                    setActiveMenu('dewan_ambalan');
                  }
                }}
                aria-current={(activeMenu === 'ruang_kerja_dewan' || activeMenu === 'dewan_ambalan') ? 'page' : undefined}
              >
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
