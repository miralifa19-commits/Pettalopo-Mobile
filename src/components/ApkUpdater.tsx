import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Download, RefreshCw, Smartphone, LoaderCircle } from 'lucide-react';

interface UpdateManifest {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  catatan: string;
}

const VERSION_URL = 'https://github.com/miralifa19-commits/Pettalopo-Mobile/releases/latest/download/version.json';
const APK_MIME_TYPE = 'application/vnd.android.package-archive';

export function ApkUpdater() {
  const [manifest, setManifest] = useState<UpdateManifest | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const checkForUpdate = async () => {
      if (Capacitor.getPlatform() !== 'android') return;

      try {
        const response = await fetch(VERSION_URL, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`Manifest pembaruan tidak dapat dibaca (HTTP ${response.status}).`);
        }

        const latest = await response.json() as UpdateManifest;
        if (
          !Number.isFinite(Number(latest.versionCode)) ||
          !latest.versionName ||
          !latest.apkUrl ||
          !latest.apkUrl.startsWith('https://github.com/miralifa19-commits/Pettalopo-Mobile/releases/download/')
        ) {
          throw new Error('Isi version.json tidak lengkap atau alamat APK tidak valid.');
        }

        const installed = await App.getInfo();
        const installedVersionCode = Number.parseInt(installed.build, 10);
        if (active && Number(latest.versionCode) > installedVersionCode) {
          setManifest(latest);
        }
      } catch (checkError) {
        console.warn('Pemeriksaan Auto Update Pettalopo gagal:', checkError);
      }
    };

    void checkForUpdate();
    return () => { active = false; };
  }, []);

  const startUpdate = async () => {
    if (!manifest || downloading) return;

    setDownloading(true);
    setProgress(0);
    setMessage('Menyiapkan unduhan APK...');
    setError('');

    const path = `updates/pettalopo-mobile-v${manifest.versionCode}.apk`;
    let progressListener: { remove: () => Promise<void> } | undefined;

    try {
      const cachedFiles = await Filesystem.readdir({
        path: 'updates',
        directory: Directory.Cache,
      }).catch(() => ({ files: [] as Array<{ name: string }> }));
      await Promise.all(
        cachedFiles.files
          .filter((file) => file.name.toLowerCase().endsWith('.apk'))
          .map((file) => Filesystem.deleteFile({
            path: `updates/${file.name}`,
            directory: Directory.Cache,
          }).catch(() => undefined)),
      );

      progressListener = await Filesystem.addListener('progress', (status) => {
        if (status.contentLength > 0) {
          const percentage = Math.min(100, Math.round((status.bytes / status.contentLength) * 100));
          setProgress(percentage);
          setMessage(`Mengunduh pembaruan... ${percentage}%`);
        } else {
          setMessage('Mengunduh pembaruan...');
        }
      });

      await Filesystem.downloadFile({
        url: manifest.apkUrl,
        path,
        directory: Directory.Cache,
        recursive: true,
        progress: true,
      });

      setProgress(100);
      setMessage('Unduhan selesai. Membuka pemasang Android...');
      const file = await Filesystem.getUri({ path, directory: Directory.Cache });

      await FileOpener.open({
        filePath: file.uri,
        contentType: APK_MIME_TYPE,
        openWithDefault: true,
      });

      setMessage('Pemasang Android sudah dibuka. Tekan Pasang untuk menyelesaikan pembaruan.');
    } catch (updateError) {
      console.error('Auto Update Pettalopo gagal:', updateError);
      setError(updateError instanceof Error ? updateError.message : String(updateError));
      setMessage('Pembaruan belum dapat dipasang. Periksa izin pemasangan aplikasi dari sumber ini lalu coba lagi.');
    } finally {
      if (progressListener) await progressListener.remove().catch(() => undefined);
      setDownloading(false);
    }
  };

  if (!manifest) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-2xl">
        <div className="bg-gradient-to-br from-red-700 to-red-600 px-6 pb-6 pt-6 text-white">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Smartphone size={29} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-100">Pettalopo Mobile</p>
          <h2 className="mt-1 text-2xl font-bold">Pembaruan Tersedia</h2>
          <p className="mt-2 text-sm leading-relaxed text-red-50">Versi terbaru aplikasi sudah tersedia.</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Versi terbaru</span>
            <span className="font-bold text-red-700">v{manifest.versionName}</span>
          </div>

          {manifest.catatan && (
            <p className="max-h-32 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {manifest.catatan}
            </p>
          )}

          {downloading && (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-red-700 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-xs font-semibold text-slate-600">{message}</p>
            </div>
          )}

          {!downloading && message && (
            <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs leading-relaxed text-emerald-800">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={downloading}
            onClick={() => void startUpdate()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-60"
          >
            {downloading ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}
            {downloading ? 'Mengunduh APK...' : 'Update'}
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={() => setManifest(null)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Nanti
          </button>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            Setelah unduhan selesai, Android akan membuka pemasang aplikasi. Anda hanya perlu menekan Pasang. Jika diminta, izinkan Pettalopo Mobile memasang aplikasi dari sumber ini.
          </p>
        </div>
      </div>
    </div>
  );
}
