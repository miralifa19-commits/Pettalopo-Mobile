import React, { useState, useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Home, MessageCircle, Settings, MoreVertical, Megaphone, CalendarCheck, UserRound, Users, Bell, Bookmark, CalendarDays, BookOpen, LifeBuoy, Info, Share2, Wrench } from 'lucide-react';
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
import { GoogleAuthPortal } from './components/auth/GoogleAuthPortal';
import { KelolaAplikasiView } from './components/views/KelolaAplikasiView';
import { ApkUpdater } from './components/ApkUpdater';
import { signOut as webSignOut } from 'firebase/auth';
import { auth } from './firebase/config';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import { ActiveMenu, ProgramKerjaItem, UserAccount } from './types';
import { get8DewanPositions, isUserInDewan, subscribeTo8DewanPositions, Dewan8Position } from './data/dewanStructure';
import { 
  subscribeToProgramKerja, 
  syncUserProfile, 
  subscribeToAllMembers,
  DEFAULT_SEED_MEMBERS,
  DEFAULT_ADMIN_ACCOUNT 
} from './services/firebaseService';
import { DEFAULT_PROGRAM_KERJA_ITEMS } from './data/defaultProgramKerja';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('home');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGooglePortalOpen, setIsGooglePortalOpen] = useState(true);
  const [showPettalopoSplash, setShowPettalopoSplash] = useState(true);

  // Live All Members in Ambalan
  const [allMembers, setAllMembers] = useState<UserAccount[]>(DEFAULT_SEED_MEMBERS);
  const [dewanPositions, setDewanPositions] = useState<Dewan8Position[]>(() => get8DewanPositions());

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
  const isMainAdmin = user.role === 'admin' && (
    user.email?.toLowerCase() === 'miralifa19@gmail.com' ||
    auth.currentUser?.email?.toLowerCase() === 'miralifa19@gmail.com'
  );
  const isDewanAccount = isUserInDewan(user, dewanPositions);

  const handleShareApp = async () => {
    const shareUrl = 'https://github.com/miralifa19-commits/Pettalopo-Mobile/releases/latest';
    const shareData = {
      title: 'Pettalopo Mobile',
      text: 'Unduh dan gunakan aplikasi resmi Ambalan La Surullah Petta Lopo.',
      url: shareUrl
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        window.alert('Tautan Pettalopo Mobile berhasil disalin.');
      } else {
        window.prompt('Salin tautan Pettalopo Mobile:', shareUrl);
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        console.warn('Bagikan aplikasi gagal:', error);
      }
    }
  };

  useEffect(() => {
    if (activeMenu === 'ruang_kerja_dewan' && !isDewanAccount) setActiveMenu('home');
  }, [activeMenu, isDewanAccount]);

  // Logout akun: keluar dari Firebase native & web, hapus penyimpanan lokal, dan kembali ke halaman login
  const handleLogout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await FirebaseAuthentication.signOut();
        } catch (e) {
          console.warn('Capacitor Firebase signOut error:', e);
        }
      }
      await webSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    localStorage.removeItem('ambalan_user_account_v3');
    setUser(DEFAULT_ADMIN_ACCOUNT);
    setActiveMenu('home');
    setIsGooglePortalOpen(true);
  };

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



  // Hanya akun Firebase yang benar-benar terautentikasi yang boleh disimpan dan disinkronkan.
  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
      localStorage.removeItem('ambalan_user_account_v3');
      return;
    }
    localStorage.setItem('ambalan_user_account_v3', JSON.stringify(user));
    syncUserProfile(user).catch(() => {});
  }, [user]);

  // Persist program kerja locally
  useEffect(() => {
    localStorage.setItem('ambalan_program_kerja', JSON.stringify(programKerjaList));
  }, [programKerjaList]);

  useEffect(() => {
    if (!auth.currentUser) return;
    return subscribeTo8DewanPositions(setDewanPositions);
  }, [isGooglePortalOpen, user.uid]);

  // Real-time Firestore sync for Members and current user's appointed Dewan status
  useEffect(() => {
    const unsubscribe = subscribeToAllMembers((members) => {
      if (members && members.length > 0) {
        setAllMembers(members);
        if (user.uid) {
          const latestUser = members.find((member) => member.uid === user.uid);
          if (latestUser) {
            if (
              (latestUser.blacklisted === true || latestUser.accountStatus === 'reset') &&
              user.email?.toLowerCase() !== 'miralifa19@gmail.com'
            ) {
              void handleLogout();
              return;
            }
            setUser((current) => {
              if (
                current.role === latestUser.role &&
                Boolean(current.isDewan) === Boolean(latestUser.isDewan) &&
                current.dewanJabatan === latestUser.dewanJabatan
              ) return current;
              return {
                ...current,
                role: latestUser.role,
                isDewan: latestUser.isDewan === true,
                dewanJabatan: latestUser.dewanJabatan || '',
                jabatan: latestUser.jabatan || current.jabatan
              };
            });
          }
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user.uid]);

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
              <div className="pettalopo-overflow-menu max-h-[72vh] overflow-y-auto">
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setIsNotificationsOpen(true); }}>
                  <Bell size={17} /><span>Notifikasi</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('tersimpan'); }}>
                  <Bookmark size={17} /><span>Tersimpan</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('dashboard'); }}>
                  <CalendarDays size={17} /><span>Kalender Ambalan</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('panduan_aplikasi'); }}>
                  <BookOpen size={17} /><span>Panduan Aplikasi</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('pusat_bantuan'); }}>
                  <LifeBuoy size={17} /><span>Pusat Bantuan</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('tentang_ambalan'); }}>
                  <Info size={17} /><span>Tentang Ambalan</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); void handleShareApp(); }}>
                  <Share2 size={17} /><span>Bagikan Aplikasi</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('pengaturan'); }}>
                  <Settings size={17} /><span>Pengaturan</span>
                </button>
                <button type="button" onClick={() => { setIsQuickMenuOpen(false); setActiveMenu('akun'); }}>
                  <UserRound size={17} /><span>Akun Saya</span>
                </button>
                {isMainAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickMenuOpen(false);
                      setActiveMenu('kelola_aplikasi');
                    }}
                    className="font-bold text-[#e51c24] border-t border-slate-100"
                  >
                    <Wrench size={17} /><span>Kelola Aplikasi</span>
                  </button>
                )}
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

          {activeMenu === 'tersimpan' && (
            <ComingSoonView title="Tersimpan" subtitle="Kegiatan, materi, dan informasi yang disimpan akan ditampilkan di sini." icon="🔖" onBackToDashboard={() => setActiveMenu('home')} />
          )}
          {activeMenu === 'panduan_aplikasi' && (
            <ComingSoonView title="Panduan Aplikasi" subtitle="Panduan penggunaan Pettalopo Mobile sedang disiapkan." icon="📘" onBackToDashboard={() => setActiveMenu('home')} />
          )}
          {activeMenu === 'pusat_bantuan' && (
            <ComingSoonView title="Pusat Bantuan" subtitle="Informasi bantuan dan dukungan pengguna sedang disiapkan." icon="🛟" onBackToDashboard={() => setActiveMenu('home')} />
          )}
          {activeMenu === 'tentang_ambalan' && (
            <ComingSoonView title="Tentang Ambalan" subtitle="Profil dan sejarah Ambalan La Surullah Petta Lopo." icon="⚜️" onBackToDashboard={() => setActiveMenu('home')} />
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

        <GoogleAuthPortal
          open={isGooglePortalOpen && !showPettalopoSplash}
          onComplete={(googleUser) => {
            setUser(googleUser);
            setIsGooglePortalOpen(false);
          }}
          onLogout={() => {
            setIsGooglePortalOpen(true);
            setShowPettalopoSplash(true);
          }}
        />

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
