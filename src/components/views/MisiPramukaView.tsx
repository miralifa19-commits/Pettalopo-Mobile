import React, { useState } from 'react';
import { Target, CheckCircle2, Circle, Award, Flame, Star, Sparkles, Trophy, ArrowLeft } from 'lucide-react';
import { MenuHeaderCard } from '../common/MenuHeaderCard';

interface MisiItem {
  id: string;
  kategori: 'Harian' | 'Mingguan' | 'Bakti Ambalan';
  judul: string;
  deskripsi: string;
  poin: number;
  dasaDarma: string;
  selesai: boolean;
}

const INITIAL_MISI: MisiItem[] = [
  {
    id: 'misi-1',
    kategori: 'Harian',
    judul: 'Ibadah Tertib & Doa Harian',
    deskripsi: 'Menjalankan ibadah wajib tepat waktu dan membaca doa harian sebelum beraktivitas.',
    poin: 15,
    dasaDarma: 'Darma ke-1 (Taqwa kepada Tuhan Yang Maha Esa)',
    selesai: true
  },
  {
    id: 'misi-2',
    kategori: 'Harian',
    judul: 'Bakti Peduli Sampah Pangkalan',
    deskripsi: 'Memungut minimal 5 sampah anorganik dan membuangnya pada tempat daur ulang di sekolah.',
    poin: 20,
    dasaDarma: 'Darma ke-2 (Cinta alam dan kasih sayang sesama manusia)',
    selesai: false
  },
  {
    id: 'misi-3',
    kategori: 'Mingguan',
    judul: 'Latihan 5 Kata Sandi Morse / Semaphore',
    deskripsi: 'Mengirim dan membaca minimal 5 kata sandi morse bersama rekan satu sangga.',
    poin: 40,
    dasaDarma: 'Darma ke-6 (Rajin, terampil, dan gembira)',
    selesai: false
  },
  {
    id: 'misi-4',
    kategori: 'Mingguan',
    judul: 'Simpul & Ikatan Tandu Lapangan',
    deskripsi: 'Mempraktikkan simpul pangkal, jangkar, dan ikatan palang pada pembuatan tandu darurat.',
    poin: 50,
    dasaDarma: 'Darma ke-5 (Rela menolong dan tabah)',
    selesai: false
  },
  {
    id: 'misi-5',
    kategori: 'Bakti Ambalan',
    judul: 'Aksi Siri\' na Pacce: Tolong Rekan Kesulitan',
    deskripsi: 'Membantu rekan yang tertinggal pelajaran atau membutuhkan bantuan tanpa mengharapkan imbalan.',
    poin: 60,
    dasaDarma: 'Darma ke-5 & Filosofi Luhur Bugis-Makassar',
    selesai: true
  },
  {
    id: 'misi-6',
    kategori: 'Bakti Ambalan',
    judul: 'Rencana Hijau: Rawat Tanaman Pangkalan',
    deskripsi: 'Menyiram dan merawat tanaman obat keluarga (TOGA) di area sanggar ambalan.',
    poin: 45,
    dasaDarma: 'Darma ke-2 (Cinta alam)',
    selesai: false
  }
];

interface MisiPramukaViewProps {
  onBack: () => void;
}

export const MisiPramukaView: React.FC<MisiPramukaViewProps> = ({ onBack }) => {
  const [misiList, setMisiList] = useState<MisiItem[]>(INITIAL_MISI);
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  const toggleMisi = (id: string) => {
    setMisiList(prev => prev.map(m => m.id === id ? { ...m, selesai: !m.selesai } : m));
  };

  const totalSelesai = misiList.filter(m => m.selesai).length;
  const totalPoin = misiList.reduce((acc, m) => m.selesai ? acc + m.poin : acc, 0);
  const progressPercent = Math.round((totalSelesai / misiList.length) * 100);

  const filteredMisi = filterKategori === 'Semua' 
    ? misiList 
    : misiList.filter(m => m.kategori === filterKategori);

  return (
    <div className="space-y-4 pb-24 font-sans animate-in fade-in duration-150">
      <MenuHeaderCard
        title="Misi Pramuka"
        subtitle="Tantangan bakti, kecakapan, dan karakter penegak"
        onBack={onBack}
      />

      {/* Score and Level Card */}
      <div className="rounded-2xl border border-red-100 bg-linear-to-br from-red-50 to-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#b71922]">
              Pramuka Aktif & Tanggap
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {totalPoin} <span className="text-xs font-bold text-slate-500">Poin Ambalan</span>
            </h3>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white border border-red-200 shadow-xs">
            <Trophy className="text-[#e51c24]" size={26} />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
            <span>Kemajuan Misi ({totalSelesai}/{misiList.length} selesai)</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div 
              className="h-full bg-[#e51c24] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {['Semua', 'Harian', 'Mingguan', 'Bakti Ambalan'].map((kat) => (
          <button
            key={kat}
            type="button"
            onClick={() => setFilterKategori(kat)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              filterKategori === kat
                ? 'bg-[#c81e28] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* List Misi */}
      <div className="space-y-2.5">
        {filteredMisi.map((misi) => (
          <div
            key={misi.id}
            onClick={() => toggleMisi(misi.id)}
            className={`rounded-2xl border p-3.5 transition-all cursor-pointer flex items-start gap-3 ${
              misi.selesai
                ? 'bg-slate-50 border-slate-200 opacity-80'
                : 'bg-white border-slate-200 hover:border-red-300 shadow-xs'
            }`}
          >
            <button
              type="button"
              className="mt-0.5 shrink-0"
              aria-label={misi.selesai ? 'Tandai belum selesai' : 'Tandai selesai'}
            >
              {misi.selesai ? (
                <CheckCircle2 className="text-[#c81e28]" size={22} />
              ) : (
                <Circle className="text-slate-300 hover:text-slate-400" size={22} />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-100 text-[#b71922]">
                  {misi.kategori}
                </span>
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> +{misi.poin} Poin
                </span>
              </div>
              <h4 className={`text-sm font-bold mt-1 ${misi.selesai ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                {misi.judul}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {misi.deskripsi}
              </p>
              <div className="mt-2 text-[10px] font-semibold text-slate-500">
                ⚜️ {misi.dasaDarma}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
