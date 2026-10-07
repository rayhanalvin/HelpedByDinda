export interface User {
  id: number;
  clerkId: string;
  email: string;
  nama: string;
  role: "admin" | "pengajar" | "murid";
  avatarUrl: string;
  phone: string;
  password?: string;
}

export interface Pengajar {
  id: number;
  userId: number;
  nama: string;
  email: string;
  avatarUrl: string;
  phone: string;
  spesialisasi: string;
  nominalPerJam: number;
  bio: string;
  isActive: boolean;
  totalJamBulanIni: number;
  password?: string;
}

export interface Murid {
  id: number;
  userId: number;
  nama: string;
  email: string;
  avatarUrl: string;
  phone: string;
  kelas: "SD" | "SMP" | "SMA" | "UTBK";
  sekolah: string;
  namaWali: string;
  phoneWali: string;
  paketBulanan: number;
  statusBayarBulanIni: "pending" | "dibayar";
  isActive: boolean;
  password?: string;
}

export interface Jadwal {
  id: number;
  pengajarId: number;
  pengajarNama: string;
  muridId: number;
  muridNama: string;
  mataPelajaran: string;
  tanggal: string; // YYYY-MM-DD
  jamMulai: string; // HH:mm
  jamSelesai: string; // HH:mm
  mode: "online" | "offline";
  ruangan?: string;
  catatan?: string;
  statusSesi?: "terjadwal" | "berlangsung" | "selesai";
}

export interface Absensi {
  id: number;
  jadwalId: number;
  userId: number;
  userName: string;
  role: "pengajar" | "murid";
  status: "hadir" | "terlambat" | "izin" | "sakit" | "alpha";
  waktuAbsen: string; // ISO string
  catatan?: string;
  mataPelajaran: string;
  tanggal: string;
}

export interface AttendanceSession {
  id: number;
  jadwalId: number;
  userId: number;
  userName: string;
  role: "pengajar" | "murid";
  mataPelajaran: string;
  jadwalTanggal: string;
  jadwalJamMulai: string;
  jadwalJamSelesai: string;
  jadwalMode: "online" | "offline";
  mulaiAt: string;
  selesaiAt?: string;
  mulaiLocation: { latitude: number; longitude: number; accuracy: number };
  selesaiLocation?: { latitude: number; longitude: number; accuracy: number };
}

export interface Materi {
  id: number;
  judul: string;
  deskripsi: string;
  mataPelajaran: string;
  kelasSasaran: "SD" | "SMP" | "SMA" | "UTBK";
  tipe: "video" | "pdf" | "latihan";
  bunnyVideoId?: string;
  thumbnailUrl: string;
  fileUrl?: string;
  durasiMenit?: number;
  pengajarId: number;
  pengajarNama: string;
  isPublished: boolean;
  createdAt: string;
}

export interface KatalogUjian {
  id: number;
  namaUjian: string;
  mataPelajaran: string;
  kelasSasaran: "SD" | "SMP" | "SMA" | "UTBK";
  tanggal: string; // YYYY-MM-DD
  jam: string; // HH:mm WIB
  deskripsi: string;
  lokasi: string;
  pengajarId?: number;
  pengajarPic: string;
  isPublished: boolean;
}

export interface QuizQuestion {
  id: number;
  pertanyaan: string;
  opsi: string[];
  jawabanBenar: number;
  pembahasan: string;
}

export interface Quiz {
  id: number;
  judul: string;
  deskripsi: string;
  mataPelajaran: string;
  kelasSasaran: "SD" | "SMP" | "SMA" | "UTBK";
  durasiMenit: number;
  pengajarId: number;
  pengajarNama: string;
  isPublished: boolean;
  questions: QuizQuestion[];
}

export interface Pembayaran {
  id: number;
  muridId: number;
  muridNama: string;
  muridKelas: string;
  periodeBulan: string; // "2025-07"
  jumlah: number;
  status: "pending" | "dibayar" | "gagal" | "expired";
  orderId: string;
  metodePembayaran?: string;
  tanggalBayar?: string;
  createdAt: string;
}

export interface FeePengajar {
  id: number;
  pengajarId: number;
  pengajarNama: string;
  periodeBulan: string;
  totalJam: number;
  nominalPerJam: number;
  totalFee: number;
  status: "belum_dibayar" | "dibayar";
  tanggalBayar?: string;
}

export interface FinanceRecord {
  id: number;
  tanggal: string;
  tipe: "pendapatan" | "pengeluaran";
  kategori: "pembayaran_murid" | "fee_pengajar" | "operasional" | "promosi";
  keterangan: string;
  jumlah: number;
  status: "tercatat" | "dibayar";
}

export interface RapotMurid {
  id: number;
  muridId: number;
  muridNama: string;
  pengajarId: number;
  pengajarNama: string;
  periode: string;
  nilaiQuiz: number;
  kehadiran: number;
  nilaiSekolah: number;
  keaktifan: number;
  nilaiAkhir: number;
  deskripsi: string;
  rekomendasi: string;
  status: "draft" | "terbit";
  updatedAt: string;
}

export interface AsesmenPengajar {
  id: number;
  muridId: number;
  muridNama: string;
  pengajarId: number;
  pengajarNama: string;
  periode: string;
  rating: number;
  pemahamanMateri: number;
  komunikasi: number;
  ketepatanWaktu: number;
  deskripsi: string;
  status: "terkirim" | "ditinjau";
  createdAt: string;
}

export interface ReminderLog {
  id: number;
  tipe: "mengajar" | "bayar" | "absen" | "ujian";
  targetNama: string;
  targetEmail: string;
  targetRole: "pengajar" | "murid";
  status: "sent" | "failed";
  errorMessage?: string;
  sentAt: string;
  keterangan: string;
}

// ===== DATA DUMMY REALISTIS SESUAI BAB 9 PRD =====

export const DUMMY_ADMIN: User = {
  id: 1,
  clerkId: "user_admin_dinda",
  email: "dinda@helpedbydinda.id",
  nama: "Dinda Rizky Febriyanti",
  role: "admin",
  avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  phone: "081234567890",
  password: "admin123",
};

export const DUMMY_PENGAJAR: Pengajar[] = [
  {
    id: 1,
    userId: 2,
    nama: "Budi Santoso",
    email: "budi.santoso@helpedbydinda.id",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    phone: "081211223344",
    spesialisasi: "Matematika SMA & UTBK",
    nominalPerJam: 75000,
    bio: "Pengajar Matematika berpengalaman 7+ tahun membimbing ratusan siswa lolos PTN favorit (ITB, UI, UGM).",
    isActive: true,
    totalJamBulanIni: 42,
    password: "teacher123",
  },
  {
    id: 2,
    userId: 3,
    nama: "Siti Rahmawati",
    email: "siti.rahma@helpedbydinda.id",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    phone: "081255667788",
    spesialisasi: "Bahasa Inggris SMP & SMA",
    nominalPerJam: 65000,
    bio: "Alumni Pendidikan Bahasa Inggris UPI, spesialis TOEFL & pemahaman grammar praktis tanpa hafalan rumit.",
    isActive: true,
    totalJamBulanIni: 38,
    password: "teacher123",
  },
  {
    id: 3,
    userId: 4,
    nama: "Andi Pratama",
    email: "andi.pratama@helpedbydinda.id",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    phone: "081399887766",
    spesialisasi: "Fisika SMA & Penalaran UTBK",
    nominalPerJam: 80000,
    bio: "Lulusan Fisika ITB. Menganalisis fenomena fisika dengan konsep logika sederhana dan metode cepat.",
    isActive: true,
    totalJamBulanIni: 30,
    password: "teacher123",
  },
  {
    id: 4,
    userId: 5,
    nama: "Ratna Wulandari",
    email: "ratna.wulan@helpedbydinda.id",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    phone: "081312345678",
    spesialisasi: "Bahasa Indonesia SD & SMP",
    nominalPerJam: 55000,
    bio: "Penyabar dan interaktif. Berfokus pada penguasaan literasi, membaca cepat, dan menulis kreatif anak sekolah dasar.",
    isActive: true,
    totalJamBulanIni: 25,
    password: "teacher123",
  },
];

export const DUMMY_MURID: Murid[] = [
  {
    id: 1,
    userId: 6,
    nama: "Rizky Maulana",
    email: "rizky.m@student.id",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    phone: "082199881122",
    kelas: "SMA",
    sekolah: "SMAN 1 Jakarta",
    namaWali: "Ir. Hendra Maulana",
    phoneWali: "08119900112",
    paketBulanan: 900000,
    statusBayarBulanIni: "dibayar",
    isActive: true,
    password: "student123",
  },
  {
    id: 2,
    userId: 7,
    nama: "Aisyah Nur Fadilah",
    email: "aisyah.nur@student.id",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    phone: "082177665544",
    kelas: "SMP",
    sekolah: "SMPN 5 Bandung",
    namaWali: "Hj. Siti Aminah",
    phoneWali: "08123344556",
    paketBulanan: 750000,
    statusBayarBulanIni: "pending",
    isActive: true,
    password: "student123",
  },
  {
    id: 3,
    userId: 8,
    nama: "Fajar Ramadhan",
    email: "fajar.ramadhan@student.id",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    phone: "082144332211",
    kelas: "UTBK",
    sekolah: "SMAN 3 Surabaya",
    namaWali: "Bambang Sudiro",
    phoneWali: "08137788990",
    paketBulanan: 1100000,
    statusBayarBulanIni: "dibayar",
    isActive: true,
    password: "student123",
  },
  {
    id: 4,
    userId: 9,
    nama: "Nabila Zahra",
    email: "nabila.zahra@student.id",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    phone: "082166554433",
    kelas: "SD",
    sekolah: "SDN 02 Yogyakarta",
    namaWali: "Drs. Eko Prasetyo",
    phoneWali: "08129988771",
    paketBulanan: 650000,
    statusBayarBulanIni: "pending",
    isActive: true,
    password: "student123",
  },
];

export const DUMMY_JADWAL: Jadwal[] = [
  {
    id: 1,
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    muridId: 1,
    muridNama: "Rizky Maulana",
    mataPelajaran: "Matematika SMA",
    tanggal: "2025-07-15",
    jamMulai: "16:00",
    jamSelesai: "17:30",
    mode: "online",
    ruangan: "Google Meet Room 1",
    catatan: "Persiapan Bab Integral dan Turunan Lanjutan",
    statusSesi: "berlangsung",
  },
  {
    id: 2,
    pengajarId: 2,
    pengajarNama: "Siti Rahmawati",
    muridId: 2,
    muridNama: "Aisyah Nur Fadilah",
    mataPelajaran: "Bahasa Inggris SMP",
    tanggal: "2025-07-16",
    jamMulai: "15:00",
    jamSelesai: "16:30",
    mode: "offline",
    ruangan: "Ruang Kelas 2 - Lantai 1",
    catatan: "Fokus Grammar Tenses & Latihan Speaking",
    statusSesi: "terjadwal",
  },
  {
    id: 3,
    pengajarId: 3,
    pengajarNama: "Andi Pratama",
    muridId: 3,
    muridNama: "Fajar Ramadhan",
    mataPelajaran: "Fisika SMA",
    tanggal: "2025-07-17",
    jamMulai: "16:00",
    jamSelesai: "17:30",
    mode: "online",
    ruangan: "Zoom Room Bimbel",
    catatan: "Bedah Soal Hukum Newton & Dinamika Gerak",
    statusSesi: "terjadwal",
  },
  {
    id: 4,
    pengajarId: 4,
    pengajarNama: "Ratna Wulandari",
    muridId: 4,
    muridNama: "Nabila Zahra",
    mataPelajaran: "Bahasa Indonesia SD",
    tanggal: "2025-07-18",
    jamMulai: "14:00",
    jamSelesai: "15:30",
    mode: "offline",
    ruangan: "Ruang Kelas 1 - Lantai 1",
    catatan: "Membaca Pemahaman & Menemukan Ide Pokok Paragraf",
    statusSesi: "terjadwal",
  },
  {
    id: 5,
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    muridId: 3,
    muridNama: "Fajar Ramadhan",
    mataPelajaran: "TPS Kuantitatif UTBK",
    tanggal: "2025-07-19",
    jamMulai: "16:00",
    jamSelesai: "17:30",
    mode: "online",
    ruangan: "Google Meet Room 2",
    catatan: "Trik Cepat 60 Detik Soal Deret & Aljabar",
    statusSesi: "terjadwal",
  },
  {
    id: 6,
    pengajarId: 2,
    pengajarNama: "Siti Rahmawati",
    muridId: 1,
    muridNama: "Rizky Maulana",
    mataPelajaran: "Bahasa Inggris SMA",
    tanggal: "2025-07-20",
    jamMulai: "09:00",
    jamSelesai: "10:30",
    mode: "online",
    ruangan: "Zoom Room Bimbel",
    catatan: "Reading Comprehension untuk Ujian Semester",
    statusSesi: "terjadwal",
  },
];

export const DUMMY_ABSENSI: Absensi[] = [
  {
    id: 1,
    jadwalId: 1,
    userId: 2,
    userName: "Budi Santoso",
    role: "pengajar",
    status: "hadir",
    waktuAbsen: "2025-07-15T15:58:10+07:00",
    catatan: "Masuk tepat waktu, materi telah disiapkan",
    mataPelajaran: "Matematika SMA",
    tanggal: "2025-07-15",
  },
  {
    id: 2,
    jadwalId: 1,
    userId: 6,
    userName: "Rizky Maulana",
    role: "murid",
    status: "hadir",
    waktuAbsen: "2025-07-15T16:02:14+07:00",
    catatan: "Hadir online lewat laptop",
    mataPelajaran: "Matematika SMA",
    tanggal: "2025-07-15",
  },
  {
    id: 3,
    jadwalId: 2,
    userId: 3,
    userName: "Siti Rahmawati",
    role: "pengajar",
    status: "hadir",
    waktuAbsen: "2025-07-14T14:55:00+07:00",
    catatan: "Sesi berjalan lancar di ruang 2",
    mataPelajaran: "Bahasa Inggris SMP",
    tanggal: "2025-07-14",
  },
  {
    id: 4,
    jadwalId: 2,
    userId: 7,
    userName: "Aisyah Nur Fadilah",
    role: "murid",
    status: "terlambat",
    waktuAbsen: "2025-07-14T15:18:22+07:00",
    catatan: "Terlambat karena hujan di perjalanan",
    mataPelajaran: "Bahasa Inggris SMP",
    tanggal: "2025-07-14",
  },
  {
    id: 5,
    jadwalId: 3,
    userId: 4,
    userName: "Andi Pratama",
    role: "pengajar",
    status: "hadir",
    waktuAbsen: "2025-07-10T15:59:00+07:00",
    catatan: "Membahas 15 soal dinamika gerak",
    mataPelajaran: "Fisika SMA",
    tanggal: "2025-07-10",
  },
  {
    id: 6,
    jadwalId: 3,
    userId: 8,
    userName: "Fajar Ramadhan",
    role: "murid",
    status: "hadir",
    waktuAbsen: "2025-07-10T16:00:30+07:00",
    catatan: "Hadir via Zoom",
    mataPelajaran: "Fisika SMA",
    tanggal: "2025-07-10",
  },
];

export const DUMMY_MATERI: Materi[] = [
  {
    id: 1,
    judul: "Integral Tak Tentu Dasar & Contoh Soal Praktis",
    deskripsi: "Konsep dasar integral tak tentu, rumus substitusi sederhana, dan trik menyelesaikan tipe soal ujian nasional & seleksi mandiri.",
    mataPelajaran: "Matematika",
    kelasSasaran: "SMA",
    tipe: "video",
    bunnyVideoId: "bunny_sample_01",
    thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    durasiMenit: 18,
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    isPublished: true,
    createdAt: "2025-07-01T10:00:00Z",
  },
  {
    id: 2,
    judul: "Present Perfect Tense Tanpa Rumus Memusingkan",
    deskripsi: "Pelajari perbedaan Have/Has Been vs Have/Has Done dengan ilustrasi visual kehidupan sehari-hari.",
    mataPelajaran: "Bahasa Inggris",
    kelasSasaran: "SMP",
    tipe: "video",
    bunnyVideoId: "bunny_sample_02",
    thumbnailUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
    durasiMenit: 22,
    pengajarId: 2,
    pengajarNama: "Siti Rahmawati",
    isPublished: true,
    createdAt: "2025-07-03T11:30:00Z",
  },
  {
    id: 3,
    judul: "Hukum Newton: Ringkasan Rumus & 30 Latihan Soal",
    deskripsi: "Modul PDF eksklusif berisi diagram gaya bebas, ringkasan konsep gerak lurus, dan kunci jawaban pembahasan mendalam.",
    mataPelajaran: "Fisika",
    kelasSasaran: "SMA",
    tipe: "pdf",
    fileUrl: "/docs/Hukum_Newton_HelpedByDinda.pdf",
    thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
    durasiMenit: 15,
    pengajarId: 3,
    pengajarNama: "Andi Pratama",
    isPublished: true,
    createdAt: "2025-07-05T09:15:00Z",
  },
  {
    id: 4,
    judul: "Struktur Paragraf & Menemukan Ide Pokok Cepat",
    deskripsi: "Teknik membaca skimming & scanning untuk anak SD kelas 5-6 agar percaya diri menghadapi ujian literasi sekolah.",
    mataPelajaran: "Bahasa Indonesia",
    kelasSasaran: "SD",
    tipe: "pdf",
    fileUrl: "/docs/Ide_Pokok_SD_HelpedByDinda.pdf",
    thumbnailUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80",
    durasiMenit: 10,
    pengajarId: 4,
    pengajarNama: "Ratna Wulandari",
    isPublished: true,
    createdAt: "2025-07-07T14:00:00Z",
  },
  {
    id: 5,
    judul: "Bedah Pola Soal UTBK SNBT: Penalaran Kuantitatif",
    deskripsi: "Trik menyelesaikan soal logika perbandingan kuantitatif dalam waktu di bawah 45 detik per soal.",
    mataPelajaran: "Penalaran Kuantitatif",
    kelasSasaran: "UTBK",
    tipe: "video",
    bunnyVideoId: "bunny_sample_03",
    thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
    durasiMenit: 25,
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    isPublished: true,
    createdAt: "2025-07-08T16:20:00Z",
  },
];

export const DUMMY_QUIZ: Quiz[] = [
  {
    id: 1,
    judul: "Latihan Integral Tak Tentu Dasar",
    deskripsi: "Uji pemahaman konsep integral dasar sebelum masuk ke aplikasi luas.",
    mataPelajaran: "Matematika",
    kelasSasaran: "SMA",
    durasiMenit: 20,
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    isPublished: true,
    questions: [
      { id: 1, pertanyaan: "Hasil integral dari 2x dx adalah ...", opsi: ["x² + C", "2x² + C", "x + C", "2 + C"], jawabanBenar: 0, pembahasan: "Integral 2x adalah x² karena turunan x² menghasilkan 2x." },
      {
        id: 2,
        pertanyaan: "Konstanta C pada integral tak tentu disebut ...",
        opsi: ["Koefisien", "Konstanta integrasi", "Variabel bebas", "Limit"],
        jawabanBenar: 1,
        pembahasan: "C adalah konstanta integrasi karena turunan konstanta bernilai nol.",
      },
      { id: 3, pertanyaan: "Integral dari 1/x dx untuk x > 0 adalah ...", opsi: ["x²", "1/x²", "ln x + C", "eˣ + C"], jawabanBenar: 2, pembahasan: "Turunan ln x adalah 1/x, sehingga integralnya ln x + C." },
    ],
  },
  {
    id: 2,
    judul: "Present Perfect Tense Mudah",
    deskripsi: "Latihan singkat untuk membedakan penggunaan have dan has.",
    mataPelajaran: "Bahasa Inggris",
    kelasSasaran: "SMP",
    durasiMenit: 15,
    pengajarId: 2,
    pengajarNama: "Siti Rahmawati",
    isPublished: true,
    questions: [
      { id: 4, pertanyaan: "She ___ finished her homework.", opsi: ["have", "has", "having", "had"], jawabanBenar: 1, pembahasan: "Subjek she menggunakan has dalam present perfect tense." },
      { id: 5, pertanyaan: "They have ___ to Bali twice.", opsi: ["go", "went", "gone", "going"], jawabanBenar: 2, pembahasan: "Present perfect memakai have/has + past participle; bentuk ketiga go adalah gone." },
    ],
  },
];

export const DUMMY_KATALOG_UJIAN: KatalogUjian[] = [
  {
    id: 1,
    namaUjian: "UTS Matematika Wajib Kelas 11",
    mataPelajaran: "Matematika",
    kelasSasaran: "SMA",
    tanggal: "2025-07-20",
    jam: "09:00 WIB",
    deskripsi: "Cakupan materi mencakup Notasi Sigma, Barisan & Deret, serta Induksi Matematika.",
    lokasi: "Online via Portal CBT Bimbel",
    pengajarId: 1,
    pengajarPic: "Budi Santoso",
    isPublished: true,
  },
  {
    id: 2,
    namaUjian: "Ujian Bahasa Inggris Tengah Semester",
    mataPelajaran: "Bahasa Inggris",
    kelasSasaran: "SMP",
    tanggal: "2025-07-22",
    jam: "14:00 WIB",
    deskripsi: "Evaluasi penguasaan Tenses, Daily Expression, dan Reading Comprehension artikel sains.",
    lokasi: "Ruang Kelas 2 Lantai 1 (Offline)",
    pengajarId: 2,
    pengajarPic: "Siti Rahmawati",
    isPublished: true,
  },
  {
    id: 3,
    namaUjian: "Try Out Akbar UTBK SNBT 2025 Gelombang 1",
    mataPelajaran: "TPS & Literasi Lengkap",
    kelasSasaran: "UTBK",
    tanggal: "2025-07-28",
    jam: "08:00 WIB",
    deskripsi: "Simulasi ujian nasional dengan sistem IRT (Item Response Theory), analisis kelemahan, dan ranking nasional.",
    lokasi: "Auditorium Utama & Online Synchronous",
    pengajarId: 3,
    pengajarPic: "Andi Pratama",
    isPublished: true,
  },
  {
    id: 4,
    namaUjian: "Asesmen Sumatif Bahasa Indonesia SD",
    mataPelajaran: "Bahasa Indonesia",
    kelasSasaran: "SD",
    tanggal: "2025-07-30",
    jam: "08:30 WIB",
    deskripsi: "Asesmen akhir materi puisi anak, menyusun surat pribadi, dan menemukan ide pokok.",
    lokasi: "Ruang Kelas 1 Lantai 1 (Offline)",
    pengajarId: 4,
    pengajarPic: "Ratna Wulandari",
    isPublished: true,
  },
];

export const DUMMY_PEMBAYARAN: Pembayaran[] = [
  {
    id: 1,
    muridId: 2,
    muridNama: "Aisyah Nur Fadilah",
    muridKelas: "SMP (Kelas 8)",
    periodeBulan: "2025-07",
    jumlah: 750000,
    status: "pending",
    orderId: "HBD-0001-Aisyah-JULI2025",
    metodePembayaran: "Midtrans Snap",
    createdAt: "2025-07-01T08:00:00Z",
  },
  {
    id: 2,
    muridId: 1,
    muridNama: "Rizky Maulana",
    muridKelas: "SMA (Kelas 11)",
    periodeBulan: "2025-07",
    jumlah: 900000,
    status: "dibayar",
    orderId: "HBD-0002-Rizky-JULI2025",
    metodePembayaran: "BCA Virtual Account",
    tanggalBayar: "2025-07-03T14:22:15Z",
    createdAt: "2025-07-01T08:00:00Z",
  },
  {
    id: 3,
    muridId: 3,
    muridNama: "Fajar Ramadhan",
    muridKelas: "UTBK Intensif",
    periodeBulan: "2025-07",
    jumlah: 1100000,
    status: "dibayar",
    orderId: "HBD-0003-Fajar-JULI2025",
    metodePembayaran: "Mandiri Bill Payment",
    tanggalBayar: "2025-07-02T10:11:00Z",
    createdAt: "2025-07-01T08:00:00Z",
  },
  {
    id: 4,
    muridId: 4,
    muridNama: "Nabila Zahra",
    muridKelas: "SD (Kelas 6)",
    periodeBulan: "2025-07",
    jumlah: 650000,
    status: "pending",
    orderId: "HBD-0004-Nabila-JULI2025",
    metodePembayaran: "Midtrans Snap",
    createdAt: "2025-07-01T08:00:00Z",
  },
];

export const DUMMY_FEE_PENGAJAR: FeePengajar[] = [
  {
    id: 1,
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    periodeBulan: "2025-07",
    totalJam: 42,
    nominalPerJam: 75000,
    totalFee: 3150000,
    status: "belum_dibayar",
  },
  {
    id: 2,
    pengajarId: 2,
    pengajarNama: "Siti Rahmawati",
    periodeBulan: "2025-07",
    totalJam: 38,
    nominalPerJam: 65000,
    totalFee: 2470000,
    status: "dibayar",
    tanggalBayar: "2025-07-10T16:00:00Z",
  },
  {
    id: 3,
    pengajarId: 3,
    pengajarNama: "Andi Pratama",
    periodeBulan: "2025-07",
    totalJam: 30,
    nominalPerJam: 80000,
    totalFee: 2400000,
    status: "dibayar",
    tanggalBayar: "2025-07-10T16:05:00Z",
  },
  {
    id: 4,
    pengajarId: 4,
    pengajarNama: "Ratna Wulandari",
    periodeBulan: "2025-07",
    totalJam: 25,
    nominalPerJam: 55000,
    totalFee: 1375000,
    status: "belum_dibayar",
  },
];

export const DUMMY_FINANCE: FinanceRecord[] = [
  { id: 1, tanggal: "2025-07-02", tipe: "pendapatan", kategori: "pembayaran_murid", keterangan: "Pembayaran Fajar Ramadhan - Juli 2025", jumlah: 1100000, status: "tercatat" },
  { id: 2, tanggal: "2025-07-03", tipe: "pendapatan", kategori: "pembayaran_murid", keterangan: "Pembayaran Rizky Maulana - Juli 2025", jumlah: 900000, status: "tercatat" },
  { id: 3, tanggal: "2025-07-10", tipe: "pengeluaran", kategori: "fee_pengajar", keterangan: "Fee Siti Rahmawati - Juli 2025", jumlah: 2470000, status: "dibayar" },
  { id: 4, tanggal: "2025-07-10", tipe: "pengeluaran", kategori: "fee_pengajar", keterangan: "Fee Andi Pratama - Juli 2025", jumlah: 2400000, status: "dibayar" },
  { id: 5, tanggal: "2025-07-12", tipe: "pengeluaran", kategori: "operasional", keterangan: "Langganan platform belajar dan internet", jumlah: 850000, status: "dibayar" },
  { id: 6, tanggal: "2025-06-03", tipe: "pendapatan", kategori: "pembayaran_murid", keterangan: "Pembayaran murid - Juni 2025", jumlah: 3850000, status: "tercatat" },
  { id: 7, tanggal: "2025-06-10", tipe: "pengeluaran", kategori: "fee_pengajar", keterangan: "Fee pengajar - Juni 2025", jumlah: 3100000, status: "dibayar" },
  { id: 8, tanggal: "2025-05-03", tipe: "pendapatan", kategori: "pembayaran_murid", keterangan: "Pembayaran murid - Mei 2025", jumlah: 4200000, status: "tercatat" },
  { id: 9, tanggal: "2025-05-10", tipe: "pengeluaran", kategori: "fee_pengajar", keterangan: "Fee pengajar - Mei 2025", jumlah: 2950000, status: "dibayar" },
];

export const DUMMY_RAPOT_MURID: RapotMurid[] = [
  {
    id: 1,
    muridId: 1,
    muridNama: "Rizky Maulana",
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    periode: "Juli 2025",
    nilaiQuiz: 88,
    kehadiran: 94,
    nilaiSekolah: 86,
    keaktifan: 90,
    nilaiAkhir: 89,
    deskripsi: "Rizky menunjukkan pemahaman konsep yang kuat dan konsisten menyelesaikan latihan integral. Ia aktif mengajukan pertanyaan saat menemukan langkah yang belum dipahami.",
    rekomendasi: "Latih variasi soal cerita dan pertahankan kebiasaan membuat rangkuman setelah kelas.",
    status: "terbit",
    updatedAt: "2025-07-31",
  },
  {
    id: 2,
    muridId: 2,
    muridNama: "Aisyah Nur Fadilah",
    pengajarId: 2,
    pengajarNama: "Siti Rahmawati",
    periode: "Juli 2025",
    nilaiQuiz: 82,
    kehadiran: 90,
    nilaiSekolah: 84,
    keaktifan: 86,
    nilaiAkhir: 86,
    deskripsi: "Aisyah semakin percaya diri menggunakan present perfect tense dan berani mencoba contoh kalimat sendiri.",
    rekomendasi: "Tambah latihan speaking singkat setiap hari dan gunakan kosakata baru dalam kalimat.",
    status: "terbit",
    updatedAt: "2025-07-31",
  },
];

export const DUMMY_ASESMEN_PENGAJAR: AsesmenPengajar[] = [
  {
    id: 1,
    muridId: 1,
    muridNama: "Rizky Maulana",
    pengajarId: 1,
    pengajarNama: "Budi Santoso",
    periode: "Juli 2025",
    rating: 5,
    pemahamanMateri: 5,
    komunikasi: 5,
    ketepatanWaktu: 4,
    deskripsi: "Pak Budi menjelaskan integral dengan contoh yang mudah diikuti dan selalu memberi waktu untuk bertanya.",
    status: "ditinjau",
    createdAt: "2025-07-29",
  },
  {
    id: 2,
    muridId: 2,
    muridNama: "Aisyah Nur Fadilah",
    pengajarId: 2,
    pengajarNama: "Siti Rahmawati",
    periode: "Juli 2025",
    rating: 5,
    pemahamanMateri: 5,
    komunikasi: 4,
    ketepatanWaktu: 5,
    deskripsi: "Bu Siti membuat latihan Bahasa Inggris terasa menyenangkan dan memberikan koreksi yang jelas.",
    status: "terkirim",
    createdAt: "2025-07-30",
  },
];

export const DUMMY_REMINDER_LOGS: ReminderLog[] = [
  {
    id: 1,
    tipe: "mengajar",
    targetNama: "Budi Santoso",
    targetEmail: "budi.santoso@helpedbydinda.id",
    targetRole: "pengajar",
    status: "sent",
    sentAt: "2025-07-14T20:00:00+07:00",
    keterangan: "Pengingat H-1 Jadwal Mengajar Matematika SMA (15 Juli 2025 16.00 WIB)",
  },
  {
    id: 2,
    tipe: "bayar",
    targetNama: "Aisyah Nur Fadilah",
    targetEmail: "aisyah.nur@student.id",
    targetRole: "murid",
    status: "sent",
    sentAt: "2025-07-10T09:00:00+07:00",
    keterangan: "Invoice Juli 2025: Rp 750.000 menunggu pembayaran via Midtrans",
  },
  {
    id: 3,
    tipe: "absen",
    targetNama: "Rizky Maulana",
    targetEmail: "rizky.m@student.id",
    targetRole: "murid",
    status: "sent",
    sentAt: "2025-07-15T15:45:00+07:00",
    keterangan: "Pengingat sesi belajar Matematika SMA akan dimulai dalam 15 menit",
  },
  {
    id: 4,
    tipe: "ujian",
    targetNama: "Rizky Maulana",
    targetEmail: "rizky.m@student.id",
    targetRole: "murid",
    status: "sent",
    sentAt: "2025-07-17T08:00:00+07:00",
    keterangan: "Pengingat H-3 UTS Matematika Wajib Kelas 11",
  },
];
