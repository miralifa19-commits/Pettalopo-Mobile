import { ProgramKerjaItem } from '../types';

export interface AskKakCikalParams {
  prompt: string;
  programKerjaList?: ProgramKerjaItem[];
  actionType?: 'undangan' | 'rancang' | 'saran' | 'chat';
  selectedProker?: ProgramKerjaItem;
}

export async function askKakCikalAI({
  prompt,
  programKerjaList = [],
  actionType,
  selectedProker
}: AskKakCikalParams): Promise<string> {
  try {
    const res = await fetch('/api/ai/kak-cikal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, programKerjaList, actionType, selectedProker })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    }
  } catch (err) {
    console.warn('API call to /api/ai/kak-cikal failed, falling back to local scout knowledge:', err);
  }

  // Deterministic Scout AI fallback
  if (actionType === 'undangan' && selectedProker) {
    return `*GERAKAN PRAMUKA GUGUS DEPAN 10-035 & 10-036*
*AMBALAN LA SURULLAH PETTA LOPO*
------------------------------------------
Salam Pramuka! ⚜️

Kepada Yth.
Kakak-kakak Anggota Ambalan La Surullah Petta Lopo
di Tempat

Sehubungan dengan pelaksanaan program kerja ambalan, kami mengundang kehadiran Kakak-kakak pada:

📅 *Kegiatan:* ${selectedProker.nama}
🏷️ *Kategori:* ${selectedProker.tipe || 'Kegiatan'}
🗓️ *Waktu:* ${selectedProker.waktuPelaksanaan}
📍 *Tempat:* ${selectedProker.tempat || 'Sanggar Pramuka Gugus Depan'}
👔 *Seragam:* ${selectedProker.seragam || 'Seragam Pramuka Lengkap'}
👥 *Sasaran:* ${selectedProker.sasaran || 'Seluruh Penegak'}

*Catatan Penting:*
1. Harap hadir 15 menit sebelum apel dimulai untuk presensi sangga.
2. Membawa perlengkapan pribadi dan alat tulis pramuka.
3. Menjunjung tinggi adat ambalan dan tata tertib kegiatan.

Demikian undangan ini kami sampaikan. Atas kesiapan dan partisipasi aktif Kakak-kakak diucapkan terima kasih.

*Satyaku Kudarmakan, Darmaku Kubaktikan*
*Dewan Ambalan La Surullah Petta Lopo*`.trim();
  }

  const lower = prompt.toLowerCase();
  if (lower.includes('undangan')) {
    const proker = selectedProker || programKerjaList[0];
    if (proker) {
      return `*GERAKAN PRAMUKA GUGUS DEPAN 10-035 & 10-036*
*AMBALAN LA SURULLAH PETTA LOPO*
------------------------------------------
Salam Pramuka! ⚜️

Undangan Resmi Kegiatan Ambalan:

📅 *Kegiatan:* ${proker.nama}
🗓️ *Waktu:* ${proker.waktuPelaksanaan}
📍 *Tempat:* ${proker.tempat || 'Pangkalan Gugus Depan'}
👔 *Seragam:* ${proker.seragam || 'Seragam Pramuka Lengkap'}
👥 *Sasaran:* ${proker.sasaran || 'Seluruh Anggota'}

Mari bersama kita sukseskan kegiatan ini dengan semangat gotong royong dan kebersamaan!

*Satyaku Kudarmakan, Darmaku Kubaktikan*
*Dewan Ambalan La Surullah Petta Lopo*`.trim();
    }
  }

  if (lower.includes('rancang') || lower.includes('kegiatan') || lower.includes('latihan')) {
    return `Salam Pramuka! ⚜️ Berikut rekomendasi rancangan kegiatan terstruktur dari Kak Cikal:

1. *Nama Rencana Kegiatan:* Latihan Gabungan & Uji Ketangkasan Lapangan
2. *Rundown Pelaksanaan:*
   - 07.30 - 08.00 : Apel Pembukaan & Doa Bersama
   - 08.00 - 09.30 : Materi Inti (Pionering, Taksir Ukur, & Kompas Lapangan)
   - 09.30 - 11.00 : Simulasi Game Antar-Sangga
   - 11.00 - 11.30 : Evaluasi & Apel Penutupan
3. *Perlengkapan Utama:* Tongkat 160cm, tali kur 5-10m per orang, kompas bidik, buku saku, dan P3K sangga.
4. *Manajemen Risiko:* Sediakan pos medis darurat, periksa kesiapan fisik anggota, dan pastikan izin tertulis dari orang tua/sekolah.`.trim();
  }

  if (lower.includes('masalah') || lower.includes('saran') || lower.includes('sangga')) {
    return `Salam Pramuka! ⚜️ Berdasarkan pengalaman kepramukaan dan falsafah *Siri' na Pacce*, berikut saran bijak Kak Cikal:

1. *Bangun Dialog Terbuka:* Kumpulkan pimpinan sangga (Pinsang) dan wakilnya dalam suasana santai di sanggar ambalan.
2. *Terapkan Sistem Among:* Ingat prinsip *Ing Ngarsa Sung Tulada, Ing Madya Mangun Karsa, Tut Wuri Handayani*. Pimpin dengan keteladanan nyata.
3. *Bagi Peran Merata:* Pastikan setiap anggota memiliki tanggung jawab spesifik (juru masak, juru tali, pencatat logistik) agar merasa memiliki sangganya.
4. *Apresiasi Usaha Kecil:* Berikan pengakuan pada setiap kemajuan anggota untuk memupuk rasa percaya diri.`.trim();
  }

  return `Salam Pramuka! ⚜️ Kak Cikal siap mendampingi Kakak. Kakak dapat meminta Kak Cikal untuk:
1. 📅 *Membuat undangan kegiatan resmi* dari program kerja ambalan.
2. 💡 *Merancang rundown dan teknis kegiatan/latihan rutin*.
3. 🛠️ *Memberikan solusi atas permasalahan sangga atau organisasi*.
4. 📋 *Menjelaskan langkah-langkah persiapan program kerja terdekat*.

Silakan ketik pertanyaan Kakak atau gunakan tombol cepat di atas!`.trim();
}
