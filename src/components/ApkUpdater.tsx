import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Download, RefreshCw, Smartphone, LoaderCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface UpdateManifest {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  catatan: string;
}

const VERSION_URL = 'https://github.com/miralifa19-commits/Pettalopo-Mobile/releases/latest/download/version.json';
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const UPDATE_FOLDER = 'updates';

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function ApkUpdater() {
  const [manifest, setManifest] = useState<UpdateManifest | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [installerOpened, setInstallerOpened] = useState(false);

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
        const installedVersionCode = Number.parseInt(installed.build, 10) || 0;

        // Bersihkan APK sementara yang versinya sudah terpasang. File yang belum
        // terpasang tetap berada di cache privat aplikasi agar bisa dicoba lagi.
        const cachedFiles = await Filesystem.readdir({
          path: UPDATE_FOLDER,
          directory: Directory.Cache,
        }).catch(() => ({ files: [] as Array<{ name: string }> }));
        await Promise.all(
          cachedFiles.files
            .map((file) => {
              const match = file.name.match(/^pettalopo-mobile-v(\\d+)\\.apk$/i);
              return match && Number(match[1]) <= installedVersionCode
                ? Filesystem.deleteFile({
                    path: `${UPDATE_FOLDER}/${file.name}`,
                    directory: Directory.Cache,
                  }).catch(() => undefined)
                : Promise.resolve();
            }),
        );

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

  // Setelah pengguna kembali dari layar pemasang Android, periksa apakah APK
  // baru benar-benar sudah terpasang. Hanya hapus file cache jika versionCode
  // aplikasi sudah mencapai versi target.
  useEffect(() => {
    if (!installerOpened || !manifest || Capacitor.getPlatform() !== 'android') return;

    let cancelled = false;
    let listener: { remove: () => Promise<void> } | undefined;

    const verifyInstallation = async () => {
      try {
        const installed = await App.getInfo();
        const installedVersionCode = Number.parseInt(installed.build, 10) || 0;
        if (cancelled) return;

        if (installedVersionCode >= manifest.versionCode) {
          await Filesystem.deleteFile({
            path: `${UPDATE_FOLDER}/pettalopo-mobile-v${manifest.versionCode}.apk`,
            directory: Directory.Cache,
          }).catch(() => undefined);
          setMessage('Pettalopo Mobile berhasil diperbarui. Terima kasih, Kak!');
          setManifest(null);
        } else {
          setInstallerOpened(false);
          setMessage('Pemasangan belum selesai. Kakak bisa mencoba membuka pemasang kembali.');
        }
      } catch (verifyError) {
        console.warn('Verifikasi hasil pemasangan gagal:', verifyError);
      }
    };

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void verifyInstallation();
    }).then((handle) => {
      if (cancelled) void handle.remove();
      else listener = handle;
    }).catch((listenerError) => {
      console.warn('Listener status aplikasi tidak dapat dipasang:', listenerError);
    });

    return () => {
      cancelled = true;
      if (listener) void listener.remove();
    };
  }, [installerOpened, manifest]);

  const startUpdate = async () => {
    if (!manifest || downloading) return;

    setDownloading(true);
    setInstallerOpened(false);
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(0);
    setMessage('Menyiapkan unduhan pembaruan...');
    setError('');

    const path = `${UPDATE_FOLDER}/pettalopo-mobile-v${manifest.versionCode}.apk`;
    let progressListener: { remove: () => Promise<void> } | undefined;

    try {
      await Filesystem.mkdir({
        path: UPDATE_FOLDER,
        directory: Directory.Cache,
        recursive: true,
      }).catch(() => undefined);

      // Hapus unduhan lama yang tidak sedang dipasang, agar cache tidak menumpuk.
      const cachedFiles = await Filesystem.readdir({
        path: UPDATE_FOLDER,
        directory: Directory.Cache,
      }).catch(() => ({ files: [] as Array<{ name: string }> }));
      await Promise.all(
        cachedFiles.files
          .filter((file) => file.name.toLowerCase().endsWith('.apk') && file.name !== path.split('/').pop())
          .map((file) => Filesystem.deleteFile({
            path: `${UPDATE_FOLDER}/${file.name}`,
            directory: Directory.Cache,
          }).catch(() => undefined)),
      );

      progressListener = await Filesystem.addListener('progress', (status) => {
        const received = Math.max(0, Number(status.bytes) || 0);
        const total = Math.max(0, Number(status.contentLength) || 0);
        setDownloadedBytes(received);
        setTotalBytes(total);
        if (total > 0) {
          const percentage = Math.min(100, Math.round((received / total) * 100));
          setProgress(percentage);
          setMessage('Sedang mengunduh pembaruan di latar belakang...');
        } else {
          setMessage('Sedang mengunduh pembaruan di latar belakang...');
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

      setInstallerOpened(true);
      setMessage('Pemasang Android sudah dibuka. Tekan Instal/Perbarui untuk menyelesaikan.');
    } catch (updateError) {
      console.error('Auto Update Pettalopo gagal:', updateError);
      setError(updateError instanceof Error ? updateError.message : String(updateError));
      setMessage('Unduhan atau pemasangan belum berhasil. Periksa koneksi dan izin pemasangan, lalu coba lagi.');
    } finally {
      if (progressListener) await progressListener.remove().catch(() => undefined);
      setDownloading(false);
    }
  };

  const reopenInstaller = async () => {
    if (!manifest) return;
    try {
      const path = `${UPDATE_FOLDER}/pettalopo-mobile-v${manifest.versionCode}.apk`;
      const file = await Filesystem.getUri({ path, directory: Directory.Cache });
      await FileOpener.open({
        filePath: file.uri,
        contentType: APK_MIME_TYPE,
        openWithDefault: true,
      });
      setInstallerOpened(true);
      setMessage('Pemasang Android dibuka kembali. Tekan Instal/Perbarui untuk melanjutkan.');
      setError('');
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : String(openError));
      setMessage('File pembaruan belum tersedia. Silakan unduh kembali.');
    }
  };

  if (!manifest) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-red-800 via-red-700 to-red-600 px-6 pb-6 pt-7 text-white">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border-[22px] border-white/10" />
          <div className="relative mb-4 flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[24px] border-4 border-white/80 bg-white shadow-lg">
            <img
              src="/assets/pettalopo-logo.png"
              alt="Logo Pettalopo Mobile"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-red-100">Pettalopo Mobile</p>
          <h2 className="relative mt-1 text-[25px] font-extrabold leading-tight">Pembaruan Tersedia!</h2>
          <p className="relative mt-3 text-sm font-semibold text-white">Halo, Kak! 👋</p>
          <p className="relative mt-1 text-sm leading-relaxed text-red-50">
            Yuk, perbarui Pettalopo Mobile. Versi terbaru hadir dengan penyempurnaan dan pengalaman penggunaan yang lebih nyaman.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center justify-between rounded-2xl border border-red-50 bg-red-50/70 px-4 py-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Versi terbaru</p>
              <p className="mt-0.5 text-lg font-extrabold text-red-800">v{manifest.versionName}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-red-700 ring-1 ring-red-100">Tersedia</span>
          </div>

          {manifest.catatan && (
            <p className="max-h-24 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {manifest.catatan}
            </p>
          )}

          {downloading && (
            <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50/60 p-4" aria-live="polite">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600">Progres unduhan</p>
                  <p className="mt-1 text-[11px] text-slate-500">{totalBytes > 0 ? `${formatBytes(downloadedBytes)} dari ${formatBytes(totalBytes)}` : 'Menghubungkan ke server...'}</p>
                </div>
                <p className="text-3xl font-extrabold tabular-nums text-red-700">{totalBytes > 0 ? `${progress}%` : '…'}</p>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-red-100"
                role="progressbar"
                aria-label="Progres unduhan pembaruan"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={totalBytes > 0 ? progress : 0}
              >
                <div className="h-full rounded-full bg-red-700 transition-[width] duration-200" style={{ width: `${totalBytes > 0 ? progress : 4}%` }} />
              </div>
              <p className="text-center text-xs font-medium text-red-800">{message}</p>
            </div>
          )}

          {!downloading && message && (
            <div role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-800">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={downloading}
            onClick={() => void (installerOpened ? reopenInstaller() : startUpdate())}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
          >
            {downloading ? <LoaderCircle size={18} className="animate-spin" /> : installerOpened ? <Smartphone size={18} /> : <Download size={18} />}
            {downloading ? 'Mengunduh...' : installerOpened ? 'Buka Pemasang Lagi' : 'Perbarui Sekarang'}
          </button>

          <button
            type="button"
            disabled={downloading || installerOpened}
            onClick={() => setManifest(null)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <RefreshCw size={15} />
            Nanti Saja
          </button>

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            APK diunduh ke penyimpanan privat aplikasi, bukan folder Download. Setelah selesai, Android akan membuka layar pemasangan. Kakak cukup menekan Instal/Perbarui.
          </p>
        </div>
      </div>
    </div>
  );
}
