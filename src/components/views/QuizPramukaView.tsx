import React, { useState } from 'react';
import { 
  HelpCircle, 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  ChevronRight, 
  Trophy,
  Flame,
  Brain
} from 'lucide-react';
import { UserAccount } from '../../types';

interface QuizPramukaViewProps {
  currentUser: UserAccount;
  onBackToHome?: () => void;
}

interface Question {
  id: number;
  pertanyaan: string;
  kategori: string;
  pilihan: string[];
  kunci: number;
  penjelasan: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    kategori: 'Sejarah Pramuka',
    pertanyaan: 'Siapakah nama Bapak Pandu Sedunia yang mendirikan gerakan kepanduan pertama kali pada tahun 1907?',
    pilihan: [
      'Robert Baden-Powell',
      'Sri Sultan Hamengkubuwono IX',
      'William F. Cody',
      'Ernest Thompson Seton'
    ],
    kunci: 0,
    penjelasan: 'Lord Robert Baden-Powell mendirikan gerakan kepanduan sedunia setelah perkemahan perdana di Pulau Brownsea, Inggris pada tahun 1907.'
  },
  {
    id: 2,
    kategori: 'Kiasan & Adat Ambalan',
    pertanyaan: 'Pusaka adat Ambalan La Surullah Petta Lopo yang melambangkan keberanian, keteguhan hati, dan kearifan Bugis-Makassar adalah?',
    pilihan: [
      'Keris Lekuk Tujuh',
      'Badik Pusaka Ambalan',
      'Tombak Berambut Kuda',
      'Pedang Katana'
    ],
    kunci: 1,
    penjelasan: 'Badik Pusaka Ambalan adalah simbol kehormatan yang dijiwai falsafah Siri\' na Pacce bagi seluruh warga Ambalan La Surullah.'
  },
  {
    id: 3,
    kategori: 'Dasa Darma',
    pertanyaan: 'Darma ke-4 dalam Dasa Darma Pramuka berbunyi?',
    pilihan: [
      'Cinta alam dan kasih sayang sesama manusia',
      'Patriot yang sopan dan kesatria',
      'Patuh dan suka bermusyawarah',
      'Rela menolong dan tabah'
    ],
    kunci: 2,
    penjelasan: 'Dasa Darma ke-4 adalah: "Patuh dan suka bermusyawarah".'
  },
  {
    id: 4,
    kategori: 'Sandi Morse',
    pertanyaan: 'Dalam sandi morse, kombinasi titik dan garis untuk huruf "S" adalah?',
    pilihan: [
      '• • • (tiga titik)',
      '— — — (tiga garis)',
      '• — • (titik garis titik)',
      '— • — (garis titik garis)'
    ],
    kunci: 0,
    penjelasan: 'Huruf "S" dalam Sandi Morse dilambangkan dengan tiga titik (• • •), sedangkan huruf "O" adalah tiga garis (— — —).'
  },
  {
    id: 5,
    kategori: 'Pionering & Tali Temali',
    pertanyaan: 'Simpul yang digunakan untuk mengikatkan tali pada tiang dan memulai membuat suatu ikatan seperti ikatan palang atau silang adalah?',
    pilihan: [
      'Simpul Mati',
      'Simpul Pangkal',
      'Simpul Jangkar',
      'Simpul Kembar'
    ],
    kunci: 1,
    penjelasan: 'Simpul pangkal berfungsi untuk mengawali dan mengakhiri suatu ikatan pionering tiang atau tongkat.'
  },
  {
    id: 6,
    kategori: 'Golongan Penegak',
    pertanyaan: 'Berapakah usia peserta didik untuk tingkatan Pramuka Penegak?',
    pilihan: [
      '11 sampai 15 tahun',
      '16 sampai 20 tahun',
      '21 sampai 25 tahun',
      '7 sampai 10 tahun'
    ],
    kunci: 1,
    penjelasan: 'Sesuai UU Gerakan Pramuka No. 12 Tahun 2010, jenjang usia Pramuka Penegak adalah 16 sampai 20 tahun.'
  },
  {
    id: 7,
    kategori: 'Satuan Penegak',
    pertanyaan: 'Satuan terkecil dalam Ambalan Penegak yang beranggotakan 4 sampai 8 orang disebut?',
    pilihan: [
      'Barung',
      'Regu',
      'Sangga',
      'Reka'
    ],
    kunci: 2,
    penjelasan: 'Sangga adalah satuan terkecil dalam penegak (Perintis, Penegas, Pendobrak, Pencoba, Pelaksana).'
  },
  {
    id: 8,
    kategori: 'Kecakapan Penegak',
    pertanyaan: 'Tingkatan Syarat Kecakapan Umum (SKU) Pramuka Penegak terdiri atas dua tingkatan, yaitu?',
    pilihan: [
      'Mula dan Bantu',
      'Ramu dan Rakit',
      'Bantara dan Laksana',
      'Purwa dan Madya'
    ],
    kunci: 2,
    penjelasan: 'Tingkatan SKU Penegak adalah Penegak Bantara dan Penegak Laksana, sebelum dapat menempuh Pramuka Garuda.'
  }
];

export const QuizPramukaView: React.FC<QuizPramukaViewProps> = ({ currentUser, onBackToHome }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIndex];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === currentQ.kunci) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < QUIZ_QUESTIONS.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  const getRankBadge = () => {
    const pct = (score / QUIZ_QUESTIONS.length) * 100;
    if (pct === 100) return { title: 'Pandu Teladan Utama (Sempurna)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (pct >= 75) return { title: 'Penegak Cakap & Berprestasi', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (pct >= 50) return { title: 'Penegak Tangguh', color: 'text-amber-800 bg-amber-50 border-amber-300' };
    return { title: 'Semangat Terus Berlatih', color: 'text-slate-700 bg-slate-50 border-slate-300' };
  };

  return (
    <div className="space-y-4 pb-24 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#e51c24] flex items-center justify-center border border-red-200 shadow-xs shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#e51c24] text-white font-mono tracking-wider">
              Uji Wawasan Penegak
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              Quiz Kepramukaan
            </h1>
            <p className="text-xs text-slate-500">
              Ambalan La Surullah Petta Lopo • 8 Soal Pilihan Ganda
            </p>
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          
          {/* Progress Strip */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Soal {currentIndex + 1} dari {QUIZ_QUESTIONS.length}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
              {currentQ.kategori}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div 
              className="h-full bg-[#e51c24] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed pt-1">
            {currentQ.pertanyaan}
          </h2>

          {/* Options */}
          <div className="space-y-2 pt-2">
            {currentQ.pilihan.map((pil, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.kunci;

              let btnStyle = 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-800';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                } else if (isSelected) {
                  btnStyle = 'border-red-500 bg-red-50 text-red-950 font-bold';
                } else {
                  btnStyle = 'border-slate-200 bg-white text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelect(idx)}
                  className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-left transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{pil}</span>
                  </div>

                  {isAnswered && (
                    <div className="shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isSelected ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered */}
          {isAnswered && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1 animate-in fade-in duration-200">
              <span className="font-bold text-[#e51c24] block font-mono text-[10px] uppercase">
                Penjelasan Materi:
              </span>
              <p className="leading-relaxed">{currentQ.penjelasan}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-2xl bg-[#e51c24] hover:bg-[#c9141b] text-white font-black text-xs sm:text-sm shadow-md border border-red-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>{currentIndex + 1 === QUIZ_QUESTIONS.length ? 'Lihat Hasil Akhir' : 'Soal Selanjutnya'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

        </div>
      ) : (
        /* Finished Result Card */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-red-50 text-[#e51c24] flex items-center justify-center mx-auto border-2 border-red-200">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs text-slate-500 font-bold uppercase font-mono">
              Hasil Skor Quiz
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              {score} / {QUIZ_QUESTIONS.length}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Nilai Anda: <strong>{Math.round((score / QUIZ_QUESTIONS.length) * 100)}%</strong>
            </p>
          </div>

          <div className={`p-3 rounded-2xl border ${getRankBadge().color} text-xs font-bold`}>
            {getRankBadge().title}
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={handleRestart}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Quiz</span>
            </button>

            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-5 py-2.5 rounded-xl bg-[#e51c24] text-white font-bold text-xs border border-red-700 hover:bg-[#c9141b] transition-all"
              >
                Kembali ke Beranda
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
