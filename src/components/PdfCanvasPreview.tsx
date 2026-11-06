import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfCanvasPreviewProps {
  data: Uint8Array;
}

export function PdfCanvasPreview({ data }: PdfCanvasPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState('');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | undefined;
    setRenderError('');
    container.replaceChildren();

    const renderPdf = async () => {
      try {
        loadingTask = pdfjsLib.getDocument({
          data: data.slice(),
          useSystemFonts: true,
        });
        const document = await loadingTask.promise;

        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          if (cancelled) return;

          const page = await document.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(280, container.clientWidth || 900);
          const scale = Math.min(1.5, availableWidth / baseViewport.width);
          const viewport = page.getViewport({ scale });
          const outputScale = Math.max(1, window.devicePixelRatio || 1);
          const canvas = window.document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Peramban tidak dapat menyiapkan area gambar pratinjau.');
          }

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.display = 'block';
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.maxWidth = '100%';
          canvas.style.margin = '0 auto 12px';
          canvas.style.background = '#FFFFFF';
          canvas.style.border = '1px solid #CBD5E1';

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
          }).promise;

          if (cancelled) return;
          container.appendChild(canvas);
          page.cleanup();
        }

      } catch (error) {
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : String(error));
        }
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
      container.replaceChildren();
      void loadingTask?.destroy();
    };
  }, [data]);

  if (renderError) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Pratinjau PDF tidak dapat dirender: {renderError}
      </div>
    );
  }

  return <div ref={containerRef} className="mx-auto w-full max-w-[860px] space-y-3" aria-label="Halaman pratinjau surat" />;
}
