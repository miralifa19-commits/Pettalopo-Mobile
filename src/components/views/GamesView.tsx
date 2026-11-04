import React, { useState } from 'react';
import { Gamepad2, Sparkles, Volume2, HelpCircle, Trophy, RefreshCw, Check, X, ArrowLeft, Eye } from 'lucide-react';
import { MenuHeaderCard } from '../common/MenuHeaderCard';

type GameMode = 'menu' | 'morse' | 'semaphore' | 'kim';

interface GamesViewProps {
  onBack: () => void;
}

export const GamesView: React.FC<GamesViewProps> = ({ onBack }) => {
  const [activeGame, setActiveGame] = useState<GameMode>('menu');

  // --- GAME 1: TEBAK MORSE ---
  const MORSE_QUESTIONS = [
    { code: '· -', answer: 'A', options: ['A', 'B', 'N', 'T'] },
    { code: '- · · ·', answer: 'B', options: ['D', 'B', 'H', 'J'] },
    { code: '- · - ·', answer: 'C', options: ['C', 'Z', 'Q', 'X'] },
    { code: '· · ·', answer: 'S', options: ['S', 'O', 'H', 'E'] },
    { code: '- - -', answer: 'O', options: ['M', 'O', 'S', 'T'] },
    { code: '· - - ·', answer: 'P', options: ['P', 'Q', 'L', 'F'] }
  ];
  const [morseIndex, setMorseIndex] = useState(0);
  const [morseScore, setMorseScore] = useState(0);
  const [morseFeedback, setMorseFeedback] = useState<boolean | null>(null);

  const handleAnswerMorse = (option: string) => {
    const isCorrect = option === MORSE_QUESTIONS[morseIndex].answer;
    setMorseFeedback(isCorrect);
    if (isCorrect) setMorseScore(s => s + 10);
    setTimeout(() => {
      setMorseFeedback(null);
      setMorseIndex((i) => (i + 1) % MORSE_QUESTIONS.length);
    }, 700);
  };

  // --- GAME 2: TEBAK SEMAPHORE ---
  const SEMAPHORE_QUESTIONS = [
    { question: 'Kedua tangan membentuk huruf V ke atas (arah jam 10 dan jam 2)', answer: 'U', options: ['U', 'V', 'N', 'D'] },
    { question: 'Kedua tangan direntangkan mendatar horizontal ke samping', answer: 'R', options: ['R', 'S', 'B', 'E'] },
    { question: 'Tangan kiri tegak lurus ke atas, tangan kanan mendatar ke kiri', answer: 'P', options: ['P', 'T', 'O', 'K'] },
    { question: 'Kedua tangan serong ke bawah membentuk huruf V terbalik', answer: 'N', options: ['N', 'A', 'M', 'G'] },
    { question: 'Tangan kanan tegak ke atas, tangan kiri serong kiri bawah', answer: 'K', options: ['K', 'I', 'L', 'E'] }
  ];
  const [semaphoreIndex, setSemaphoreIndex] = useState(0);
  const [semaphoreScore, setSemaphoreScore] = useState(0);
  const [semaphoreFeedback, setSemaphoreFeedback] = useState<boolean | null>(null);

  const handleAnswerSemaphore = (option: string) => {
    const isCorrect = option === SEMAPHORE_QUESTIONS[semaphoreIndex].answer;
    setSemaphoreFeedback(isCorrect);
    if (isCorrect) setSemaphoreScore(s => s + 10);
    setTimeout(() => {
      setSemaphoreFeedback(null);
      setSemaphoreIndex((i) => (i + 1) % SEMAPHORE_QUESTIONS.length);
    }, 700);
  };

  // --- GAME 3: GAME KIM (MENGINGAT PERALATAN PRAMUKA) ---
  const KIM_ITEMS = ['Kompas', 'Peluit', 'Tali Pramuka', 'Tongkat', 'Buku Saku', 'Pita Merah Putih', 'Pisau Pandu', 'Senter'];
  const [kimStep, setKimStep] = useState<'view' | 'guess' | 'result'>('view');
  const [kimCountdown, setKimCountdown] = useState(5);
  const [selectedKimItems, setSelectedKimItems] = useState<string[]>([]);

  const startKimGame = () => {
    setKimStep('view');
    setSelectedKimItems([]);
    setKimCountdown(5);
    const interval = setInterval(() => {
      setKimCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setKimStep('guess');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const ALL_KIM_OPTIONS = [
    'Kompas', 'Peluit', 'Tali Pramuka', 'Tongkat', 'Buku Saku', 'Pita Merah Putih', 'Pisau Pandu', 'Senter',
    'Kamera', 'Sepatu Bot', 'Payung', 'Jam Tangan'
  ];

  const toggleKimSelection = (item: string) => {
    if (selectedKimItems.includes(item)) {
      setSelectedKimItems(prev => prev.filter(i => i !== item));
    } else {
      setSelectedKimItems(prev => [...prev, item]);
    }
  };

  return (
    <div className="space-y-4 pb-24 font-sans animate-in fade-in duration-150">
      <MenuHeaderCard
        title="Games Pramuka"
        subtitle={
          activeGame === 'menu' 
            ? 'Uji ketangkasan & asah keterampilan kepanduan'
            : activeGame === 'morse'
            ? 'Game Tebak Sandi Morse'
            : activeGame === 'semaphore'
            ? 'Game Tebak Isyarat Semaphore'
            : 'Game Kim (Daya Ingat Pramuka)'
        }
        onBack={() => {
          if (activeGame !== 'menu') {
            setActiveGame('menu');
          } else {
            onBack();
          }
        }}
      />

      {activeGame === 'menu' && (
        <div className="space-y-3">
          {/* Card 1: Morse */}
          <div 
            onClick={() => { setActiveGame('morse'); setMorseScore(0); setMorseIndex(0); }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-red-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-[#c81e28] text-xl font-black">
                ·—
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Tebak Sandi Morse</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tebak huruf dari kode titik dan garis Morse.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#c81e28]">Main &rarr;</span>
          </div>

          {/* Card 2: Semaphore */}
          <div 
            onClick={() => { setActiveGame('semaphore'); setSemaphoreScore(0); setSemaphoreIndex(0); }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-red-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 text-xl font-black">
                🚩
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Tebak Isyarat Semaphore</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kenali posisi lengan dan bendera Semaphore.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600">Main &rarr;</span>
          </div>

          {/* Card 3: Game Kim */}
          <div 
            onClick={() => { setActiveGame('kim'); startKimGame(); }}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-red-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 text-xl font-black">
                👁️
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Game Kim (Daya Ingat)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latihan mengingat perlengkapan regu penegak.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600">Main &rarr;</span>
          </div>
        </div>
      )}

      {/* GAME 1: MORSE */}
      {activeGame === 'morse' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Soal {morseIndex + 1} dari {MORSE_QUESTIONS.length}</span>
            <span className="text-[#c81e28]">Skor: {morseScore}</span>
          </div>

          <div className="py-8 bg-slate-900 text-amber-400 rounded-2xl text-center shadow-inner">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">Kode Morse:</span>
            <span className="text-4xl font-mono font-black tracking-widest">{MORSE_QUESTIONS[morseIndex].code}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {MORSE_QUESTIONS[morseIndex].options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswerMorse(opt)}
                className={`py-3.5 rounded-xl border text-lg font-black transition-all ${
                  morseFeedback !== null && opt === MORSE_QUESTIONS[morseIndex].answer
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-red-50 hover:border-red-300 active:scale-95'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAME 2: SEMAPHORE */}
      {activeGame === 'semaphore' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Soal {semaphoreIndex + 1} dari {SEMAPHORE_QUESTIONS.length}</span>
            <span className="text-amber-600">Skor: {semaphoreScore}</span>
          </div>

          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <span className="text-xs uppercase tracking-wider text-amber-800 font-bold block mb-1">Posisi Bendera:</span>
            <p className="text-sm font-extrabold text-slate-900 leading-snug">
              &ldquo;{SEMAPHORE_QUESTIONS[semaphoreIndex].question}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {SEMAPHORE_QUESTIONS[semaphoreIndex].options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswerSemaphore(opt)}
                className={`py-3 rounded-xl border text-lg font-black transition-all ${
                  semaphoreFeedback !== null && opt === SEMAPHORE_QUESTIONS[semaphoreIndex].answer
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-amber-100 hover:border-amber-300 active:scale-95'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAME 3: KIM */}
      {activeGame === 'kim' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {kimStep === 'view' && (
            <div className="text-center space-y-4 py-2">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                Ingat perlengkapan ini dalam waktu: {kimCountdown} detik!
              </span>
              <div className="grid grid-cols-2 gap-2">
                {KIM_ITEMS.map((item) => (
                  <div key={item} className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800">
                    📦 {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {kimStep === 'guess' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 text-center">
                Pilih perlengkapan yang tadi kamu lihat ({selectedKimItems.length}/{KIM_ITEMS.length} dipilih):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_KIM_OPTIONS.map((opt) => {
                  const isSelected = selectedKimItems.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleKimSelection(opt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        isSelected 
                          ? 'bg-[#c81e28] text-white border-[#c81e28]' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {opt}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setKimStep('result')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700"
              >
                Periksa Jawaban
              </button>
            </div>
          )}

          {kimStep === 'result' && (
            <div className="text-center space-y-3 py-3">
              <Trophy className="mx-auto text-amber-500" size={36} />
              <h4 className="text-base font-black text-slate-900">
                Kamu berhasil mengingat {selectedKimItems.filter(i => KIM_ITEMS.includes(i)).length} dari {KIM_ITEMS.length} benda!
              </h4>
              <button
                type="button"
                onClick={startKimGame}
                className="px-4 py-2 rounded-xl bg-[#c81e28] text-white text-xs font-bold"
              >
                Main Ulang
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
