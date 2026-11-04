import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type LetterData = {
  nomorSurat: string;
  jenis: string;
  perihal: string;
  penerima: string;
  tanggalSurat: string;
  tanggalKegiatan?: string;
  tempat?: string;
  anggotaTerlibat?: string;
  keperluan?: string;
  penandatangan?: { pradana?: string; kerani?: string; dewan?: string };
};

const TEMPLATE_URL = '/assets/Gerakan%20Pramuka%20Gugus%20Depan%2010-035%20%2010-036%20Pangkalan%20SMA%20Negeri%209%20Maros_20261104_213457_0000.pdf';

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function makePdf(jpeg: Uint8Array, pixelWidth: number, pixelHeight: number, pageWidth: number, pageHeight: number) {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const add = (data: Uint8Array) => { chunks.push(data); length += data.length; };
  const addText = (value: string) => add(enc.encode(value));
  add(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10]));
  const objects = [
    enc.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    enc.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    enc.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`),
    null as unknown as Uint8Array,
    null as unknown as Uint8Array
  ];
  for (const obj of objects.slice(0, 3)) { offsets.push(length); add(obj); }
  offsets.push(length);
  addText(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  add(jpeg);
  addText('\nendstream\nendobj\n');
  offsets.push(length);
  const content = enc.encode(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`);
  addText(`5 0 obj\n<< /Length ${content.length} >>\nstream\n`);
  add(content);
  addText('endstream\nendobj\n');
  const xrefOffset = length;
  addText(`xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 1; i <= 5; i++) addText(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  addText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  const result = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) { result.set(chunk, cursor); cursor += chunk.length; }
  return result;
}

export async function downloadSuratPdf(
  surat: LetterData,
  onProgress: (progress: number) => void
) {
  onProgress(5);
  const response = await fetch(TEMPLATE_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('PDF kop surat tidak dapat dibuka.');
  const source = new Uint8Array(await response.arrayBuffer());
  onProgress(20);
  const pdf = await getDocument({ data: source }).promise;
  const page = await pdf.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia untuk membuat PDF.');
  await page.render({ canvasContext: ctx, viewport }).promise;
  onProgress(55);

  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = '#111827';
  ctx.textBaseline = 'top';
  const margin = 52;
  const width = baseViewport.width - margin * 2;
  let y = Math.max(205, baseViewport.height * 0.29);
  const line = (text: string, size = 10, bold = false, gap = 5) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px Arial, sans-serif`;
    for (const part of wrapText(ctx, text, width)) {
      ctx.fillText(part, margin, y);
      y += size + 4;
    }
    y += gap;
  };
  const centered = (text: string, size = 11, bold = false) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, baseViewport.width / 2, y);
    ctx.textAlign = 'left';
    y += size + 7;
  };

  line(`Nomor : ${surat.nomorSurat}`, 10, false, 0);
  line(`Lampiran : -`, 10, false, 0);
  line(`Perihal : ${surat.perihal}`, 10, true, 10);
  line(`Maros, ${surat.tanggalSurat}`, 10, false, 12);
  line('Kepada Yth.', 10, false, 0);
  line(surat.penerima, 10, true, 0);
  line('di Tempat', 10, false, 12);
  line('Dengan hormat, sehubungan dengan agenda Gerakan Pramuka Ambalan, bersama ini kami menyampaikan hal sebagai berikut:', 10, false, 4);
  line(`Jenis Surat : ${surat.jenis}`, 10, false, 0);
  if (surat.anggotaTerlibat) line(`Anggota Terkait : ${surat.anggotaTerlibat}`, 10, false, 0);
  line(`Hari / Tanggal : ${surat.tanggalKegiatan || '-'}`, 10, false, 0);
  line(`Tempat : ${surat.tempat || '-'}`, 10, false, 0);
  line(`Keperluan : ${surat.keperluan || '-'}`, 10, false, 10);
  line('Demikian surat ini disampaikan untuk dipergunakan sebagaimana mestinya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.', 10, false, 18);

  const signers = [
    surat.penandatangan?.pradana ? { title: 'Pradana Ambalan,', name: surat.penandatangan.pradana } : null,
    surat.penandatangan?.kerani ? { title: 'Kerani (Sekretaris),', name: surat.penandatangan.kerani } : null,
    surat.penandatangan?.dewan ? { title: 'Dewan Ambalan,', name: surat.penandatangan.dewan } : null
  ].filter(Boolean) as { title: string; name: string }[];
  const columns = Math.max(1, signers.length);
  const colWidth = width / columns;
  signers.forEach((signer, index) => {
    const centerX = margin + colWidth * index + colWidth / 2;
    ctx.textAlign = 'center';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText(signer.title, centerX, y);
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText(signer.name, centerX, y + 62);
    ctx.beginPath();
    const nameWidth = Math.min(ctx.measureText(signer.name).width, colWidth - 12);
    ctx.moveTo(centerX - nameWidth / 2, y + 76);
    ctx.lineTo(centerX + nameWidth / 2, y + 76);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  });
  ctx.restore();
  onProgress(80);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Gagal mengolah halaman PDF.')), 'image/jpeg', 0.94);
  });
  const jpeg = new Uint8Array(await blob.arrayBuffer());
  const bytes = makePdf(jpeg, canvas.width, canvas.height, baseViewport.width, baseViewport.height);
  onProgress(95);
  const file = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Surat-${surat.nomorSurat.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  onProgress(100);
}
