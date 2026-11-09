# PANDUAN LENGKAP & ATURAN PROMPT: LOGIN GOOGLE DI CAPACITOR ANDROID (PETTALOPO MOBILE)

Dokumen ini berisi analisis penyebab kegagalan login Google pada APK Android Pettalopo Mobile, perbaikan yang telah diimplementasikan, serta kumpulan **Aturan Prompt Baku** agar fitur autentikasi Google tidak rusak oleh perubahan di masa depan.

---

## 1. MENGAPA APK ANDROID BISA GAGAL LOGIN GOOGLE? (ANALISIS ROOT CAUSE)

Berdasarkan inspeksi menyeluruh pada kode, konfigurasi Capacitor, dan alur build GitHub Actions, terdapat 4 penyebab utama kegagalan login Google di APK Android:

### A. Ketidakcocokan Sidik Jari SHA-1 Keystore (Penyebab Utama Developer Error / Kode 10)
- **Gejala**: Ketika tombol login ditekan, muncul pesan `Developer Error (Kode 10)` atau loading langsung berhenti tanpa menampilkan pemilih akun Google.
- **Penyebab**: Google Play Services di perangkat Android memverifikasi kombinasi **Package Name** (`id.sch.smpialwasi_maros.ambalan`) dan **SHA-1 Fingerprint** dari keystore yang menandatangani APK rilis. Jika keystore yang disimpan di GitHub Secrets (`PETTALOPO_KEYSTORE_BASE64`) memiliki sidik jari SHA-1 yang berbeda dari yang didaftarkan di Firebase Console (`ef4dacac9187d0f87837821b311c3906bf782bee`), Google Play Services langsung menolak otentikasi.
- **Solusi**: Workflow GitHub Actions kini otomatis mencetak SHA-1 keystore rilis ke build log dan membandingkannya dengan `google-services.json`.

### B. Kegagalan Credential Manager API di HP Android tanpa Fallback (NoCredentialException)
- **Gejala**: Di beberapa tipe HP atau versi Android tertentu (khususnya Android 13 ke bawah atau Google Play Services versi lama), pemanggilan login gagal atau hang.
- **Penyebab**: Plugin `@capacitor-firebase/authentication` versi terbaru menggunakan `CredentialManager` Android (`useCredentialManager: true`) secara default. Jika perangkat belum mendukung API ini atau belum ada akun Google yang terdaftar di Credential Manager provider, pemanggilan melempar `GetCredentialException`.
- **Solusi**: Diimplementasikan **Dual-Strategy Login**: Aplikasi mencoba `useCredentialManager: true` terlebih dahulu. Jika gagal, otomatis fallback ke `useCredentialManager: false` (GoogleSignInClient klasik berbasis Google Play Services Intent yang terbukti kompatibel di 100% perangkat Android).

### C. Macet di "Menghubungkan ke sesi Ambalan..." (Loading Tanpa Henti)
- **Gejala**: Pengguna berhasil memilih akun Google, tetapi tombol login terus berputar tanpa henti di status "Menghubungkan..." dan tidak masuk ke halaman profil.
- **Penyebab**: Alur sebelumnya hanya mengandalkan listener event `onAuthStateChanged`. Jika event tertunda atau terlewat karena sesi token credential sudah tercatat, fungsi `finishLogin()` tidak pernah dipanggil, meninggalkan spinner login dalam status aktif selamanya.
- **Solusi**: Setelah `signInWithCredential(auth, webCredential)` selesai, aplikasi langsung memanggil `await finishLogin(userCred.user)` secara deterministik.

### D. Ketiadaan String Resource `default_web_client_id` di Android Resources
- **Penyebab**: Plugin native Android `@capacitor-firebase/authentication` mencari `R.string.default_web_client_id` untuk meminta `idToken` dari Google OAuth. Jika build tools tidak menyuntikkannya dengan benar, native plugin tidak dapat menghasilkan `idToken`.
- **Solusi**: Workflow build GitHub Actions kini secara eksplisit menyuntikkan `default_web_client_id` (`392815401237-vamq2fm8khbpu42dlm08fg4c5obstoa3.apps.googleusercontent.com`) ke `android/app/src/main/res/values/strings.xml`.

---

## 2. ARSITEKTUR LOGIN GOOGLE DI PETTALOPO MOBILE

Alur autentikasi Google dirancang khusus untuk lingkungan hybrid Capacitor WebView:
```
[Pengguna Tekan Tombol]
       │
       ▼
[Deteksi Platform: Capacitor.isNativePlatform()]
       │
   ┌───┴────────────────────────────────────────┐
   ▼ (Android Native)                           ▼ (Web Preview)
[FirebaseAuthentication.signInWithGoogle()]     [signInWithPopup(auth, googleProvider)]
  - Coba: useCredentialManager: true            │
  - Fallback: useCredentialManager: false        │
       │                                        │
       ▼                                        │
[Dapatkan result.credential.idToken]            │
       │                                        │
       ▼                                        │
[GoogleAuthProvider.credential(idToken)]        │
       │                                        │
       ▼                                        │
[signInWithCredential(auth, webCredential)] ◄───┘
       │
       ▼
[finishLogin(user)] ──> Baca Firestore users/{uid}
       │
       ├─ Jika Admin (miralifa19@gmail.com) ──> Langsung Masuk (Role: Admin)
       ├─ Jika Profil Lengkap ────────────────> Masuk ke Tampilan Terakhir
       └─ Jika Anggota Baru ──────────────────> Form Pendaftaran (Nama, TTL, Sandi)
```

---

## 3. ATURAN PROMPT BAKU (AGAR LOGIN GOOGLE TIDAK RUSAK LAGI)

Salin aturan di bawah ini ke prompt setiap kali meminta asisten AI melakukan perubahan di masa depan:

```markdown
### ATURAN BAKU LOGIN GOOGLE CAPACITOR (JANGAN DIUBAH):
1. IDENTITAS PROYEK & PACKAGE:
   - Application ID / Package Name: id.sch.smpialwasi_maros.ambalan (Wajib sama persis).
   - Firebase Project ID: pettalopo-6f6f4.
   - Firestore Database ID: "(default)".
   - Web Client ID (Client Type 3): 392815401237-vamq2fm8khbpu42dlm08fg4c5obstoa3.apps.googleusercontent.com.

2. KONFIGURASI CAPACITOR:
   - Di capacitor.config.ts, pertahankan plugins.FirebaseAuthentication dengan { skipNativeAuth: true, providers: ['google.com'] }.
   - Jangan ubah skipNativeAuth menjadi false, karena sesi Firestore membutuhkan kredensial di Firebase Web SDK.

3. DUAL-STRATEGY LOGIN (NATIVE ANDROID):
   - Di GoogleAuthPortal.tsx, wajib pertahankan alur try-catch dual-strategy:
     Pertama panggil FirebaseAuthentication.signInWithGoogle({ useCredentialManager: true }).
     Jika gagal, otomatis fallback ke FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false }).
   - Setelah signInWithCredential(auth, webCredential), wajib panggil finishLogin(user) secara langsung tanpa hanya menunggu onAuthStateChanged.

4. PENANGANAN ERROR & DIAGNOSTIK:
   - Pertahankan penanganan kode error spesifik: Kode 10 (SHA-1 belum terdaftar), Kode 12501 (dibatalkan pengguna), Kode 12500 (Google Play Services error), dan auth/unauthorized-domain.
   - Pertahankan tombol dan panel "Diagnostik Koneksi Firestore" pada halaman login.

5. GITHUB ACTIONS & KEYSTORE:
   - Jangan sembunyikan output SHA-1 keystore ke /dev/null di .github/workflows/build-apk.yml.
   - Pastikan default_web_client_id selalu disuntikkan ke strings.xml.
```

---

## 4. LANGKAH VERIFIKASI MANDIRI DI FIREBASE CONSOLE

Jika muncul pesan **Developer Error (Kode 10)** di layar aplikasi:
1. Buka [Firebase Console](https://console.firebase.google.com/) > Pilih project **pettalopo-6f6f4**.
2. Klik ikon gerigi ⚙️ (Project settings) > Tab **General**.
3. Gulir ke bawah ke bagian **Your apps** > Pilih aplikasi Android **id.sch.smpialwasi_maros.ambalan**.
4. Periksa daftar **SHA certificate fingerprints**:
   - Pastikan SHA-1 berikut sudah ada: `EF:4D:AC:AC:91:87:D0:F8:78:37:82:1B:31:1C:39:06:BF:78:2B:EE`.
   - Jika Anda melihat SHA-1 yang berbeda di log build GitHub Actions (pada langkah *Print release keystore SHA-1 and SHA-256*), klik tombol **Add fingerprint**, lalu masukkan SHA-1 tersebut.
5. Klik Simpan. Google Play Services akan aktif dalam 2–5 menit tanpa perlu mengubah kode aplikasi.
