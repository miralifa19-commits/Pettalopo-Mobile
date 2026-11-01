import React, { useState } from 'react';
import { Calendar, UserCheck, Plus, CheckCircle, Clock, MapPin, Shield, Users, Filter, X } from 'lucide-react';
import { AgendaEvent, AttendanceRecord, UserProfile } from '../../types';
import { INITIAL_EVENTS, INITIAL_ATTENDANCE } from '../../data/scoutData';

interface AgendaPresensiViewProps {
  profile: UserProfile;
}

export const AgendaPresensiView: React.FC<AgendaPresensiViewProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'presensi'>('agenda');
  const [events, setEvents] = useState<AgendaEvent[]>(INITIAL_EVENTS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  
  // Attendance Filter
  const [selectedSangga, setSelectedSangga] = useState<string>('Semua');

  // New Attendance modal
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newStatus, setNewStatus] = useState<'Hadir' | 'Izin' | 'Sakit' | 'Alpa'>('Hadir');
  const [newSangga, setNewSangga] = useState<'Perintis' | 'Penegas' | 'Pendobrak' | 'Pencoba' | 'Pelaksana'>('Perintis');
  const [newNotes, setNewNotes] = useState('');

  const filteredAttendance = attendance.filter((item) => {
    if (selectedSangga !== 'Semua' && item.sangga !== selectedSangga) return false;
    return true;
  });

  const handleAddAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      sangga: newSangga,
      gudep: profile.gudep,
      memberName: newMemberName.trim(),
      status: newStatus,
      notes: newNotes.trim() || undefined
    };

    setAttendance([record, ...attendance]);
    setNewMemberName('');
    setNewNotes('');
    setIsAddingAttendance(false);
  };

  const hadirCount = attendance.filter(a => a.status === 'Hadir').length;
  const izinCount = attendance.filter(a => a.status === 'Izin').length;
  const sakitCount = attendance.filter(a => a.status === 'Sakit').length;

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header with Tab switcher */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
              Aktivitas Gugus Depan {profile.gudep}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
              Agenda & Presensi Kehadiran
            </h2>
            <p className="text-xs text-slate-500">
              Jadwal kegiatan rutin dan pencatatan absensi sangga penegak
            </p>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'agenda'
                  ? 'bg-[#e51c24] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda Kegiatan
            </button>
            <button
              onClick={() => setActiveTab('presensi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'presensi'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Presensi Sangga
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'agenda' ? (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl p-4 border-2 border-slate-100 hover:border-amber-400 transition-all shadow-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {event.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {event.uniform}
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                {event.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {event.description}
              </p>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-1.5 font-bold text-[#e51c24]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{event.date}</span>
                  <span className="text-slate-400 font-normal">({event.time})</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate max-w-[200px]">{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Presensi View */
        <div className="space-y-3">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-white border-2 border-emerald-200">
              <span className="text-lg font-black text-emerald-600">{hadirCount}</span>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Hadir</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border-2 border-amber-200">
              <span className="text-lg font-black text-amber-600">{izinCount}</span>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Izin</p>
            </div>
            <div className="p-3 rounded-2xl bg-white border-2 border-rose-200">
              <span className="text-lg font-black text-rose-600">{sakitCount}</span>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Sakit</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {['Semua', 'Perintis', 'Penegas', 'Pendobrak'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSangga(s)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors shrink-0 ${
                    selectedSangga === s
                      ? 'bg-[#e51c24] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddingAttendance(true)}
              className="px-3 py-1.5 rounded-xl bg-[#e51c24] text-white text-xs font-bold flex items-center gap-1 shadow-xs border border-amber-400 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Input Hadir</span>
            </button>
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-2xl border-2 border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {filteredAttendance.map((rec) => (
              <div key={rec.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                    {rec.memberName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{rec.memberName}</h4>
                    <p className="text-[10px] text-slate-500">
                      Sangga {rec.sangga} • Gudep {rec.gudep} • {rec.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    rec.status === 'Hadir'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : rec.status === 'Izin'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Attendance Dialog */}
      {isAddingAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border-2 border-amber-400 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Catat Presensi Latihan</h3>
              <button onClick={() => setIsAddingAttendance(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAttendance} className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Anggota Penegak:</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nama lengkap..."
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Sangga:</label>
                <select
                  value={newSangga}
                  onChange={(e) => setNewSangga(e.target.value as any)}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="Perintis">Sangga Perintis</option>
                  <option value="Penegas">Sangga Penegas</option>
                  <option value="Pendobrak">Sangga Pendobrak</option>
                  <option value="Pencoba">Sangga Pencoba</option>
                  <option value="Pelaksana">Sangga Pelaksana</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Status Kehadiran:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Hadir', 'Izin', 'Sakit', 'Alpa'] as const).map((st) => (
                    <button
                      type="button"
                      key={st}
                      onClick={() => setNewStatus(st)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        newStatus === st
                          ? 'bg-[#e51c24] text-white border-[#e51c24]'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Keterangan / Alasan:</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Keterangan opsional..."
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingAttendance(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-bold border border-amber-400"
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
