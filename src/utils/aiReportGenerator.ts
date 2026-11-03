import { KegiatanEvaluation, ProgramKerjaItem } from '../types';

export interface GeneratedReportNarrative {
  paragrafLatarBelakang: string;
  paragrafKehadiran: string;
  paragrafKepuasan: string;
  paragrafEvaluasiKekurangan: string;
  rekomendasiTindakLanjut: string;
  teksLengkap: string;
}

/**
 * Menyusun narasi resmi laporan kegiatan kepramukaan menggunakan AI (Gemini 3.8 Flash via backend server).
 */
export async function generateActivityReportWithAi(
  kegiatan: ProgramKerjaItem,
  evaluations: KegiatanEvaluation[],
  _periodTitle: string = 'Laporan Kegiatan'
): Promise<GeneratedReportNarrative> {
  const totalAnggota = evaluations.length;
  const totalHadir = evaluations.filter((e) => e.statusKehadiran === 'Hadir').length;
  const totalIzin = evaluations.filter((e) => e.statusKehadiran === 'Izin').length;
  const totalSakit = evaluations.filter((e) => e.statusKehadiran === 'Sakit').length;

  const ratings = evaluations.map((e) => e.rating || 5);
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
    : '5.0';

  const kelebihanList = evaluations.map((e) => e.kelebihan).filter(Boolean);
  const kekuranganList = evaluations.map((e) => e.kekurangan).filter(Boolean);

  try {
    const response = await fetch('/api/ai/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kegiatan,
        evaluations,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.text && data.text.trim().length > 50) {
        return parseGeneratedText(data.text, kegiatan, totalHadir, avgRating);
      }
    }
  } catch (error) {
    console.warn('Backend Gemini API call fallback to smart deterministic narrative:', error);
  }

  // Deterministic high-fidelity fallback generator if AI key or server is offline
  return generateDeterministicNarrative(kegiatan, totalAnggota, totalHadir, totalIzin, totalSakit, avgRating, kelebihanList, kekuranganList);
}

function parseGeneratedText(
  text: string, 
  kegiatan: ProgramKerjaItem, 
  totalHadir: number, 
  avgRating: string
): GeneratedReportNarrative {
  return {
    paragrafLatarBelakang: `Pelaksanaan agenda "${kegiatan.nama}" telah diselenggarakan sesuai kalender kerja Ambalan La Surullah Petta Lopo Gudep 10-035 & 10-036 dengan target sasaran ${kegiatan.sasaran}.`,
    paragrafKehadiran: `Berdasarkan rekapitulasi presensi digital, tercatat sebanyak ${totalHadir} anggota aktif berpartisipasi penuh dalam seluruh rangkaian latihan dan kegiatan.`,
    paragrafKepuasan: `Indeks kepuasan anggota mencapai rata-rata skor ${avgRating} / 5.0 bintang, mencerminkan tingginya antusiasme serta relevansi materi yang disajikan oleh dewan ambalan.`,
    paragrafEvaluasiKekurangan: `Terdapat beberapa catatan konstruktif dari penegak terkait ketepatan alokasi waktu dan kelengkapan sarana pendukung lapangan.`,
    rekomendasiTindakLanjut: `Dewan Ambalan merekomendasikan koordinasi logistik yang lebih terencana dan pemantapan simulasi teknis sebelum pelaksanaan kegiatan berikutnya.`,
    teksLengkap: text
  };
}

function generateDeterministicNarrative(
  kegiatan: ProgramKerjaItem,
  _totalAnggota: number,
  totalHadir: number,
  totalIzin: number,
  totalSakit: number,
  avgRating: string,
  kelebihanList: string[],
  kekuranganList: string[]
): GeneratedReportNarrative {
  const contohKelebihan = kelebihanList.length > 0 
    ? kelebihanList.slice(0, 3).join(', ') 
    : 'kelancaran penyampaian materi, kekompakan antar sangga, dan suasana persaudaraan yang erat';

  const contohKekurangan = kekuranganList.length > 0 
    ? kekuranganList.slice(0, 3).join(', ') 
    : 'manajemen alokasi waktu sesi lapangan dan penyediaan perlengkapan teknis pendukung';

  const p1 = `Pelaksanaan agenda "${kegiatan.nama}" pada masa bakti 2026/2027 telah terselenggara dengan lancar sesuai rancangan program kerja Ambalan La Surullah Petta Lopo Pangkalan Gudep 10-035 & 10-036. Agenda ini difokuskan pada ${kegiatan.sasaran} guna menumbuhkan kemandirian, kedisiplinan, dan jiwa kepemimpinan penegak.`;

  const p2 = `Berdasarkan rekapitulasi data presensi digital terpadu, agenda ini diikuti oleh ${totalHadir} anggota penegak yang hadir langsung, didukung keterbukaan presensi bagi anggota yang berhalangan (${totalIzin} izin, ${totalSakit} sakit). Tingkat kehadiran dan keaktifan menunjukkan komitmen kuat seluruh anggota sangga dalam menyukseskan program kerja ambalan.`;

  const p3 = `Tingkat kepuasan peserta terhadap pelaksanaan kegiatan tercatat sangat tinggi, dengan perolehan skor rata-rata sebesar ${avgRating} dari skala 5.0 bintang. Dalam kolom evaluasi, anggota mengapresiasi sejumlah kelebihan utama, antara lain: ${contohKelebihan}. Hal ini mencerminkan keberhasilan perancangan konsep kegiatan yang digagas oleh dewan ambalan.`;

  const p4 = `Adapun evaluasi kekurangan dan kendala lapangan yang dihimpun meliputi: ${contohKekurangan}. Guna menjamin peningkatan mutu pembinaan berkelanjutan, Dewan Kehormatan dan Pembina Ambalan merekomendasikan penajaman simulasi teknis serta efisiensi waktu pada agenda berikutnya.`;

  const fullText = `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;

  return {
    paragrafLatarBelakang: p1,
    paragrafKehadiran: p2,
    paragrafKepuasan: p3,
    paragrafEvaluasiKekurangan: p4,
    rekomendasiTindakLanjut: `Melakukan evaluasi berkala per triwulan dan penyempurnaan inventaris logistik ambalan.`,
    teksLengkap: fullText
  };
}
