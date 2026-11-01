import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Sun, 
  RotateCcw, 
  Copy, 
  Check, 
  Eye, 
  Sparkles, 
  Sliders, 
  HelpCircle 
} from 'lucide-react';
import { MORSE_CODE_TABLE, SEMAPHORE_TABLE } from '../../data/scoutData';

export const SandiMorseView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'morse' | 'semaphore' | 'kotak'>('morse');
  const [inputText, setInputText] = useState('AMBALAN LA SURULLAH');
  const [morseResult, setMorseResult] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [wpm, setWpm] = useState(12); // speed
  const [copied, setCopied] = useState(false);
  const [selectedSemaphore, setSelectedSemaphore] = useState(SEMAPHORE_TABLE[0]);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const stopSignalRef = useRef(false);

  // Encode Text to Morse
  useEffect(() => {
    const clean = inputText.toUpperCase().trim();
    const encoded = clean
      .split('')
      .map(char => MORSE_CODE_TABLE[char] || '?')
      .join(' ');
    setMorseResult(encoded);
  }, [inputText]);

  // Play audio tone
  const playTone = (durationMs: number): Promise<void> => {
    return new Promise((resolve) => {
      if (stopSignalRef.current) {
        resolve();
        return;
      }

      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, ctx.currentTime); // Standard 750 Hz scout morse frequency

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        if (isFlashing) {
          setFlashActive(true);
        }

        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // ignore
          }
          if (isFlashing) setFlashActive(false);
          resolve();
        }, durationMs);
      } catch {
        resolve();
      }
    });
  };

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handlePlayMorse = async () => {
    if (isPlaying) {
      stopSignalRef.current = true;
      setIsPlaying(false);
      setFlashActive(false);
      return;
    }

    stopSignalRef.current = false;
    setIsPlaying(true);

    const unit = 1200 / wpm; // Paris standard unit in ms
    const dotDuration = unit;
    const dashDuration = unit * 3;
    const intraCharPause = unit;
    const interCharPause = unit * 3;
    const wordPause = unit * 7;

    for (let i = 0; i < morseResult.length; i++) {
      if (stopSignalRef.current) break;
      const char = morseResult[i];

      if (char === '.') {
        await playTone(dotDuration);
        await sleep(intraCharPause);
      } else if (char === '-') {
        await playTone(dashDuration);
        await sleep(intraCharPause);
      } else if (char === ' ') {
        await sleep(interCharPause);
      } else if (char === '/') {
        await sleep(wordPause);
      }
    }

    setIsPlaying(false);
    setFlashActive(false);
  };

  const handleCopyMorse = () => {
    navigator.clipboard.writeText(morseResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickPhrases = ['SOS', 'SIAP', 'AMBALAN', 'PENEGAK', 'SALAM PRAMUKA'];

  return (
    <div className="space-y-4 pb-20">
      
      {/* Senter Flash Screen Overlay */}
      {flashActive && (
        <div className="fixed inset-0 z-50 bg-amber-300 pointer-events-none opacity-85 transition-opacity duration-75 flex items-center justify-center">
          <div className="bg-black/80 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold">
            ⚡ SINYAL CAHAYA SENTER SEDANG MEMANCAR
          </div>
        </div>
      )}

      {/* Header card with tab switcher */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
              Komunikasi Isyarat
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
              Laboratorium Sandi & Isyarat Pramuka
            </h2>
            <p className="text-xs text-slate-500">
              Peluit Audio Morse, Lampu Senter, Semaphore & Sandi Kotak
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('morse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'morse'
                  ? 'bg-[#e51c24] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sandi Morse
            </button>
            <button
              onClick={() => setActiveTab('semaphore')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'semaphore'
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semaphore
            </button>
            <button
              onClick={() => setActiveTab('kotak')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'kotak'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sandi Kotak
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'morse' && (
        <div className="space-y-3">
          
          {/* Morse Interactive Converter */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Teks Yang Ingin Disampaikan:</span>
                <span className="text-[10px] text-slate-400 font-mono">{inputText.length} karakter</span>
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik teks latin di sini..."
                rows={2}
                className="w-full mt-1.5 p-3 rounded-xl border-2 border-slate-200 focus:border-amber-400 focus:outline-none text-xs font-bold uppercase tracking-wider text-slate-900 placeholder:normal-case placeholder:font-normal"
              />
            </div>

            {/* Quick Phrases */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-slate-400 shrink-0">Cepat:</span>
              {quickPhrases.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => setInputText(phrase)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#e51c24] border border-amber-300 hover:bg-red-100 shrink-0"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Morse Output Display */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-white border-2 border-amber-400 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                  Kode Morse Hasil Konversi:
                </span>
                <button
                  onClick={handleCopyMorse}
                  className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 font-mono"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-amber-300 break-words leading-relaxed min-h-[40px]">
                {morseResult || '...'}
              </div>
            </div>

            {/* Controls: Audio Play, Torch Flash, WPM */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              
              {/* Play / Stop Button */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handlePlayMorse}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all border ${
                    isPlaying
                      ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                      : 'bg-[#e51c24] hover:bg-[#c9141b] text-white border-amber-400'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Hentikan Isyarat</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-amber-300" />
                      <span>Bunyikan Peluit (Morse)</span>
                    </>
                  )}
                </button>

                {/* Senter Mode Toggle */}
                <button
                  onClick={() => setIsFlashing(!isFlashing)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                    isFlashing
                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title="Aktifkan kedipan layar sebagai senter morse"
                >
                  <Sun className="w-4 h-4" />
                  <span>Senter: {isFlashing ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Speed Slider */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs text-slate-600">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold">Kecepatan:</span>
                <input
                  type="range"
                  min="6"
                  max="20"
                  value={wpm}
                  onChange={(e) => setWpm(Number(e.target.value))}
                  className="w-24 accent-[#e51c24]"
                />
                <span className="font-mono font-bold text-slate-800 text-[11px] w-12">{wpm} WPM</span>
              </div>
            </div>
          </div>

          {/* Tabel Referensi Sandi Morse A-Z */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Tabel Alfabet Sandi Morse Internasional
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(MORSE_CODE_TABLE).filter(([k]) => k !== ' ').map(([letter, code]) => (
                <button
                  key={letter}
                  onClick={() => setInputText(prev => prev + letter)}
                  className="p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-red-50/50 transition-colors text-center group"
                >
                  <span className="text-sm font-extrabold text-slate-900 group-hover:text-[#e51c24]">{letter}</span>
                  <div className="text-[11px] font-mono font-bold text-slate-500 tracking-wider mt-0.5">{code}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'semaphore' && (
        <div className="space-y-3">
          {/* Semaphore Interactive Visualizer */}
          <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Peragaan Bendera Semaphore
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-2">
              Huruf: <span className="text-3xl text-[#e51c24] underline decoration-amber-400">{selectedSemaphore.letter}</span>
            </h3>

            {/* Semaphore Flag Diagram Simulation */}
            <div className="w-48 h-48 mx-auto my-4 relative flex items-center justify-center">
              {/* Center Human Figure */}
              <div className="w-12 h-20 bg-slate-800 rounded-2xl relative shadow-md flex flex-col items-center justify-start pt-2">
                {/* Head */}
                <div className="w-6 h-6 rounded-full bg-amber-200 border-2 border-slate-700 shadow-inner" />
                {/* Torso */}
                <div className="w-8 h-10 bg-[#e51c24] rounded-lg mt-1 border border-amber-400" />
              </div>

              {/* Left Flag Arm */}
              <div
                className="absolute w-24 h-1.5 bg-slate-800 origin-right transition-transform duration-300 right-1/2 top-1/2 -mt-0.5"
                style={{ transform: `rotate(${selectedSemaphore.left}deg)` }}
              >
                {/* Flag Red-Yellow scout flag */}
                <div className="absolute left-0 -top-3 w-7 h-7 bg-gradient-to-tr from-[#e51c24] to-amber-400 border border-slate-900 rounded-sm shadow-sm" />
              </div>

              {/* Right Flag Arm */}
              <div
                className="absolute w-24 h-1.5 bg-slate-800 origin-left transition-transform duration-300 left-1/2 top-1/2 -mt-0.5"
                style={{ transform: `rotate(${selectedSemaphore.right}deg)` }}
              >
                {/* Flag Red-Yellow scout flag */}
                <div className="absolute right-0 -top-3 w-7 h-7 bg-gradient-to-tr from-[#e51c24] to-amber-400 border border-slate-900 rounded-sm shadow-sm" />
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 max-w-sm mx-auto text-xs font-semibold text-amber-950">
              📌 {selectedSemaphore.desc}
            </div>
          </div>

          {/* Alphabet Selector Grid */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 mb-2 font-mono uppercase">
              Pilih Huruf Semaphore:
            </h4>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
              {SEMAPHORE_TABLE.map((s) => (
                <button
                  key={s.letter}
                  onClick={() => setSelectedSemaphore(s)}
                  className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all ${
                    selectedSemaphore.letter === s.letter
                      ? 'bg-[#e51c24] text-white shadow-xs scale-105 border border-amber-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-amber-100'
                  }`}
                >
                  {s.letter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kotak' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Panduan Sandi Kotak I & II</h3>
            <p className="text-xs text-slate-600 mb-4">
              Sandi Kotak I terdiri dari garis bersilang (+) dan silang (X) dengan titik. Sandi Kotak II menggunakan 1 garis silang dengan sampai 2 titik.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border-2 border-slate-200 bg-slate-50">
                <h4 className="font-bold text-[#e51c24] mb-1">Sandi Kotak I</h4>
                <p className="text-slate-600">
                  Huruf pertama tanpa titik, huruf kedua dengan satu titik di dalam ruang bidang garis bersilang (#) dan silang (X).
                </p>
                <div className="mt-2 font-mono text-[11px] p-2 bg-white rounded border border-slate-200 text-slate-700">
                  [A B] [C D] [E F]<br/>
                  [G H] [I J] [K L]<br/>
                  [M N] [O P] [Q R]
                </div>
              </div>

              <div className="p-3 rounded-xl border-2 border-slate-200 bg-slate-50">
                <h4 className="font-bold text-amber-700 mb-1">Sandi Kotak II</h4>
                <p className="text-slate-600">
                  Setiap kotak bidang palang memuat 3 huruf: huruf pertama polos, huruf kedua satu titik, huruf ketiga dua titik.
                </p>
                <div className="mt-2 font-mono text-[11px] p-2 bg-white rounded border border-slate-200 text-slate-700">
                  [ABC] [DEF] [GHI]<br/>
                  [JKL] [MNO] [PQR]<br/>
                  [STU] [VWX] [YZ]
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
