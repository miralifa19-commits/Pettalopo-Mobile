import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, MessageCircle, Settings, MoreVertical, Megaphone, CalendarCheck, UserRound, Users, RefreshCw } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { NotificationsModal } from './components/NotificationsModal';

// Views
import { HomeView } from './components/views/HomeView';
import { ProfilAmbalanView } from './components/views/ProfilAmbalanView';
import { DashboardView } from './components/views/DashboardView';
import { ProgramKerjaView } from './components/views/ProgramKerjaView';
import { DewanAmbalanView } from './components/views/DewanAmbalanView';
import { LatihanRutinView } from './components/views/LatihanRutinView';
import { AkunView, getScoutMemberStatus } from './components/views/AkunView';
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
import { onAuthStateChanged, signOut as webSignOut } from 'firebase/auth';
import { auth } from './firebase/config';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthPortal } from './components/auth/GoogleAuthPortal';

import { ActiveMenu, ProgramKerjaItem, UserAccount } from './types';
import { get8DewanPositions, subscribeTo8DewanPositions, Dewan8Position, isUserInDewan } from './data/dewanStructure';
import { 
  subscribeToProgramKerja, 
  syncUserProfile, 
  subscribeToAllMembers,
  DEFAULT_ADMIN_ACCOUNT 
} from './services/firebaseService';
import { DEFAULT_PROGRAM_KERJA_ITEMS } from './data/defaultProgramKerja';

export default function App() {
  // Pertahankan tampilan akhir aplikasi saat dibuka kembali
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(() => {
    try {
      const saved = localStorage.getItem('pettalopo_last_active_menu');
      if (saved) return saved as ActiveMenu;
    } catch {}
    return 'home';
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);
  const [selectedDashboardMonthIndex, setSelectedDashboardMonthIndex] = useState<number | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountEditable, setIsAccountEditable] = useState(false);
  // Splash React singkat; portal login tetap dibuka setelah splash selesai.
  const [showPettalopoSplash, setShowPettalopoSplash] = useState(true);

  // Simpan tampilan aktif terakhir setiap berpindah menu
  useEffect(() => {
    if (activeMenu) {
      try {
        localStorage.setItem('pettalopo_last_active_menu', activeMenu);
      } catch {}
    }
  }, [activeMenu]);

  // Live All Members in Ambalan
  const [allMembers, setAllMembers] = useState<UserAccount[]>([]);
  const [dewanPositions, setDewanPositions] = useState<Dewan8Position[]>(() => get8DewanPositions());

  // User Account State: Pertahankan login yang berhasil dari localStorage
  const [user, setUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('ambalan_user_account_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.uid) return parsed;
      }
    } catch {}
    return { ...DEFAULT_ADMIN_ACCOUNT, uid: '', email: '', nama: 'Anggota Ambalan', role: 'anggota' };
  });

  // Pertahankan login: jangan buka modal login jika user sudah login / memiliki sesi
  // Wajib validasi sesi Firebase; data akun lokal hanya cache, bukan bukti login.
  const [isGooglePortalOpen, setIsGooglePortalOpen] = useState(true);
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const pullStartY = useRef<number | null>(null);
  const pullStartedAt = useRef<number>(0);
  const pullDistance = useRef<number>(0);
  const pullHoldTimer = useRef<number | null>(null);
  const [isPullReady, setIsPullReady] = useState(false);

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

  const isAdmin = user.role === 'admin' || user.email?.toLowerCase() === 'miralifa19@gmail.com' || auth.currentUser?.email?.toLowerCase() === 'miralifa19@gmail.com';
  const profilePhoto = user.foto || (user as any).fotoUrl || (user as any).photoURL || (user as any).photo || (user as any).avatarUrl || auth.currentUser?.photoURL || '';
  const isGoogleSignedIn = !isGooglePortalOpen && !!auth.currentUser && !auth.currentUser.isAnonymous;
  const profileName = user.nama && !['Anggota Ambalan', 'Tamu Ambalan'].includes(user.nama)
    ? user.nama
    : auth.currentUser?.displayName || user.nama || 'Anggota Ambalan';
  const profileRole = isAdmin ? 'Pembina / Admin' : user.role === 'dewan'
    ? user.dewanJabatan || 'Dewan Ambalan'
    : user.jabatan && user.jabatan !== 'Pembina Gugus Depan' ? user.jabatan : 'Anggota Ambalan';

  useEffect(() => {
    setProfilePhotoFailed(false);
  }, [profilePhoto]);

  const isDewanAccount = isAdmin || user.role === 'dewan' || user.isDewan === true || isUserInDewan(user, dewanPositions);

  useEffect(() => {
    if (activeMenu === 'ruang_kerja_dewan' && !isDewanAccount) setActiveMenu('home');
    if (activeMenu === 'kelola_aplikasi' && !isAdmin) setActiveMenu('home');
  }, [activeMenu, isDewanAccount, isAdmin]);

  // Logout: keluar dari sesi Firebase dan kembali langsung ke halaman login
  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await FirebaseAuthentication.signOut();
        } catch {}
      }
      await webSignOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    localStorage.removeItem('ambalan_user_account_v3');
    setUser({ ...DEFAULT_ADMIN_ACCOUNT, uid: '', email: '', nama: 'Tamu Ambalan', role: 'anggota' });
    setIsGooglePortalOpen(true);
    setActiveMenu('home');
    setIsQuickMenuOpen(false);
  };

  // Pantau sesi autentikasi Firebase; pertahankan login yang telah berhasil
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const hasGoogleProvider = !!firebaseUser
        && !firebaseUser.isAnonymous
        && firebaseUser.providerData?.some((provider) => provider.providerId === 'google.com');

      if (hasGoogleProvider) {
        // GoogleAuthPortal harus menyelesaikan pemeriksaan profil Firestore sebelum ditutup.
        console.info('[AUTH_FLOW] App: sesi Google terdeteksi; menunggu pemeriksaan profil.');
      } else {
        // Sesi anonim/cache lokal bukan login; wajib melalui Google Sign-In AI Studio.
        console.info('[AUTH_FLOW] App: sesi Google tidak tersedia; portal login dibuka.');
        setIsGooglePortalOpen(true);
      }
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
  }, [user.uid, refreshSequence]);

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
  }, [user.uid, refreshSequence]);

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
  }, [user.uid, refreshSequence]);

  const handlePullStart = (event: React.TouchEvent<HTMLElement>) => {
    if (mainScrollRef.current?.scrollTop !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, button, a')) return;
    pullStartY.current = event.touches[0]?.clientY ?? null;
    pullStartedAt.current = Date.now();
    pullDistance.current = 0;
    setIsPullReady(false);
    if (pullHoldTimer.current !== null) window.clearTimeout(pullHoldTimer.current);
    pullHoldTimer.current = window.setTimeout(() => {
      if (pullDistance.current >= 72 && mainScrollRef.current?.scrollTop === 0) {
        setIsPullReady(true);
      }
    }, 3000);
  };

  const handlePullMove = (event: React.TouchEvent<HTMLElement>) => {
    if (pullStartY.current === null) return;
    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined) return;
    pullDistance.current = Math.max(0, currentY - pullStartY.current);
    if (pullDistance.current >= 72 && Date.now() - pullStartedAt.current >= 3000) {
      setIsPullReady(true);
    }
  };

  const handlePullEnd = (event: React.TouchEvent<HTMLElement>) => {
    const startY = pullStartY.current;
    const endY = event.changedTouches[0]?.clientY;
    const shouldRefresh = isPullReady && startY !== null && endY !== undefined
      && endY - startY >= 72 && mainScrollRef.current?.scrollTop === 0;
    pullStartY.current = null;
    pullDistance.current = 0;
    if (pullHoldTimer.current !== null) window.clearTimeout(pullHoldTimer.current);
    pullHoldTimer.current = null;
    setIsPullReady(false);
    if (!shouldRefresh) return;
    setIsRefreshing(true);
    setRefreshSequence((current) => current + 1);
    window.setTimeout(() => setIsRefreshing(false), 650);
  };

  return (
    <div className="h-[100dvh] min-h-0 overflow-hidden overscroll-y-none bg-white flex flex-col font-sans antialiased text-slate-800">
      {showPettalopoSplash && (
        <SplashScreen onFinish={() => setShowPettalopoSplash(false)} />
      )}
      
      {/* Main Native App Container */}
      <div className="w-full max-w-[480px] mx-auto h-full min-h-0 overflow-hidden bg-white flex flex-col relative">
        
        <ApkUpdater />

        {/* Dynamic Main Body Scroll View */}
        {activeMenu === 'home' && (
        <header className="pettalopo-topbar pettalopo-topbar-home">
          <button type="button" className="pettalopo-member-shortcut" onClick={() => { setIsAccountEditable(false); setActiveMenu('akun'); }} aria-label={isGoogleSignedIn ? "Buka Profil Saya" : "Masuk ke akun"}>
            <span className="pettalopo-member-avatar">
              {isGoogleSignedIn && profilePhoto && !profilePhotoFailed
                ? <img src={profilePhoto} alt="" referrerPolicy="no-referrer" onError={() => setProfilePhotoFailed(true)} />
                : <span aria-hidden="true">{isGoogleSignedIn ? profileName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'M'}</span>}
            </span>
            <span className="pettalopo-member-meta">
              <strong>{isGoogleSignedIn ? profileName : 'Masuk'}</strong>
              {isGoogleSignedIn && <small>{profileRole}</small>}
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
                {(user.email?.toLowerCase() === 'miralifa19@gmail.com' || auth.currentUser?.email?.toLowerCase() === 'miralifa19@gmail.com') && (
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
                )}
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setIsAccountEditable(true); setActiveMenu('akun'); }}>
                  <UserRound size={17} /><span>Akun</span>
                </button>
              </div>
            )}
          </div>
        </header>
        )}
        <main ref={mainScrollRef} onTouchStart={handlePullStart} onTouchMove={handlePullMove} onTouchEnd={handlePullEnd} style={{ minHeight: 0, height: 0, flex: '1 1 0%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', touchAction: 'pan-y' }} className="min-h-0 p-3.5 sm:p-4 pt-3 bg-white pb-28">
          {isPullReady && !isRefreshing && (
            <div className="flex items-center justify-center gap-2 py-2 text-[11px] font-semibold text-slate-500" role="status" aria-live="polite">
              <RefreshCw size={15} className="text-[#e51c24]" />
              Lepaskan untuk memperbarui
            </div>
          )}
          {isRefreshing && (
            <div className="flex items-center justify-center gap-2 py-2 text-[11px] font-semibold text-slate-500" role="status" aria-live="polite">
              <RefreshCw size={15} className="animate-spin text-[#e51c24]" />
              Memperbarui data...
            </div>
          )}
          {activeMenu === 'home' && (
            <HomeView
              user={user}
              onNavigateMenu={(m) => setActiveMenu(m)}
              onOpenMonthDetails={(monthIndex) => {
                setSelectedDashboardMonthIndex(monthIndex);
                setSelectedAgendaId(null);
                setActiveMenu('dashboard');
              }}
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
              initialSelectedMonthIndex={selectedDashboardMonthIndex}
              onAgendaDetailOpened={() => setSelectedAgendaId(null)}
            />
          )}

          {activeMenu === 'profil_ambalan' && (
            <ProfilAmbalanView isAdmin={isAdmin} allMembers={allMembers} onBack={() => setActiveMenu('home')} />
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
              onNavigateToAkun={() => { setIsAccountEditable(false); setActiveMenu('akun'); }}
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
              editable={isAccountEditable}
              onUpdateUser={(updated) => setUser(updated)}
              onLogout={handleLogout}
              onBack={() => { setIsAccountEditable(false); setActiveMenu('home'); }}
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

        {/* Portal Login Google & Pendaftaran Profil Anggota Baru */}
        <GoogleAuthPortal
          open={isGooglePortalOpen && !showPettalopoSplash}
          onComplete={(loggedInUser) => {
            setUser(loggedInUser);
            setIsGooglePortalOpen(false);
          }}
          onLogout={handleLogout}
        />

      </div>

    </div>
  );
}
