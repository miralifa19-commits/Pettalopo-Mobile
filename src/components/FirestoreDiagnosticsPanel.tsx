import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

type TestResult = {
  status: 'idle' | 'running' | 'success' | 'error' | 'timeout';
  httpStatus?: number;
  durationMs?: number;
  body?: string;
  code?: string;
  message?: string;
};

const TIMEOUT_MS = 10_000;
const REST_URL = 'https://firestore.googleapis.com/v1/projects/pettalopo-6f6f4/databases/(default)/documents/users?pageSize=1';

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        const error = new Error(label + ' melewati batas waktu 10 detik.');
        (error as Error & { code?: string }).code = 'diagnostic/timeout';
        reject(error);
      }, TIMEOUT_MS);
    })
  ]);
}

function errorDetails(error: unknown) {
  const value = error as { code?: unknown; message?: unknown };
  return {
    code: value?.code ? String(value.code) : 'unknown',
    message: value?.message ? String(value.message) : String(error)
  };
}

function formatJsonOrRaw(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body || '(respons kosong)';
  }
}

const initialResult: TestResult = { status: 'idle' };

export const FirestoreDiagnosticsPanel: React.FC = () => {
  const [rest, setRest] = useState<TestResult>(initialResult);
  const [sdkWrite, setSdkWrite] = useState<TestResult>(initialResult);
  const [sdkRead, setSdkRead] = useState<TestResult>(initialResult);
  const [running, setRunning] = useState(false);

  const runDiagnostics = async () => {
    const user = auth.currentUser;
    if (!user) {
      const result = { status: 'error' as const, code: 'auth/no-current-user', message: 'Tidak ada pengguna Firebase yang sedang login.' };
      setRest(result);
      setSdkWrite(result);
      setSdkRead(result);
      return;
    }

    setRunning(true);
    setRest({ status: 'running' });
    setSdkWrite(initialResult);
    setSdkRead(initialResult);

    // 1. REST list users using the current Firebase user's ID token.
    const restStarted = performance.now();
    try {
      const token = await withTimeout(user.getIdToken(), 'Mengambil token Firebase');
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await fetch(REST_URL, {
          method: 'GET',
          headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
          signal: controller.signal
        });
        const body = await response.text();
        setRest({
          status: response.ok ? 'success' : 'error',
          httpStatus: response.status,
          durationMs: Math.round(performance.now() - restStarted),
          body: formatJsonOrRaw(body)
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      const details = errorDetails(error);
      setRest({
        status: details.code === 'diagnostic/timeout' || details.message.toLowerCase().includes('abort') ? 'timeout' : 'error',
        durationMs: Math.round(performance.now() - restStarted),
        ...details
      });
    }

    // 2. SDK write to a dedicated, non-profile diagnostics/{uid} document.
    const diagnosticRef = doc(db, 'diagnostics', user.uid);
    const testedAt = new Date().toISOString();
    const writeStarted = performance.now();
    try {
      await withTimeout(setDoc(diagnosticRef, {
        uid: user.uid,
        purpose: 'firestore-connectivity-diagnostic',
        testedAt
      }, { merge: true }), 'Firebase SDK setDoc');
      setSdkWrite({ status: 'success', durationMs: Math.round(performance.now() - writeStarted), message: 'setDoc berhasil.' });
    } catch (error) {
      const details = errorDetails(error);
      setSdkWrite({
        status: details.code === 'diagnostic/timeout' ? 'timeout' : 'error',
        durationMs: Math.round(performance.now() - writeStarted),
        ...details
      });
    }

    // 3. SDK read uses the exact same document reference.
    const readStarted = performance.now();
    try {
      const snapshot = await withTimeout(getDoc(diagnosticRef), 'Firebase SDK getDoc');
      setSdkRead({
        status: 'success',
        durationMs: Math.round(performance.now() - readStarted),
        message: snapshot.exists() ? 'getDoc berhasil; dokumen diagnostik ditemukan.' : 'getDoc berhasil; dokumen belum ditemukan.'
      });
    } catch (error) {
      const details = errorDetails(error);
      setSdkRead({
        status: details.code === 'diagnostic/timeout' ? 'timeout' : 'error',
        durationMs: Math.round(performance.now() - readStarted),
        ...details
      });
    }

    setRunning(false);
  };

  const ResultCard: React.FC<{ title: string; result: TestResult; description: string }> = ({ title, result, description }) => (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-black text-slate-900">{title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
          result.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
          result.status === 'running' ? 'bg-blue-50 text-blue-700' :
          result.status === 'timeout' || result.status === 'error' ? 'bg-red-50 text-red-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {result.status === 'idle' ? 'Belum diuji' : result.status === 'running' ? 'Menguji…' : result.status === 'success' ? 'Berhasil' : result.status === 'timeout' ? 'Timeout' : 'Gagal'}
        </span>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">{description}</p>
      {result.httpStatus !== undefined && <p className="text-[11px] font-bold text-slate-700">HTTP {result.httpStatus}</p>}
      {result.durationMs !== undefined && <p className="text-[10px] text-slate-500">Waktu: {result.durationMs} ms</p>}
      {result.code && <p className="break-all text-[10px] font-mono text-red-700">Kode: {result.code}</p>}
      {result.message && <p className="break-words text-[10px] text-slate-700">{result.message}</p>}
      {result.body && <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950 p-2 text-[9px] leading-relaxed text-slate-100">{result.body}</pre>}
    </section>
  );

  const allSucceeded = rest.status === 'success' && sdkWrite.status === 'success' && sdkRead.status === 'success';
  const restOnly = rest.status === 'success' && (sdkWrite.status !== 'success' || sdkRead.status !== 'success');
  const allFailed = rest.status === 'error' && sdkWrite.status === 'error' && sdkRead.status === 'error';

  return (
    <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50/40 p-3">
      <div>
        <h3 className="text-sm font-black text-slate-900">Diagnostik Koneksi Firestore</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
          Membandingkan REST API dan Firebase SDK aplikasi memakai token pengguna yang sedang login. Setiap operasi dibatasi 10 detik.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ResultCard title="1. REST List users" result={rest} description="GET /documents/users?pageSize=1 dengan Bearer ID token." />
        <ResultCard title="2. SDK Write" result={sdkWrite} description={`setDoc ke diagnostics/${auth.currentUser?.uid || '{uid}'}.`} />
        <ResultCard title="3. SDK Read" result={sdkRead} description="getDoc pada dokumen diagnostik yang sama." />
      </div>
      <button
        type="button"
        onClick={runDiagnostics}
        disabled={running || !auth.currentUser}
        className="w-full rounded-xl bg-[#e51c24] px-4 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {running ? 'Menjalankan pengujian…' : 'Jalankan 3 Uji Koneksi'}
      </button>
      {!auth.currentUser && <p className="text-[10px] font-semibold text-red-700">Login Firebase diperlukan untuk menjalankan diagnostik.</p>}
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-[10px] leading-relaxed text-slate-600 space-y-1">
        <p className="font-black text-slate-800">Panduan membaca hasil</p>
        <p>• REST 200 + SDK timeout: REST dapat mencapai Firestore, sedangkan jalur transport SDK bermasalah atau macet.</p>
        <p>• REST dan SDK sama-sama gagal: periksa token/proyek/database, Rules/IAM, dan jaringan. Kode error membantu membedakan penyebabnya.</p>
        <p>• REST 401/403: token tidak valid/kedaluwarsa atau akses ditolak; 404 perlu diperiksa pada project/database/path.</p>
        <p>• REST 200 + SDK write/read berhasil: ketiga jalur dasar dapat berkomunikasi; lanjutkan diagnosis pada operasi profil dan aturan koleksi terkait.</p>
        {allSucceeded && <p className="font-bold text-emerald-700">Ketiga pengujian berhasil.</p>}
        {restOnly && <p className="font-bold text-amber-700">REST berhasil tetapi setidaknya satu operasi SDK gagal atau timeout.</p>}
        {allFailed && <p className="font-bold text-red-700">Ketiga jalur gagal. Periksa konfigurasi proyek, database, izin, dan koneksi.</p>}
      </div>
      <p className="text-[9px] leading-relaxed text-slate-500">
        Catatan: dokumen diagnostics/{auth.currentUser?.uid || '{uid}'} dibuat/diperbarui sebagai data uji dan tidak mengubah profil anggota.
      </p>
    </div>
  );
};
