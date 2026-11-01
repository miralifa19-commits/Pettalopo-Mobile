// Helper to extract text from PDF files client-side using pdfjs-dist with fallback
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker safely for Vite / Capacitor
// Using CDN worker that matches the installed pdfjs-dist version or inline fallback
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('Worker configuration notice:', e);
  }
}

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  wordCount: number;
  charCount: number;
  success: boolean;
  error?: string;
}

/**
 * Extracts plain text from an ArrayBuffer of a PDF
 */
export async function extractTextFromPdf(data: ArrayBuffer): Promise<PdfExtractionResult> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      useSystemFonts: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    const pagesText: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with appropriate spacing
      let lastY: number | null = null;
      let pageStr = '';

      for (const item of textContent.items) {
        if ('str' in item) {
          const textItem = item as { str: string; transform: number[] };
          const currentY = textItem.transform[5];

          // If Y position changed significantly, it's a new line
          if (lastY !== null && Math.abs(currentY - lastY) > 8) {
            pageStr += '\n';
          } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
            pageStr += ' ';
          }

          pageStr += textItem.str;
          lastY = currentY;
        }
      }

      const cleanPageText = pageStr.trim();
      if (cleanPageText) {
        pagesText.push(cleanPageText);
      }
    }

    const fullText = pagesText.join('\n\n');
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    if (fullText.trim().length > 0) {
      return {
        text: fullText,
        numPages,
        wordCount,
        charCount: fullText.length,
        success: true,
      };
    }

    // Fallback if no text extracted (e.g., scanned/unusual stream)
    return fallbackRegexExtract(data, numPages);
  } catch (err: unknown) {
    console.warn('PDF.js parsing notice, attempting stream fallback:', err);
    return fallbackRegexExtract(data, 1);
  }
}

/**
 * Robust fallback scanner for raw text strings in PDF stream
 */
function fallbackRegexExtract(data: ArrayBuffer, assumedPages: number = 1): PdfExtractionResult {
  try {
    const bytes = new Uint8Array(data);
    let rawStr = '';
    // Sample ASCII characters from stream
    for (let i = 0; i < bytes.length; i++) {
      const code = bytes[i];
      if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
        rawStr += String.fromCharCode(code);
      }
    }

    // Extract text inside parentheses (text commands like (Some text) Tj)
    const matches = rawStr.match(/\(([^()]{2,})\)/g);
    if (matches && matches.length > 0) {
      const cleanWords = matches
        .map(m => m.slice(1, -1).trim())
        .filter(m => m.length > 1 && !m.startsWith('/'))
        .join(' ');
      
      const words = cleanWords.split(/\s+/).filter(Boolean);
      return {
        text: cleanWords,
        numPages: assumedPages || 1,
        wordCount: words.length,
        charCount: cleanWords.length,
        success: true,
      };
    }
  } catch (e) {
    console.error('Fallback extraction error:', e);
  }

  return {
    text: '',
    numPages: assumedPages || 1,
    wordCount: 0,
    charCount: 0,
    success: false,
    error: 'Tidak dapat mengekstrak teks dari PDF ini secara langsung.',
  };
}

/**
 * Mempercantik penulisan materi tanpa mengubah isi atau makna aslinya.
 * Sesuai permintaan pengguna:
 * "untuk pilihan ai generated, harusnya membuat materi sesuai dengan yang di pdf,
 * artinya kita membaca materi tanpa harus membuka pdf. Lalu ai akan mempercantik
 * penulisannya, tapi tidak boleh mengubah"
 */
export function formatMateriCantik(rawText: string, judulDokumen: string): {
  formattedContent: string;
  ringkasan: string;
  poinPenting: string[];
  estimasiMenitBaca: number;
} {
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  // Hitung estimasi baca (rata-rata 200 kata per menit)
  const totalWords = normalized.split(/\s+/).filter(Boolean).length;
  const estimasiMenitBaca = Math.max(1, Math.ceil(totalWords / 200));

  // Kumpulkan poin-poin penting tanpa mengubah isi (ambil dari kalimat-kalimat penting)
  const candidatePoints: string[] = [];
  const processedParagraphs: string[] = [];

  // Pola untuk mendeteksi judul bab / subbab / poin
  const isHeadingPattern = (line: string): boolean => {
    return (
      /^(BAB|BAGIAN|PASAL|LAMPIRAN|MODUL|MATERI)\s+[IVXLCDM\d]+/i.test(line) ||
      /^[A-Z0-9\s:.'"-]{4,60}$/.test(line) && line === line.toUpperCase() && line.split(' ').length <= 8 ||
      /^[A-Z]\.\s+/.test(line) ||
      /^\d+\.\s+[A-Z]/.test(line)
    );
  };

  let currentSectionTitle = '';
  let currentSectionParagraphs: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Deteksi apakah baris ini adalah judul / heading
    if (isHeadingPattern(line) && line.length < 80) {
      if (currentSectionParagraphs.length > 0) {
        processedParagraphs.push(currentSectionParagraphs.join('\n\n'));
        currentSectionParagraphs = [];
      }
      currentSectionTitle = line;
      processedParagraphs.push(`\n### ${line.toUpperCase()}\n`);

      // Tambahkan ke poin penting jika informatif
      if (candidatePoints.length < 5 && line.length > 5 && !line.includes('DAFTAR ISI')) {
        candidatePoints.push(line.replace(/^[#*\-•\d.]+\s*/, ''));
      }
    } else {
      // Baris konten isi materi asli
      // Format daftar berbutir bila terdeteksi simbol / angka
      if (/^[-*•–]\s*/.test(line)) {
        currentSectionParagraphs.push(line);
      } else if (/^\d+[.)]\s*/.test(line)) {
        currentSectionParagraphs.push(line);
      } else {
        currentSectionParagraphs.push(line);
      }

      // Kumpulkan kutipan/poin kunci jika mengandung kata penting
      if (candidatePoints.length < 5 && line.length > 25 && line.length < 140) {
        if (/adalah|merupakan|tujuan|tugas|fungsi|wajib|kewajiban|prinsip|aturan/i.test(line)) {
          candidatePoints.push(line);
        }
      }
    }
  }

  if (currentSectionParagraphs.length > 0) {
    processedParagraphs.push(currentSectionParagraphs.join('\n\n'));
  }

  // Gabungkan seluruh isi materi asli dengan tata letak paragraf yang nyaman dan rapi
  const finalFormatted = processedParagraphs.join('\n\n').trim();

  // Ekstrak ringkasan dari kalimat awal dokumen yang representatif
  const firstSignificantLines = lines.filter(l => l.length > 30 && !isHeadingPattern(l));
  const ringkasan = firstSignificantLines.length > 0
    ? firstSignificantLines[0]
    : `Materi lengkap ${judulDokumen} dari dokumen resmi yang telah disesuaikan tata letak dan keterbacaannya untuk pembelajaran Pramuka Penegak.`;

  // Pastikan ada poin penting
  const poinPenting = candidatePoints.length > 0
    ? candidatePoints.slice(0, 5)
    : [
        `Pemahaman menyeluruh naskah ${judulDokumen}`,
        'Penguasaan materi teknis dan etika kepanduan',
        'Penerapan langsung dalam kegiatan ambalan'
      ];

  return {
    formattedContent: finalFormatted || normalized,
    ringkasan,
    poinPenting,
    estimasiMenitBaca,
  };
}
