/** Konstanta murni untuk halaman Beranda — TANPA import prisma/db agar aman di client bundle. */

export const HOME_KATEGORI = [
  { value: "hero", label: "Hero Section" },
  { value: "statistik", label: "Statistik Beranda" },
  { value: "keunggulan", label: "Keunggulan Kami" },
  { value: "program", label: "Program Unggulan" },
  { value: "pengajar", label: "Bagian Pengajar" },
  { value: "cta", label: "CTA / Penutup" },
] as const;

export const HOME_IKON = [
  "Sparkles",
  "Rocket",
  "TrendingUp",
  "BadgeCheck",
  "CalendarCheck",
  "Video",
  "ShieldCheck",
  "BookOpen",
  "GraduationCap",
  "Star",
  "Award",
  "Users",
  "Heart",
  "Target",
];

export const HOME_FALLBACKS: Record<string, { judul: string; ringkasan: string; ikon: string; tombolTeks: string | null; tombolLink: string | null }> = {
  "hero-beranda": {
    judul: "Bimbingan Belajar Modern Bersama Helped By Dinda",
    ringkasan:
      "Menghubungkan murid, pengajar hebat, dan admin dalam satu sistem terintegrasi. Absensi kehadiran digital realtime, materi video terstruktur, dan rekap transparan tanpa repot.",
    ikon: "Sparkles",
    tombolTeks: "Daftar Murid Baru",
    tombolLink: "/register",
  },
  "statistik-beranda": {
    judul: "Statistik Beranda",
    ringkasan: "Angka yang menunjukkan dampak nyata Helped By Dinda bagi murid dan keluarga.",
    ikon: "TrendingUp",
    tombolTeks: null,
    tombolLink: null,
  },
  "keunggulan-kami": {
    judul: "Bukan Sekadar Les Biasa, Ini Ekosistem Belajar Cerdas",
    ringkasan:
      "Kami menyelesaikan masalah pencatatan manual, jadwal bentrok, dan materi berserakan dengan teknologi modern.",
    ikon: "BadgeCheck",
    tombolTeks: null,
    tombolLink: null,
  },
  "program-unggulan": {
    judul: "Pilihan Jenjang & Kurikulum",
    ringkasan: "Tersedia bimbingan tatap muka (offline) maupun kelas daring interaktif (online).",
    ikon: "BookOpen",
    tombolTeks: "Lihat Seluruh Detail Program",
    tombolLink: "/program",
  },
  "pengajar-beranda": {
    judul: "Belajar Bersama Pengajar Berpengalaman",
    ringkasan: "Pengajar kami adalah lulusan PTN ternama yang mengajar dengan metode ramah dan santai.",
    ikon: "GraduationCap",
    tombolTeks: "Lihat Semua Pengajar",
    tombolLink: "/pengajar-publik",
  },
  "cta-pendaftaran": {
    judul: "Siap Raih Prestasi Terbaik Bersama Kami?",
    ringkasan:
      "Daftarkan putra-putri Anda sekarang atau konsultasikan kebutuhan belajar secara gratis dengan tim akademik kami.",
    ikon: "Rocket",
    tombolTeks: "Daftar Sekarang",
    tombolLink: "/register",
  },
};