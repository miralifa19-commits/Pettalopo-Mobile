import React, { useState } from 'react';
import { FileText, Plus, Calendar, Star, Tag, X, User } from 'lucide-react';
import { LogbookEntry, UserProfile } from '../../types';
import { INITIAL_LOGBOOK } from '../../data/scoutData';

interface LogbookViewProps {
  profile: UserProfile;
}

export const LogbookView: React.FC<LogbookViewProps> = ({ profile }) => {
  const [entries, setEntries] = useState<LogbookEntry[]>(INITIAL_LOGBOOK);
  const [isAdding, setIsAdding] = useState(false);

  // New entry form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Latihan Rutin');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newEntry: LogbookEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: title.trim(),
      category,
      content: content.trim(),
      author: profile.name,
      sangga: profile.sangga,
      rating
    };

    setEntries([newEntry, ...entries]);
    setTitle('');
    setContent('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
            Jurnal Pribadi Penegak
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
            Buku Catatan Logbook
          </h2>
          <p className="text-xs text-slate-500">
            Dokumentasi pengalaman latihan, pengembaraan dan bakti
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-3.5 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm border border-amber-400 hover:bg-[#c9141b] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Catatan</span>
        </button>
      </div>

      {/* Entry List */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-2xl p-4 border-2 border-slate-100 hover:border-amber-400 transition-all shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                {entry.category}
              </span>
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: entry.rating || 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>

            <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
              {entry.title}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line">
              {entry.content}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-[#e51c24]">
                <User className="w-3.5 h-3.5" />
                {entry.author} (Sangga {entry.sangga})
              </span>
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {entry.date}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Entry */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border-2 border-amber-400 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Tambah Catatan Logbook Baru</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Judul Kegiatan:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Latihan Survival & Pendirian Bivak"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Kategori:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="Latihan Rutin">Latihan Rutin</option>
                  <option value="Pionering">Pionering & Tali Temali</option>
                  <option value="Sandi & Morse">Sandi & Komunikasi</option>
                  <option value="Perkemahan">Perkemahan / Survival</option>
                  <option value="Bakti Masyarakat">Bakti Masyarakat</option>
                  <option value="Adat Ambalan">Kajian Adat & Sejarah</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Isi Catatan Kegiatan:</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ceritakan jalannya kegiatan, materi yang dipelajari, tantangan yang dihadapi..."
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e51c24] text-white text-xs font-bold border border-amber-400"
                >
                  Simpan ke Logbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
