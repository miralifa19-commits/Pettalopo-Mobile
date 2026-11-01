import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { Download, X, RefreshCw, Smartphone, LoaderCircle } from 'lucide-react';

const CURRENT_VERSION = '1.0.6';
// Hanya periksa rilis Pettalopo Mobile sendiri, bukan repositori aplikasi lain.
const RELEASES_API = 'https://api.github.com/repos/miralifa19-commits/Pettalopo-Mobile/releases/latest';

type ReleaseInfo = {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  assets?: Array<{ name: string; browser_download_url: string }>;
};

function compareVersions(a: string, b: string) {
  const left = a.replace(/^v/i, '').split('.').map(Number);
  const right = b.replace(/^v/i, '').split('.').map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const x = left[i] || 0;
    const y = right[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export function UpdateChecker() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function checkForUpdate() {
      try {
        const response = await fetch(RELEASES_API, {
          headers: { Accept: 'application/vnd.github+json' },
          cache: 'no-store',
        });
        // Jika belum ada rilis resmi atau repositori tidak dapat diakses publik,
        // jangan tampilkan pemberitahuan pembaruan.
        if (!response.ok) return;
        const latest: ReleaseInfo = await response.json();
        const latestVersion = (latest.tag_name || '').replace(/^v/i, '');
        const installedVersion = Capacitor.isNativePlatform()
          ? (await App.getInfo()).version
          : CURRENT_VERSION;
        if (!latestVersion || compareVersions(latestVersion, installedVersion) <= 0) return;

        const apk = latest.assets?.find((asset) => asset.name.toLowerCase().endsWith('.apk'));
        if (!apk || !active) return;

        setRelease({ ...latest, assets: [apk] });
        setVisible(true);

        if (Capacitor.isNativePlatform()) {
          const lastNotified = localStorage.getItem('pettalopo_last_update_notification');
          if (lastNotified !== latestVersion) {
            const permission = await LocalNotifications.checkPermissions();
            const granted = permission.display === 'granted'
              ? permission
              : await LocalNotifications.requestPermissions();

            if (granted.display === 'granted') {
              await LocalNotifications.schedule({
                notifications: [{
                  id: 7301,
                  title: 'Pembaruan Pettalopo Mobile tersedia',
                  body: `Versi terbaru ${latestVersion} sudah tersedia. Ketuk untuk melihat pembaruan.`,
                  schedule: { at: new Date(Date.now() + 1000) },
                  extra: { url: apk.browser_download_url },
                }],
              });
              localStorage.setItem('pettalopo_last_update_notification', latestVersion);
            }
          }
        }
      } catch (error) {
        console.warn('Pemeriksaan pembaruan Pettalopo tidak berhasil:', error);
      }
    }

    checkForUpdate();
    return () => { active = false; };
  }, []);

  async function startUpdate() {
    const apkUrl = release?.assets?.[0]?.browser_download_url;
    if (!apkUrl || updating) return;

    if (Capacitor.getPlatform() !== 'android') {
      window.open(apkUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setUpdating(true);
    setUpdateMessage('Mengunduh pembaruan ke perangkat...');
    try {
      const version = (release?.tag_name || 'terbaru').replace(/^v/i, '');
      const path = `updates/pettalopo-mobile-${version}.apk`;

      await Filesystem.downloadFile({
        url: apkUrl,
        path,
        directory: Directory.Cache,
        recursive: true,
      });

      setUpdateMessage('Unduhan selesai. Membuka pemasang Android...');
      const file = await Filesystem.getUri({ path, directory: Directory.Cache });
      await FileOpener.openFile({
        path: file.uri,
        mimeType: 'application/vnd.android.package-archive',
      });
      setUpdateMessage('Silakan ikuti konfirmasi pemasangan yang muncul dari Android.');
    } catch (error) {
      console.error('Pembaruan Pettalopo gagal dibuka:', error);
      setUpdateMessage('Belum dapat membuka pemasang otomatis. Silakan unduh APK melalui tautan cadangan.');
      window.open(apkUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setUpdating(false);
    }
  }

  if (!visible || !release) return null;

  const apkUrl = release.assets?.[0]?.browser_download_url;
  const version = (release.tag_name || '').replace(/^v/i, '');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-2xl">
        <div className="relative bg-gradient-to-br from-emerald-700 to-green-600 px-6 pb-7 pt-6 text-white">
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Tutup pemberitahuan"
            disabled={updating}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 disabled:opacity-50"
          >
            <X size={18} />
          </button>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Smartphone size={29} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Pettalopo Mobile</p>
          <h2 className="mt-1 text-2xl font-bold">Pembaruan tersedia</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50">Versi terbaru aplikasi sudah siap digunakan.</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Versi terbaru</span>
            <span className="font-bold text-emerald-700">v{version}</span>
          </div>
          {release.body && (
            <div className="max-h-28 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {release.body}
            </div>
          )}
          {updateMessage && (
            <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs leading-relaxed text-emerald-800">
              {updateMessage}
            </p>
          )}
          <button
            type="button"
            disabled={!apkUrl || updating}
            onClick={startUpdate}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {updating ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}
            {updating ? 'Memproses Pembaruan...' : 'Unduh & Pasang Pembaruan'}
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={() => setVisible(false)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Nanti saja
          </button>
          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            Setelah unduhan, Android akan meminta persetujuan untuk memasang pembaruan. Data aplikasi tidak dihapus jika versi ini memiliki tanda tangan pemasangan yang sama.
          </p>
        </div>
      </div>
    </div>
  );
}
