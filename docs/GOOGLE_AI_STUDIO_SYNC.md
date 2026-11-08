# Google AI Studio Sync — Pettalopo Mobile

## Tujuan

Cabang `preview/pettalopo-ui-chat-2026-11-08` adalah cabang kerja/pratinjau untuk perubahan UI dan perbaikan yang sedang ditinjau. Perubahan pada cabang ini harus tetap dapat diimpor ke Google AI Studio Build dan dilanjutkan dari sana.

## Mengimpor cabang kerja ke Google AI Studio

1. Buka Google AI Studio di komputer, lalu masuk ke **Build**.
2. Pada kotak prompt, buka menu **Add files (+)** lalu pilih **Import from GitHub**.
3. Hubungkan akun GitHub yang memiliki akses ke `miralifa19-commits/Pettalopo-Mobile`.
4. Pilih repositori tersebut dan pilih cabang `preview/pettalopo-ui-chat-2026-11-08` jika pemilih cabang tersedia.
5. Tunggu proses impor selesai, lalu buka tab **Code** dan periksa struktur proyek serta file konfigurasi sebelum melanjutkan.
6. Setelah proyek hasil impor diverifikasi, gunakan tab **Settings → GitHub** untuk mengelola sinkronisasi. Pastikan repositori dan cabang target benar sebelum melakukan push atau pull.

Dokumentasi Google: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## Aturan keselamatan proyek

- Jangan membuat repositori baru. Gunakan `miralifa19-commits/Pettalopo-Mobile`.
- Jangan menimpa `main` dengan cabang pratinjau tanpa persetujuan eksplisit.
- Jangan menggabungkan atau melakukan push dari AI Studio sebelum memeriksa daftar file yang akan berubah dan memastikan target cabangnya benar.
- Jangan mengubah alur login/autentikasi: `LoginScreen`, `GoogleAuthPortal`, `authService`, Firebase Auth/session, provider, konfigurasi autentikasi, serta alur masuk/keluar tidak boleh disentuh tanpa instruksi khusus.
- Pertahankan `showPettalopoSplash = false` pada `src/App.tsx`.
- Jangan mengubah Firebase project, Firestore rules/schema, applicationId/package name, keystore, alias, sertifikat, atau mekanisme signing.
- Jangan menerbitkan APK/rilis dari proses sinkronisasi ini. Rilis hanya jika diminta secara eksplisit.
- Perubahan berikutnya harus minimal, hanya pada file yang termasuk ruang lingkup permintaan, dan harus diuji sebelum disinkronkan.

## Catatan teknis

Repositori menggunakan React + TypeScript + Vite, Tailwind CSS, Firebase, dan Capacitor Android. Pertahankan struktur serta dependensi yang sudah ada. Jangan mengonversi proyek menjadi aplikasi Android native Kotlin/Jetpack Compose atau mengganti stack tanpa persetujuan.

GitHub Pages hanya untuk pratinjau web; deploy Pages tidak sama dengan sinkronisasi ke Google AI Studio maupun penerbitan APK.
