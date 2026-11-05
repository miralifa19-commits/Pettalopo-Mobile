import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { PdfExportStageError, type PdfStageCallback } from './pdfLetterGenerator';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export interface PdfDeliveryResult {
  message: string;
  savedPath?: string;
}

export async function deliverPdfFile(
  pdfBytes: Uint8Array,
  fileName: string,
  onStage: PdfStageCallback = () => undefined,
): Promise<PdfDeliveryResult> {
  if (Capacitor.isNativePlatform()) {
    const relativePath = `Pettalopo/${fileName}`;
    let savedUri = '';

    try {
      onStage('Menyimpan PDF ke penyimpanan dokumen Android');
      const saved = await Filesystem.writeFile({
        path: relativePath,
        data: bytesToBase64(pdfBytes),
        directory: Directory.Documents,
        recursive: true,
      });
      savedUri = saved.uri || (await Filesystem.getUri({
        path: relativePath,
        directory: Directory.Documents,
      })).uri;

      onStage('Membuka PDF dengan aplikasi pembaca dokumen Android');
      try {
        await FileOpener.openFile({
          path: savedUri,
          mimeType: 'application/pdf',
        });
      } catch (error) {
        throw new PdfExportStageError(
          'Membuka PDF yang sudah tersimpan',
          error,
          savedUri,
        );
      }

      return {
        message: 'PDF tersimpan di Dokumen/Pettalopo dan dibuka di aplikasi pembaca PDF.',
        savedPath: savedUri,
      };
    } catch (error) {
      if (error instanceof PdfExportStageError) throw error;
      throw new PdfExportStageError(
        'Menyimpan PDF ke penyimpanan dokumen Android',
        error,
        savedUri || undefined,
      );
    }
  }

  try {
    onStage('Menyiapkan unduhan PDF di browser');
    const blobBuffer = new Uint8Array(pdfBytes.byteLength);
    blobBuffer.set(pdfBytes);
    const blob = new Blob([blobBuffer.buffer as ArrayBuffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

    return { message: 'PDF siap diunduh melalui browser.' };
  } catch (error) {
    throw new PdfExportStageError('Mengunduh PDF melalui browser', error);
  }
}
