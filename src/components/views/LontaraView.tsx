import React, { useState } from 'react';
import { Languages, BookOpen, Sparkles, Copy, Check, Info } from 'lucide-react';
import { LONTARA_DICTIONARY, LONTARA_VOWELS, LOGO_IMAGE_PATH } from '../../data/scoutData';

export const LontaraView: React.FC = () => {
  const [inputText, setInputText] = useState('LA SURULLAH');
  const [copied, setCopied] = useState(false);

  // Transliterate simple Latin text into Bugis Lontara script
  const transliterateToLontara = (text: string): string => {
    let lower = text.toLowerCase().trim();
    if (!lower) return '';

    const consonantMap: Record<string, string> = {
      'ngka': 'ᨃ', 'mpa': 'ᨇ', 'nra': 'ᨋ', 'nca': 'ᨏ', 'nya': 'ᨎ', 'nga': 'ᨂ',
      'ka': 'ᨀ', 'ga': 'ᨁ', 'pa': 'ᨄ', 'ba': 'ᨅ', 'ma': 'ᨆ',
      'ta': 'ᨈ', 'da': 'ᨉ', 'na': 'ᨊ', 'ca': 'ᨌ', 'ja': 'ᨍ',
      'ya': 'ᨐ', 'ra': 'ᨑ', 'la': 'ᨒ', 'wa': 'ᨓ', 'sa': 'ᨔ',
      'a': 'ᨕ', 'ha': 'ᨖ'
    };

    let result = '';
    let i = 0;
    while (i < lower.length) {
      if (lower[i] === ' ') {
        result += ' ';
        i++;
        continue;
      }

      let matched = false;
      const candidates = ['ngka', 'mpa', 'nra', 'nca', 'nya', 'nga', 'ka', 'ga', 'pa', 'ba', 'ma', 'ta', 'da', 'na', 'ca', 'ja', 'ya', 'ra', 'la', 'wa', 'sa', 'ha'];
      
      for (const cand of candidates) {
        const root = cand.slice(0, -1);
        if (lower.startsWith(root, i)) {
          const baseChar = consonantMap[cand];
          const nextIdx = i + root.length;
          const nextVowel = lower[nextIdx];

          if (nextVowel === 'i') {
            result += baseChar + LONTARA_VOWELS.i;
            i = nextIdx + 1;
          } else if (nextVowel === 'u') {
            result += baseChar + LONTARA_VOWELS.u;
            i = nextIdx + 1;
          } else if (nextVowel === 'e') {
            result += LONTARA_VOWELS.e + baseChar;
            i = nextIdx + 1;
          } else if (nextVowel === 'o') {
            result += baseChar + LONTARA_VOWELS.o;
            i = nextIdx + 1;
          } else if (nextVowel === 'a') {
            result += baseChar;
            i = nextIdx + 1;
          } else {
            result += baseChar;
            i = nextIdx;
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        const ch = lower[i];
        if (ch === 'a') {
          result += 'ᨕ';
        } else if (ch === 'i') {
          result += 'ᨕ' + LONTARA_VOWELS.i;
        } else if (ch === 'u') {
          result += 'ᨕ' + LONTARA_VOWELS.u;
        } else if (ch === 'e') {
          result += LONTARA_VOWELS.e + 'ᨕ';
        } else if (ch === 'o') {
          result += 'ᨕ' + LONTARA_VOWELS.o;
        } else {
          result += ch;
        }
        i++;
      }
    }

    return result;
  };

  const lontaraResult = transliterateToLontara(inputText);

  const handleCopy = () => {
    navigator.clipboard.writeText(lontaraResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pepatahBugis = [
    {
      semboyan: "Siri' na Pacce",
      arti: "Harga diri, martabat, dan rasa empati solidaritas kemanusiaan mendalam yang menjadi kehormatan tertinggi penegak.",
      lontara: "ᨔᨗᨑᨗ ᨊ ᨄᨌᨙ"
    },
    {
      semboyan: "Resopa Temmangingngi Malomo Naletei Pammase Dewata",
      arti: "Hanya dengan kerja keras tanpa lelah, kemudahan dan berkah Tuhan Yang Maha Esa akan datang.",
      lontara: "ᨑᨙᨔᨚᨄ ᨈᨙᨆᨂᨗᨂᨗ ᨆᨒᨚᨆᨚ ᨊᨒᨙᨈᨙᨕᨗ ᨄᨆᨔᨙ ᨉᨙᨓᨈ"
    },
    {
      semboyan: "Taro Ada Taro Gau",
      arti: "Kesesuaian mutlak antara perkataan dan perbuatan. Janji seorang Pramuka pantang diingkari.",
      lontara: "ᨈᨑᨚ ᨕᨉ ᨈᨑᨚ ᨁᨕᨘ"
    }
  ];

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#e51c24] flex items-center justify-center border border-amber-300 shrink-0">
            <span className="font-serif font-black text-2xl">ᨕ</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
              Kearifan Lokal Bugis-Makassar
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              Penerjemah Aksara Lontara
            </h2>
            <p className="text-xs text-slate-500">
              Mengenal tulisan pada pita merah Lambang Ambalan La Surullah Petta Lopo
            </p>
          </div>
        </div>
      </div>

      {/* Ribbon on Logo Explanation */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-white p-1 shrink-0 ring-2 ring-amber-400 shadow-sm flex items-center justify-center">
          <img src={LOGO_IMAGE_PATH} alt="Pita Lontara Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono">
            Kaji Lambang Pita Merah
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
            Tulisan Lontara pada Pita Merah Ambalan
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Pada pita merah di bagian bawah perisai logo Ambalan terukir aksara Lontara luhur. Ini menandakan bahwa Pramuka Penegak Gugus Depan 10-035 dan 10-036 menjunjung tinggi warisan budi luhur kesatria Bugis-Makassar: setia kawan, pantang menyerah, dan berani membela kebenaran.
          </p>
        </div>
      </div>

      {/* Transliteration Tool */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Ketik Teks Huruf Latin:
          </label>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik teks latin (misal: La Surullah, Petta Lopo)..."
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-xs font-bold text-slate-900 uppercase"
          />
        </div>

        {/* Lontara Result Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-red-700 to-[#e51c24] text-white border-2 border-amber-400 shadow-md">
          <div className="flex items-center justify-between text-xs text-amber-200 font-mono mb-2">
            <span>TULISAN AKSARA LONTARA:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Lontara'}</span>
            </button>
          </div>

          <div className="text-3xl sm:text-4xl font-serif text-center py-4 tracking-widest text-amber-200 font-bold select-all min-h-[70px]">
            {lontaraResult || '...'}
          </div>

          <p className="text-center text-[11px] text-white/80 italic">
            Transliterasi: "{inputText}"
          </p>
        </div>
      </div>

      {/* Falsafah Bugis */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs space-y-2.5">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Falsafah Luhur Kesatria Bugis-Makassar
        </h3>

        <div className="space-y-2">
          {pepatahBugis.map((p, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 transition-colors">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-xs font-bold text-[#e51c24]">{p.semboyan}</h4>
                <span className="text-lg font-serif text-amber-800 font-bold">{p.lontara}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">{p.arti}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Induk Huruf Lontara Reference */}
      <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-2">
          Induk Huruf Lontara (Ina Sure')
        </h3>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {LONTARA_DICTIONARY.map((item) => (
            <button
              key={item.latin}
              onClick={() => setInputText(prev => prev + ' ' + item.latin.toUpperCase())}
              className="p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-colors text-center"
            >
              <div className="text-2xl font-serif text-slate-900 font-bold">{item.lontara}</div>
              <div className="text-[10px] font-bold text-[#e51c24] uppercase mt-0.5">{item.latin}</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
