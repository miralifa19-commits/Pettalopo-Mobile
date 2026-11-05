import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';
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

  const parsed = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= parsed.numPages; pageNumber += 1) {
    const page = await parsed.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pageTexts.push(text);
    assert.ok(text.includes('GERAKAN PRAMUKA'), label + ': kop tidak ditemukan pada halaman ' + pageNumber);
  }
  assert.ok(pageTexts.join(' ').includes('Pengujian PDF Surat Resmi'), label + ': teks isi tidak bisa diekstrak');
  console.log('PASS ' + label + ': ' + expectedPages + ' halaman, kop asli ada di setiap halaman, ukuran tetap, teks dapat diseleksi/diekstrak.');
}

base.qrCodeDataUrl = await QRCode.toDataURL('Pettalopo Mobile - Uji QR - 001/10.035/C/2026', { width: 240, margin: 2 });
const shortBytes = await createLetterPdf(base, loadTestAsset);
await inspectPdf(shortBytes, 1, 'Surat pendek');

const visualSample = {
  ...base,
  includePembinaTambahan: true,
  pembinaTambahanJabatan: 'Pembina Putri',
  pembinaTambahanNama: 'Pembina Putri',
  pembinaTambahanNip: 'NIP. 19820101 200601 2 002',
  includeTtdBiasa: true,
  includeQrCode: true,
  metodeTtd: 'biasa' as const,
};
const visualBytes = await createLetterPdf(visualSample, loadTestAsset);
const visualDocument = await PDFDocument.load(visualBytes);
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/contoh-tata-letak-persuratan.pdf', visualBytes);
const visualParsed = await pdfjsLib.getDocument({ data: visualBytes }).promise;
const signaturePage = await visualParsed.getPage(visualParsed.numPages);
const signatureText = await signaturePage.getTextContent();
const items = signatureText.items.filter(item => 'str' in item && 'transform' in item);
const titlePutri = items.find(item => 'str' in item && item.str.includes('Pembina Putri'));
const namePutri = items.find(item => 'str' in item && item.str === 'Pembina Putri');
const nipPutri = items.find(item => 'str' in item && item.str.includes('19820101 200601 2 002'));
assert.ok(titlePutri && namePutri && nipPutri, 'Blok Pembina Putri harus memuat jabatan, nama, dan NIP pada halaman yang sama');
assert.ok(Math.abs(titlePutri.transform[4] - namePutri.transform[4]) < 0.5, 'Jabatan dan nama Pembina Putri harus rata kiri pada blok yang sama');
console.log('DEBUG_PUTRI_X', { title: titlePutri && {str:titlePutri.str,x:titlePutri.transform[4],y:titlePutri.transform[5]}, name:namePutri && {str:namePutri.str,x:namePutri.transform[4],y:namePutri.transform[5]}, nip:nipPutri && {str:nipPutri.str,x:nipPutri.transform[4],y:nipPutri.transform[5]}, items:items.filter(item => 'str' in item && (item.str.includes('Pembina Putri') || item.str.includes('19820101') || item.str === 'Mengetahui')).map(item => ({str:item.str,x:item.transform[4],y:item.transform[5]})) });
assert.ok(Math.abs(titlePutri.transform[4] - nipPutri.transform[4]) < 0.5, 'NIP Pembina Putri harus rata kiri pada blok yang sama');
assert.ok(items.some(item => 'str' in item && item.str === 'Mengetahui' && Math.abs(item.transform[4] - titlePutri.transform[4]) < 0.5), 'Mengetahui Pembina Putri harus sejajar dengan jabatan');
assert.ok(signatureText.items.some(item => 'str' in item && item.str === 'Tembusan:'), 'Tembusan harus berada di halaman terakhir bersama tanda tangan');
console.log('PASS Tata letak Pembina Putri dan tembusan: satu halaman tanda tangan, seluruh teks rata kiri di kolom kanan.');

// Test unsupported characters in fields that are drawn directly (date,
// recipient, signer names), not only in wrapped body paragraphs.
const unicodeBytes = await createLetterPdf({
  ...base,
  tanggalSurat: '5 November 2026 📅',
  penerimaNama: 'Kepala SMA Negeri 9 Maros 😀',
  dewanNama: 'Amiruddin 🧭',
  pembinaNama: 'Pembina Putra 🚀',
  ketuaGudepNama: 'Kepala Sekolah 🎓',
}, loadTestAsset);
const unicodePdf = await pdfjsLib.getDocument({ data: unicodeBytes }).promise;
const unicodeTextParts: string[] = [];
for (let pageNumber = 1; pageNumber <= unicodePdf.numPages; pageNumber += 1) {
  const page = await unicodePdf.getPage(pageNumber);
  const content = await page.getTextContent();
  unicodeTextParts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
}
const unicodeText = unicodeTextParts.join(' ');
assert.ok(unicodeText.includes('Kepala SMA Negeri 9 Maros ?'), 'Karakter tidak didukung pada penerima harus diganti ?');
assert.ok(unicodeText.includes('Amiruddin ?'), 'Karakter tidak didukung pada nama dewan harus diganti ?');
assert.ok(unicodeText.includes('Pembina Putra ?'), 'Karakter tidak didukung pada nama pembina harus diganti ?');
assert.ok(unicodeText.includes('Kepala Sekolah ?'), 'Karakter tidak didukung pada nama ketua gudep harus diganti ?');
console.log('PASS Uji karakter identitas dan tanda tangan: simbol non-WinAnsi diganti ? tanpa menggagalkan ekspor.');

const longBody = Array.from({ length: 70 }, (_, index) =>
  'Paragraf uji nomor ' + (index + 1) + '. Pettalopo Mobile menyusun surat dengan teks asli, ukuran font terukur, dan pergantian halaman otomatis agar setiap baris tetap berada di dalam margin dokumen.'
).join('\n\n');
const longBytes = await createLetterPdf({ ...base, isiParagraf: longBody }, loadTestAsset);
const longDocument = await PDFDocument.load(longBytes);
assert.ok(longDocument.getPageCount() >= 2, 'Surat panjang harus menjadi minimal dua halaman');
await inspectPdf(longBytes, longDocument.getPageCount(), 'Surat panjang dua halaman');
console.log('PASS Uji karakter: font bawaan PDF dan sanitasi karakter non-WinAnsi terpasang pada mesin ekspor.');
