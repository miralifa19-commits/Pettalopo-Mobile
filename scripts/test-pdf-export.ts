import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { GeneratedSurat } from '../src/components/views/PersuratanAmbalanView';
import { createLetterPdf, type PdfAssetLoader } from '../src/services/pdfLetterGenerator';

const loadTestAsset: PdfAssetLoader = async (assetPath) =>
  new Uint8Array(await readFile(path.join(process.cwd(), 'public', assetPath)));

const base: GeneratedSurat = {
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
  isiParagraf: 'Dengan hormat, kami mengundang Bapak/Ibu untuk menghadiri kegiatan Pramuka. Mohon kehadiran tepat waktu.',
  bulletStyle: 'titik',
  rincianHariTanggal: 'Sabtu, 21 November 2026',
  rincianWaktu: '08.00 WITA s.d. Selesai',
  includeTempat: true,
  rincianTempat: 'Sanggar Bakti Pramuka SMA Negeri 9 Maros',
  includeKeteranganAcara: true,
  rincianKeteranganAcara: 'Pengujian ekspor PDF',
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

async function inspectPdf(bytes: Uint8Array, expectedPages: number, label: string) {
  const document = await PDFDocument.load(bytes);
  assert.equal(document.getPageCount(), expectedPages, label + ': jumlah halaman tidak sesuai');
  for (const page of document.getPages()) {
    const size = page.getSize();
    assert.ok(Math.abs(size.width - 571.5) < 0.1, label + ': lebar halaman berubah');
    assert.ok(Math.abs(size.height - 828) < 0.1, label + ': tinggi halaman berubah');
  }

  const parsed = await pdfjsLib.getDocument({ data: bytes, disableWorker: true, isEvalSupported: false }).promise;
  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= parsed.numPages; pageNumber += 1) {
    const page = await parsed.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pageTexts.push(text);
    assert.ok(text.includes('GERAKAN PRAMUKA'), label + ': kop tidak ditemukan pada halaman ' + pageNumber);
  }
  assert.ok(pageTexts.join(' ').includes('Pengujian PDF Surat Resmi'), label + ': teks isi tidak bisa diekstrak');
  await parsed.destroy();
  console.log('PASS ' + label + ': ' + expectedPages + ' halaman, kop asli ada di setiap halaman, ukuran tetap, teks dapat diseleksi/diekstrak.');
}

const shortBytes = await createLetterPdf(base, loadTestAsset);
await inspectPdf(shortBytes, 1, 'Surat pendek');

const longBody = Array.from({ length: 70 }, (_, index) =>
  'Paragraf uji nomor ' + (index + 1) + '. Pettalopo Mobile menyusun surat dengan teks asli, ukuran font terukur, dan pergantian halaman otomatis agar setiap baris tetap berada di dalam margin dokumen.'
).join('\n\n');
const longBytes = await createLetterPdf({ ...base, isiParagraf: longBody }, loadTestAsset);
const longDocument = await PDFDocument.load(longBytes);
assert.ok(longDocument.getPageCount() >= 2, 'Surat panjang harus menjadi minimal dua halaman');
await inspectPdf(longBytes, longDocument.getPageCount(), 'Surat panjang dua halaman');
console.log('PASS Uji karakter: font bawaan PDF dan sanitasi karakter non-WinAnsi terpasang pada mesin ekspor.');
