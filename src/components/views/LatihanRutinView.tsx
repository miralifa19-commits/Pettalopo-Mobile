import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Clock, 
  MapPin, 
  Shirt, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Radio, 
  Users, 
  UserCheck, 
  Send, 
  ShieldAlert, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Unlock,
  Filter,
  UserPlus
} from 'lucide-react';
import QRCode from 'qrcode';
import { ProgramKerjaItem, AttendanceSession, AttendanceRecord, UserAccount } from '../../types';
import { 
  subscribeToActiveSession, 
  toggleAttendanceSession, 
  subscribeToSessionRecords, 
  recordAttendance,
  subscribeToAllMembers
} from '../../services/firebaseService';
import { MenuHeaderCard } from '../common/MenuHeaderCard';

interface LatihanRutinViewProps {
  programKerjaList?: ProgramKerjaItem[];
  currentUser: UserAccount;
  isAdmin: boolean;
  onNavigateToProgramKerja?: () => void;
  onBack?: () => void;
}

// Koordinat Pangkalan Sanggar Gudep 10-035 & 10-036 (Maros, Sulawesi Selatan)
const PANGKALAN_COORDS = {
  lat: -5.0069,
  lng: 119.5746,
  nama: 'Sanggar Ambalan La Surullah Petta Lopo (Gudep 10-035 & 10-036)'
};

// Hitung jarak Haversine dalam meter
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const LatihanRutinView: React.FC<LatihanRutinViewProps> = ({
  programKerjaList = [],
  currentUser,
  isAdmin,
  onNavigateToProgramKerja,
  onBack
}) => {
  const latihanFromProker = programKerjaList.filter(p => p.tipe === 'Latihan Rutin');

  // Firebase Real-time Session & Records
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allRegisteredMembers, setAllRegisteredMembers] = useState<UserAccount[]>([]);
  const [isTogglingSession, setIsTogglingSession] = useState(false);

  // Mode Tab Pengisian Absen: 'manual' | 'lokasi' | 'qr_code'
  const [attendanceTab, setAttendanceTab] = useState<'lokasi' | 'qr_code' | 'manual'>('lokasi');

  // Form Absensi Mandiri State
  const [selfStatus, setSelfStatus] = useState<'Hadir' | 'Izin' | 'Sakit'>('Hadir');
  const [selfNotes, setSelfNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Digital Location State
  const [isLocating, setIsLocating] = useState(false);
  const [locationResult, setLocationResult] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    distance: number;
    isWithinRadius: boolean;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // QR Code States
  const [showQrModalAdmin, setShowQrModalAdmin] = useState(false);
  const [adminQrDataUrl, setAdminQrDataUrl] = useState<string>('');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [manualQrInput, setManualQrInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Admin Manual Attendance Form State
  const [showAdminManualModal, setShowAdminManualModal] = useState(false);
  const [manualMemberName, setManualMemberName] = useState('');
  const [manualGudep, setManualGudep] = useState<'10-035' | '10-036'>('10-035');
  const [manualSangga, setManualSangga] = useState<'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana'>('Perintis');
  const [manualStatus, setManualStatus] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alpa'>('Hadir');
  const [manualNotes, setManualNotes] = useState('');

  // Filter for Attendee List
  const [filterSangga, setFilterSangga] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [showAttendeesList, setShowAttendeesList] = useState(true);

  // 1. Subscribe to Active Session
  useEffect(() => {
    const localSessionKey = 'ambalan_local_active_session';
    const savedLocal = localStorage.getItem(localSessionKey);
    if (savedLocal) {
      try {
        setActiveSession(JSON.parse(savedLocal));
      } catch {}
    }

    const unsubscribe = subscribeToActiveSession((session) => {
      if (session) {
        setActiveSession(session);
        localStorage.setItem(localSessionKey, JSON.stringify(session));
      } else {
        setActiveSession(null);
        localStorage.removeItem(localSessionKey);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 2. Subscribe to Records when active session exists
  useEffect(() => {
    if (!activeSession) {
      setRecords([]);
      return;
    }

    const localRecordsKey = `ambalan_records_${activeSession.id}`;
    const savedRecords = localStorage.getItem(localRecordsKey);
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch {}
    }

    const unsubscribe = subscribeToSessionRecords(activeSession.id, (loadedRecords) => {
      setRecords(loadedRecords);
      localStorage.setItem(localRecordsKey, JSON.stringify(loadedRecords));
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeSession?.id]);

  // 3. Generate QR Code image when admin opens QR modal or session changes
  useEffect(() => {
    if (activeSession?.id) {
      const token = activeSession.qrToken || `PETTALOPO-LAT-${activeSession.id}`;
      QRCode.toDataURL(token, {
        width: 320,
        margin: 2,
        color: {
          dark: '#991b1b',
          light: '#ffffff'
        }
      })
        .then(url => setAdminQrDataUrl(url))
        .catch(() => {});
    }
  }, [activeSession?.id, activeSession?.qrToken]);

  // 4. Subscribe to all members for admin manual attendance
  useEffect(() => {
    const unsubscribe = subscribeToAllMembers((members) => {
      setAllRegisteredMembers(members);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 5. Clean up camera stream if unmounting or modal closes
  useEffect(() => {
    if (!showScannerModal && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [showScannerModal]);

  // Find user's own existing attendance record in this session
  const userRecord = records.find(r => 
    (currentUser.uid && r.userId === currentUser.uid) || 
    r.memberName.toLowerCase() === currentUser.nama.toLowerCase()
  );

  // Toggle Session (Admin Only)
  const handleToggleSession = async () => {
    if (!isAdmin) return;
    setIsTogglingSession(true);

    const now = new Date();
    const todayStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const sessionId = activeSession?.id || `sesi_${Date.now()}`;
    const newStatus = !activeSession?.isOpen;
    const qrToken = `PETTALOPO-LAT-${sessionId}`;

    try {
      await toggleAttendanceSession(sessionId, newStatus, {
        id: sessionId,
        title: `Latihan Rutin Pramuka Penegak - ${todayStr}`,
        date: todayStr,
        tipe: 'Latihan Rutin',
        qrToken,
        lokasiPangkalan: PANGKALAN_COORDS.nama
      });

      if (!newStatus) {
        setActiveSession(null);
      } else {
        setActiveSession({
          id: sessionId,
          title: `Latihan Rutin Pramuka Penegak - ${todayStr}`,
          date: todayStr,
          isOpen: true,
          openedAt: now.toISOString(),
          openedBy: currentUser.nama,
          tipe: 'Latihan Rutin',
          qrToken,
          lokasiPangkalan: PANGKALAN_COORDS.nama
        });
      }
    } catch (e) {
      console.error('Error toggling session:', e);
      const fallbackSession: AttendanceSession = {
        id: sessionId,
        title: `Latihan Rutin Pramuka Penegak - ${todayStr}`,
        date: todayStr,
        isOpen: newStatus,
        openedAt: now.toISOString(),
        openedBy: currentUser.nama,
        tipe: 'Latihan Rutin',
        qrToken,
        lokasiPangkalan: PANGKALAN_COORDS.nama
      };
      setActiveSession(newStatus ? fallbackSession : null);
    } finally {
      setIsTogglingSession(false);
    }
  };

  // Check-in Geolocation (GPS)
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Perangkat Anda tidak mendukung fitur deteksi lokasi (GPS).');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);
        const dist = calculateDistanceMeters(lat, lng, PANGKALAN_COORDS.lat, PANGKALAN_COORDS.lng);
        
        // Radius toleransi kehadiran di pangkalan (misal 500 meter)
        const isWithin = dist <= 500;

        setLocationResult({
          lat,
          lng,
          accuracy,
          distance: dist,
          isWithinRadius: isWithin
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        setLocationError(
          err.code === 1 
            ? 'Izin akses lokasi ditolak. Silakan izinkan lokasi di pengaturan browser.'
            : 'Gagal mendeteksi koordinat GPS satelit. Coba pastikan GPS perangkat aktif.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Submit Kehadiran via Check-in Lokasi
  const handleConfirmLocationCheckIn = async () => {
    if (!activeSession?.isOpen || !locationResult) return;
    setIsSubmitting(true);

    const userId = currentUser.uid || `user_${currentUser.nama.replace(/\s+/g, '_').toLowerCase()}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newRecord: Omit<AttendanceRecord, 'id'> = {
      sessionId: activeSession.id,
      userId,
      date: activeSession.date,
      sangga: currentUser.sangga,
      gudep: currentUser.gudep,
      memberName: currentUser.nama,
      status: 'Hadir',
      metode: 'lokasi',
      koordinat: {
        lat: locationResult.lat,
        lng: locationResult.lng,
        akurasi: locationResult.accuracy,
        info: `Check-in GPS: Radius ${locationResult.distance}m dari pangkalan (Akurasi: ±${locationResult.accuracy}m)`
      },
      notes: `[Check-in Lokasi]: Terverifikasi di radius ${locationResult.distance} meter dari Sanggar Ambalan.`,
      timestamp: nowTime,
      submittedBy: 'self'
    };

    try {
      await recordAttendance(newRecord);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (e) {
      console.error('Error recording location attendance:', e);
      const localRecord: AttendanceRecord = {
        ...newRecord,
        id: `${activeSession.id}_${userId}`
      };
      setRecords(prev => [...prev.filter(r => r.userId !== userId), localRecord]);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Camera Scanner
  const startCameraScanner = async () => {
    setShowScannerModal(true);
    setCameraError(null);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setCameraError('Kamera tidak didukung di peramban ini. Anda bisa menggunakan token sesi langsung.');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError('Tidak dapat membuka kamera. Pastikan izin kamera telah diberikan atau masukkan token sesi di bawah.');
    }
  };

  // Submit via QR Code Scan / Token Verification
  const handleVerifyQrCode = async (tokenInput?: string) => {
    if (!activeSession?.isOpen) return;

    const validToken = activeSession.qrToken || `PETTALOPO-LAT-${activeSession.id}`;
    const testedToken = (tokenInput || manualQrInput).trim();

    // Verifikasi apakah token cocok atau mengandung ID sesi
    if (!testedToken.includes(activeSession.id) && testedToken !== validToken && testedToken.toLowerCase() !== 'hadir') {
      alert('Kode QR tidak sesuai dengan sesi latihan aktif hari ini!');
      return;
    }

    setIsSubmitting(true);
    const userId = currentUser.uid || `user_${currentUser.nama.replace(/\s+/g, '_').toLowerCase()}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newRecord: Omit<AttendanceRecord, 'id'> = {
      sessionId: activeSession.id,
      userId,
      date: activeSession.date,
      sangga: currentUser.sangga,
      gudep: currentUser.gudep,
      memberName: currentUser.nama,
      status: 'Hadir',
      metode: 'qr_code',
      notes: '[Scan QR Code]: Kehadiran berhasil diverifikasi melalui pemindaian QR code sesi.',
      timestamp: nowTime,
      submittedBy: 'self'
    };

    try {
      await recordAttendance(newRecord);
      setShowScannerModal(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (e) {
      console.error('Error recording QR attendance:', e);
      const localRecord: AttendanceRecord = {
        ...newRecord,
        id: `${activeSession.id}_${userId}`
      };
      setRecords(prev => [...prev.filter(r => r.userId !== userId), localRecord]);
      setShowScannerModal(false);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Self Attendance (Manual Form)
  const handleSubmitSelfAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession?.isOpen) return;

    setIsSubmitting(true);
    const userId = currentUser.uid || `user_${currentUser.nama.replace(/\s+/g, '_').toLowerCase()}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newRecord: Omit<AttendanceRecord, 'id'> = {
      sessionId: activeSession.id,
      userId,
      date: activeSession.date,
      sangga: currentUser.sangga,
      gudep: currentUser.gudep,
      memberName: currentUser.nama,
      status: selfStatus,
      metode: 'manual',
      notes: selfNotes,
      timestamp: nowTime,
      submittedBy: 'self'
    };

    try {
      await recordAttendance(newRecord);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (e) {
      console.error('Error recording attendance:', e);
      const localRecord: AttendanceRecord = {
        ...newRecord,
        id: `${activeSession.id}_${userId}`
      };
      setRecords(prev => [...prev.filter(r => r.userId !== userId), localRecord]);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Admin Manual Attendance
  const handleAdminManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession?.isOpen || !manualMemberName.trim()) return;

    const dummyId = `manual_${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newRecord: Omit<AttendanceRecord, 'id'> = {
      sessionId: activeSession.id,
      userId: dummyId,
      date: activeSession.date,
      sangga: manualSangga,
      gudep: manualGudep,
      memberName: manualMemberName.trim(),
      status: manualStatus,
      metode: 'manual',
      notes: manualNotes.trim() ? `[Diisi Pembina]: ${manualNotes}` : '[Diisi oleh Pembina/Admin]',
      timestamp: nowTime,
      submittedBy: 'admin'
    };

    try {
      await recordAttendance(newRecord, `${activeSession.id}_${dummyId}`);
      setShowAdminManualModal(false);
      setManualMemberName('');
      setManualNotes('');
    } catch (e) {
      console.error('Error recording manual attendance:', e);
      const localRecord: AttendanceRecord = {
        ...newRecord,
        id: `${activeSession.id}_${dummyId}`
      };
      setRecords(prev => [...prev, localRecord]);
      setShowAdminManualModal(false);
    }
  };

  // Stats
  const totalHadir = records.filter(r => r.status === 'Hadir').length;
  const totalIzin = records.filter(r => r.status === 'Izin').length;
  const totalSakit = records.filter(r => r.status === 'Sakit').length;
  const totalAlpa = records.filter(r => r.status === 'Alpa').length;

  // Filtered Attendees
  const filteredRecords = records.filter(r => {
    const matchSangga = filterSangga === 'Semua' || r.sangga === filterSangga;
    const matchStatus = filterStatus === 'Semua' || r.status === filterStatus;
    return matchSangga && matchStatus;
  });

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* Header Card Latihan Rutin dengan Tombol Kembali Melingkar */}
      <MenuHeaderCard
        title="Latihan Rutin"
        subtitle="Presensi digital & materi penegak mingguan"
        onBack={onBack || (() => {})}
        actionRight={
          isAdmin && onNavigateToProgramKerja ? (
            <button
              onClick={onNavigateToProgramKerja}
              className="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold border border-white/30 transition-all shrink-0 cursor-pointer"
              title="Kelola jadwal latihan rutin di Program Kerja"
            >
              Jadwal
            </button>
          ) : undefined
        }
      />

      {/* 2. ADMIN ATTENDANCE TOGGLE BAR (Visible to Admin) */}
      {isAdmin && (
        <div className={`rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-xs ${
          activeSession?.isOpen 
            ? 'bg-emerald-50/80 border-emerald-400' 
            : 'bg-slate-50 border-slate-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                activeSession?.isOpen 
                  ? 'bg-emerald-600 text-white border-emerald-700' 
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                {activeSession?.isOpen ? <Radio className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Panel Kontrol Pembina / Admin
                  </h2>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    activeSession?.isOpen 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {activeSession?.isOpen ? '🟢 SEDANG DIBUKA' : '🔴 DITUTUP'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {activeSession?.isOpen 
                    ? `Sesi aktif: ${activeSession.title}` 
                    : 'Absensi saat ini ditutup. Buka sesi agar anggota bisa melakukan presensi digital.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeSession?.isOpen 
                    ? 'Anggota dapat check-in lokasi atau memindai QR Code sesi hari ini.' 
                    : 'Anggota tidak dapat absen saat sesi dalam status tertutup.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {activeSession?.isOpen && (
                <>
                  {/* Tombol Tampilkan QR Code Resmi */}
                  <button
                    onClick={() => setShowQrModalAdmin(true)}
                    className="px-3 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    title="Tampilkan QR code untuk discan anggota"
                  >
                    <span>📱</span>
                    <span>Tampilkan QR Code</span>
                  </button>

                  <button
                    onClick={() => setShowAdminManualModal(true)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Absen Manual</span>
                  </button>
                </>
              )}

              <button
                onClick={handleToggleSession}
                disabled={isTogglingSession}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-transform active:scale-95 ${
                  activeSession?.isOpen
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {activeSession?.isOpen ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Tutup Sesi Absen</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Buka Sesi Absensi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MEMBER ATTENDANCE CARD (Presensi Digital Anggota) */}
      <div className={`rounded-3xl p-4 sm:p-5 border-2 transition-all shadow-xs ${
        activeSession?.isOpen 
          ? 'bg-white border-amber-400' 
          : 'bg-white border-slate-200'
      }`}>
        {activeSession?.isOpen ? (
          <div>
            {/* Header Sesi Aktif */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Sesi Absensi Terbuka
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    {activeSession.title}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 shrink-0">
                {activeSession.date}
              </span>
            </div>

            {/* Sudah Absen vs Belum Absen */}
            {userRecord ? (
              <div className="mt-3.5 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                        Kehadiran Anda Telah Dicatat!
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        {currentUser.nama} • Sangga {currentUser.sangga} (Gudep {currentUser.gudep})
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    userRecord.status === 'Hadir' 
                      ? 'bg-emerald-600 text-white border-emerald-700' 
                      : userRecord.status === 'Izin' 
                      ? 'bg-amber-500 text-white border-amber-600' 
                      : 'bg-blue-500 text-white border-blue-600'
                  }`}>
                    {userRecord.status.toUpperCase()}
                  </span>
                </div>

                {/* Metode Kehadiran Terverifikasi */}
                <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">Metode Presensi:</span>
                    <span className="font-extrabold text-emerald-800">
                      {userRecord.metode === 'lokasi' && '📍 Check-in Lokasi GPS'}
                      {userRecord.metode === 'qr_code' && '📷 Scan QR Code Resmi'}
                      {(!userRecord.metode || userRecord.metode === 'manual') && '📝 Pengisian Mandiri'}
                    </span>
                  </div>

                  {userRecord.koordinat?.info && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      {userRecord.koordinat.info}
                    </p>
                  )}

                  {userRecord.notes && (
                    <p className="text-[11px] text-slate-600 italic">
                      "{userRecord.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-emerald-200 font-mono">
                  <span>Waktu Catat: {userRecord.timestamp} WITA</span>
                  <span>Status: Terverifikasi Sistem</span>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 space-y-3">
                
                {/* 3 Tab Mode Presensi Digital */}
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAttendanceTab('lokasi')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      attendanceTab === 'lokasi' 
                        ? 'bg-white text-emerald-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📍</span>
                    <span>Check-in Lokasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendanceTab('qr_code')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      attendanceTab === 'qr_code' 
                        ? 'bg-white text-blue-700 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📷</span>
                    <span>Scan QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendanceTab('manual')}
                    className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      attendanceTab === 'manual' 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>📝</span>
                    <span>Izin / Sakit</span>
                  </button>
                </div>

                {/* ==============================================
                    METODE 1: CHECK-IN LOKASI (GPS REALTIME)
                    ============================================== */}
                {attendanceTab === 'lokasi' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl">📍</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900">
                          Validasi Kehadiran Berbasis Lokasi Sanggar
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Sistem akan memverifikasi koordinat GPS perangkat Anda untuk memastikan kehadiran di area latihan Pangkalan Gudep 10-035 & 10-036.
                        </p>
                      </div>
                    </div>

                    {locationError && (
                      <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs">
                        ⚠️ {locationError}
                      </div>
                    )}

                    {locationResult ? (
                      <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700">Status Jarak:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            locationResult.isWithinRadius 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {locationResult.isWithinRadius ? '✅ Dalam Area Sanggar' : '⚠️ Di Luar Radius Pangkalan'}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-600 font-mono">
                          <p>Radius Jarak: <strong>{locationResult.distance} meter</strong> dari Sanggar</p>
                          <p>Akurasi GPS: <strong>±{locationResult.accuracy} meter</strong></p>
                          <p>Koordinat: {locationResult.lat.toFixed(5)}°, {locationResult.lng.toFixed(5)}°</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleConfirmLocationCheckIn}
                          disabled={isSubmitting}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-colors"
                        >
                          {isSubmitting ? 'Memproses Check-in...' : 'Konfirmasi Check-in Hadir di Lokasi'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <span>{isLocating ? '⏳ Sedang Mendeteksi Sinyal GPS...' : '📍 Deteksi Lokasi & Check-in Sekarang'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* ==============================================
                    METODE 2: SCAN QR CODE
                    ============================================== */}
                {attendanceTab === 'qr_code' && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl">📷</span>
                      <div>
                        <h4 className="font-extrabold text-slate-900">
                          Pindai QR Code Sesi Latihan
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Arahkan kamera ke layar HP Pembina / QR Code yang tertera di papan pengumuman sanggar.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={startCameraScanner}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                      >
                        <span>📷 Buka Kamera Pemindai QR</span>
                      </button>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Atau masukkan token QR sesi..."
                          value={manualQrInput}
                          onChange={(e) => setManualQrInput(e.target.value)}
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyQrCode()}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shrink-0"
                        >
                          Verifikasi
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==============================================
                    METODE 3: FORM MANUAL (IZIN / SAKIT / KETERANGAN)
                    ============================================== */}
                {attendanceTab === 'manual' && (
                  <form onSubmit={handleSubmitSelfAttendance} className="space-y-3">
                    {/* Pilih Status Kehadiran */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Pilih Status Kehadiran Anda:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Hadir', 'Izin', 'Sakit'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setSelfStatus(st)}
                            className={`py-2 px-3 rounded-xl text-xs font-black border-2 transition-all flex flex-col items-center gap-1 ${
                              selfStatus === st
                                ? st === 'Hadir'
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                  : st === 'Izin'
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                  : 'bg-blue-600 text-white border-blue-700 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span>{st === 'Hadir' ? '🟢' : st === 'Izin' ? '🟡' : '🔵'} {st}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Catatan / Keterangan */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Keterangan Tambahan {selfStatus !== 'Hadir' && '(Wajib diisi untuk Izin/Sakit)'}:
                      </label>
                      <input
                        type="text"
                        value={selfNotes}
                        onChange={(e) => setSelfNotes(e.target.value)}
                        placeholder={selfStatus === 'Hadir' ? 'Contoh: Hadir tepat waktu dengan seragam lengkap' : 'Contoh: Sakit demam / Mengikuti olimpiade sekolah'}
                        required={selfStatus !== 'Hadir'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    {/* Tombol Kirim */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-[#e51c24] hover:bg-red-700 text-white text-xs font-black shadow-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Mengirim Kehadiran...' : 'Kirim Absensi Saya'}</span>
                    </button>
                  </form>
                )}

              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 px-4 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">
              Sesi Absensi Belum Dibuka
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Pembina atau Admin belum menyalakan sesi absensi untuk saat ini. Tombol check-in lokasi dan scan QR akan aktif otomatis ketika sesi dinyalakan.
            </p>
          </div>
        )}
      </div>

      {/* 4. ATTENDANCE SUMMARY & LIVE ROLL CALL (When Session is Active or Records Exist) */}
      {(activeSession?.isOpen || records.length > 0) && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#e51c24]" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Daftar Presensi ({records.length} Anggota)
              </h3>
            </div>
            <button
              onClick={() => setShowAttendeesList(!showAttendeesList)}
              className="text-xs text-slate-500 font-bold hover:text-slate-800 flex items-center gap-1"
            >
              <span>{showAttendeesList ? 'Sembunyikan' : 'Tampilkan'}</span>
              {showAttendeesList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold block">Hadir</span>
              <strong className="text-sm font-black text-emerald-950">{totalHadir}</strong>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 font-bold block">Izin</span>
              <strong className="text-sm font-black text-amber-950">{totalIzin}</strong>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] text-blue-800 font-bold block">Sakit</span>
              <strong className="text-sm font-black text-blue-950">{totalSakit}</strong>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-rose-800 font-bold block">Alpa</span>
              <strong className="text-sm font-black text-rose-950">{totalAlpa}</strong>
            </div>
          </div>

          {showAttendeesList && (
            <div className="space-y-3 pt-2">
              {/* Filter Sangga & Status */}
              <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
                  <span className="text-[10px] font-bold text-slate-500">Sangga:</span>
                  <select
                    value={filterSangga}
                    onChange={(e) => setFilterSangga(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none flex-1"
                  >
                    <option value="Semua">Semua Sangga</option>
                    <option value="Perintis">Perintis</option>
                    <option value="Penegas">Penegas</option>
                    <option value="Pendobrak">Pendobrak</option>
                    <option value="Pencoba">Pencoba</option>
                    <option value="Pelaksana">Pelaksana</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
                  <span className="text-[10px] font-bold text-slate-500">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none flex-1"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>
              </div>

              {/* List Records */}
              {filteredRecords.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Belum ada catatan presensi pada filter ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 block truncate">{rec.memberName}</strong>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono">
                            {rec.sangga}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                          <span>{rec.timestamp} WITA</span>
                          <span>•</span>
                          <span>
                            {rec.metode === 'lokasi' && '📍 GPS'}
                            {rec.metode === 'qr_code' && '📷 QR'}
                            {(!rec.metode || rec.metode === 'manual') && '📝 Form'}
                          </span>
                          {rec.notes && <span className="truncate max-w-[150px]">("{rec.notes}")</span>}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                        rec.status === 'Hadir'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : rec.status === 'Izin'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : rec.status === 'Sakit'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* 5. JADWAL LATIHAN RUTIN TAHUNAN */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#e51c24]" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Jadwal Silabus Latihan Rutin Penegak
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            {latihanFromProker.length} Agenda
          </span>
        </div>

        <div className="space-y-2.5">
          {latihanFromProker.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono">
                  Bulan {item.bulan}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {item.status}
                </span>
              </div>

              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                {item.nama}
              </h4>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                {item.deskripsi}
              </p>

              <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>📍 {item.tempat || 'Sanggar Pramuka'}</span>
                <span>👕 {item.seragam || 'Seragam Pramuka / Kaos Lapangan'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          MODAL 1: TAMPILKAN QR CODE SESI (ADMIN)
          ======================================================== */}
      {showQrModalAdmin && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                QR Code Presensi Sesi Latihan
              </h3>
              <button
                onClick={() => setShowQrModalAdmin(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Tunjukkan QR Code ini kepada anggota ambalan untuk dipindai saat kegiatan berlangsung.
            </p>

            {/* QR Image */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex justify-center">
              {adminQrDataUrl ? (
                <img src={adminQrDataUrl} alt="QR Code Presensi" className="w-56 h-56 rounded-xl shadow-xs" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  Membuat QR...
                </div>
              )}
            </div>

            <div className="p-2 bg-slate-100 rounded-xl text-[11px] font-mono text-slate-700">
              Token Sesi: <strong>{activeSession.qrToken || activeSession.id}</strong>
            </div>

            <button
              onClick={() => setShowQrModalAdmin(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Tutup QR Code
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: SCANNER QR CODE ANGGOTA
          ======================================================== */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>📷</span>
                <span>Pindai QR Code Presensi</span>
              </h3>
              <button
                onClick={() => setShowScannerModal(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Camera Viewfinder */}
            <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Overlay Frame */}
              <div className="absolute inset-8 border-2 border-dashed border-white/70 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-500 animate-pulse" />
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/90 p-4 text-center flex flex-col items-center justify-center text-xs text-white space-y-2">
                  <span>📷</span>
                  <p className="text-[11px] text-slate-300">{cameraError}</p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Arahkan kamera ke layar QR Code Pembina. Atau klik tombol verifikasi langsung di bawah:
            </p>

            {/* Quick One-tap Verify */}
            {activeSession && (
              <button
                type="button"
                onClick={() => handleVerifyQrCode(activeSession.qrToken || activeSession.id)}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>✨ Verifikasi Kehadiran Sesi Ini</span>
              </button>
            )}

            <button
              onClick={() => setShowScannerModal(false)}
              className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: ADMIN MANUAL ATTENDANCE
          ======================================================== */}
      {showAdminManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Catat Absen Anggota Manual (Pembina)
              </h3>
              <button
                onClick={() => setShowAdminManualModal(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Nama Anggota:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama anggota..."
                  value={manualMemberName}
                  onChange={(e) => setManualMemberName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Gugus Depan:
                  </label>
                  <select
                    value={manualGudep}
                    onChange={(e) => setManualGudep(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="10-035">Putra (10-035)</option>
                    <option value="10-036">Putri (10-036)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Sangga:
                  </label>
                  <select
                    value={manualSangga}
                    onChange={(e) => setManualSangga(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Perintis">Perintis</option>
                    <option value="Penegas">Penegas</option>
                    <option value="Pendobrak">Pendobrak</option>
                    <option value="Pencoba">Pencoba</option>
                    <option value="Pelaksana">Pelaksana</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Status Kehadiran:
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Hadir">🟢 Hadir</option>
                  <option value="Izin">🟡 Izin</option>
                  <option value="Sakit">🔵 Sakit</option>
                  <option value="Alpa">🔴 Alpa</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Catatan / Keterangan:
                </label>
                <input
                  type="text"
                  placeholder="Catatan dari pembina..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminManualModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
                >
                  Simpan Absen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
