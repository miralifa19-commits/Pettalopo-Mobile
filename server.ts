import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT 
    ? parseInt(process.env.PORT, 10) 
    : 3000;

  app.use(express.json());

  // Server-side route for generating AI activity reports using Gemini 3.8 Flash
  app.post('/api/ai/generate-report', async (req, res) => {
    try {
      const { kegiatan, evaluations } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(503).json({ 
          error: 'GEMINI_API_KEY is not configured on the server. Falling back to deterministic report generation.' 
        });
      }

      const totalAnggota = evaluations?.length || 0;
      const totalHadir = (evaluations || []).filter((e: any) => e.statusKehadiran === 'Hadir').length;
      const totalIzin = (evaluations || []).filter((e: any) => e.statusKehadiran === 'Izin').length;
      const totalSakit = (evaluations || []).filter((e: any) => e.statusKehadiran === 'Sakit').length;

      const ratings = (evaluations || []).map((e: any) => e.rating || 5);
      const avgRating = ratings.length > 0 
        ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) 
        : '5.0';

      const kelebihanList = (evaluations || []).map((e: any) => e.kelebihan).filter(Boolean);
      const kekuranganList = (evaluations || []).map((e: any) => e.kekurangan).filter(Boolean);

      const prompt = `
Bertindaklah sebagai Kerani dan Tim Perumus Laporan Resmi Gugus Depan Pramuka Penegak Ambalan La Surullah Petta Lopo (Gudep 10-035 & 10-036).
Buatlah naskah paragraf laporan resmi pelaksanaan kegiatan berdasarkan data riil presensi dan evaluasi berikut:

Data Pelaksanaan:
- Nama Agenda: ${kegiatan?.nama || 'Latihan Rutin'} (${kegiatan?.tipe || 'Latihan'})
- Periode/Waktu: ${kegiatan?.waktuPelaksanaan || '2026'} (Bulan ${kegiatan?.bulan || 'Berjalan'})
- Sasaran Peserta: ${kegiatan?.sasaran || 'Penegak Bantara & Laksana'}
- Total Presensi Masuk: ${totalAnggota} orang (Hadir: ${totalHadir}, Izin: ${totalIzin}, Sakit: ${totalSakit})
- Rata-rata Skor Rating Kepuasan Anggota: ${avgRating} dari skala 5.0 bintang
- Catatan Kelebihan dari Anggota: ${kelebihanList.slice(0, 8).join('; ') || 'Kegiatan berjalan tertib dan materi tersampaikan baik'}
- Catatan Kekurangan/Kendala dari Anggota: ${kekuranganList.slice(0, 8).join('; ') || 'Waktu kegiatan terasa singkat dan perlengkapan perlu ditambah'}

Instruksi Penulisan:
Susunlah laporan dalam bahasa Indonesia yang formal, santun, baku, dan bernuansa kepramukaan (Adat Ambalan). Bagilah teks ke dalam 4 bagian paragraf:
1. DESKRIPSI PELAKSANAAN: Gambaran umum pelaksanaan agenda sesuai jadwal dan tujuan latihan.
2. ANALISIS PARTISIPASI & KEHADIRAN: Tingkat keikutsertaan anggota putra dan putri, kedisiplinan waktu.
3. ANALISIS KEPUASAN & KELEBIHAN: Respon kepuasan peserta (rating ${avgRating}/5) serta kelebihan-kelebihan utama yang dirasakan.
4. KENDALA & REKOMENDASI PERBAIKAN: Evaluasi kekurangan lapangan serta solusi konkret untuk kegiatan berikutnya.

Hasilkan naskah laporan yang siap dimasukkan ke berkas resmi PDF pertanggungjawaban ambalan.
`.trim();

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      const text = response.text || '';
      return res.json({ text, avgRating, totalHadir, totalAnggota });
    } catch (error: any) {
      console.error('Error generating report with Gemini on server:', error);
      return res.status(500).json({ 
        error: error.message || 'Gagal memproses narasi AI di server' 
      });
    }
  });

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Serve index.html with Vite transforms in development
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace?.(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
