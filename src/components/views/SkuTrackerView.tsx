import React, { useState } from 'react';
import { 
  CheckSquare, 
  Award, 
  Filter, 
  Search, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  UserCheck, 
  Calendar, 
  Info, 
  Download, 
  HelpCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SkuItem, SkkItem, SkuLevel, UserProfile } from '../../types';
import { INITIAL_SKK_ITEMS } from '../../data/scoutData';

interface SkuTrackerViewProps {
  skuItems: SkuItem[];
  onUpdateSku: (updatedItems: SkuItem[]) => void;
  profile: UserProfile;
}

export const SkuTrackerView: React.FC<SkuTrackerViewProps> = ({
  skuItems,
  onUpdateSku,
  profile
}) => {
  const [selectedLevel, setSelectedLevel] = useState<SkuLevel>('bantara');
  const [viewMode, setViewMode] = useState<'sku' | 'skk'>('sku');
  const [skkItems, setSkkItems] = useState<SkkItem[]>(INITIAL_SKK_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal for verifying SKU
  const [activeModalItem, setActiveModalItem] = useState<SkuItem | null>(null);
  const [examinerName, setExaminerName] = useState('Kak Pembina Satuan');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [examNotes, setExamNotes] = useState('Telah diuji dengan memuaskan sesuai syarat kualifikasi.');

  const filteredSku = skuItems.filter((item) => {
    const matchLevel = item.level === selectedLevel;
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchCategory && matchSearch;
  });

  const levelItems = skuItems.filter(item => item.level === selectedLevel);
  const completedCount = levelItems.filter(item => item.completed).length;
  const progressPercent = Math.round((completedCount / (levelItems.length || 1)) * 100);

  const handleOpenVerify = (item: SkuItem) => {
    if (item.completed) {
      // Toggle back to uncompleted directly
      const updated = skuItems.map(i => i.id === item.id ? { ...i, completed: false, completedDate: undefined, verifiedBy: undefined } : i);
      onUpdateSku(updated);
    } else {
      setActiveModalItem(item);
      setExamDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleConfirmVerify = () => {
    if (!activeModalItem) return;
    const updated = skuItems.map(i => {
      if (i.id === activeModalItem.id) {
        return {
          ...i,
          completed: true,
          completedDate: examDate,
          verifiedBy: examinerName,
          notes: examNotes
        };
      }
      return i;
    });
    onUpdateSku(updated);
    setActiveModalItem(null);

    // Fire festive scout celebration confetti
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e51c24', '#ffea00', '#ffffff', '#22c55e']
    });
  };

  const toggleSkk = (id: string) => {
    setSkkItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        if (nextState) {
          confetti({ particleCount: 50, spread: 60, colors: ['#ffea00', '#e51c24'] });
        }
        return { ...item, completed: nextState };
      }
      return item;
    }));
  };

  const categories = ['Semua', 'Spiritual / Agama', 'Patriotisme & Kebangsaan', 'Sosial & Kepribadian', 'Keterampilan & Teknologi', 'Jasmani & Lingkungan'];

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header & Tab Selector */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
              Uji Syarat Kecakapan
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
              Buku Kontrol SKU & SKK Penegak
            </h2>
            <p className="text-xs text-slate-500">
              Gugus Depan {profile.gudep} • Ambalan La Surullah Petta Lopo
            </p>
          </div>

          {/* Toggle SKU / SKK */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('sku')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'sku'
                  ? 'bg-[#e51c24] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SKU Penegak
            </button>
            <button
              onClick={() => setViewMode('skk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'skk'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              TKK / SKK
            </button>
          </div>
        </div>

        {viewMode === 'sku' && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLevel('bantara')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${
                selectedLevel === 'bantara'
                  ? 'bg-red-50 border-[#e51c24] text-[#e51c24] shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>SKU Penegak Bantara</span>
            </button>
            <button
              onClick={() => setSelectedLevel('laksana')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${
                selectedLevel === 'laksana'
                  ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>SKU Penegak Laksana</span>
            </button>
          </div>
        )}
      </div>

      {viewMode === 'sku' ? (
        <>
          {/* Progress Card */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-slate-700">
                  Kemajuan {selectedLevel === 'bantara' ? 'Penegak Bantara' : 'Penegak Laksana'}
                </span>
                <p className="text-[11px] text-slate-500">
                  {completedCount} dari {levelItems.length} butir telah lulus uji kelayakan
                </p>
              </div>
              <span className="text-sm font-mono font-extrabold text-[#e51c24] bg-red-50 border border-amber-300 px-2.5 py-1 rounded-xl">
                {progressPercent}%
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-100 rounded-full p-0.5 ring-1 ring-amber-400 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-[#e51c24] to-[#e51c24] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {progressPercent === 100 && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Selamat! Seluruh butir telah terpenuhi. Anda siap untuk prosesi Pelantikan Adat Ambalan!</span>
              </div>
            )}
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari butir SKU (contoh: morse, ibadah, pancasila)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Horizontal Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#e51c24] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* SKU Items List */}
          <div className="space-y-2.5">
            {filteredSku.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border-2 border-slate-100 p-6">
                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Tidak ada butir SKU yang cocok</p>
                <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
              </div>
            ) : (
              filteredSku.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 transition-all bg-white shadow-xs ${
                    item.completed
                      ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 shrink-0">
                        {item.code}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                          {item.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    {/* Completion Action Button */}
                    <button
                      onClick={() => handleOpenVerify(item)}
                      className={`shrink-0 p-1.5 rounded-xl transition-all ${
                        item.completed
                          ? 'text-emerald-600 hover:text-emerald-700'
                          : 'text-slate-300 hover:text-[#e51c24]'
                      }`}
                      title={item.completed ? 'Klik untuk membatalkan verifikasi' : 'Tandai telah lulus'}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-7 h-7 fill-emerald-100" />
                      ) : (
                        <Circle className="w-7 h-7 stroke-[2]" />
                      )}
                    </button>
                  </div>

                  {/* Description & Testing Guide */}
                  <div className="mt-2.5 pl-0 sm:pl-9 space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
                      <span className="font-bold flex items-center gap-1 text-amber-800">
                        <HelpCircle className="w-3.5 h-3.5" /> Panduan Pengujian:
                      </span>
                      <p className="mt-0.5 font-medium">{item.guide}</p>
                    </div>

                    {item.completed && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-1.5">
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <UserCheck className="w-3.5 h-3.5" /> Penguji: {item.verifiedBy || 'Kak Pembina'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-400">
                          <Calendar className="w-3.5 h-3.5" /> {item.completedDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* SKK / TKK View */
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-900 font-medium">
            <strong>Tanda Kecakapan Khusus (TKK):</strong> Tanda kecakapan di luar kecakapan umum yang ditempuh sesuai minat dan bakat anggota Ambalan.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skkItems.map((skk) => (
              <div
                key={skk.id}
                className={`p-3.5 rounded-2xl border-2 bg-white transition-all shadow-xs ${
                  skk.completed ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-[#e51c24] border border-red-200">
                      {skk.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                      {skk.name} ({skk.level})
                    </h4>
                  </div>
                  <button
                    onClick={() => toggleSkk(skk.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                      skk.completed
                        ? 'bg-amber-400 text-slate-950 border border-amber-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {skk.completed ? '✓ Tercapai' : 'Klaim'}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-2 font-normal leading-relaxed">
                  {skk.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Modal Dialog */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 border-2 border-amber-400 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#e51c24] text-white">
                  {activeModalItem.code}
                </span>
                <h3 className="text-sm font-bold text-slate-900">Verifikasi Ujian SKU</h3>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-800">{activeModalItem.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{activeModalItem.description}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Penguji / Pembina Satuan:
                </label>
                <input
                  type="text"
                  value={examinerName}
                  onChange={(e) => setExaminerName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tanggal Pengujian:
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Catatan Penguji:
                </label>
                <textarea
                  value={examNotes}
                  onChange={(e) => setExamNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmVerify}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e51c24] hover:bg-[#c9141b] text-white shadow-sm border border-amber-400 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Sahkan Kelulusan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
