/**
 * Setup idempotent HomeSection (bagian halaman Beranda).
 * Membuat 6 bagian: Hero, Statistik Beranda, Keunggulan Kami, Program Unggulan,
 * Tautan Daftar & CTA Pendaftaran — hanya bila slug belum ada (tidak menghapus data).
 *
 * Cara pakai: npm run db:home-sections
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const HERO_DEFAULT = {
  judul: "Bimbingan Belajar Modern Bersama Helped By Dinda",
  ringkasan:
    "Menghubungkan murid, pengajar hebat, dan admin dalam satu sistem terintegrasi. Absensi kehadiran digital realtime, materi video terstruktur, dan rekap transparan tanpa repot.",
  isi:
    "Platform bimbel digital modern untuk generasi berprestasi.\n\nDaftar murid baru sekarang dan dapatkan pendampingan belajar yang terarah.",
  imageUrl: null,
  ikon: "Sparkles",
  tombolTeks: "Daftar Murid Baru",
  tombolLink: "/register",
  urutan: 1,
};

const STATISTIK_DEFAULT = {
  judul: "Statistik Beranda",
  ringkasan: "Angka yang menunjukkan dampak nyata Helped By Dinda bagi murid dan keluarga.",
  isi: [
    "100%|Absensi Digital Akurat|CalendarCheck",
    "500+|Siswa Lolos PTN Impian|GraduationCap",
    "4.9 / 5|Kepuasan Wali Murid|Star",
    "< 2 Detik|Rekap Fee Pengajar Otomatis|Zap",
  ].join("\n"),
  imageUrl: null,
  ikon: "TrendingUp",
  tombolTeks: null,
  tombolLink: null,
  urutan: 2,
};

const KEUNGGULAN_DEFAULT = {
  judul: "Bukan Sekadar Les Biasa, Ini Ekosistem Belajar Cerdas",
  ringkasan: "Kami menyelesaikan masalah pencatatan manual, jadwal bentrok, dan materi berserakan dengan teknologi modern.",
  isi: [
    "Absensi Digital Realtime|Murid & pengajar melakukan presensi mandiri dengan validasi waktu jadwal. Status kehadiran akurat tanpa manipulasi.|CalendarCheck",
    "Materi Video Bunny CDN|Streaming video penjelasan berkualitas tinggi dan modul latihan PDF tersusun rapi per mata pelajaran & jenjang kelas.|Video",
    "Pembayaran Midtrans Otomatis|Tagihan bulanan terbit otomatis dan dapat dibayar melalui transfer bank dengan konfirmasi admin.|ShieldCheck",
  ].join("\n"),
  imageUrl: null,
  ikon: "BadgeCheck",
  tombolTeks: null,
  tombolLink: null,
  urutan: 3,
};

const PROGRAM_UNGGULAN_DEFAULT = {
  judul: "Pilihan Jenjang & Kurikulum",
  ringkasan: "Tersedia bimbingan tatap muka (offline) maupun kelas daring interaktif (online).",
  isi: "Program unggulan diambil langsung dari menu Kelola Program agar data selalu konsisten.",
  imageUrl: null,
  ikon: "BookOpen",
  tombolTeks: "Lihat Seluruh Detail Program",
  tombolLink: "/program",
  urutan: 4,
};

const PENGAJAR_DEFAULT = {
  judul: "Belajar Bersama Pengajar Berpengalaman",
  ringkasan: "Pengajar kami adalah lulusan PTN ternama yang mengajar dengan metode ramah dan santai.",
  isi: "Daftar pengajar ditampilkan otomatis dari sistem dan dapat dilihat di halaman Daftar Pengajar.",
  imageUrl: null,
  ikon: "GraduationCap",
  tombolTeks: "Lihat Semua Pengajar",
  tombolLink: "/pengajar-publik",
  urutan: 5,
};

const CTA_DEFAULT = {
  judul: "Siap Raih Prestasi Terbaik Bersama Kami?",
  ringkasan: "Daftarkan putra-putri Anda sekarang atau konsultasikan kebutuhan belajar secara gratis dengan tim akademik kami.",
  isi: "Daftar Sekarang",
  imageUrl: null,
  ikon: "Rocket",
  tombolTeks: "Daftar Sekarang",
  tombolLink: "/register",
  urutan: 6,
};

type SectionDefaults = {
  judul: string;
  ringkasan: string;
  isi: string;
  imageUrl: string | null;
  ikon: string;
  tombolTeks: string | null;
  tombolLink: string | null;
  urutan: number;
};

const SECTIONS: Array<{ slug: string; kategori: string; defaultData: SectionDefaults }> = [
  { slug: "hero-beranda", kategori: "hero", defaultData: HERO_DEFAULT },
  { slug: "statistik-beranda", kategori: "statistik", defaultData: STATISTIK_DEFAULT },
  { slug: "keunggulan-kami", kategori: "keunggulan", defaultData: KEUNGGULAN_DEFAULT },
  { slug: "program-unggulan", kategori: "program", defaultData: PROGRAM_UNGGULAN_DEFAULT },
  { slug: "pengajar-beranda", kategori: "pengajar", defaultData: PENGAJAR_DEFAULT },
  { slug: "cta-pendaftaran", kategori: "cta", defaultData: CTA_DEFAULT },
];

async function main() {
  console.log("Memeriksa home_sections...");
  const existing = await prisma.homeSection.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existing.map((item) => item.slug));
  let created = 0;
  let skipped = 0;

  for (const { slug, kategori, defaultData } of SECTIONS) {
    if (existingSlugs.has(slug)) {
      skipped += 1;
      continue;
    }
    await prisma.homeSection.create({
      data: {
        slug,
        kategori,
        judul: defaultData.judul,
        ringkasan: defaultData.ringkasan,
        isi: defaultData.isi,
        imageUrl: defaultData.imageUrl,
        ikon: defaultData.ikon,
        tombolTeks: defaultData.tombolTeks,
        tombolLink: defaultData.tombolLink,
        isActive: true,
        urutan: defaultData.urutan,
      },
    });
    created += 1;
    console.log(`  + ${slug} (${kategori})`);
  }

  console.log(`Selesai. Dibuat: ${created}, sudah ada (tidak diubah): ${skipped}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });