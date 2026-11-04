import React, { useState } from 'react';
import { 
  CalendarCheck, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Users, 
  ChevronRight,
  Share2,
  Calendar,
  Filter
} from 'lucide-react';
import { UserAccount, ProgramKerjaItem } from '../../types';
import { MenuHeaderCard } from '../common/MenuHeaderCard';
import { formatAgendaDate } from '../../utils/agendaDate';

interface PresensiViewProps {
  currentUser: UserAccount;
  programKerjaList: ProgramKerjaItem[];
  onBack: () => void;
}

interface KehadiranRecord {
  id: string;
  namaAgenda: string;
  tanggal: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  sangga: string;
  keterangan?: string;
}

const INITIAL_RECORDS: KehadiranRecord[] = [
  { id: 'pres-1', namaAgenda: 'Latihan Rutin: Tata Cara Penyelenggaraan Jenazah', tanggal: '24 Oktober 2026', status: 'Hadir', sangga: 'Perintis' },
  { id: 'pres-2', namaAgenda: 'Bakti Sosial Lingkungan & Situs Sejarah Maros', tanggal: '17 Oktober 2026', status: 'Hadir', sangga: 'Perintis' },
  { id: 'pres-3', namaAgenda: 'Latihan Rutin: Taksir Ukur Lebar Sungai & Pohon', tanggal: '19 September 2026', status: 'Hadir', sangga: 'Perintis' },
  { id: 'pres-4', namaAgenda: 'Peringatan Hari Pramuka Ke-65 & Renungan Ulang Janji', tanggal: '14 Agustus 2026', status: 'Hadir', sangga: 'Perintis' },
  { id: 'pres-5', namaAgenda: 'Latihan Rutin: PBB Tongkat & Kolone Senapan', tanggal: '22 Agustus 2026', status: 'Izin', sangga: 'Perintis', keterangan: 'Urusan keluarga di Makassar' }
];

export const PresensiView: React.FC<PresensiViewProps> = ({ currentUser, programKerjaList, onBack }) => {
  const [records, setRecords] = useState<KehadiranRecord[]>(INITIAL_RECORDS);
  const [selectedAgenda, setSelectedAgenda] = useState<string>(programKerjaList[0]?.nama || 'Latihan Rutin Mingguan');
  const [inputStatus, setInputStatus] = useState<'Hadir' | 'Izin' | 'Sakit'>('Hadir');
  const [inputKeterangan, setInputKeterangan] = useState('');
  const [isSuccessToast, setIsSuccessToast] = useState(false);
  const [filterSangga, setFilterSangga] = useState<string>('Semua');

  const hadirCount = records.filter(r => r.status === 'Hadir').length;
  const izinCount = records.filter(r => r.status === 'Izin').length;
  const sakitCount = records.filter(r => r.status === 'Sakit').length;
  const totalCount = records.length;
  const kehadiranPersen = totalCount > 0 ? Math.round((hadirCount / totalCount) * 100) : 100;

  const handleSubmitPresensi = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: KehadiranRecord = {
      id: `pres-${Date.now()}`,
      namaAgenda: selectedAgenda,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: inputStatus,
      sangga: currentUser.sangga || 'Perintis',
      keterangan: inputKeterangan.trim() || undefined
    };

    setRecords([newRecord, ...records]);
    setInputKeterangan('');
    setIsSuccessToast(true);
    setTimeout(() => setIsSuccessToast(false), 3000);
  };

  const handleShareToWA = () => {
    const text = `*PRESENSI KEHADIRAN PRAMUKA*\nAmbalan La Surullah Petta Lopo\nNama: ${currentUser.nama}\nSangga: ${currentUser.sangga || 'Perintis'}\nAgenda: ${selectedAgenda}\nStatus: ${inputStatus}${inputKeterangan ? `\nKeterangan: ${inputKeterangan}` : ''}\nWaktu: ${new Date().toLocaleDateString('id-ID')}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredRecords = filterSangga === 'Semua' 
    ? records 
    : records.filter(r => r.sangga.toLowerCase() === filterSangga.toLowerCase());

  return (
    <div className="space-y-4 pb-28 font-sans animate-in fade-in duration-150">
      <MenuHeaderCard
        title="Presensi Ambalan"
        subtitle="Pencatatan absensi & rekapitulasi kehadiran penegak"
        onBack={onBack}
      />

      {/* Ringkasan Kehadiran Saya */}
      <div className="rounded-3xl border border-red-100 bg-linear-to-br from-red-50 to-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#b71922]">
              Gugus Depan 10-035 & 10-036
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {currentUser.nama}
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Sangga {currentUser.sangga || 'Perintis'} • {currentUser.tingkat || 'Penegak'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#c81e28]">{kehadiranPersen}%</span>
            <span className="block text-[10px] font-bold text-slate-500">Tingkat Hadir</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-red-100 text-center">
          <div className="p-2 rounded-xl bg-white border border-emerald-200">
            <strong className="block text-base font-black text-emerald-700">{hadirCount}</strong>
            <small className="text-[10px] font-bold text-slate-500">Hadir</small>
          </div>
          <div className="p-2 rounded-xl bg-white border border-amber-200">
            <strong className="block text-base font-black text-amber-700">{izinCount}</strong>
            <small className="text-[10px] font-bold text-slate-500">Izin</small>
          </div>
          <div className="p-2 rounded-xl bg-white border border-rose-200">
            <strong className="block text-base font-black text-rose-700">{sakitCount}</strong>
            <small className="text-[10px] font-bold text-slate-500">Sakit</small>
          </div>
        </div>
      </div>

      {/* Form Input Presensi / Izin Kegiatan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 mb-3">
          <CalendarCheck className="text-[#c81e28]" size={18} />
          <span>Isi Presensi / Konfirmasi Kehadiran</span>
        </h4>

        {isSuccessToast && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Presensi berhasil dicatat!</span>
          </div>
        )}

        <form onSubmit={handleSubmitPresensi} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Pilih Kegiatan / Latihan:
            </label>
            <select
              value={selectedAgenda}
              onChange={(e) => setSelectedAgenda(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-400"
            >
              {programKerjaList.map((item) => (
                <option key={item.id} value={item.nama}>
                  [{item.tipe || 'Kegiatan'}] {item.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
              Status Kehadiran:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Hadir', 'Izin', 'Sakit'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setInputStatus(st)}
                  className={`py-2 rounded-xl text-xs font-black transition-all border ${
                    inputStatus === st
                      ? st === 'Hadir'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : st === 'Izin'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {(inputStatus === 'Izin' || inputStatus === 'Sakit') && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Keterangan / Alasan:
              </label>
              <input
                type="text"
                placeholder="Tuliskan alasan izin/sakit..."
                value={inputKeterangan}
                onChange={(e) => setInputKeterangan(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:border-red-400"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#c81e28] text-white font-extrabold text-xs shadow-xs hover:bg-[#a91b24] transition-all"
            >
              Kirim Presensi
            </button>
            <button
              type="button"
              onClick={handleShareToWA}
              title="Bagikan format presensi ke WhatsApp"
              className="py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 hover:bg-emerald-100 transition-all"
            >
              <Share2 size={14} />
              <span>Kirim ke WA</span>
            </button>
          </div>
        </form>
      </div>

      {/* Riwayat Catatan Kehadiran */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-extrabold text-slate-900 text-sm">
            Riwayat Kehadiran Ambalan
          </h4>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredRecords.length} catatan
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRecords.map((rec) => (
            <div key={rec.id} className="py-2.5 flex items-start justify-between gap-2">
              <div>
                <h5 className="font-bold text-slate-900 text-xs leading-snug">
                  {rec.namaAgenda}
                </h5>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {rec.tanggal} • Sangga {rec.sangga}
                </span>
                {rec.keterangan && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                    Keterangan: {rec.keterangan}
                  </p>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                rec.status === 'Hadir'
                  ? 'bg-emerald-100 text-emerald-800'
                  : rec.status === 'Izin'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {rec.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
