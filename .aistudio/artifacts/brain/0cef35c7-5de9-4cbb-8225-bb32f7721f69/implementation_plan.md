# Perbaikan Sistem Login Google Firebase & Sukses Build APK GitHub Actions

Perbaikan menyeluruh pada alur login Google dan inisialisasi Firestore di Pettalopo Mobile guna mengatasi masalah waktu habis (timeout) atau pemuatan tanpa henti (infinite loading) pada web pratinjau dan aplikasi Android APK, serta memastikan alur otomatisasi build APK pada GitHub Actions berhasil 100%.

> [!IMPORTANT]
> **Keputusan Berdasarkan Jawaban Pengguna (Fase Klarifikasi):**
> - **Lingkungan Masalah**: Terjadi baik pada APK Android maupun pada pratinjau web AI Studio.
> - **Gejala Utama**: Muncul pesan timeout atau pemuatan berputar tanpa henti saat login.
> - **Status SHA-1 Keystore**: Sidik jari SHA-1 rilis (`ef:4d:ac:ac:91:87:d0:f8:78:37:82:1b:31:1c:39:06:bf:78:2b:ee`) sudah tertera di konfigurasi, namun pengguna memerlukan kepastian kecocokan dengan keystore di GitHub Actions dan Firebase Console.
> - **Pendekatan Solusi**: Mengeliminasi pemblokiran jaringan berlebih (menghilangkan paksaan `getIdToken(true)` yang memicu STS token refresh berulang, mengganti `getDocFromServer` yang memaksa bypass cache dengan penanganan fallback cerdas), merapikan listener state auth ganda, dan memperjelas panduan verifikasi SHA-1 untuk APK rilis.

---

### 1. Overview & Core Concept

Pettalopo Mobile adalah aplikasi resmi keanggotaan dan administrasi Pramuka Penegak Ambalan La Surullah Petta Lopo (Gudep 10-035 & 10-036). Aplikasi dibangun menggunakan React SPA dengan Vite dan dibungkus menjadi APK Android native menggunakan Capacitor.

- **Masalah Pengguna**: Saat pengguna menekan tombol "Lanjutkan dengan Google", aplikasi mengalami pemuatan tanpa henti atau memunculkan pesan error "Firestore timeout: proses membaca/menyelesaikan profil melebihi 10 detik". Hal ini menghambat anggota dan Pembina/Admin (`miralifa19@gmail.com`) untuk masuk ke dalam aplikasi.
- **Tujuan Utama**: 
  1. Proses login Google berjalan cepat (< 3 detik) baik di peramban web maupun di dalam WebView APK Android.
  2. Bebas dari kendala race condition antara `onAuthStateChanged` dan `useEffect([open])`.
  3. Memastikan konfigurasi Gradle dan aset `google-services.json` memenuhi seluruh syarat verifikasi skrip Python di alur kerja GitHub Actions (`.github/workflows/build-apk.yml`).

---

### 2. User Experience & Visual Design

Desain antarmuka tetap mematuhi prinsip desain mobile clean, modern, minimalis, dan berpedoman pada warna dominan putih dengan aksen merah ambalan (`#e51c24`).

#### A. Alur Pengguna (User Flow)
```
┌────────────────────────┐
│ Layar Login Pettalopo  │
│ [Lanjutkan dg Google]  │
└───────────┬────────────┘
            │ Klik Login
            ▼
┌────────────────────────┐     Gagal / Batal     ┌────────────────────────┐
│ Otentikasi Google      │ ────────────────────> │ Tampilkan Pesan Jelas  │
│ (Native / Web Popup)   │                       │ + Tombol Coba Lagi     │
└───────────┬────────────┘                       └────────────────────────┘
            │ Sukses dapat kredensial
            ▼
┌────────────────────────┐     Belum ada profil  ┌────────────────────────┐
│ Cek Profil Pengguna    │ ────────────────────> │ Layar Lengkapi Data    │
│ users/{uid} (Firestore)│                       │ (Nama, WA, Tgl Lahir)  │
└───────────┬────────────┘                       └───────────┬────────────┘
            │ Profil sudah ada                               │ Simpan
            ▼                                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Masuk ke Beranda Aplikasi (Role Anggota / Dewan / Admin miralifa19)     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### B. Hierarki Visual & Disiplin Anti-Slop
- **Palet Warna 60-30-10**:
  - 60% Kanvas Netral: Latar putih bersih (`#ffffff` / `bg-white`) dan slate lembut (`#f8fafc`).
  - 30% Struktur: Garis tepi halus (`border-slate-200`), kartu beradius `rounded-2xl` tanpa efek bayangan berlebihan.
  - 10% Aksen: Merah khas Ambalan (`#e51c24`) untuk tombol aksi utama dan header resmi.
- **Tipografi**: Menggunakan `Plus Jakarta Sans` yang tegas dan proporsional untuk teks umum, serta `font-mono` untuk data teknis diagnostik.
- **Penanganan Umpan Balik (Feedback)**:
  - Tombol login menampilkan status animasi loading halus saat proses berlangsung (`"Menghubungkan..."`).
  - Bila terjadi timeout atau koneksi gagal, sistem menampilkan tombol *"Coba Lagi"* dan *"Buka Diagnostik"* tanpa mengunci pengguna di layar kosong.

---

### 3. Key Product Decisions & Trade-Offs

#### Keputusan 1: Optimasi Pengambilan Token dan Profil (Mencegah Timeout)
- **Kondisi Sebelumnya**: Memanggil `user.getIdToken(true)` yang memaksa refresh token lewat server STS Google setiap kali proses login berjalan, ditambah `getDocFromServer(ref)` yang melarang pemakaian cache internal SDK.
- **Solusi Terpilih**: 
  - Gunakan `user.getIdToken()` standar tanpa `forceRefresh=true` jika sesi token masih aktif.
  - Gunakan `getDoc(ref)` standar dengan fallback timeout 8 detik. Jika server Firestore lambat merespons tetapi data cache tersedia atau koneksi sedang negosiasi, pengguna tidak langsung dibatalkan.
- **Alasan**: Menghilangkan latensi 3-5 detik tak perlu dan mencegah kegagalan timeout akibat koneksi lambat di ponsel.

#### Keputusan 2: Pemisahan Trigger Login dan Eliminasi Race Condition
- **Kondisi Sebelumnya**: `onAuthStateChanged` dan hook `useEffect([open])` sama-sama memanggil fungsi `finishLogin` yang mengakibatkan penumpukan eksekusi ganda dan potensi deadlock jika status auth lokal sudah terisi.
- **Solusi Terpilih**: Gunakan flag status sinkronisasi tunggal yang dikontrol secara terpusat dengan pembatalan (*cleanup effect*).

#### Keputusan 3: Penyelarasan Konfigurasi Android & GitHub Actions
- **Kondisi**: File `.github/workflows/build-apk.yml` memiliki tahapan pengujian ketat (*Python assertion*) yang memeriksa:
  1. `projectId == "pettalopo-6f6f4"`
  2. `databaseId == "(default)"`
  3. `messagingSenderId == "392815401237"`
  4. Keberadaan client Android untuk package `id.sch.smpialwasi_maros.ambalan`
  5. Keberadaan OAuth client Type 3 (Web client `...vamq2fm8khbpu42dlm08fg4c5obstoa3`)
- **Solusi Terpilih**: Menjaga integritas file `firebase-applet-config.json` dan `android/app/google-services.json` agar 100% lolos verifikasi build APK tanpa kendala.

---

### 4. Technical Architecture & Data Strategy

#### Diagram Arsitektur Alur Otentikasi & Penyimpanan

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PETTALOPO CLIENT LAYER                          │
│                                                                        │
│   Web Browser (AI Studio)               Android APK (Capacitor)        │
│   ┌──────────────────────────┐          ┌──────────────────────────┐   │
│   │ Google Popup Sign-In     │          │ Native Google Sign-In    │   │
│   │ (signInWithPopup)        │          │ (@capacitor-firebase)    │   │
│   └────────────┬─────────────┘          └────────────┬─────────────┘   │
│                │                                     │ idToken         │
│                │                                     ▼                 │
│                │                        ┌──────────────────────────┐   │
│                │                        │ signInWithCredential     │   │
│                │                        └────────────┬─────────────┘   │
│                └───────────────────┬─────────────────┘                 │
│                                    │ Sesi Web SDK Terotentikasi        │
│                                    ▼                                   │
│                     ┌─────────────────────────────┐                    │
│                     │  Firebase Auth (Web SDK)    │                    │
│                     │  Current User (UID, Email)  │                    │
│                     └──────────────┬──────────────┘                    │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ Query profil users/{uid}
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FIRESTORE DATABASE "(default)"                     │
│                        Proyek: pettalopo-6f6f4                         │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ firestore.rules Security Gate                                  │   │
│   │ - Admin miralifa19@gmail.com: Hak akses penuh                   │   │
│   │ - Anggota: Hak baca/tulis dokumen profil users/{request.auth.uid}│ │
│   └────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                   │
│          ┌─────────────────────────┴────────────────────────┐          │
│          ▼                                                  ▼          │
│  [users/{uid}]                                     [public_members]    │
│  Profil pribadi, status keanggotaan                Direktori publik    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Komponen yang Disesuaikan:
1. `src/components/auth/GoogleAuthPortal.tsx`:
   - Menghapus pemaksaan refresh STS token `user.getIdToken(true)` yang memicu timeout.
   - Mengganti `getDocFromServer` dengan `getDoc` yang aman dan berbatas waktu.
   - Memperbaiki penanganan error agar menampilkan panduan solusi nyata saat timeout terjadi.
   - Menstabilkan panel diagnostik koneksi Firestore agar dapat mendeteksi apakah endpoint Firestore diblokir atau lancar.
2. `src/services/authService.ts`:
   - Memastikan fungsi `signInWithGoogle` dan `signOutAmbalan` menangani lingkungan native Capacitor maupun web dengan elegan.
3. `src/firebase/config.ts`:
   - Mempertahankan inisialisasi Firestore sesuai persyaratan GitHub Actions (`pettalopo-6f6f4` dan database `(default)`).

---

### 5. Rencana Verifikasi & Uji Kualitas

1. **Uji Kompilasi & Linting Lokal**:
   - Menjalankan `bun run lint` (`tsc --noEmit`) untuk memastikan tidak ada kesalahan tipe TypeScript.
   - Menjalankan `bun run test:pdf` untuk memastikan generator dokumen resmi tetap lolos uji.
   - Menjalankan `bun run build` untuk memvalidasi pembuatan bundle web produksi.
2. **Uji Alur Login Pratinjau**:
   - Menguji alur otentikasi Google pada portal login dan memeriksa diagnostik koneksi ke proyek `pettalopo-6f6f4`.
3. **Panduan Verifikasi Keystore di GitHub Actions**:
   - Memberikan petunjuk jelas kepada pengguna mengenai cara mencocokkan SHA-1 rilis (`ef:4d:ac:ac:91:87:d0:f8:78:37:82:1b:31:1c:39:06:bf:78:2b:ee`) pada Firebase Console jika APK rilis mengalami Developer Error (Code 10).
