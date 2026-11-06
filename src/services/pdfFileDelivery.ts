import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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
      onStage('Menyimpan PDF sementara di penyimpanan aplikasi');
      const saved = await Filesystem.writeFile({
        path: relativePath,
        data: bytesToBase64(pdfBytes),
        directory: Directory.Cache,
        recursive: true,
      });
      savedUri = saved.uri || (await Filesystem.getUri({
        path: relativePath,
        directory: Directory.Cache,
      })).uri;

      onStage('Membuka menu Bagikan untuk menyimpan PDF');
      try {
        await Share.share({
          title: fileName,
          text: 'Pilih Simpan ke File atau aplikasi tujuan untuk menyimpan surat.',
          files: [savedUri],
          dialogTitle: 'Bagikan atau simpan PDF',
        });
      } catch (error) {
        throw new PdfExportStageError(
          'Membuka menu Bagikan PDF',
          error,
          savedUri,
        );
      }

      return {
        message: 'Menu Bagikan terbuka. Pilih Simpan ke File untuk menyimpan PDF.',
        savedPath: savedUri,
      };
    } catch (error) {
      if (error instanceof PdfExportStageError) throw error;
      throw new PdfExportStageError(
        'Menyimpan PDF sementara di penyimpanan aplikasi',
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
