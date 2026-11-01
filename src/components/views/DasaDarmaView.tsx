import React from 'react';
import { Flame, ShieldCheck, Heart, Sparkles, BookOpen } from 'lucide-react';

export const DasaDarmaView: React.FC = () => {
  const dasaDarma = [
    {
      no: 1,
      title: 'Taqwa kepada Tuhan Yang Maha Esa',
      desc: 'Menjalankan perintah Tuhan dan menjauhi larangan-Nya, beribadah tepat waktu, serta menghormati perbedaan keyakinan sesama anggota.',
      icon: '✨'
    },
    {
      no: 2,
      title: 'Cinta alam dan kasih sayang sesama manusia',
      desc: 'Menjaga kelestarian lingkungan hidup, tidak merusak alam saat perkemahan, dan senantiasa menolong sesama yang tertimpa kesusahan.',
      icon: '🌿'
    },
    {
      no: 3,
      title: 'Patriot yang sopan dan kesatria',
      desc: 'Mencintai tanah air, membela kehormatan bangsa, bersikap sopan santun dalam tutur kata, dan berjiwa ksatria mengakui kesalahan.',
      icon: '🛡️'
    },
    {
      no: 4,
      title: 'Patuh dan suka bermusyawarah',
      desc: 'Menaati tata tertib hukum dan ambalan, serta mendahulukan musyawarah untuk mufakat dalam setiap pengambilan keputusan sangga.',
      icon: '🤝'
    },
    {
      no: 5,
      title: 'Rela menolong dan tabah',
      desc: 'Memberikan bantuan tanpa pamrih kepada yang membutuhkan dan tabah menghadapi rintangan saat penjelajahan maupun ujian hidup.',
      icon: '🤲'
    },
    {
      no: 6,
      title: 'Rajin, terampil, dan gembira',
      desc: 'Pantang bermalas-malasan, tekun mengasah keterampilan pionering dan teknologi, serta selalu menyebarkan kegembiraan di ambalan.',
      icon: '⚡'
    },
    {
      no: 7,
      title: 'Hemat, cermat, dan bersahaja',
      desc: 'Tidak boros, teliti dalam merencanakan perlengkapan perkemahan, dan hidup sederhana penuh rasa syukur.',
      icon: '🪙'
    },
    {
      no: 8,
      title: 'Disiplin, berani, dan setia',
      desc: 'Tepat waktu dalam segala kegiatan ambalan, berani membela kebenaran walaupun pahit, dan setia pada janji kepramukaan.',
      icon: '⚔️'
    },
    {
      no: 9,
      title: 'Bertanggung jawab dan dapat dipercaya',
      desc: 'Melaksanakan amanah sangga dengan tuntas, jujur dalam kata dan perbuatan (Taro Ada Taro Gau).',
      icon: '⭐'
    },
    {
      no: 10,
      title: 'Suci dalam pikiran, perkataan, dan perbuatan',
      desc: 'Menjaga kemurnian hati, tidak berprasangka buruk, menjaga lisan dari fitnah, dan bertindak selaras dengan nurani luhur.',
      icon: '🕊️'
    }
  ];

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-[#e51c24] flex items-center justify-center border border-amber-300 shrink-0">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#e51c24] border border-red-200">
              Kode Kehormatan Pramuka
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              Tri Satya & Dasa Darma
            </h2>
            <p className="text-xs text-slate-500">
              Landasan moral, janji, dan pedoman hidup Pramuka Penegak
            </p>
          </div>
        </div>
      </div>

      {/* Tri Satya Card */}
      <div className="bg-gradient-to-br from-[#e51c24] to-[#ab1016] text-white rounded-3xl p-5 border-2 border-amber-400 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
            ⚜️ IKRAR JANJI PRAMUKA
          </span>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white text-[#e51c24]">
            TRI SATYA
          </span>
        </div>

        <h3 className="text-sm font-extrabold tracking-wide uppercase text-amber-200">
          Demi kehormatanku aku berjanji akan bersungguh-sungguh:
        </h3>

        <div className="space-y-2 text-xs font-medium leading-relaxed">
          <div className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/10">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              1
            </span>
            <p>
              Menjalankan kewajibanku terhadap <strong>Tuhan Yang Maha Esa</strong>, Negara Kesatuan Republik Indonesia dan mengamalkan Pancasila.
            </p>
          </div>

          <div className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/10">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              2
            </span>
            <p>
              Menolong sesama hidup dan <strong>ikut serta membangun masyarakat</strong>.
            </p>
          </div>

          <div className="flex items-start gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/10">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              3
            </span>
            <p>
              Menepati <strong>Dasa Darma</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 10 Dasa Darma List */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">
            Dasa Darma Pramuka (10 Ketentuan Moral)
          </h3>
          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Dilambangkan 10 Helai Sayap Emas Logo
          </span>
        </div>

        <div className="space-y-2">
          {dasaDarma.map((darma) => (
            <div
              key={darma.no}
              className="p-3 rounded-xl border-l-4 border-l-[#e51c24] border-t border-r border-b border-slate-200 bg-slate-50 hover:bg-white transition-colors space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{darma.icon}</span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {darma.no}. {darma.title}
                </h4>
              </div>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                {darma.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
