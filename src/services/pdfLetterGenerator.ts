import { PDFDocument, PDFPage, PDFFont, PDFImage, StandardFonts, rgb } from 'pdf-lib';
import type { GeneratedSurat } from '../components/views/PersuratanAmbalanView';

export const LETTERHEAD_ASSET =
  'assets/aistudio/Gerakan_Pramuka_Gugus_Depan_10-035__10-036_Pangkalan_SMA_Negeri_9_Maros_20261104_213457_0000_6f4fe1a9.pdf';

const PT_PER_CM = 72 / 2.54;
const SIDE_MARGIN = 2.5 * PT_PER_CM;
const HEADER_RULE_FROM_TOP = 116.4;
const GAP_AFTER_HEADER = 14;
const CONTENT_TOP_FROM_TOP = HEADER_RULE_FROM_TOP + GAP_AFTER_HEADER;
const BOTTOM_SAFE_MARGIN = 42;
const BLACK = rgb(0, 0, 0);
const MUTED = rgb(0.35, 0.35, 0.35);
const STAMP_RED = rgb(0.78, 0.08, 0.1);

export type PdfAssetLoader = (assetPath: string) => Promise<Uint8Array>;
export type PdfStageCallback = (stage: string) => void;

export class PdfExportStageError extends Error {
  stage: string;
  originalName: string;
  originalMessage: string;
  savedPath?: string;

  constructor(stage: string, cause: unknown, savedPath?: string) {
    const originalName = cause instanceof Error ? cause.name : 'UnknownError';
    const originalMessage = cause instanceof Error ? cause.message : String(cause);
    super(originalMessage);
    this.name = 'PdfExportStageError';
    this.stage = stage;
    this.originalName = originalName;
    this.originalMessage = originalMessage;
    this.savedPath = savedPath;
  }
}

async function loadLocalAsset(assetPath: string): Promise<Uint8Array> {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${baseUrl}${assetPath}`, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Aset lokal ${assetPath} tidak dapat dibaca (HTTP ${response.status}).`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function cleanText(value: unknown): string {
  const normalized = String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/…/g, '...')
    .replace(/•/g, '-');

  // Standard PDF fonts use WinAnsi. Check each Unicode code point separately
  // so one unsupported symbol cannot abort the complete export.
  return Array.from(normalized, (character) => {
    if (character === '\n' || character === '\t') return character;
    // The standard Times Roman encoding is compatible with WinAnsi.
    // Unsupported glyphs are replaced individually, never as a whole paragraph.
    try {
      STANDARD_FONT_PROBE.encodeText(character);
      return character;
    } catch {
      return '?';
    }
  }).join('');
}

const STANDARD_FONT_PROBE = {
  encodeText(value: string): Uint8Array {
    // WinAnsi-compatible code point check. PDFDocEncoding covers the
    // punctuation/Latin range accepted by the built-in standard fonts.
    const code = value.codePointAt(0) ?? 0;
    if (code <= 0x7F || (code >= 0xA0 && code <= 0xFF)) return new Uint8Array([code]);
    const winAnsiExtras = new Set([0x20AC,0x201A,0x0192,0x201E,0x2026,0x2020,0x2021,0x02C6,0x2030,0x0160,0x2039,0x0152,0x017D,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x02DC,0x2122,0x0161,0x203A,0x0153,0x017E,0x0178]);
    if (winAnsiExtras.has(code)) return new Uint8Array([0]);
    throw new Error(`Karakter U+${code.toString(16).toUpperCase()} tidak didukung font PDF bawaan.`);
  },
};

function splitLongWord(word: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const character of Array.from(word)) {
    const candidate = current + character;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) pieces.push(current);
  return pieces.length ? pieces : [word];
}

export function wrapPdfText(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const output: string[] = [];
  const paragraphs = cleanText(value).split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      output.push('');
      continue;
    }

    const words = paragraph.trim().split(/\s+/);
    let line = '';

    for (const word of words) {
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        if (line) {
          output.push(line);
          line = '';
        }
        const chunks = splitLongWord(word, font, size, maxWidth);
        output.push(...chunks.slice(0, -1));
        line = chunks[chunks.length - 1] || '';
        continue;
      }

      const candidate = line ? `${line} ${word}` : word;
      if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        output.push(line);
        line = word;
      }
    }

    if (line) output.push(line);
  }

  return output;
}

interface FontSet {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

class LetterLayout {
  readonly pages: PDFPage[] = [];
  readonly width: number;
  readonly height: number;
  readonly contentWidth: number;
  page!: PDFPage;
  y = 0;

  constructor(
    private readonly output: PDFDocument,
    private readonly template: PDFDocument,
    readonly fonts: FontSet,
    size: { width: number; height: number },
  ) {
    this.width = size.width;
    this.height = size.height;
    this.contentWidth = this.width - SIDE_MARGIN * 2;
  }

  async addLetterheadPage(): Promise<void> {
    const [copiedPage] = await this.output.copyPages(this.template, [0]);
    this.page = this.output.addPage(copiedPage);
    this.pages.push(this.page);
    // pdf-lib uses a bottom-left origin. This keeps the first text line
    // 14 pt below the measured bottom rule of the original PDF letterhead.
    this.y = this.height - CONTENT_TOP_FROM_TOP - 12;
  }

  async ensureSpace(requiredHeight: number): Promise<void> {
    if (this.y - requiredHeight < BOTTOM_SAFE_MARGIN) {
      await this.addLetterheadPage();
    }
  }

  drawText(
    text: string,
    x: number,
    y: number,
    font: PDFFont,
    size: number,
    color = BLACK,
  ): void {
    const safeText = cleanText(text);
    if (!safeText) return;
    this.page.drawText(safeText, { x, y, size, font, color });
  }

  drawRight(text: string, y: number, font: PDFFont, size: number): void {
    const safeText = cleanText(text);
    const width = font.widthOfTextAtSize(safeText, size);
    this.drawText(safeText, this.width - SIDE_MARGIN - width, y, font, size);
  }

  drawCentered(text: string, centerX: number, y: number, font: PDFFont, size: number): void {
    const safeText = cleanText(text);
    const width = font.widthOfTextAtSize(safeText, size);
    this.drawText(safeText, centerX - width / 2, y, font, size);
  }

  drawJustifiedLine(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    font: PDFFont,
    size: number,
  ): void {
    const safeText = cleanText(text);
    const words = safeText.split(' ').filter(Boolean);
    if (words.length < 2) {
      this.drawText(text, x, y, font, size);
      return;
    }
    const widths = words.map((word) => font.widthOfTextAtSize(word, size));
    const usedWidth = widths.reduce((sum, width) => sum + width, 0);
    const gap = Math.max(1.5, (maxWidth - usedWidth) / (words.length - 1));
    let cursorX = x;
    words.forEach((word, index) => {
      this.drawText(word, cursorX, y, font, size);
      cursorX += widths[index] + gap;
    });
  }

  async paragraph(
    value: string,
    options: {
      x?: number;
      maxWidth?: number;
      size?: number;
      font?: PDFFont;
      lineHeight?: number;
      spacingAfter?: number;
      align?: 'left' | 'right' | 'center' | 'justify';
      color?: ReturnType<typeof rgb>;
    } = {},
  ): Promise<void> {
    const size = options.size ?? 12;
    const font = options.font ?? this.fonts.regular;
    const x = options.x ?? SIDE_MARGIN;
    const maxWidth = options.maxWidth ?? this.contentWidth;
    const lineHeight = options.lineHeight ?? size * 1.5;
    const lines = wrapPdfText(value, font, size, maxWidth);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line) {
        this.y -= lineHeight;
        continue;
      }

      await this.ensureSpace(lineHeight);
      if (options.align === 'right') {
        const lineWidth = font.widthOfTextAtSize(line, size);
        this.drawText(line, x + maxWidth - lineWidth, this.y, font, size, options.color);
      } else if (options.align === 'center') {
        const lineWidth = font.widthOfTextAtSize(line, size);
        this.drawText(line, x + (maxWidth - lineWidth) / 2, this.y, font, size, options.color);
      } else if (options.align === 'justify' && index < lines.length - 1) {
        this.drawJustifiedLine(line, x, this.y, maxWidth, font, size);
      } else {
        this.drawText(line, x, this.y, font, size, options.color);
      }
      this.y -= lineHeight;
    }

    this.y -= options.spacingAfter ?? 0;
  }

  async labelValueRow(options: {
    label: string;
    value: string;
    x?: number;
    labelWidth: number;
    maxWidth: number;
    size?: number;
    lineHeight?: number;
    labelFont?: PDFFont;
    valueFont?: PDFFont;
    rowGap?: number;
  }): Promise<void> {
    const size = options.size ?? 12;
    const lineHeight = options.lineHeight ?? 16;
    const x = options.x ?? SIDE_MARGIN;
    const valueX = x + options.labelWidth + 10;
    const valueMaxWidth = Math.max(40, options.maxWidth - (valueX - x));
    const valueLines = wrapPdfText(options.value, options.valueFont ?? this.fonts.regular, size, valueMaxWidth);
    const rowHeight = Math.max(1, valueLines.length) * lineHeight + (options.rowGap ?? 3);

    await this.ensureSpace(rowHeight);
    this.drawText(options.label, x, this.y, options.labelFont ?? this.fonts.regular, size);
    this.drawText(':', x + options.labelWidth, this.y, options.valueFont ?? this.fonts.regular, size);

    for (const line of valueLines.length ? valueLines : ['']) {
      await this.ensureSpace(lineHeight);
      this.drawText(line, valueX, this.y, options.valueFont ?? this.fonts.regular, size);
      this.y -= lineHeight;
    }
    this.y -= options.rowGap ?? 3;
  }

  async addPageNumbers(): Promise<void> {
    if (this.pages.length <= 1) return;
    this.pages.forEach((page, index) => {
      const label = `${index + 1}`;
      const fontSize = 8;
      const textWidth = this.fonts.regular.widthOfTextAtSize(label, fontSize);
      page.drawText(label, {
        x: this.width - SIDE_MARGIN - textWidth,
        y: 20,
        size: fontSize,
        font: this.fonts.regular,
        color: MUTED,
      });
    });
  }
}

function bulletPrefix(style: GeneratedSurat['bulletStyle'], index: number): string {
  switch (style) {
    case 'nomor': return `${index + 1}.`;
    case 'abcd': return `${String.fromCharCode(97 + index)}.`;
    case 'strip': return '-';
    case 'titik':
    default: return '•';
  }
}

async function embedQrCode(pdf: PDFDocument, dataUrl?: string): Promise<PDFImage | undefined> {
  if (!dataUrl) return undefined;
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return pdf.embedPng(bytes);
}

function drawStamp(
  page: PDFPage,
  centerX: number,
  centerY: number,
  boldFont: PDFFont,
): void {
  page.drawCircle({
    x: centerX,
    y: centerY,
    size: 18,
    borderColor: STAMP_RED,
    borderWidth: 1,
    color: rgb(1, 1, 1),
    opacity: 0,
  });
  const lines = ['GERAKAN PRAMUKA', 'GUDEP 10-035/10-036', 'SMA NEGERI 9 MAROS'];
  lines.forEach((line, index) => {
    const size = index === 2 ? 3.5 : 4;
    const width = boldFont.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: centerX - width / 2,
      y: centerY + 5 - index * 5,
      size,
      font: boldFont,
      color: STAMP_RED,
    });
  });
}

function drawSignerBlock(
  layout: LetterLayout,
  centerX: number,
  columnWidth: number,
  topY: number,
  title: string,
  name: string,
  identifier: string | undefined,
  qrImage: PDFImage | undefined,
  includeStamp: boolean,
): number {
  const titleSize = 11;
  const titleLines = wrapPdfText(title, layout.fonts.bold, titleSize, columnWidth - 10);
  let y = topY;

  titleLines.forEach((line) => {
    layout.drawCentered(line, centerX, y, layout.fonts.bold, titleSize);
    y -= 13;
  });

  y -= 4;
  if (qrImage) {
    const qrSize = 42;
    layout.page.drawImage(qrImage, {
      x: centerX - qrSize / 2,
      y: y - qrSize + 4,
      width: qrSize,
      height: qrSize,
    });
  }

  if (includeStamp) {
    drawStamp(layout.page, centerX + columnWidth / 2 - 23, y - 18, layout.fonts.bold);
  }

  y -= 49;
  const nameSize = 11;
  const safeName = cleanText(name);
  const nameWidth = Math.min(columnWidth - 8, layout.fonts.bold.widthOfTextAtSize(safeName, nameSize));
  const nameX = centerX - nameWidth / 2;
  layout.drawText(safeName, nameX, y, layout.fonts.bold, nameSize);
  layout.page.drawLine({
    start: { x: nameX, y: y - 1.5 },
    end: { x: nameX + nameWidth, y: y - 1.5 },
    thickness: 0.6,
    color: BLACK,
  });
  y -= 14;

  if (identifier) {
    const idSize = 8.5;
    layout.drawCentered(identifier, centerX, y, layout.fonts.regular, idSize);
    y -= 12;
  }

  return y - 8;
}

async function drawSignatures(
  layout: LetterLayout,
  surat: GeneratedSurat,
  qrImage?: PDFImage,
): Promise<void> {
  const hasDewan = surat.includeDewan;
  const hasPembina = surat.includePembina;
  if (!hasDewan && !hasPembina) return;

  await layout.ensureSpace(160);
  const gap = 14;
  const columnWidth = (layout.contentWidth - gap) / 2;
  const topY = layout.y;
  const bottomYs: number[] = [];

  if (hasDewan && hasPembina) {
    const leftCenter = SIDE_MARGIN + columnWidth / 2;
    const rightCenter = SIDE_MARGIN + columnWidth + gap + columnWidth / 2;
    bottomYs.push(drawSignerBlock(
      layout, leftCenter, columnWidth, topY,
      surat.dewanJabatan, surat.dewanNama, surat.dewanNta,
      undefined, false,
    ));
    bottomYs.push(drawSignerBlock(
      layout, rightCenter, columnWidth, topY,
      surat.pembinaJabatan, surat.pembinaNama, surat.pembinaNip,
      surat.metodeTtd === 'digital' ? qrImage : undefined,
      surat.includeStempel,
    ));
  } else {
    const centerX = SIDE_MARGIN + columnWidth / 2;
    if (hasDewan) {
      bottomYs.push(drawSignerBlock(
        layout, centerX, columnWidth, topY,
        surat.dewanJabatan, surat.dewanNama, surat.dewanNta,
        undefined, false,
      ));
    } else {
      bottomYs.push(drawSignerBlock(
        layout, centerX, columnWidth, topY,
        surat.pembinaJabatan, surat.pembinaNama, surat.pembinaNip,
        surat.metodeTtd === 'digital' ? qrImage : undefined,
        surat.includeStempel,
      ));
    }
  }

  layout.y = Math.min(...bottomYs);
}

async function drawKetuaGudep(
  layout: LetterLayout,
  surat: GeneratedSurat,
  qrImage?: PDFImage,
): Promise<void> {
  if (!surat.includeKetuaGudep) return;
  await layout.ensureSpace(126);

  const centerX = SIDE_MARGIN + 125;
  const topY = layout.y;
  let y = topY - 4;
  layout.drawCentered(`${surat.approvalType || 'Mengetahui'},`, centerX, y, layout.fonts.bold, 11);
  y -= 14;
  layout.drawCentered('Ketua Gugus Depan SMA Negeri 9 Maros', centerX, y, layout.fonts.bold, 10);

  y -= 48;
  if (surat.metodeTtd === 'digital' && surat.digitalSigner === 'kepala_sekolah' && qrImage) {
    const qrSize = 38;
    layout.page.drawImage(qrImage, {
      x: centerX - qrSize / 2,
      y: y - qrSize + 5,
      width: qrSize,
      height: qrSize,
    });
  }

  y -= 5;
  const nameSize = 11;
  const safeName = cleanText(surat.ketuaGudepNama);
  const nameWidth = Math.min(240, layout.fonts.bold.widthOfTextAtSize(safeName, nameSize));
  const nameX = centerX - nameWidth / 2;
  layout.drawText(safeName, nameX, y, layout.fonts.bold, nameSize);
  layout.page.drawLine({
    start: { x: nameX, y: y - 1.5 },
    end: { x: nameX + nameWidth, y: y - 1.5 },
    thickness: 0.6,
    color: BLACK,
  });
  y -= 14;

  if (surat.ketuaGudepNip) {
    layout.drawCentered(surat.ketuaGudepNip, centerX, y, layout.fonts.regular, 8.5);
    y -= 12;
  }
  layout.y = y - 8;
}

async function drawTembusan(layout: LetterLayout, surat: GeneratedSurat): Promise<void> {
  if (!surat.includeTembusan || !surat.tembusanList?.length) return;
  await layout.ensureSpace(30);
  layout.y -= 5;
  await layout.paragraph('TEMBUSAN KEPADA YTH :', {
    size: 8.5,
    font: layout.fonts.bold,
    lineHeight: 11,
    spacingAfter: 2,
  });

  for (let index = 0; index < surat.tembusanList.length; index += 1) {
    await layout.paragraph(`${index + 1}. ${surat.tembusanList[index]}`, {
      x: SIDE_MARGIN + 10,
      maxWidth: layout.contentWidth - 10,
      size: 8.5,
      lineHeight: 11,
      spacingAfter: 1,
    });
  }
}

export async function createLetterPdf(
  surat: GeneratedSurat,
  assetLoader: PdfAssetLoader = loadLocalAsset,
  onStage: PdfStageCallback = () => undefined,
): Promise<Uint8Array> {
  let stage = 'Memuat PDF kop surat asli';
  try {
    onStage(stage);
    const templateBytes = await assetLoader(LETTERHEAD_ASSET);

    stage = 'Membaca ukuran dan struktur PDF kop surat';
    onStage(stage);
    const templatePdf = await PDFDocument.load(templateBytes);
    const sourcePage = templatePdf.getPage(0);
    const pageSize = sourcePage.getSize();

    stage = 'Menyiapkan dokumen dan menyalin halaman kop';
    onStage(stage);
    const outputPdf = await PDFDocument.create();

    stage = 'Menyiapkan font bawaan PDF (Times Roman)';
    onStage(stage);
    const [regular, bold, italic, boldItalic] = await Promise.all([
      outputPdf.embedFont(StandardFonts.TimesRoman),
      outputPdf.embedFont(StandardFonts.TimesRomanBold),
      outputPdf.embedFont(StandardFonts.TimesRomanItalic),
      outputPdf.embedFont(StandardFonts.TimesRomanBoldItalic),
    ]);

    const layout = new LetterLayout(
      outputPdf,
      templatePdf,
      { regular, bold, italic, boldItalic },
      pageSize,
    );

    stage = 'Membuat halaman pertama dengan kop asli';
    onStage(stage);
    await layout.addLetterheadPage();

    stage = 'Menata identitas surat dan tanggal';
    onStage(stage);
    const identityTop = layout.y;
    const identityRows: Array<{ label: string; value: string; bold?: boolean }> = [];
    if (surat.includeNomor) identityRows.push({ label: 'Nomor', value: surat.nomorSurat });
    if (surat.includeLampiran) identityRows.push({ label: 'Lampiran', value: surat.lampiran });
    if (surat.includePerihal) identityRows.push({ label: 'Perihal', value: surat.perihal, bold: true });
    if (surat.includeKeteranganIdentitas) {
      identityRows.push({ label: 'Keterangan', value: surat.keteranganIdentitas });
    }

    // Tanggal pengesahan ditampilkan sekali di sisi kiri, dekat blok tanda tangan.

    for (const row of identityRows) {
      await layout.labelValueRow({
        label: row.label,
        value: row.value,
        labelWidth: 72,
        maxWidth: layout.contentWidth * 0.62,
        size: 12,
        lineHeight: 16,
        labelFont: row.bold ? bold : regular,
        valueFont: row.bold ? bold : regular,
        rowGap: 2,
      });
    }
    if (!identityRows.length) layout.y -= 16;
    layout.y -= 8;

    stage = 'Menata penerima dan salam pembuka';
    onStage(stage);
    if (surat.includeKepadaYth) {
      await layout.paragraph('Kepada Yth.', { size: 12, lineHeight: 16, spacingAfter: 0 });
      await layout.paragraph(surat.penerimaNama, {
        size: 12, font: bold, lineHeight: 16, spacingAfter: 0,
      });
      await layout.paragraph(surat.penerimaTempat, {
        size: 12, lineHeight: 16, spacingAfter: 0,
      });
      layout.y -= 8;
    }

    await layout.paragraph('Assalamu’alaikum Warahmatullahi Wabarakatuh', {
      size: 12, font: italic, lineHeight: 16, spacingAfter: 0,
    });
    await layout.paragraph('Salam Pramuka,', {
      size: 12, font: regular, lineHeight: 16, align: 'center', spacingAfter: 8,
    });

    stage = 'Menata paragraf isi dan rincian kegiatan';
    onStage(stage);
    await layout.paragraph(surat.isiParagraf, {
      size: 12, lineHeight: 18, align: 'justify', spacingAfter: 9,
    });

    const bulletRows = [
      { label: 'Hari / Tanggal', value: surat.rincianHariTanggal },
      { label: 'Waktu', value: surat.rincianWaktu },
    ];
    if (surat.includeTempat) {
      bulletRows.push({ label: 'Tempat', value: surat.rincianTempat });
    }
    if (surat.includeKeteranganAcara) {
      bulletRows.push({ label: 'Agenda', value: surat.rincianKeteranganAcara });
    }

    for (const row of bulletRows) {
      await layout.labelValueRow({
        label: row.label,
        value: row.value,
        x: SIDE_MARGIN + 18,
        labelWidth: 108,
        maxWidth: layout.contentWidth - 18,
        size: 12,
        lineHeight: 17,
        labelFont: bold,
        valueFont: regular,
        rowGap: 2,
      });
    }

    layout.y -= 7;
    await layout.paragraph(surat.penutupParagraf, {
      size: 12, lineHeight: 18, align: 'justify', spacingAfter: 8,
    });

    stage = 'Menata salam penutup dan tanggal pengesahan';
    onStage(stage);
    await layout.paragraph('Wassalamu’alaikum Warahmatullahi Wabarakatuh', {
      size: 12, font: italic, lineHeight: 16, spacingAfter: 0,
    });
    await layout.ensureSpace(18);
    layout.drawText(`${surat.kotaPengesahan || 'Maros'}, ${surat.tanggalSurat}`, SIDE_MARGIN, layout.y, regular, 12);
    layout.y -= 20;

    stage = 'Menyematkan QR dan menata tanda tangan';
    onStage(stage);
    const qrImage = surat.metodeTtd === 'digital' ? await embedQrCode(outputPdf, surat.qrCodeDataUrl) : undefined;
    await drawSignatures(layout, surat, qrImage);
    await drawKetuaGudep(layout, surat, qrImage);

    stage = 'Menata tembusan surat';
    onStage(stage);
    await drawTembusan(layout, surat);

    stage = 'Menambahkan nomor halaman dan menyimpan PDF';
    onStage(stage);
    await layout.addPageNumbers();
    outputPdf.setTitle(`Surat Pramuka ${surat.nomorSurat}`);
    outputPdf.setAuthor('Pettalopo Mobile');
    outputPdf.setSubject(surat.perihal);
    return await outputPdf.save();
  } catch (error) {
    if (error instanceof PdfExportStageError) throw error;
    throw new PdfExportStageError(stage, error);
  }
}
