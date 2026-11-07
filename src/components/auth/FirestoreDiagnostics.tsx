import React, { useState } from 'react';
import { app, auth } from '../../firebase/config';

type FirestoreDiagnosticsProps = {
  open: boolean;
  onClose: () => void;
};

type ProbeResult = {
  status: number | null;
  body: string;
  networkError?: string;
};

const endpoint = 'https://firestore.googleapis.com/v1/projects/pettalopo-6f6f4/databases/(default)/documents';

function explainStatus(status: number | null, networkError?: string) {
  if (status === 200) return 'HTTP 200: REST API berhasil dijangkau dan token diterima. Daftar dokumen root bisa kosong jika belum ada koleksi pada root.';
  if (status === 401) return 'HTTP 401: token tidak ada, kedaluwarsa, atau tidak valid. Autentikasi Firebase perlu diperiksa.';
  if (status === 403) return 'HTTP 403: permintaan mencapai Google, tetapi ditolak. Periksa Firestore Rules, IAM, atau izin akses database.';
  if (status === 404) return 'HTTP 404: project/database/endpoint tidak ditemukan. Periksa projectId dan keberadaan database (default).';
  if (networkError) return 'Gagal jaringan: request tidak memperoleh respons HTTP. Periksa koneksi, DNS, TLS, WebView, atau pemblokiran jaringan.';
  return 'Respons HTTP lain: baca isi respons asli untuk mengetahui alasan penolakan.';
}

export const FirestoreDiagnostics: React.FC<FirestoreDiagnosticsProps> = ({ open, onClose }) => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [online] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : false);

  if (!open) return null;

  const runProbe = async () => {
    setRunning(true);
    setResult(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const user = auth.currentUser;
      if (!user) {
        setResult({ status: null, body: 'Belum ada pengguna Firebase yang login.', networkError: 'No authenticated user' });
        return;
      }

      const token = await user.getIdToken(true);
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 15_000);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal,
      });
      const body = await response.text();
      setResult({ status: response.status, body });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({
        status: null,
        body: message,
        networkError: message.includes('aborted') ? 'Request timeout setelah 15 detik.' : message,
      });
    } finally {
      if (timer) clearTimeout(timer);
      setRunning(false);
    }
  };

  const projectId = app.options.projectId || '(kosong)';
  const apiKeyPrefix = app.options.apiKey ? app.options.apiKey.slice(0, 6) : '(kosong)';

  return (
    <div className="fixed inset-0 z-[160] overflow-y-auto bg-black/50 p-3 flex items-center justify-center font-sans">
      <section className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-4 space-y-3" role="dialog" aria-modal="true" aria-labelledby="firestore-diagnostics-title">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="firestore-diagnostics-title" className="text-base font-bold text-slate-900">Diagnostik Firestore</h2>
            <p className="text-[11px] text-slate-500">Pemeriksaan REST menggunakan token akun yang sedang login.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-slate-200">Tutup</button>
        </div>

        <div className="rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
          <div className="flex justify-between gap-3"><span className="text-slate-500">projectId aktif</span><strong className="text-right break-all">{projectId}</strong></div>
          <div className="flex justify-between gap-3"><span className="text-slate-500">apiKey (6 karakter awal)</span><strong>{apiKeyPrefix}</strong></div>
          <div className="flex justify-between gap-3"><span className="text-slate-500">Status online</span><strong className={online ? 'text-emerald-700' : 'text-red-700'}>{online ? 'Online' : 'Offline'}</strong></div>
          <div className="text-[10px] text-slate-400 break-all">Endpoint: {endpoint}</div>
        </div>

        <button type="button" onClick={runProbe} disabled={running} className="w-full rounded-xl bg-[#e51c24] px-4 py-3 text-xs font-bold text-white disabled:opacity-50">
          {running ? 'Memeriksa REST Firestore…' : 'Uji koneksi REST sekarang'}
        </button>

        {result && (
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="text-xs font-bold text-slate-900">Hasil: {result.status === null ? 'Tidak ada respons HTTP' : `HTTP ${result.status}`}</div>
            <p className="text-[11px] leading-relaxed text-slate-600">{explainStatus(result.status, result.networkError)}</p>
            <div>
              <div className="text-[10px] font-bold text-slate-500 mb-1">Isi respons / error asli</div>
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-950 text-slate-100 p-3 text-[10px] max-h-56 overflow-auto">{result.body || '(respons kosong)'}</pre>
            </div>
          </div>
        )}
        <p className="text-[10px] text-slate-400">Token pengguna hanya dikirim sebagai header Authorization ke endpoint Google Firestore dan tidak ditampilkan atau disimpan.</p>
      </section>
    </div>
  );
};
