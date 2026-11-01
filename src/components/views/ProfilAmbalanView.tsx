import React, { useState } from 'react';
import { Shield, Sparkles, BookOpen, Users, Compass, ChevronRight, Award, Flame } from 'lucide-react';
import { LOGO_IMAGE_PATH, FILOSOFI_LOGO, SEJARAH_TOKOH } from '../../data/scoutData';
import { UserProfile } from '../../types';

interface ProfilAmbalanViewProps {
  profile?: UserProfile;
}

export const ProfilAmbalanView: React.FC<ProfilAmbalanViewProps> = () => {
  const [activeElement, setActiveElement] = useState(FILOSOFI_LOGO[0]);

  const dewanAmbalan = [
    { jabatan: 'Pradana Putra', nama: 'Amiruddin S.', gudep: '10-035', peran: 'Ketua Dewan Ambalan Satuan Putra' },
    { jabatan: 'Pradana Putri', nama: 'Siti Nur Aisyah', gudep: '10-036', peran: 'Ketua Dewan Ambalan Satuan Putri' },
    { jabatan: 'Kerani (Sekretaris)', nama: 'Muh. Fikri Haikal', gudep: '10-035/036', peran: 'Ketertiban Administrasi & Surat Menyurat' },
    { jabatan: 'Hartaka (Bendahara)', nama: 'Nur Fadilah', gudep: '10-035/036', peran: 'Pengelolaan Keuangan & Iuran Sangga' },
    { jabatan: 'Pemangku Adat', nama: 'Andi Baso Pratama', gudep: '10-035/036', peran: 'Penjaga Tradisi, Adat & Sandi Ambalan' }
  ];

  const adatAmbalanRules = [
    'Menjunjung tinggi kehormatan Ambalan, bangsa, dan agama dengan senantiasa berpegang teguh pada prinsip "Siri\' na Pacce".',
    'Setiap warga ambalan wajib saling menghormati, mengutamakan tabayyun dan musyawarah mufakat dalam menyelesaikan permasalahan.',
    'Pusaka Ambalan berupa Badik dan Panji hanya diarak serta dihunus pada upacara resmi pembukaan dan penutupan kegiatan sakral ambalan.',
    'Menjaga kebersihan sanggar, kerapian atribut berseragam pramuka lengkap sesuai petunjuk penyelenggaraan Kwartir Nasional.',
    'Selalu menjaga shalat berjamaah atau ibadah tepat waktu dan bersikap ramah, sopan santun kepada masyarakat sekitar.'
  ];

  return (
    <div className="space-y-4 pb-20">
      
      {/* Top Banner Profile */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm text-center relative overflow-hidden">
        <div className="w-32 h-32 mx-auto rounded-3xl bg-white p-2 border border-slate-200 shadow-lg mb-3">
          <img
            src={LOGO_IMAGE_PATH}
            alt="Lambang Ambalan La Surullah Petta Lopo"
            className="w-full h-full object-contain"
          />
        </div>

        <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#e51c24] text-white font-mono shadow-xs">
          GUGUS DEPAN 10-035 & 10-036
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
          Ambalan La Surullah <br />
          <span className="text-[#e51c24]">Petta Lopo</span>
        </h2>

        <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
          Keluarga Besar Pramuka Penegak yang berakar pada kearifan luhur pejuang Bugis-Makassar, berwatak kesatria, berani, mandiri, dan berbakti bagi nusa dan bangsa.
        </p>

        {/* Lis Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 text-[#e51c24]">
            <span className="w-2 h-2 rounded-full bg-[#e51c24]" /> Satuan Putra: 10-035
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Satuan Putri: 10-036
          </span>
        </div>
      </div>

      {/* Interactive Emblem Explorer (Klik Elemen Lambang) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-100 shadow-xs space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            Kiasan Dasar Lambang
          </span>
          <h3 className="text-base font-extrabold text-slate-900 mt-1">
            Eksplorasi Makna Filosofis Logo Ambalan
          </h3>
          <p className="text-xs text-slate-500">
            Pilih elemen lambang di bawah untuk membaca arti filosofinya
          </p>
        </div>

        {/* Selected Element Feature Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 via-white to-amber-50 border-2 border-amber-400 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-extrabold text-[#e51c24]">
              {activeElement.title}
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-normal">
            {activeElement.description}
          </p>
        </div>

        {/* Element Selector Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {FILOSOFI_LOGO.map((item) => (
            <button
              key={item.element}
              onClick={() => setActiveElement(item)}
              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                activeElement.element === item.element
                  ? 'bg-[#e51c24] text-white border-amber-400 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-slate-50'
              }`}
            >
              <span className="line-clamp-2">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sejarah Tokoh La Surullah Petta Lopo */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            ⚔️
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Riwayat Tokoh: {SEJARAH_TOKOH.tokoh}
            </h3>
            <p className="text-[11px] text-[#e51c24] font-bold">{SEJARAH_TOKOH.gelar}</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {SEJARAH_TOKOH.kisah}
        </p>

        {/* 5 Nilai Teladan Kesatria */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            5 Nilai Teladan Utama bagi Anggota Ambalan:
          </h4>
          <div className="space-y-1.5">
            {SEJARAH_TOKOH.nilaiTeladan.map((nilai, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="text-[#e51c24] font-bold">▸</span>
                <span>{nilai}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Struktur Pengurus Dewan Ambalan */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#e51c24]" />
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">
            Struktur Dewan Ambalan (Masa Bakti Berjalan)
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {dewanAmbalan.map((dewan, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-slate-900">{dewan.jabatan}</h4>
                <p className="text-[11px] text-slate-500">{dewan.peran}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-[#e51c24]">{dewan.nama}</span>
                <p className="text-[10px] font-mono text-slate-400">{dewan.gudep}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adat Ambalan */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-amber-400 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#e51c24]" />
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-mono">
            Ketentuan Adat Ambalan La Surullah Petta Lopo
          </h3>
        </div>

        <div className="space-y-2">
          {adatAmbalanRules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
