import React, { useState } from 'react';
import { Award, Sparkles, BookOpen, Clock, ChevronDown, ChevronUp, Search, Info } from 'lucide-react';
import { INITIAL_SKU_ITEMS } from '../../data/scoutData';

export const SkuSkkView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bantara' | 'laksana' | 'skk'>('bantara');
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const [search, setSearch] = useState('');

  const bantaraList = INITIAL_SKU_ITEMS.filter(i => i.level === 'bantara');
  const laksanaList = INITIAL_SKU_ITEMS.filter(i => i.level === 'laksana');

  const currentList = activeTab === 'bantara' ? bantaraList : laksanaList;

  const filteredList = currentList.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-24">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
          Kecakapan Penegak
        </span>
        <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1">
          Materi SKU & SKK Penegak
        </h1>
        <p className="text-xs text-slate-500">
          Syarat Kecakapan Umum (SKU) Penegak Bantara & Penegak Laksana
        </p>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 mt-3">
          <button
            onClick={() => setActiveTab('bantara')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bantara'
                ? 'bg-[#e51c24] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SKU Bantara
          </button>
          <button
            onClick={() => setActiveTab('laksana')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'laksana'
                ? 'bg-[#e51c24] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SKU Laksana
          </button>
          <button
            onClick={() => setActiveTab('skk')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'skk'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>SKK</span>
            <span className="text-[9px] bg-red-100 text-[#e51c24] px-1 rounded-full font-mono">Soon</span>
          </button>
        </div>
      </div>

      {activeTab === 'skk' ? (
        /* SKK Coming Soon Screen */
        <div className="bg-white rounded-3xl p-8 border-2 border-amber-400 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border-2 border-amber-400 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
              COMING SOON
            </span>
            <h2 className="text-base font-black text-slate-900 mt-2">
              Materi SKK (TKK) Penegak
            </h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
              Modul Tanda Kecakapan Khusus (TKK) 5 Bidang (Agama & Mental, Patriotisme & Seni, Ketangkasan & Kesehatan, Keterampilan, dan Sosial Kemanusiaan) sedang dalam tahap penyusunan oleh Dewan Ambalan.
            </p>
          </div>
        </div>
      ) : (
        /* SKU Content */
        <div className="space-y-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Cari butir materi ${activeTab === 'bantara' ? 'Bantara' : 'Laksana'}...`}
              className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            {filteredList.map((item, idx) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                    isExpanded ? 'border-amber-400 shadow-xs' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {/* Header Item */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full p-3.5 text-left flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-red-50 text-[#e51c24] border border-amber-300 shrink-0 mt-0.5">
                        {item.code}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                          {item.category}
                        </span>
                        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 leading-snug">
                          {item.title}
                        </h2>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 bg-slate-50/50">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Syarat Materi:
                        </h4>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300/80 text-xs text-amber-950">
                        <strong className="block text-amber-900 font-bold mb-0.5">
                          💡 Panduan & Indikator Pengujian:
                        </strong>
                        <p className="leading-relaxed font-medium">{item.guide}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
