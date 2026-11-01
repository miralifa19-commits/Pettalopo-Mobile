import React, { useState, useEffect } from 'react';
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
import { ProgramKerjaItem, AttendanceSession, AttendanceRecord, UserAccount } from '../../types';
import { 
  subscribeToActiveSession, 
  toggleAttendanceSession, 
  subscribeToSessionRecords, 
  recordAttendance,
  subscribeToAllMembers
} from '../../services/firebaseService';

interface LatihanRutinViewProps {
  programKerjaList?: ProgramKerjaItem[];
  currentUser: UserAccount;
  isAdmin: boolean;
  onNavigateToProgramKerja?: () => void;
}

export const LatihanRutinView: React.FC<LatihanRutinViewProps> = ({
  programKerjaList = [],
  currentUser,
  isAdmin,
  onNavigateToProgramKerja
}) => {
  const latihanFromProker = programKerjaList.filter(p => p.tipe === 'Latihan Rutin');

  // Firebase Real-time Session & Records
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allRegisteredMembers, setAllRegisteredMembers] = useState<UserAccount[]>([]);
  const [isTogglingSession, setIsTogglingSession] = useState(false);

  // Self Attendance Submission Form State
  const [selfStatus, setSelfStatus] = useState<'Hadir' | 'Izin' | 'Sakit'>('Hadir');
  const [selfNotes, setSelfNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    // Default fallback local storage check
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

    // Local storage fallback for records
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

  // 3. Subscribe to all members for admin manual attendance
  useEffect(() => {
    const unsubscribe = subscribeToAllMembers((members) => {
      setAllRegisteredMembers(members);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

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

    try {
      await toggleAttendanceSession(sessionId, newStatus, {
        id: sessionId,
        title: `Latihan Rutin Pramuka Penegak - ${todayStr}`,
        date: todayStr,
        tipe: 'Latihan Rutin'
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
          tipe: 'Latihan Rutin'
        });
      }
    } catch (e) {
      console.error('Error toggling session:', e);
      // Fallback local toggle
      const fallbackSession: AttendanceSession = {
        id: sessionId,
        title: `Latihan Rutin Pramuka Penegak - ${todayStr}`,
        date: todayStr,
        isOpen: newStatus,
        openedAt: now.toISOString(),
        openedBy: currentUser.nama,
        tipe: 'Latihan Rutin'
      };
      setActiveSession(newStatus ? fallbackSession : null);
    } finally {
      setIsTogglingSession(false);
    }
  };

  // Submit Self Attendance (Anggota)
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
      // Fallback local storage
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
    <div className="space-y-4 pb-24">
      
      {/* 1. Header with Active Role Badge */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Absensi & Jadwal Latihan
            </span>
            {isAdmin ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-300 flex items-center gap-1">
                👑 Admin Pembina
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                ⚜️ Anggota Ambalan
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1">
            Latihan Rutin & Presensi Real-Time
          </h1>
          <p className="text-xs text-slate-500">
            Sistem absensi mandiri dan presensi dewan ambalan terintegrasi
          </p>
        </div>

        {isAdmin && onNavigateToProgramKerja && (
          <button
            onClick={onNavigateToProgramKerja}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs shrink-0"
            title="Kelola jadwal latihan rutin di Program Kerja"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Jadwal</span>
          </button>
        )}
      </div>

      {/* 2. ADMIN ATTENDANCE TOGGLE BAR (Visible to Admin) */}
      {isAdmin && (
        <div className={`rounded-2xl p-4 border-2 transition-all shadow-sm ${
          activeSession?.isOpen 
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400' 
            : 'bg-slate-50 border-slate-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                activeSession?.isOpen 
                  ? 'bg-emerald-500 text-white border-emerald-600 animate-pulse' 
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                {activeSession?.isOpen ? <Radio className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
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
                    : 'Absensi saat ini ditutup. Nyalakan agar anggota bisa absen mandiri.'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeSession?.isOpen 
                    ? 'Semua anggota yang membuka aplikasi dapat langsung mengisi kehadiran.' 
                    : 'Anggota tidak dapat mengirim absen saat sesi dalam status ditutup.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeSession?.isOpen && (
                <button
                  onClick={() => setShowAdminManualModal(true)}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Isi Absen Manual</span>
                </button>
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
                    <span>Nyalakan Absensi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MEMBER ATTENDANCE CARD (Absensi Mandiri) */}
      <div className={`rounded-2xl p-4 border-2 transition-all shadow-sm ${
        activeSession?.isOpen 
          ? 'bg-gradient-to-br from-amber-50 via-white to-red-50 border-amber-400' 
          : 'bg-white border-slate-200'
      }`}>
        {activeSession?.isOpen ? (
          <div>
            {/* Header Sesi Aktif */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Sesi Absensi Terbuka
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    {activeSession.title}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                {activeSession.date}
              </span>
            </div>

            {/* Sudah Absen vs Belum Absen */}
            {userRecord ? (
              <div className="mt-3.5 p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">
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

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-emerald-200 font-mono">
                  <span>Waktu Absen: {userRecord.timestamp} WITA</span>
                  {userRecord.notes && (
                    <span className="text-slate-700 italic max-w-xs truncate">
                      "{userRecord.notes}"
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitSelfAttendance} className="mt-3.5 space-y-3">
                <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-xs space-y-1">
                  <p className="font-bold text-amber-950 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-800" />
                    Pengisian Absen Mandiri Anggota:
                  </p>
                  <p className="text-slate-700">
                    Nama: <strong className="text-slate-900">{currentUser.nama}</strong> | Sangga: <strong className="text-slate-900">{currentUser.sangga}</strong> | Gudep: <strong className="text-slate-900">{currentUser.gudep} ({currentUser.satuan})</strong>
                  </p>
                </div>

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
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Tombol Kirim */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#e51c24] to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirim Kehadiran...' : 'Kirim Absensi Saya Sekarang'}</span>
                </button>
              </form>
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
              Pembina atau Admin belum menyalakan sesi absensi untuk saat ini. Tombol pengisian absen akan aktif otomatis ketika sesi dinyalakan.
            </p>
          </div>
        )}
      </div>

      {/* 4. ATTENDANCE SUMMARY & LIVE ROLL CALL (When Session is Active or Records Exist) */}
      {(activeSession?.isOpen || records.length > 0) && (
        <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-xs space-y-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#e51c24]" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Daftar Presensi ({records.length} Anggota)
              </h3>
            </div>
            
            <button
              onClick={() => setShowAttendeesList(!showAttendeesList)}
              className="text-xs text-slate-500 font-bold flex items-center gap-1 hover:text-slate-800"
            >
              <span>{showAttendeesList ? 'Sembunyikan' : 'Tampilkan'}</span>
              {showAttendeesList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 block">Hadir</span>
              <span className="text-base font-black text-emerald-700">{totalHadir}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 block">Izin</span>
              <span className="text-base font-black text-amber-700">{totalIzin}</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold text-blue-800 block">Sakit</span>
              <span className="text-base font-black text-blue-700">{totalSakit}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold text-rose-800 block">Alpa</span>
              <span className="text-base font-black text-rose-700">{totalAlpa}</span>
            </div>
          </div>

          {/* Detailed Attendees List */}
          {showAttendeesList && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              {/* Filter controls */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-600 shrink-0">Sangga:</span>
                {['Semua', 'Perintis', 'Penegas', 'Pendobrak', 'Pencoba', 'Pelaksana'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterSangga(s)}
                    className={`px-2.5 py-0.5 rounded-full font-bold shrink-0 transition-colors ${
                      filterSangga === s 
                        ? 'bg-amber-400 text-slate-950 font-black' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {filteredRecords.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4 italic">
                  Belum ada presensi yang cocok dengan filter.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {filteredRecords.map((r, idx) => (
                    <div key={r.id || idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">{r.memberName}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Sangga {r.sangga}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {r.gudep}
                          </span>
                        </div>
                        {r.notes && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">
                            {r.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">{r.timestamp}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          r.status === 'Hadir' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : r.status === 'Izin' 
                            ? 'bg-amber-100 text-amber-800 border-amber-300' 
                            : r.status === 'Sakit' 
                            ? 'bg-blue-100 text-blue-800 border-blue-300' 
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. JADWAL LATIHAN RUTIN DARI PROGRAM KERJA */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
            Daftar Jadwal Latihan Rutin (Tahunan)
          </h2>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            {latihanFromProker.length} Jadwal
          </span>
        </div>

        {latihanFromProker.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-amber-300 text-center space-y-2 shadow-xs">
            <Flame className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Belum Ada Jadwal Latihan Rutin
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAdmin 
                ? 'Tambahkan jadwal latihan rutin melalui menu Program Kerja (pilih jenis Latihan Rutin).'
                : 'Belum ada agenda latihan rutin yang dipublikasikan oleh Pembina.'}
            </p>
            {isAdmin && onNavigateToProgramKerja && (
              <button
                onClick={onNavigateToProgramKerja}
                className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold shadow-xs hover:bg-amber-300"
              >
                + Tambah di Program Kerja
              </button>
            )}
          </div>
        ) : (
          latihanFromProker.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border-l-4 border-l-amber-400 border-t border-r border-b border-amber-200 hover:border-amber-400 transition-all shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300 shrink-0">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {item.nama}
                    </h3>
                    <span className="text-xs font-mono font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> {item.waktuPelaksanaan} ({item.bulan})
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  item.status === 'Terlaksana'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : item.status === 'Berjalan'
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {item.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <p className="text-slate-800 font-bold">
                  Materi: <span className="font-normal text-slate-700">{item.deskripsi}</span>
                </p>
                {item.tempat && (
                  <p className="text-slate-800 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#e51c24]" />
                    Lokasi: <span className="font-normal text-slate-600">{item.tempat}</span>
                  </p>
                )}
                {item.seragam && (
                  <p className="text-slate-800 font-bold flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5 text-amber-700" />
                    Pakaian: <span className="font-normal text-slate-600">{item.seragam}</span>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 6. MODAL ADMIN MANUAL ATTENDANCE ENTRY */}
      {showAdminManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border-2 border-amber-400 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>Isi Presensi Anggota Manual</span>
            </h3>

            <form onSubmit={handleAdminManualSubmit} className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  Nama Anggota:
                </label>
                <input
                  type="text"
                  required
                  value={manualMemberName}
                  onChange={(e) => setManualMemberName(e.target.value)}
                  placeholder="Ketik nama anggota pramuka"
                  className="w-full px-3 py-1.5 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                    Gugus Depan:
                  </label>
                  <select
                    value={manualGudep}
                    onChange={(e) => setManualGudep(e.target.value as any)}
                    className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="10-035">10-035 (Putra)</option>
                    <option value="10-036">10-036 (Putri)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                    Sangga:
                  </label>
                  <select
                    value={manualSangga}
                    onChange={(e) => setManualSangga(e.target.value as any)}
                    className="w-full px-2 py-1.5 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-amber-400 focus:outline-none"
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
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  Status Kehadiran:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setManualStatus(st)}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                        manualStatus === st
                          ? 'bg-slate-900 text-white border-black'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  Catatan (Opsional):
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Keterangan dispensasi / surat dokter"
                  className="w-full px-3 py-1.5 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdminManualModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 shadow-xs"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
