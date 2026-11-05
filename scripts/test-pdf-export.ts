import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { GeneratedSurat } from '../src/components/views/PersuratanAmbalanView';
import { createLetterPdf, type PdfAssetLoader } from '../src/services/pdfLetterGenerator';

const longBody = Array.from(
  { length: 70 },
  (_, index) =>
    `Paragraf uji nomor ${index + 1}. Pettalopo Mobile menyusun surat dengan teks asli, ukuran font terukur, dan pergantian halaman otomatis agar setiap baris tetap berada di dalam margin dokumen.`,
).join('\n\n');

const sample: GeneratedSurat = {
  id: 'pdf-self-test',
  nomorSurat: '001/10.035/C/2026',
  nomorUrut: '001',
  perihal: 'Pengujian PDF Surat Resmi',
  lampiran: '1 (Satu) Berkas',
  keteranganIdentitas: '',
  tanggalSurat: '5 November 2026',
  gudepType: '10.035-10.036',
  includeNomor: true,
  includeTanggal: true,
  includePerihal: true,
  includeLampiran: true,
  includeKeteranganIdentitas: false,
  includeKepadaYth: true,
  penerimaNama: 'Kepala SMA Negeri 9 Maros',
  penerimaTempat: 'di - Tempat',
  isiParagraf: longBody,
  bulletStyle: 'titik',
  rincianHariTanggal: 'Sabtu, 21 November 2026',
  rincianWaktu: '08.00 WITA s.d. Selesai',
  includeTempat: true,
  rincianTempat: 'Sanggar Bakti Pramuka SMA Negeri 9 Maros',
  includeKeteranganAcara: true,
  rincianKeteranganAcara: 'Pengujian pergantian halaman PDF',
  penutupParagraf: 'Demikian surat ini kami sampaikan. Terima kasih.',
  includeDewan: true,
  dewanJabatan: 'Pradana Putra',
  dewanNama: 'Amiruddin S.',
  dewanNta: 'NTA. 10.035.001',
  includePembina: true,
  pembinaJabatan: 'Pembina Gugus Depan 10.035',
  pembinaNama: 'Pembina Putra',
  pembinaNip: 'NIP. 19800101 200501 1 001',
  includeKetuaGudep: true,
  ketuaGudepNama: 'Kepala Sekolah',
  ketuaGudepNip: 'NIP. 19700101 199501 1 001',
  metodeTtd: 'biasa',
  digitalSigner: 'pembina_putra',
  digitalSignerName: 'Pembina Putra',
  digitalSignerTitle: 'Pembina Putra Gugus Depan 10.035',
  includeStempel: true,
  includeTembusan: true,
  tembusanList: ['Kepala UPT SMA Negeri 9 Maros', 'Kwartir Ranting Gerakan Pramuka Marusu', 'Arsip Ambalan'],
  createdAt: new Date().toISOString(),
};

const loadTestAsset: PdfAssetLoader = async (assetPath) => {
  const absolutePath = path.join(process.cwd(), 'public', assetPath);
  const bytes = await readFile(absolutePath);
  return new Uint8Array(bytes);
};

const bytes = await createLetterPdf(sample, loadTestAsset);
const parsed = await PDFDocument.load(bytes);
assert.ok(parsed.getPageCount() >= 2, 'Surat panjang harus menghasilkan minimal dua halaman');

for (const page of parsed.getPages()) {
  const size = page.getSize();
  assert.ok(Math.abs(size.width - 571.5) < 0.1, 'Lebar halaman harus sama dengan PDF kop asli');
  assert.ok(Math.abs(size.height - 828) < 0.1, 'Tinggi halaman harus sama dengan PDF kop asli');
}

const pdfDocument = await pdfjsLib.getDocument({
  data: bytes,
  disableWorker: true,
  isEvalSupported: false,
}).promise;

const extractedPages: string[] = [];
for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
  const page = await pdfDocument.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const pageText = textContent.items
    .map((item) => ('str' in item ? item.str : ''))
    .join(' ');
  extractedPages.push(pageText);
  assert.ok(
    pageText.includes('GERAKAN PRAMUKA'),
    `Halaman ${pageNumber} harus memuat kop surat asli`,
  );
}

assert.ok(
  extractedPages.join(' ').includes('Paragraf uji nomor 1'),
  'Isi surat harus dapat diekstrak sebagai teks PDF, bukan gambar',
);

await pdfDocument.destroy();
console.log(
  `PDF self-test passed: ${parsed.getPageCount()} halaman, ukuran kop asli dipertahankan, kop berulang, dan teks dapat diekstrak.`,
);
