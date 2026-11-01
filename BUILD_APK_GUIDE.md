# Panduan CI/CD GitHub Actions: Build Otomatis File APK Android
### Ambalan La Surullah Petta Lopo (Gudep 10-035 & 10-036)

Panduan ini menjelaskan cara kerja otomasi CI/CD menggunakan **GitHub Actions** untuk mem-build aplikasi web React + Vite menjadi file installer native **APK Android** secara otomatis setiap kali Anda melakukan `git push` ke branch `main`.

---

## 1. Framework Target: Capacitor (Vite + React to Android Native)
Proyek ini dibangun menggunakan **React 19 + TypeScript + Vite + Tailwind CSS**. 
Framework jembatan terbaik, resmi, dan paling efisien untuk mengemas Vite menjadi aplikasi Android native tanpa menulis ulang kode adalah **Capacitor** (dari Ionic Team).

Konfigurasi telah disiapkan pada berkas `capacitor.config.ts`:
- **App ID**: `id.sch.smpialwasi_maros.ambalan`
- **App Name**: `Ambalan La Surullah Petta Lopo`
- **Web Directory**: `dist`

---

## 2. Struktur File Workflow GitHub Actions
File workflow telah dibuat di lokasi:
`.github/workflows/build-apk.yml`

```yaml
name: Build Android APK (Ambalan La Surullah)

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch: # Memungkinkan tombol 'Run workflow' manual di tab Actions

jobs:
  build-apk:
    name: Build Native Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
          cache: 'gradle'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install Dependencies
        run: npm ci

      - name: Build Web Application
        run: npm run build

      - name: Setup Capacitor Android
        run: |
          npx @capacitor/cli add android || echo "Android platform already exists"
          npx @capacitor/cli sync android

      - name: Grant Execute Permission for Gradlew
        run: chmod +x android/gradlew

      - name: Build Debug APK with Gradle
        run: |
          cd android
          ./gradlew assembleDebug --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ambalan-la-surullah-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14
```

---

## 3. Langkah Menjalankan di GitHub

1. **Inisialisasi Git & Push ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: inisialisasi aplikasi ambalan & github actions apk build"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO-AMBALAN.git
   git push -u origin main
   ```

2. **Proses Build Berjalan Otomatis**:
   - Buka halaman repository Anda di browser: `https://github.com/USERNAME/NAMA-REPO-AMBALAN`
   - Klik tab **Actions**.
   - Anda akan melihat workflow bernama **"Build Android APK (Ambalan La Surullah)"** sedang berjalan dengan status ikon kuning berputar.
   - Durasi build biasanya memakan waktu sekitar **2–4 menit** (lebih cepat pada build berikutnya karena cache Gradle & npm).

3. **Mengunduh File APK**:
   - Setelah workflow selesai (status centang hijau), klik pada judul run workflow tersebut.
   - Gulir ke bawah ke bagian **Artifacts**.
   - Klik pada item **`ambalan-la-surullah-debug-apk`**.
   - File zip akan terunduh. Ekstrak zip tersebut untuk mendapatkan file `app-debug.apk`.
   - Kirim file APK ke smartphone Android anggota Pramuka melalui WhatsApp / Google Drive untuk langsung di-install!

---

## 4. Debug APK vs Release APK (Signed APK)

### A. Debug APK (Fokus Saat Ini)
- **Kelebihan**: Tidak memerlukan sertifikat digital (*Keystore*), tidak memerlukan konfigurasi rahasia (*Secrets*), dan langsung dibuat secara otomatis oleh Gradle dengan *debug key* bawaan.
- **Penggunaan**: Sangat cocok untuk pengujian internal sangga, dewan ambalan, pembina, serta distribusi langsung ke anggota ambalan.
- **Catatan saat install di HP**: Android mungkin akan menampilkan peringatan Play Protect ("Aplikasi tidak dikenal"). Cukup klik *"Tetap Install"* (Install Anyway).

---

### B. Release APK (Signed APK dengan GitHub Secrets)
Jika di masa mendatang Anda ingin merilis aplikasi ke **Google Play Store** atau mendistribusikan APK resmi tanpa peringatan Play Protect, gunakan **Release APK**.

#### Langkah-langkah Menyiapkan Signed Release:

1. **Buat File Keystore (di komputer Anda via Terminal)**:
   ```bash
   keytool -genkey -v -keystore ambalan-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias ambalan_key
   ```
   *(Simpan password dan file `ambalan-release-key.jks` di tempat aman, jangan pernah di-commit ke Git public!)*

2. **Konversi Keystore ke Base64**:
   ```bash
   # Di Linux / macOS:
   base64 -w 0 ambalan-release-key.jks > keystore_base64.txt

   # Di Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("ambalan-release-key.jks")) | Out-File -Encoding ASCII keystore_base64.txt
   ```

3. **Daftarkan ke GitHub Secrets**:
   - Masuk ke tab **Settings** di repo GitHub Anda -> **Secrets and variables** -> **Actions** -> **New repository secret**.
   - Tambahkan 4 rahasia berikut:
     - `KEYSTORE_BASE64`: Salin seluruh teks isi file `keystore_base64.txt`.
     - `KEY_ALIAS`: Nama alias kunci (contoh: `ambalan_key`).
     - `KEY_PASSWORD`: Password alias kunci.
     - `KEYSTORE_PASSWORD`: Password berkas keystore.

4. **Tambahkan Step Signing pada Workflow (untuk Release)**:
   ```yaml
      - name: Build Release APK with Gradle
        run: |
          cd android
          ./gradlew assembleRelease

      - name: Sign APK with Keystore
        uses: rinline/android-sign-action@v1
        with:
          releaseDirectory: android/app/build/outputs/apk/release
          signingKey: ${{ secrets.KEYSTORE_BASE64 }}
          alias: ${{ secrets.KEY_ALIAS }}
          keyStorePassword: ${{ secrets.KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.KEY_PASSWORD }}

      - name: Upload Signed APK
        uses: actions/upload-artifact@v4
        with:
          name: ambalan-la-surullah-signed-release-apk
          path: android/app/build/outputs/apk/release/*-signed.apk
   ```
