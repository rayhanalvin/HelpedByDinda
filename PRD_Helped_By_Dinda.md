# Helped By Dinda

---

## 1. Ringkasan & Tujuan Aplikasi
*Bagian ini menjelaskan gambaran umum proyek agar dipahami bersama oleh pemilik ide/klien dan tim pengembang.*
- **Nama Aplikasi**: Helped By Dinda
- **Penjelasan Singkat**: Platform bimbel digital modern yang menghubungkan Admin, Pengajar, dan Murid dalam satu sistem terintegrasi untuk mengelola jadwal mengajar, absensi, materi pembelajaran, pembayaran murid (via Midtrans), serta rekap fee pengajar secara otomatis dan transparan.
- **Masalah yang Diselesaikan**:
  - Pencatatan absensi pengajar dan murid masih manual (buku/spreadsheet) sehingga rawan hilang dan sulit direkap.
  - Rekap fee/gaji pengajar dihitung manual dan sering memakan waktu serta rentan salah hitung.
  - Tracking pembayaran murid tidak terpusat sehingga admin sulit memantau siapa yang belum bayar.
  - Materi pembelajaran (video/PDF) tersebar di WhatsApp/Drive tanpa struktur, sulit dicari murid.
  - Pengingat jadwal mengajar, jadwal pembayaran, dan kewajiban absen masih dilakukan manual chat satu per satu.
  - Tidak ada katalog pengingat ujian yang bisa dilihat murid secara terpusat.
- **Pengguna Aplikasi**:
  - Admin: Kelola seluruh data murid, pengajar, jadwal, materi, pembayaran, dan fee. Mengirim pengingat via email ke pengajar/murid.
  - Pengajar: Absen kehadiran diri sendiri, kelola materi (CRUD), lihat jadwal & pengingat mengajar, lihat rekap fee dirinya.
  - Murid: Absen kehadiran diri sendiri, akses materi, lihat status & riwayat pembayaran, ubah profil, lihat katalog pengingat ujian.
- **Target Keberhasilan**:
  - 100% absensi pengajar & murid tercatat digital dengan waktu absen yang akurat.
  - Rekap fee pengajar otomatis dihitung dari jam mengajar tersimpan (diproses < 2 detik untuk 100 pengajar).
  - Tingkat pembayaran murid tepat waktu naik ≥ 40% berkat pengingat email otomatis.
  - Semua materi terkategori dan dapat diakses murid dari smartphone tanpa hambatan.
  - Admin dapat mengirim pengingat (mengajar, bayar, absen) hanya dengan 1 klik.

---

## 2. Batasan Pembuatan Sistem (Versi Awal MVP)
*Menegaskan fitur apa yang dikerjakan di versi awal dan apa yang sengaja ditunda agar aplikasi cepat selesai dan tidak membengkak (mencegah scope creep).*
### ✅ Yang Dikerjakan:
- Autentikasi Email & Password (Clerk) dengan 3 role: Admin, Pengajar, Murid.
- Absensi digital manual (tombol "Hadir") untuk Pengajar dan Murid, terhubung ke jadwal.
- Manajemen Materi (CRUD) dengan penyimpanan video via Bunny Stream dan file pendukung.
- Manajemen Jadwal Mengajar (buat/ubah/hapus jadwal per pengajar & murid).
- Rekap Fee Pengajar otomatis (dihitung dari total jam mengajar × rate per jam).
- Tracking Pembayaran Murid terintegrasi Midtrans Snap (invoice bulanan per murid).
- Katalog Pengingat Ujian (CRUD penuh oleh Admin: tambah/ubah/hapus).
- Pengingat Email via Resend/SMTP: pengingat mengajar (ke pengajar), pengingat bayar (ke murid), pengingat absen (ke pengajar & murid).
- Dashboard Admin, Pengajar, dan Murid yang responsif untuk smartphone.
- Profil murid & pengajar dapat diubah (nama, kontak, foto).

### ⛔ Yang Tidak Dikerjakan di Versi Awal:
- Live Class / Video Conference langsung (Zoom embed).
- Chat real-time antar pengajar dan murid.
- Aplikasi mobile native (Android/iOS).
- Sistem gamifikasi (poin, badge, leaderboard).
- Multi-cabang bimbel (single-tenant).
- Auto-generate invoice PDF via email attachment (invoice masih berupa halaman web).
- Analitik lanjutan (grafik prediksi performa murid).

---

## 3. Daftar Halaman & Struktur Menu (Pages & Routing)
*Daftar lengkap halaman yang harus dibuat, dikelompokkan berdasarkan area atau peran pengguna (Role).*
### A. Public Area (Tanpa Login)
- `/` (Beranda): Hero section "Bimbingan Belajar Modern Bersama Helped By Dinda", daftar keunggulan, preview program, CTA daftar/kontak.
- `/tentang` (Tentang Kami): Cerita Helped By Dinda, visi misi, profil founder Dinda.
- `/program` (Program Belajar): Daftar program (SD, SMP, SMA, UTBK) beserta mata pelajaran.
- `/pengajar-publik` (Daftar Pengajar): Profil singkat pengajar (tanpa data sensitif).
- `/kontak` (Kontak): Form kontak kirim pesan via Resend, alamat, WhatsApp.
- `/login` (Masuk): Form login Clerk (Email & Password).
- `/register` (Daftar): Form pendaftaran akun baru.

### B. Murid Area (Setelah Login, Role: `murid`)
- `/murid/dashboard` (Dasbor Murid): Ringkasan jadwal terdekat, status absen hari ini, status pembayaran, pengingat ujian.
- `/murid/absen` (Absen Saya): Tombol "Hadir Sekarang" untuk kelas sesuai jadwal aktif hari ini + riwayat absensi.
- `/murid/materi` (Materi Pembelajaran): Daftar materi terfilter per mapel/kelas, player video Bunny Stream.
- `/murid/pembayaran` (Pembayaran Saya): Status tagihan bulan ini, tombol "Bayar via Midtrans", riwayat pembayaran.
- `/murid/jadwal` (Jadwal Saya): Kalender & daftar jadwal belajar.
- `/murid/katalog-ujian` (Pengingat Ujian): Daftar ujian mendatang dengan countdown.
- `/murid/profil` (Profil Saya): Ubah nama, kontak, foto, password.

### C. Pengajar Area (Setelah Login, Role: `pengajar`)
- `/pengajar/dashboard` (Dasbor Pengajar): Jadwal mengajar hari ini, ringkasan absen, notifikasi pengingat mengajar, total fee bulan ini.
- `/pengajar/absen` (Absen Saya): Tombol "Absen Hadir" untuk sesi mengajar hari ini + riwayat absensi sendiri.
- `/pengajar/materi` (Kelola Materi): CRUD materi (tambah, edit, hapus, publish).
- `/pengajar/materi/baru` (Tambah Materi): Form upload video/PDF + metadata.
- `/pengajar/jadwal` (Jadwal Mengajar Saya): Lihat jadwal mengajar per minggu/bulan.
- `/pengajar/fee` (Rekap Fee Saya): Total jam mengajar, rate, total fee terhitung, status dibayar/belum.
- `/pengajar/profil` (Profil Saya): Ubah data profil & spesialisasi.

### D. Admin Area (Setelah Login, Role: `admin`)
- `/admin/dashboard` (Dasbor Admin): Statistik singkat (jumlah murid, pengajar, pembayaran masuk, fee bulan ini).
- `/admin/murid` (Data Murid): Tabel CRUD murid, filter status, pencarian.
- `/admin/pengajar` (Data Pengajar): Tabel CRUD pengajar, atur rate/jam, spesialisasi.
- `/admin/jadwal` (Kelola Jadwal Mengajar): Buat/ubah/hapus jadwal, assign pengajar & murid.
- `/admin/absensi` (Absensi Pengajar & Murid): Monitoring absensi per tanggal, role, status.
- `/admin/materi` (Kelola Materi): Moderasi seluruh materi (approve/unpublish/hapus).
- `/admin/katalog-ujian` (Katalog Pengingat Ujian): CRUD penuh (tambah, ubah, hapus) katalog ujian.
- `/admin/pembayaran` (Tracking Pembayaran Murid): Monitoring status bayar, verifikasi Midtrans, kirim pengingat bayar.
- `/admin/fee` (Rekap Fee & Gaji Pengajar): Generate rekap fee per periode, tandai "Sudah Dibayar".
- `/admin/pengingat` (Pusat Pengingat): Tombol kirim pengingat mengajar, pengingat bayar, dan pengingat absen via email.
- `/admin/pengaturan` (Pengaturan Sistem): Konfigurasi default rate, template email, dst.

---

## 4. Pedoman UI/UX & Design System
*Panduan visual konkret agar AI coding assistant tidak membuat UI yang kaku atau default.*
- **Skema Warna**:
  - Primary: `HSL(262, 83%, 58%)` (Ungu violet — kesan edukasi & premium)
  - Primary Foreground: `HSL(0, 0%, 100%)`
  - Secondary: `HSL(262, 83%, 96%)` (Lavender sangat muda)
  - Accent/CTA: `HSL(158, 64%, 42%)` (Hijau emerald — tombol "Hadir", "Bayar", "Simpan")
  - Danger: `HSL(0, 84%, 60%)` (Merah — tombol hapus, badge "Belum Bayar")
  - Warning: `HSL(38, 92%, 50%)` (Amber — badge "Menunggu Verifikasi")
  - Background: `HSL(250, 30%, 99%)` (Putih kebiruan sangat halus)
  - Foreground: `HSL(240, 10%, 12%)` (Hampir hitam, lembut di mata)
  - Muted: `HSL(240, 5%, 96%)` (Abu sangat muda untuk section alternatif)
  - Border: `HSL(240, 6%, 90%)`
- **Tipografi**:
  - Heading: Font `Plus Jakarta Sans` (weight 600-800), letter-spacing sedikit negatif `-0.02em`.
  - Body: Font `Inter` (weight 400-500), line-height `1.6`.
  - Angka/Rate/Statistik: Font `JetBrains Mono` atau tabular-nums agar rapi di tabel.
  - Ukuran mobile-first: Base `text-base` (16px), Heading hero `text-3xl` di mobile, `text-6xl` di desktop.
- **Aturan Komponen**:
  - Semua card menggunakan `rounded-2xl`, `border border-border`, `bg-white`, `shadow-sm`.
  - Shadow saat hover: `hover:shadow-lg transition-all duration-200`.
  - Tombol utama: `rounded-xl`, `h-11` (mobile friendly, mudah di-tap), `font-semibold`.
  - Tabel di mobile WAJIB berubah jadi daftar kartu (bukan horizontal scroll yang menyiksa).
  - Input form: `rounded-xl`, `h-11`, focus ring warna Primary.
  - Sidebar admin/pengajar/murid: disembunyikan di mobile, muncul sebagai drawer bottom-sheet.
  - Badge status: pil bulat `rounded-full px-3 py-1 text-xs font-medium` dengan warna sesuai status.
- **Nuansa & Vibe**: Modern, minimalis, hangat, dan ramah anak muda. Banyak whitespace, micro-animation halus (`framer-motion` untuk fade-in dan slide-up card), ikon `lucide-react` bergaya outline. Prioritas tampilan smartphone: kartu besar, tombol besar, gesture-friendly. Konsisten tanpa gradien norak — hanya gradient subtle di hero (`from-primary/10 to-accent/10`).

---

## 5. Pembagian Hak Akses Pengguna
*Tabel hak akses yang menentukan siapa saja yang boleh melihat, mengedit, atau mengelola data.*
| Menu / Halaman | Publik (Tanpa Login) | Murid (Login) | Pengajar (Login) | Admin (Login) |
| :--- | :---: | :---: | :---: | :---: |
| Beranda, Tentang, Program, Kontak | ✅ | ✅ | ✅ | ✅ |
| Login / Register | ✅ | ❌ | ❌ | ❌ |
| Dasbor Murid & Absen Diri | ❌ | ✅ | ❌ | ✅ (lihat) |
| Materi Pembelajaran (lihat) | ❌ | ✅ | ✅ | ✅ |
| Materi Pembelajaran (CRUD) | ❌ | ❌ | ✅ (milik sendiri) | ✅ (semua) |
| Katalog Pengingat Ujian (lihat) | ❌ | ✅ | ✅ | ✅ |
| Katalog Pengingat Ujian (CRUD) | ❌ | ❌ | ❌ | ✅ |
| Pembayaran Saya & Bayar Midtrans | ❌ | ✅ (milik sendiri) | ❌ | ✅ (monitoring) |
| Rekap Fee Saya | ❌ | ❌ | ✅ (milik sendiri) | ✅ (semua) |
| Data Murid & Pengajar | ❌ | ❌ | ❌ | ✅ |
| Kelola Jadwal Mengajar | ❌ | ❌ | ✅ (lihat) | ✅ (CRUD) |
| Monitoring Absensi Semua | ❌ | ❌ | ❌ | ✅ |
| Pusat Pengingat Email | ❌ | ❌ | ❌ | ✅ |
| Pengaturan Sistem | ❌ | ❌ | ❌ | ✅ |

---

## 6. Alur Kerja dan Fitur Utama
*Menjelaskan cara kerja setiap fitur utama dalam bahasa yang mudah dipahami serta aturan logikanya.*

### A. Autentikasi Email & Password (Clerk)
1. **Cara Kerja**:
   1. Calon murid/pengajar datang ke `/register` dan mengisi nama, email, password.
   2. Sistem membuat akun di Clerk dan menyimpan data profil ke tabel `users` dengan role default `murid`.
   3. Admin memverifikasi & mengubah role menjadi `pengajar` untuk akun pengajar (atau mengundang pengajar langsung).
   4. Setelah login, pengguna diarahkan ke dashboard sesuai role-nya.
2. **Aturan Sistem**:
   - Password minimal 8 karakter, kombinasai huruf & angka.
   - Email wajib unik, verifikasi email wajib (Clerk email verification).
   - Middleware Clerk melindungi rute `/murid/*`, `/pengajar/*`, `/admin/*` berdasarkan role dari database.
   - Admin tidak bisa register sendiri dari publik — dibuat langsung via dashboard Clerk / seed.

### B. Absensi Manual (Tombol Hadir) — Murid & Pengajar
1. **Cara Kerja**:
   1. Murid/pengajar login, buka `/murid/absen` atau `/pengajar/absen`.
   2. Sistem menampilkan sesi jadwal yang sedang berlangsung atau akan datang hari ini.
   3. Pengguna menekan tombol besar **"Hadir Sekarang"**.
   4. Sistem mencatat `waktuAbsen`, `status = 'hadir'`, dan menyimpan relasi ke `jadwalId` dari tabel `absensi`.
   5. Jika sesi belum dibuka (di luar rentang waktu jadwal ± 15 menit), tombol disabled dengan pesan "Absen belum dibuka".
2. **Aturan Sistem**:
   - Absen hanya bisa dilakukan 1x per `jadwalId` per pengguna (unique constraint).
   - Absen di luar rentang waktu jadwal (mulai − 15 menit s/d selesai + 15 menit) diblokir; selebihnya ditandai `terlambat`.
   - Jika tidak absen sampai jadwal berakhir, status otomatis `alpha` (di-set oleh cron job harian).
   - Admin dapat mengoreksi status absensi manual (mis. izin/sakit).

### C. Manajemen Materi Pembelajaran (CRUD Pengajar & Admin)
1. **Cara Kerja**:
   1. Pengajar membuka `/pengajar/materi/baru`.
   2. Mengisi judul, deskripsi, mata pelajaran, kelas (SD/SMP/SMA/UTBK), kategori (Video/PDF/Latihan).
   3. Jika tipe Video: upload ke Bunny Stream — server membuat video object, mengembalikan `bunnyVideoId` dan `thumbnailUrl`.
   4. Jika tipe PDF: upload file langsung ke Bunny CDN → simpan `fileUrl`.
   5. Simpan ke tabel `materi` dengan `pengajarId` pengunggah dan `isPublished = false` default.
   6. Pengajar/Admin menekan "Publish" untuk mengaktifkan materi ke murid.
2. **Aturan Sistem**:
   - Pengajar hanya bisa Edit/Hapus materi miliknya sendiri (`pengajarId === currentUser.id`).
   - Admin bisa mengelola seluruh materi tanpa terkecuali.
   - Ukuran video max 2GB (Bunny Stream), PDF max 25MB.
   - Generate thumbnail otomatis dari Bunny Stream (setelah encoding selesai).
   - Judul materi wajib unik per mapel + kelas.

### D. Jadwal Mengajar & Pengingat Mengajar
1. **Cara Kerja**:
   1. Admin membuat jadwal di `/admin/jadwal`: pilih pengajar, murid (bisa multi), mapel, tanggal, jam mulai, jam selesai, ruangan/mode (Online/Offline).
   2. Jadwal tersimpan di tabel `jadwal` dengan status `terjadwal`.
   3. Sistem menampilkan jadwal di dashboard pengajar & murid.
   4. Admin dapat menekan **"Kirim Pengingat Mengajar"** di `/admin/pengingat` (per pengajar atau massal). Sistem mengirim email via Resend berisi detail jadwal H-1 dan H-30 menit sebelum sesi.
2. **Aturan Sistem**:
   - Cron job harian jam 20.00 mengirim pengingat otomatis H-1 untuk seluruh jadwal besok.
   - Cron tambahan tiap 15 menit mengirim pengingat H-30 menit untuk jadwal yang jatuh dalam 30 menit.
   - Jika pengajar mengubah/membatalkan jadwal, `reminderLogs` disimpan untuk audit.
   - Jadwal tidak boleh bentrok: pengajar & murid yang sama tidak boleh punya 2 jadwal overlap.

### E. Pembayaran Murid (Midtrans Snap Integration)
1. **Cara Kerja**:
   1. Admin membuat invoice bulanan per murid di `/admin/pembayaran` (jumlah berdasarkan paket/kelas).
   2. Sistem menyimpan `pembayaran` dengan status `pending` dan belum ada `orderId`.
   3. Murid masuk ke `/murid/pembayaran`, melihat tagihan, lalu menekan **"Bayar Sekarang"**.
   4. Server Action memanggil Midtrans Snap API (`createTransaction`) menggunakan `MIDTRANS_SERVER_KEY`, mengembalikan `token` & `redirect_url`.
   5. Snap popup terbuka di frontend dengan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, murid menyelesaikan pembayaran.
   6. Midtrans mengirim webhook ke `/api/midtrans/webhook`. Server memverifikasi `signature_key` (`SHA512(order_id + status_code + gross_amount + serverKey)`), lalu mengubah `pembayaran.status` menjadi `settlement` / `capture`.
   7. Email bukti pembayaran dikirim ke murid via Resend.
2. **Aturan Sistem**:
   - `orderId` format: `HBD-{muridId}-{periodeBulan}-{timestamp}` untuk keunikan.
   - Status pembayaran memetakan midtrans: `pending → pending`, `capture/settlement → dibayar`, `deny/expire/cancel → gagal/expired`.
   - Webhook endpoint WAJIB verifikasi signature; jika gagal, balas `401` dan log ke `webhookLogs`.
   - Admin dapat kirim **"Pengingat Bayar"** (email) dari `/admin/pengingat` ke murid `pending` / belum bayar.
   - Retry pembayaran: order baru dibuat jika invoice sebelumnya `expired`.
   - Simulasi sandbox Midtrans untuk dev: gunakan `MIDTRANS_IS_PRODUCTION=false` + kartu uji `4811 1111 1111 1114`.

### F. Rekap Fee & Gaji Pengajar
1. **Cara Kerja**:
   1. Sistem menjumlahkan jam mengajar pengajar (dari `absensi` yang berstatus `hadir`/`terlambat` relasi ke `jadwal`) per bulan.
   2. Admin membuka `/admin/fee`, memilih periode (bulan/tahun), menekan **"Generate Rekap"**.
   3. Sistem menghitung `totalJam × nominalPerJam` → tampilkan tabel per pengajar.
   4. Admin menekan **"Tandai Sudah Dibayar"** → status `feePengajar = 'dibayar'`, dicatat `tanggalBayar`.
   5. Pengajar melihat rekap dirinya di `/pengajar/fee`.
2. **Aturan Sistem**:
   - Rate `nominalPerJam` disimpan di tabel `pengajar` per pengajar (bisa diubah admin).
   - Rekap hanya menghitung absensi valid (`hadir` + `terlambat`); `alpha/izin/sakit` tidak dihitung.
   - Periode rekap menggunakan timezone `Asia/Jakarta`.
   - Pengajar tidak bisa mengubah nominal fee.

### G. Katalog Pengingat Ujian (CRUD Admin)
1. **Cara Kerja**:
   1. Admin membuka `/admin/katalog-ujian` → melihat tabel ujian mendatang.
   2. Menekan **"Tambah Ujian"**, mengisi: nama ujian (mis. "UTS Matematika Kelas 8"), mata pelajaran, tanggal, jam, deskripsi, kelas sasaran, pengajar PIC, lokasi (Online/Offline).
   3. Simpan ke tabel `katalogUjian` dengan `isPublished = true`.
   4. Admin dapat mengubah atau menghapus katalog ujian kapan saja.
   5. Murid melihat daftar ujian di `/murid/katalog-ujian` dengan countdown hari.
2. **Aturan Sistem**:
   - Hanya role `admin` yang bisa CRUD katalog ujian.
   - Tanggal ujian tidak boleh di masa lampau saat membuat data baru.
   - Notifikasi pengingat ujian H-3 & H-1 otomatis dikirim ke email murid kelas sasaran.
   - Jika ujian dihapus, murid tetap mendapat riwayat (soft delete), hanya tidak muncul di katalog publik internal.

### H. Pusat Pengingat (Admin One-Click Reminder)
1. **Cara Kerja**:
   1. Admin membuka `/admin/pengingat`.
   2. Terdapat 3 panel: **Pengingat Mengajar**, **Pengingat Bayar**, **Pengingat Absen**.
   3. Admin memilih target (per orang, per grup, atau semua) → tekan tombol kirim.
   4. Server Action memanggil Resend API, mengirim ke email target, dan mencatat di `reminderLogs`.
2. **Aturan Sistem**:
   - Rate limit pengiriman email: max 100 email / 10 menit untuk mencegah abuse.
   - Template email berbeda per tipe pengingat (rendered dengan handlebars).
   - Kegagalan pengiriman tercatat dengan status `failed` beserta `errorMessage`, admin bisa retry.
   - Log pengingat disimpan minimal 90 hari.

---

## 7. Alur Navigasi & Arsitektur Layout
*Peta navigasi alur halaman dan struktur tata letak (layout).*

### Arsitektur Layout (Persisten)
- **Public Layout**: Header (Navbar sticky atas) berisi logo Helped By Dinda, menu Program, Pengajar, Tentang, Kontak, dan tombol "Masuk"/"Daftar". Footer dengan info kontak, sosial media, dan link cepat.
- **Auth Layout**: Split screen minimalis — kiri ilustrasi/quote founder, kanan form login/register.
- **Murid Layout**: Sidebar kiri (fixed, hidden di mobile → drawer bottom-sheet) dengan menu Dasbor, Absen, Materi, Pembayaran, Jadwal, Katalog Ujian, Profil. Header kecil menampilkan avatar murid + notifikasi.
- **Pengajar Layout**: Sidebar kiri dengan menu Dasbor, Absen, Materi, Jadwal, Fee, Profil. Header kecil menampilkan notifikasi pengingat mengajar.
- **Admin Layout**: Sidebar kiri lebih padat dengan menu lengkap (Data Murid, Data Pengajar, Jadwal, Absensi, Materi, Katalog Ujian, Pembayaran, Fee, Pengingat, Pengaturan). Header kecil dengan quick-search & panel notifikasi.

### Bagan Alur (Flowchart)
```mermaid
flowchart TD
    A[Pengunjung] --> B[Halaman Beranda Helped By Dinda]
    B --> C{Sudah Login?}
    C -- Belum --> D[Halaman Login / Register Clerk]
    D --> E{Verifikasi Email?}
    E -- Sukses --> F[Ambil Role dari DB]
    E -- Gagal --> D
    C -- Sudah --> F
    F --> G{Role?}

    G -- Admin --> H[/admin/dashboard/]
    H --> H1[/admin/murid - CRUD Data Murid/]
    H --> H2[/admin/pengajar - CRUD Data Pengajar/]
    H --> H3[/admin/jadwal - Kelola Jadwal/]
    H --> H4[/admin/absensi - Monitoring Absen/]
    H --> H5[/admin/materi - Moderasi Materi/]
    H --> H6[/admin/katalog-ujian - CRUD Ujian/]
    H --> H7[/admin/pembayaran - Tracking Midtrans/]
    H --> H8[/admin/fee - Rekap Fee Pengajar/]
    H --> H9[/admin/pengingat - Kirim Email Pengingat/]
    H9 --> H9a[Resend: Email Mengajar]
    H9 --> H9b[Resend: Email Bayar]
    H9 --> H9c[Resend: Email Absen]

    G -- Pengajar --> P[/pengajar/dashboard/]
    P --> P1[/pengajar/absen - Tombol Hadir/]
    P --> P2[/pengajar/materi - CRUD Materi/]
    P --> P2a[Upload Video → Bunny Stream]
    P --> P3[/pengajar/jadwal - Lihat Jadwal/]
    P --> P4[/pengajar/fee - Rekap Fee Saya/]
    P --> P5[/pengajar/profil]

    G -- Murid --> M[/murid/dashboard/]
    M --> M1[/murid/absen - Tombol Hadir/]
    M --> M2[/murid/materi - Lihat Materi/]
    M --> M3[/murid/pembayaran]
    M3 --> M3a[Buat Transaksi Midtrans Snap]
    M3a --> M3b[Webhook Verifikasi Signature]
    M3b --> M3c{Sukses?}
    M3c -- Ya --> M3d[Status: dibayar, Email Bukti]
    M3c -- Tidak --> M3e[Status: gagal/expired, Retry]
    M --> M4[/murid/jadwal/]
    M --> M5[/murid/katalog-ujian/]
    M --> M6[/murid/profil - Ubah Profil/]

    H8 --> H8a[Agregasi Absensi Hadir]
    H8a --> H8b[Hitung Total Jam x Rate]
    H8b --> H8c[Tandai Fee Dibayar]
```

---

## 8. Kebutuhan Non-Fungsional (SEO, Keamanan, & Performa)
*Syarat wajib agar website siap rilis ke publik (production-ready).*
- **SEO**:
  - Wajib tag `<title>` dinamis dan meta description per halaman publik (`/`, `/tentang`, `/program`, `/pengajar-publik`, `/kontak`).
  - Open Graph (OG) tags: `og:title`, `og:description`, `og:image`, `og:url` di setiap halaman publik.
  - `sitemap.xml` dan `robots.txt` otomatis.
  - Structured data JSON-LD tipe `EducationalOrganization` untuk Helped By Dinda.
  - Halaman internal (`/admin`, `/pengajar`, `/murid`) wajib `noindex`.
- **Keamanan**:
  - Middleware Clerk memverifikasi session & role di setiap request ke route terproteksi.
  - Server Actions WAJIB validasi input dengan Zod (schema tunggal di `/lib/validations`).
  - Sanitasi HTML dari input user (materi deskripsi) untuk mencegah XSS — gunakan `DOMPurify` atau `sanitize-html`.
  - Pembayaran Midtrans WAJIB verifikasi `signature_key` (SHA512) di webhook sebelum ubah status.
  - Rate-limiting endpoint sensitif (login, webhook, kirim email) menggunakan `@upstash/ratelimit`.
  - Proteksi CSRF via Next.js Server Actions built-in + SameSite cookies.
  - Environment variables rahasia (`MIDTRANS_SERVER_KEY`, `CLERK_SECRET_KEY`, `RESEND_API_KEY`) hanya dipakai server-side.
  - Enkripsi data sensitif di Neon (SSL), backup harian otomatis.
- **Performa**:
  - Gambar via `next/image` dengan format WebP/AVIF otomatis.
  - Video via Bunny Stream (CDN global) dengan adaptive bitrate.
  - Lazy-load komponen berat (player, chart) dengan `dynamic(() => import(...), { ssr: false })`.
  - Caching halaman publik dengan `unstable_cache` / `revalidateTag` di App Router.
  - Database indexing pada kolom sering di-query (`users.clerkId`, `jadwal.tanggal`, `absensi.tanggal`, `pembayaran.muridId`, `pembayaran.status`).
  - Target Lighthouse: Performance ≥ 90, Accessibility ≥ 95 di mobile.

---

## 9. Panduan Bahasa, Copywriting, & Data Dummy
*Panduan nada bicara (Tone of Voice) dan contoh data agar prototipe terasa nyata.*
- **Gaya Bahasa**: Profesional, ramah, dan membumi (menggunakan kata "Anda" untuk pengguna dewasa, dan "Kamu" untuk murid di pesan motivasi). CTA jelas dan hangat (contoh: "Yuk, Absen Dulu!", "Bayar Tagihanmu Sekarang", "Jadwal Mengajar Besok Sudah Menunggu").
- **Instruksi Data Dummy**: JANGAN PERNAH MENGGUNAKAN "Lorem Ipsum". Selalu gunakan data dummy berbahasa Indonesia yang relevan dengan konteks bimbel.

### Contoh Data Dummy Wajib Pakai
- **User Admin**:
  - Nama: Dinda Ayu Lestari, Email: `dinda@helpedbydinda.id`, Role: `admin`
- **Data Pengajar**:
  - Budi Santoso — Matematika SMA (rate Rp 75.000/jam)
  - Siti Rahmawati — Bahasa Inggris SMP (rate Rp 65.000/jam)
  - Andi Pratama — Fisika SMA (rate Rp 80.000/jam)
  - Ratna Wulandari — Bahasa Indonesia SD (rate Rp 55.000/jam)
- **Data Murid**:
  - Rizky Maulana — Kelas 11 SMA, sekolah SMAN 1 Jakarta
  - Aisyah Nur Fadilah — Kelas 8 SMP, sekolah SMPN 5 Bandung
  - Fajar Ramadhan — Kelas 12 SMA, sekolah SMAN 3 Surabaya
  - Nabila Zahra — Kelas 6 SD, sekolah SDN 02 Yogyakarta
- **Jadwal (contoh)**:
  - Senin 15 Juli 2025, 16.00–17.30, Matematika, Budi Santoso, murid Rizky Maulana, mode Online
  - Selasa 16 Juli 2025, 15.00–16.30, Bahasa Inggris, Siti Rahmawati, murid Aisyah Nur Fadilah, mode Offline (Ruang 2)
- **Materi (contoh)**:
  - "Integral Tak Tentu Dasar" — Matematika SMA, pengajar Budi Santoso, tipe Video, durasi 18 menit
  - "Present Perfect Tense Mudah" — Bahasa Inggris SMP, pengajar Siti Rahmawati, tipe Video
  - "Hukum Newton Latihan Soal" — Fisika SMA, pengajar Andi Pratama, tipe PDF
- **Katalog Ujian (contoh)**:
  - "UTS Matematika Kelas 11" — 20 Juli 2025, 09.00 WIB, PIC Budi Santoso
  - "Try Out UTBK Penalaran" — 28 Juli 2025, 08.00 WIB, PIC Andi Pratama
  - "Ujian Bahasa Inggris Tengah Semester" — 22 Juli 2025, 14.00 WIB, PIC Siti Rahmawati
- **Pembayaran (contoh)**:
  - Invoice HBD-0001-Aisyah-JULI2025 — Rp 750.000, status `pending`, metode Midtrans Snap
  - Invoice HBD-0002-Rizky-JULI2025 — Rp 900.000, status `dibayar`, metode BCA VA
- **Fee Pengajar (contoh)**:
  - Budi Santoso, Juli 2025, 42 jam, Rp 75.000/jam → Rp 3.150.000, status `belum_dibayar`

---

## 10. Fondasi Teknis (Untuk Tim Pengembang / Programmer & AI)
*Petunjuk arsitektur teknis spesifik.*
- **Bahasa & Framework**: Next.js 15 (App Router) + TypeScript, Server Actions untuk mutasi, `revalidatePath` untuk refresh cache.
- **Tampilan Antarmuka (UI)**: Tailwind CSS v4, shadcn/ui Component Library, Lucide Icons, Framer Motion untuk micro-animation.
- **Autentikasi**: Clerk Authentication dengan metode Email & Password, sinkronisasi user ke database via Clerk Webhook (`user.created`, `user.updated`).
- **Basis Data (Database)**: Neon PostgreSQL (serverless) + Drizzle ORM, migrasi via `drizzle-kit`.
- **Media & CDN**: Bunny Stream (video materi) + Bunny CDN (PDF & thumbnail).
- **Email**: Resend (fallback SMTP via Nodemailer).
- **Payment Gateway**: Midtrans Snap (sandbox & production).
- **Cron & Scheduler**: Vercel Cron Jobs untuk pengingat otomatis & marker alpha harian.
- **Validasi**: Zod untuk semua input Server Action & API Route.
- **Deployment**: Vercel (frontend + API) + Neon (database serverless).

### Struktur Skema Database Nyata
```typescript
// src/db/schema.ts
import { pgTable, serial, varchar, text, timestamp, integer, boolean, numeric, pgEnum, uniqueIndex, index, date, time } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ===== ENUMS =====
export const roleEnum = pgEnum("role", ["admin", "pengajar", "murid"]);
export const statusAbsenEnum = pgEnum("status_absen", ["hadir", "terlambat", "izin", "sakit", "alpha"]);
export const statusPembayaranEnum = pgEnum("status_pembayaran", ["pending", "dibayar", "gagal", "expired", "refund"]);
export const statusFeeEnum = pgEnum("status_fee", ["belum_dibayar", "dibayar"]);
export const tipeMateriEnum = pgEnum("tipe_materi", ["video", "pdf", "latihan"]);
export const modeJadwalEnum = pgEnum("mode_jadwal", ["online", "offline"]);
export const tipePengingatEnum = pgEnum("tipe_pengingat", ["mengajar", "bayar", "absen", "ujian"]);
export const statusPengingatEnum = pgEnum("status_pengingat", ["sent", "failed"]);

// ===== USERS (Sinkron dengan Clerk) =====
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  nama: varchar("nama", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("murid"),
  avatarUrl: text("avatar_url"),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  clerkIdx: uniqueIndex("users_clerk_id_idx").on(t.clerkId),
  emailIdx: index("users_email_idx").on(t.email),
}));

// ===== PENGAJAR (Profil Detail) =====
export const pengajar = pgTable("pengajar", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  spesialisasi: varchar("spesialisasi", { length: 255 }).notNull(),
  nominalPerJam: numeric("nominal_per_jam", { precision: 12, scale: 2 }).notNull().default("50000"),
  bio: text("bio"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== MURID (Profil Detail) =====
export const murid = pgTable("murid", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kelas: varchar("kelas", { length: 50 }).notNull(), // "SD", "SMP", "SMA", "UTBK"
  sekolah: varchar("sekolah", { length: 255 }),
  namaWali: varchar("nama_wali", { length: 255 }),
  phoneWali: varchar("phone_wali", { length: 20 }),
  paketBulanan: numeric("paket_bulanan", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== MATERI PEMBELAJARAN =====
export const materi = pgTable("materi", {
  id: serial("id").primaryKey(),
  judul: varchar("judul", { length: 255 }).notNull(),
  deskripsi: text("deskripsi"),
  mataPelajaran: varchar("mata_pelajaran", { length: 100 }).notNull(),
  kelasSasaran: varchar("kelas_sasaran", { length: 50 }).notNull(),
  tipe: tipeMateriEnum("tipe").notNull().default("video"),
  bunnyVideoId: varchar("bunny_video_id", { length: 255 }),
  thumbnailUrl: text("thumbnail_url"),
  fileUrl: text("file_url"),
  durasiMenit: integer("durasi_menit"),
  pengajarId: integer("pengajar_id").notNull().references(() => pengajar.id, { onDelete: "cascade" }),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  kelasIdx: index("materi_kelas_idx").on(t.kelasSasaran),
  mapelIdx: index("materi_mapel_idx").on(t.mataPelajaran),
}));

// ===== JADWAL MENGAJAR =====
export const jadwal = pgTable("jadwal", {
  id: serial("id").primaryKey(),
  pengajarId: integer("pengajar_id").notNull().references(() => pengajar.id, { onDelete: "cascade" }),
  muridId: integer("murid_id").notNull().references(() => murid.id, { onDelete: "cascade" }),
  mataPelajaran: varchar("mata_pelajaran", { length: 100 }).notNull(),
  tanggal: date("tanggal").notNull(),
  jamMulai: time("jam_mulai").notNull(),
  jamSelesai: time("jam_selesai").notNull(),
  mode: modeJadwalEnum("mode").default("online").notNull(),
  ruangan: varchar("ruangan", { length: 100 }),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  tanggalIdx: index("jadwal_tanggal_idx").on(t.tanggal),
  pengajarIdx: index("jadwal_pengajar_idx").on(t.pengajarId),
  muridIdx: index("jadwal_murid_idx").on(t.muridId),
}));

// ===== ABSENSI =====
export const absensi = pgTable("absensi", {
  id: serial("id").primaryKey(),
  jadwalId: integer("jadwal_id").notNull().references(() => jadwal.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  status: statusAbsenEnum("status").default("hadir").notNull(),
  waktuAbsen: timestamp("waktu_absen").defaultNow().notNull(),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueAbsen: uniqueIndex("absensi_unique_idx").on(t.jadwalId, t.userId),
  tanggalIdx: index("absensi_waktu_idx").on(t.waktuAbsen),
}));

// ===== PEMBAYARAN MURID (Midtrans) =====
export const pembayaran = pgTable("pembayaran", {
  id: serial("id").primaryKey(),
  muridId: integer("murid_id").notNull().references(() => murid.id, { onDelete: "cascade" }),
  periodeBulan: varchar("periode_bulan", { length: 7 }).notNull(), // "2025-07"
  jumlah: numeric("jumlah", { precision: 12, scale: 2 }).notNull(),
  status: statusPembayaranEnum("status").default("pending").notNull(),
  orderId: varchar("order_id", { length: 100 }).unique(),
  midtransTransactionId: varchar("midtrans_transaction_id", { length: 100 }),
  snapToken: text("snap_token"),
  snapRedirectUrl: text("snap_redirect_url"),
  metodePembayaran: varchar("metode_pembayaran", { length: 50 }),
  tanggalBayar: timestamp("tanggal_bayar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  muridIdx: index("pembayaran_murid_idx").on(t.muridId),
  statusIdx: index("pembayaran_status_idx").on(t.status),
  periodeIdx: index("pembayaran_periode_idx").on(t.periodeBulan),
}));

// ===== REKAP FEE PENGAJAR =====
export const feePengajar = pgTable("fee_pengajar", {
  id: serial("id").primaryKey(),
  pengajarId: integer("pengajar_id").notNull().references(() => pengajar.id, { onDelete: "cascade" }),
  periodeBulan: varchar("periode_bulan", { length: 7 }).notNull(),
  totalJam: integer("total_jam").default(0).notNull(),
  nominalPerJam: numeric("nominal_per_jam", { precision: 12, scale: 2 }).notNull(),
  totalFee: numeric("total_fee", { precision: 12, scale: 2 }).notNull(),
  status: statusFeeEnum("status").default("belum_dibayar").notNull(),
  tanggalBayar: timestamp("tanggal_bayar"),
  catatan: text("catatan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniquePeriode: uniqueIndex("fee_pengajar_periode_idx").on(t.pengajarId, t.periodeBulan),
}));

// ===== KATALOG PENGINGAT UJIAN =====
export const katalogUjian = pgTable("katalog_ujian", {
  id: serial("id").primaryKey(),
  namaUjian: varchar("nama_ujian", { length: 255 }).notNull(),
  mataPelajaran: varchar("mata_pelajaran", { length: 100 }).notNull(),
  kelasSasaran: varchar("kelas_sasaran", { length: 50 }).notNull(),
  tanggal: date("tanggal").notNull(),
  jam: time("jam").notNull(),
  deskripsi: text("deskripsi"),
  lokasi: varchar("lokasi", { length: 255 }),
  pengajarId: integer("pengajar_id").references(() => pengajar.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(), // soft-delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  tanggalIdx: index("katalog_ujian_tanggal_idx").on(t.tanggal),
  kelasIdx: index("katalog_ujian_kelas_idx").on(t.kelasSasaran),
}));

// ===== REMINDER LOGS (Audit Pengingat Email) =====
export const reminderLogs = pgTable("reminder_logs", {
  id: serial("id").primaryKey(),
  tipe: tipePengingatEnum("tipe").notNull(),
  targetUserId: integer("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetEmail: varchar("target_email", { length: 255 }).notNull(),
  status: statusPengingatEnum("status").notNull(),
  errorMessage: text("error_message"),
  sentByUserId: integer("sent_by_user_id").references(() => users.id, { onDelete: "set null" }),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (t) => ({
  tipeIdx: index("reminder_tipe_idx").on(t.tipe),
  targetIdx: index("reminder_target_idx").on(t.targetUserId),
}));

// ===== WEBHOOK LOGS (Audit Midtrans) =====
export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).default("midtrans").notNull(),
  orderId: varchar("order_id", { length: 100 }),
  statusCode: varchar("status_code", { length: 10 }),
  transactionStatus: varchar("transaction_status", { length: 50 }),
  signatureValid: boolean("signature_valid").default(false).notNull(),
  payload: text("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== RELATIONS =====
export const usersRelations = relations(users, ({ one }) => ({
  pengajar: one(pengajar, { fields: [users.id], references: [pengajar.userId] }),
  murid: one(murid, { fields: [users.id], references: [murid.userId] }),
}));

export const pengajarRelations = relations(pengajar, ({ one, many }) => ({
  user: one(users, { fields: [pengajar.userId], references: [users.id] }),
  materi: many(materi),
  jadwal: many(jadwal),
  feePengajar: many(feePengajar),
}));

export const muridRelations = relations(murid, ({ one, many }) => ({
  user: one(users, { fields: [murid.userId], references: [users.id] }),
  jadwal: many(jadwal),
  pembayaran: many(pembayaran),
}));

export const jadwalRelations = relations(jadwal, ({ one, many }) => ({
  pengajar: one(pengajar, { fields: [jadwal.pengajarId], references: [pengajar.id] }),
  murid: one(murid, { fields: [jadwal.muridId], references: [murid.id] }),
  absensi: many(absensi),
}));

export const absensiRelations = relations(absensi, ({ one }) => ({
  jadwal: one(jadwal, { fields: [absensi.jadwalId], references: [jadwal.id] }),
  user: one(users, { fields: [absensi.userId], references: [users.id] }),
}));
```

### Variabel Lingkungan (`.env.example`)
```env
# ===== APP =====
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== CLERK AUTH =====
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register

# ===== DATABASE (Neon PostgreSQL + Drizzle) =====
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# ===== MIDTRANS PAYMENT GATEWAY =====
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_WEBHOOK_URL=${NEXT_PUBLIC_APP_URL}/api/midtrans/webhook

# ===== BUNNY STREAM & CDN =====
BUNNY_STREAM_API_KEY=xxxxxxxxxxxx
BUNNY_STREAM_LIBRARY_ID=123456
BUNNY_STREAM_CDN_HOSTNAME=vz-xxxxxxxx.b-cdn.net
BUNNY_STORAGE_ZONE=helpedbydinda-materi
BUNNY_STORAGE_ACCESS_KEY=xxxxxxxxxxxx
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com

# ===== EMAIL (RESEND / SMTP) =====
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="Helped By Dinda <noreply@helpedbydinda.id>"
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxxxxxx

# ===== CRON =====
CRON_SECRET=random-long-secret-string

# ===== RATE LIMIT (Upstash) =====
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxx
```

---

## 11. Tahapan Pengerjaan & Task Breakdown (Actionable Work Breakdown Structure)
*Daftar tugas terstruktur dan terurut (Atomic Tasks) dengan format checklist markdown `- [ ] **Task X.Y**`. Dirancang khusus agar pengguna dapat menginstruksikan AI Coding Assistant (Antigravity, Cursor, Claude Code, Roo Code, dll.) untuk mengeksekusi proyek langkah demi langkah secara terukur, modular, dan bebas dari kehabisan context window.*

## FASE 1: Fondasi Proyek, Design System, & Seluruh Halaman UI (Dummy Data)
*Tujuan: Membangun 100% antarmuka visual lengkap dan responsif (mobile-first) menggunakan data dummy sebelum menyentuh database nyata.*

- [ ] **Task 1.1 (Foundations & Design System)**: Inisialisasi proyek Next.js 15 App Router + TypeScript + Tailwind CSS v4, setup CSS variable token warna (Primary HSL 262 83% 58%, Accent HSL 158 64% 42%), font Plus Jakarta Sans + Inter, `lucide-react`, Framer Motion, dan install komponen shadcn/ui (Button, Card, Input, Dialog, Table, Badge, Dropdown, Tabs, Sheet, Form, Toast, Skeleton).
- [ ] **Task 1.2 (Layouts Persisten & Navigasi)**: Bangun `app/layout.tsx` (Root), Public Layout (`app/(public)/layout.tsx`) dengan Navbar sticky + Footer, Auth Layout (`app/(auth)/layout.tsx`) split-screen minimalis, serta 3 Dashboard Layout terpisah — `app/(murid)/layout.tsx`, `app/(pengajar)/layout.tsx`, `app/(admin)/layout.tsx` — menggunakan pola Sidebar kiri (fixed) + Header kecil, dengan drawer bottom-sheet untuk mobile.
- [ ] **Task 1.3 (Halaman Publik)**: Bangun seluruh halaman publik tanpa login sesuai Bab 3: `/` (Beranda dengan hero, keunggulan, preview program, CTA), `/tentang`, `/program`, `/pengajar-publik`, `/kontak` (form dummy), `/login` & `/register` (form UI dummy). Semua responsif mobile-first dan pakai data dummy Indonesia dari Bab 9.
- [ ] **Task 1.4 (Halaman Murid — Dummy Data)**: Bangun halaman `/murid/dashboard`, `/murid/absen` (kartu sesi dengan tombol besar "Hadir Sekarang" dummy state), `/murid/materi` (grid kartu materi + modal preview), `/murid/materi/[id]` (player dummy placeholder video), `/murid/pembayaran` (kartu invoice + tombol "Bayar Sekarang" dummy), `/murid/jadwal` (list kalender), `/murid/katalog-ujian` (countdown dummy), `/murid/profil` (form ubah profil dummy) — semua pakai data dummy Bab 9.
- [ ] **Task 1.5 (Halaman Pengajar — Dummy Data)**: Bangun `/pengajar/dashboard` (jadwal hari ini + ringkasan fee + notif pengingat), `/pengajar/absen` (riwayat absen + tombol Hadir), `/pengajar/materi` (tabel materi + tombol aksi), `/pengajar/materi/baru` (form upload dummy), `/pengajar/jadwal`, `/pengajar/fee` (tabel rekap fee dummy), `/pengajar/profil` — semua pakai data dummy Bab 9.
- [ ] **Task 1.6 (Halaman Admin — Dummy Data)**: Bangun seluruh halaman admin sesuai Bab 3 & prioritas: `/admin/dashboard` (stat cards + chart dummy), `/admin/murid` (tabel CRUD dummy + modal), `/admin/pengajar` (tabel CRUD dummy + rate field), `/admin/jadwal` (tabel + form jadwal + filter tanggal), `/admin/absensi` (tabel monitoring + filter role & tanggal), `/admin/materi` (moderasi tabel + aksi publish/unpublish), `/admin/katalog-ujian` (tabel CRUD penuh + modal tambah/edit/hapus), `/admin/pembayaran` (tabel tracking + badge status Midtrans), `/admin/fee` (tabel rekap fee + filter periode + tombol generate & tandai bayar), `/admin/pengingat` (3 panel tombol kirim pengingat), `/admin/pengaturan` (form pengaturan dummy).
- [ ] **Task 1.7 (Data Dummy Terpusat & Review UI Mobile)**: Buat file `lib/dummy-data.ts` berisi seluruh data dummy Bab 9 (users, pengajar, murid, jadwal, materi, katalogUjian, pembayaran, feePengajar, logPengingat) dengan TypeScript interface, hubungkan ke semua halaman via import. Audit tampilan mobile di lebar 375px, perbaiki layout yang belum optimal, dan pastikan tombol ≥ 44px touch target.

## FASE 2: Database, Autentikasi, & Integrasi Data Dinamis
*Tujuan: Menghidupkan aplikasi dengan DB Neon PostgreSQL nyata, autentikasi Clerk Email & Password, Server Actions, dan mengganti seluruh data dummy dengan data live dari database.*

- [ ] **Task 2.1 (Database Schema, Migrations & Seed)**: Buat file `src/db/schema.ts` persis seperti Bab 10 (tabel `users`, `pengajar`, `murid`, `materi`, `jadwal`, `absensi`, `pembayaran`, `feePengajar`, `katalogUjian`, `reminderLogs`, `webhookLogs`), konfigurasi `drizzle.config.ts`, jalankan `drizzle-kit push` ke Neon PostgreSQL, dan buat script `src/db/seed.ts` yang mengisi data awal (1 admin Dinda, 4 pengajar, 4 murid, 6 jadwal, 3 materi, 3 katalog ujian).
- [ ] **Task 2.2 (Autentikasi Clerk + Sync Webhook + Middleware)**: Pasang Clerk di `app/layout.tsx` (`<ClerkProvider>`), setup halaman `/login` & `/register` (Email & Password), buat webhook `/api/clerk/webhook` untuk sinkronisasi user Clerk → tabel `users` (role default `murid`), serta buat `middleware.ts` dengan `clerkMiddleware()` yang memproteksi route `/admin/*` → role admin, `/pengajar/*` → role pengajar, `/murid/*` → role murid.
- [ ] **Task 2.3 (Server Actions & Validasi Zod)**: Buat seluruh Server Actions CRUD bertipe tervalidasi Zod: `actions/murid.ts` (create/update/delete murid), `actions/pengajar.ts`, `actions/jadwal.ts`, `actions/materi.ts`, `actions/absensi.ts` (tombol Hadir + logic waktu), `actions/katalogUjian.ts` (CRUD admin), `actions/pembayaran.ts` (buat invoice + Midtrans Snap), `actions/feePengajar.ts` (generate rekap), `actions/pengingat.ts` (kirim email via Resend), `actions/profil.ts`.
- [ ] **Task 2.4 (Integrasi Bunny Stream untuk Materi)**: Implement endpoint `/api/bunny/create-video` (buat video object di Bunny Stream), `/api/bunny/upload` (upload PDF ke Bunny Storage), dan player component Bunny Stream di `/murid/materi/[id]` untuk memutar video materi.
- [ ] **Task 2.5 (Frontend Data Binding & Mutations)**: Ganti seluruh data dummy dari Fase 1 dengan query dinamis dari Neon (via Drizzle). Update semua halaman admin, pengajar, dan murid agar menarik data asli. Implement mutation form (create/update/delete) dengan `useTransition` / `useOptimistic`, toast notification shadcn/ui, dan `revalidatePath` setelah mutasi sukses.
- [ ] **Task 2.6 (Cron Alpha & Marker)**: Implement endpoint `/api/cron/mark-alpha` (set status `alpha` untuk absensi yang tidak diisi di luar jadwal) protected dengan `CRON_SECRET`. Konfigurasi `vercel.json` cron untuk jalan tiap jam 23.55 WIB.

## FASE 3: Integrasi Midtrans, Email Pengingat, Keamanan, SEO, & Deployment
*Tujuan: Menyempurnakan integrasi pembayaran Midtrans, notifikasi email, keamanan produksi, SEO, pengujian end-to-end, dan rilis ke production.*

- [ ] **Task 3.1 (Integrasi Midtrans Snap End-to-End)**: Implement Server Action `createMidtransTransaction(pembayaranId)` di `actions/pembayaran.ts` untuk memanggil Snap API Midtrans dengan `MIDTRANS_SERVER_KEY` dan mengembalikan `snapToken` + `snapRedirectUrl` (simpan ke tabel `pembayaran`). Buat komponen `<SnapPaymentButton>` di `/murid/pembayaran` yang memuat Snap JS Midtrans menggunakan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dan trigger popup. Update `orderId` format `HBD-{muridId}-{periodeBulan}-{timestamp}`.
- [ ] **Task 3.2 (Webhook Midtrans + Verifikasi Signature)**: Buat route handler `/api/midtrans/webhook/route.ts` yang menerima notifikasi POST dari Midtrans, verifikasi `signature_key` = SHA512(`orderId + statusCode + grossAmount + serverKey`), update `pembayaran.status` sesuai `transaction_status` (`capture`/`settlement` → `dibayar`, `deny`/`cancel` → `gagal`, `expire` → `expired`), simpan payload ke `webhookLogs`, dan kirim email bukti bayar ke murid via Resend.
- [ ] **Task 3.3 (Email Notifikasi & Pusat Pengingat Terintegrasi)**: Implement helper `lib/email/send.ts` (Resend + template React Email): `emailPengingatMengajar`, `emailPengingatBayar`, `emailPengingatAbsen`, `emailPengingatUjian`, `emailBuktiBayar`, `emailVerifikasiMuridBaru`. Integrasikan ke `/admin/pengingat` (3 tombol kirim) dan cron jobs: `/api/cron/reminder-mengajar-h1` (cron 20.00 WIB kirim H-1 ke pengajar besok), `/api/cron/reminder-mengajar-h30` (cron tiap 15 menit kirim H-30 menit), `/api/cron/reminder-ujian` (kirim H-3 & H-1 untuk `katalogUjian`), `/api/cron/reminder-bayar` (kirim tanggal 5, 10, 15 setiap bulan untuk pembayaran pending).
- [ ] **Task 3.4 (Non-Fungsional: SEO, Security & Rate Limit)**: Pasang metadata dinamis (`generateMetadata`) untuk halaman publik (`/`, `/tentang`, `/program`, `/pengajar-publik`, `/kontak`), OG tags, `sitemap.ts`, `robots.ts` (noindex route internal), dan JSON-LD `EducationalOrganization`. Implement `@upstash/ratelimit` pada `/api/midtrans/webhook`, `/api/clerk/webhook`, dan `/admin/pengingat`. Aktifkan sanitasi XSS (`sanitize-html`) untuk input deskripsi materi. Audit seluruh Server Action: semua input wajib Zod + otorisasi role.
- [ ] **Task 3.5 (End-to-End Testing & Bugfix)**: Uji manual full user journey: (1) admin register via seed → login → CRUD murid & pengajar → buat jadwal → buat invoice; (2) murid login → absen → lihat materi → bayar via Midtrans sandbox → dapat email bukti; (3) pengajar login → absen → upload materi ke Bunny → lihat fee; (4) admin kirim 3 jenis pengingat → cek email masuk; (5) cron reminder H-1 & H-30. Perbaiki bug, glitch responsif di iPhone SE (375px) & Android kecil (360px), dan optimasi query database (index check via `EXPLAIN ANALYZE`).
- [ ] **Task 3.6 (Production Build & Deployment ke Vercel + Neon)**: Konfigurasi `.env.production` (Midtrans production key, Clerk production keys, Resend production domain, Bunny production). Verifikasi `npm run build` lulus tanpa error & warning kritis. Deploy ke Vercel, setup domain kustom (mis. `helpedbydinda.id`), aktifkan Neon autoscaling + backup harian, registrasi webhook Midtrans production URL, dan registrasi Clerk production webhook. Post-deploy: smoke test login-admin-pengajar-murid.

---

## 12. Master Starter Prompt (Siap Coding untuk AI Agent)
*Salin prompt di bawah ini ke AI Coding Assistant (Google Antigravity / Cursor / Claude Code / GitHub Copilot / Roo Code / dll.) untuk memulai pengerjaan:*
```markdown
Halo! Kamu berperan sebagai Senior Fullstack Architect dan Lead Developer.
Saya ingin membangun aplikasi "Helped By Dinda" — platform bimbel digital modern — berdasarkan dokumen PRD ini.

Silakan baca file @PRD.md secara menyeluruh terlebih dahulu.

KONTEKS PROYEK (RINGKASAN CEPAT):
- Nama Produk: Helped By Dinda
- 3 Role Pengguna: Admin, Pengajar, Murid
- Tech Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Clerk Auth (Email & Password), Neon PostgreSQL + Drizzle ORM, Bunny Stream/CDN, Resend (email), Midtrans Snap (payment), Vercel (deploy).
- Desain: Modern, minimalis, mobile-first (prioritas smartphone), warna primary Ungu Violet HSL(262,83%,58%) + Accent Hijau Emerald HSL(158,64%,42%).
- Data dummy WAJIB berbahasa Indonesia (lihat Bab 9) — DILARANG memakai "Lorem Ipsum".

ATURAN EKSEKUSI (WAJIB DIPATUHI — MODE PHASE):
1. JANGAN PERNAH membuat semua kode atau file sekaligus dalam satu waktu agar tidak terjadi error atau kehabisan token/context window.
2. Eksekusi PRD BAB 11 secara BERTAHAP PER FASE (milestone), dimulai dari FASE 1.
3. SELESAIKAN SATU FASE PENUH secara mandiri dalam satu putaran kerja. Contoh: kerjakan Task 1.1 sampai Task 1.7 hingga seluruh Halaman UI Fase 1 rampung (dengan data dummy), lalu BERHENTI.
4. Setelah satu Fase selesai, WAJIB melaporkan: (a) daftar Task yang telah diselesaikan, (b) file-file yang dibuat/ubah, (c) cara menjalankan & memverifikasi hasil, (d) kendala yang ditemui.
5. SETELAH LAPORAN, WAJIB MENUNGGU KONFIRMASI/IJIN SAYA sebelum lanjut ke Fase berikutnya. Jangan lanjut sendiri.
6. Selalu patuhi Tech Stack, skema database Drizzle (Bab 10), Pedoman UI/UX Design System (Bab 4), dan data dummy Bab 9 di setiap fase.
7. DILARANG membuat halaman placeholder / "Sedang dalam pengembangan" — SEMUA halaman wajib lengkap dengan UI + data dummy (Fase 1) atau data nyata (Fase 2-3).
8. Untuk integrasi Midtrans, WAJIB ikuti standar Midtrans Snap: buat transaksi dengan `MIDTRANS_SERVER_KEY` server-side, popup di frontend dengan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, dan verifikasi `signature_key` SHA512 di webhook.
9. Untuk autentikasi, gunakan Clerk dengan metode Email & Password + sinkronisasi user ke tabel `users` via Clerk webhook (role default `murid`).

Jika kamu sudah membaca dan memahami PRD, silakan:
- Berikan ringkasan singkat pemahamanmu (maks 10 poin).
- Konfirmasikan bahwa kamu siap mulai dari **FASE 1 — Task 1.1 (Foundations & Design System)**.
- Tanyakan kesiapan saya untuk mulai!
```
