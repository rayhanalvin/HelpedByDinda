import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getConnectionString() {
  const raw = process.env.DATABASE_URL ?? "";
  const connectionString = raw
    .replace(/sslmode=require/gi, "sslmode=verify-full")
    .replace(/sslmode=prefer/gi, "sslmode=verify-full")
    .replace(/sslmode=verify-ca/gi, "sslmode=verify-full");
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return connectionString;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getConnectionString() }),
});

const DDL: string[] = [
  `
CREATE TABLE IF NOT EXISTS "tentang_sections" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "kategori" TEXT NOT NULL DEFAULT 'lainnya',
  "judul" TEXT NOT NULL,
  "ringkasan" TEXT,
  "isi" TEXT NOT NULL,
  "imageUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "urutan" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tentang_sections_pkey" PRIMARY KEY ("id")
);
`,
  `
CREATE TABLE IF NOT EXISTS "tentang_statistik" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "nilai" TEXT NOT NULL,
  "ikon" TEXT NOT NULL DEFAULT 'GraduationCap',
  "urutan" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tentang_statistik_pkey" PRIMARY KEY ("id")
);
`,
  `
CREATE UNIQUE INDEX IF NOT EXISTS "tentang_sections_slug_key" ON "tentang_sections" ("slug");
`,
  `
CREATE INDEX IF NOT EXISTS "tentang_sections_kategori_idx" ON "tentang_sections" ("kategori");
`,
];

const SECTIONS: { slug: string; kategori: string; judul: string; ringkasan: string; isi: string; urutan: number }[] = [
  {
    slug: "tentang-helped-by-dinda",
    kategori: "profil",
    judul: "Tentang Helped by Dinda",
    ringkasan: "Bimbingan belajar privat dan kelompok yang hadir untuk mendampingi setiap murid dengan perhatian, metode yang jelas, dan ruang untuk berkembang.",
    isi: "Helped by Dinda adalah lembaga bimbingan belajar yang berfokus pada pendekatan personal agar setiap murid merasa didengar, dimengerti, dan termotivasi. Kami tidak hanya membantu mendampingi pelajaran, tetapi juga menumbuhkan rasa percaya diri dan kebiasaan belajar yang sehat.\n\nSetiap program dirancang sesuai kebutuhan murid, didukung tutor yang ramah dan kompeten, serta dipantau melalui sistem digital yang transparan. Dengan cara ini, orang tua dan murid dapat melihat perkembangan belajar secara jelas dan teratur.",
    urutan: 1,
  },
  {
    slug: "perjalanan-kami",
    kategori: "perjalanan",
    judul: "Perjalanan Kami",
    ringkasan: "Sejak 2021, kami terus tumbuh bersama ribuan murid dan keluarga yang percaya pada pendampingan belajar yang hangat dan terarah.",
    isi: "Berawal dari satu sesi bimbingan sederhana, kami percaya bahwa setiap anak layak mendapat pendampingan yang tepat. Langkah demi langkah kami bangun sistem belajar yang lebih baik, menjangkau lebih banyak murid, dan memperkuat komunitas yang saling mendukung.",
    urutan: 2,
  },
  {
    slug: "pencapaian-kami",
    kategori: "pencapaian",
    judul: "Pencapaian Kami",
    ringkasan: "Keberhasilan murid adalah bukti nyata dari pendampingan yang konsisten dan penuh perhatian.",
    isi: "Kami bersyukur atas kepercayaan ratusan murid dan keluarga. Setiap nilai yang meningkat, setiap kelulusan yang diraih, dan setiap cerita sukses menjadi semangat kami untuk terus memberikan yang terbaik.",
    urutan: 3,
  },
  {
    slug: "program-pembelajaran",
    kategori: "program",
    judul: "Program Pembelajaran",
    ringkasan: "Program belajar disusun sesuai jenjang, tujuan akademik, dan kebutuhan setiap murid.",
    isi: "Kami menyediakan program bimbingan untuk jenjang SD, SMP, SMA/SMK, hingga persiapan UTBK. Setiap program dilengkapi modul latihan, video materi, serta evaluasi berkala agar perkembangan murid selalu terpantau.",
    urutan: 4,
  },
  {
    slug: "pendekatan-pembelajaran",
    kategori: "pendekatan",
    judul: "Pendekatan Pembelajaran",
    ringkasan: "Belajar menjadi menyenangkan ketika metode yang digunakan sesuai dengan gaya belajar murid.",
    isi: "Kami memadukan pemahaman konsep, latihan soal, dan penguatan motivasi dalam setiap sesi. Tutor menyesuaikan ritme belajar, memberi umpan balik, dan menciptakan suasana yang nyaman agar murid berani bertanya dan berkembang.",
    urutan: 5,
  },
  {
    slug: "tutor-dan-pendampingan",
    kategori: "tutor",
    judul: "Tutor dan Pendampingan Akademik",
    ringkasan: "Tutor kami adalah pengajar yang ramah, kompeten, dan memiliki empati tinggi terhadap kebutuhan belajar murid.",
    isi: "Setiap tutor melalui proses kurasi yang ketat, baik dari segi penguasaan materi maupun cara menyampaikan pelajaran. Kami juga memberikan pelatihan rutin agar kualitas pendampingan selalu terjaga dan selaras dengan perkembangan dunia pendidikan.",
    urutan: 6,
  },
  {
    slug: "visi-dan-misi",
    kategori: "visi",
    judul: "Visi dan Misi",
    ringkasan: "Menjadi mitra belajar yang dipercaya keluarga Indonesia dalam membangun generasi yang percaya diri dan berprestasi.",
    isi: "**Visi**\nMenjadi lembaga bimbingan belajar yang dikenal karena kualitas pendampingan, kehangatan, dan hasil yang nyata.\n\n**Misi**\n- Mendampingi setiap murid dengan pendekatan personal yang peduli\n- Menghadirkan tutor berkualitas yang terus berkembang\n- Membangun kebiasaan belajar mandiri dan percaya diri\n- Menjalin komunikasi yang baik antara murid, orang tua, dan tutor",
    urutan: 7,
  },
  {
    slug: "komitmen-kami",
    kategori: "komitmen",
    judul: "Komitmen Kami",
    ringkasan: "Kami berkomitmen menjaga kualitas, kejujuran, dan kepedulian dalam setiap langkah pendampingan.",
    isi: "Kami berkomitmen untuk selalu hadir, mendengar, dan menyesuaikan pendampingan dengan kebutuhan murid. Transparansi laporan belajar, waktu yang tepat, dan komunikasi yang terbuka menjadi dasar kepercayaan yang kami jaga bersama keluarga murid.",
    urutan: 8,
  },
];

const STATISTIK: { label: string; nilai: string; ikon: string; urutan: number }[] = [
  { label: "Siswa yang Dibimbing", nilai: "100+", ikon: "Users", urutan: 1 },
  { label: "Tahun Berdiri", nilai: "2021", ikon: "Calendar", urutan: 2 },
  { label: "Tutor Berpengalaman", nilai: "15+", ikon: "GraduationCap", urutan: 3 },
  { label: "Kepuasan Keluarga", nilai: "98%", ikon: "Heart", urutan: 4 },
];

async function main() {
  console.log("Menyiapkan tabel tentang_sections dan tentang_statistik...");
  for (const statement of DDL) {
    await prisma.$executeRawUnsafe(statement);
  }
  console.log("Tabel siap.");

  for (const section of SECTIONS) {
    const existing = await prisma.tentangSection.findUnique({ where: { slug: section.slug } });
    if (existing) {
      await prisma.tentangSection.update({
        where: { slug: section.slug },
        data: {
          kategori: section.kategori,
          judul: existing.judul || section.judul,
          ringkasan: existing.ringkasan ?? section.ringkasan,
          isi: existing.isi || section.isi,
          urutan: section.urutan,
        },
      });
      console.log(`Bagian "${section.slug}" diperbarui (konten admin dipertahankan).`);
    } else {
      await prisma.tentangSection.create({ data: section });
      console.log(`Bagian "${section.slug}" dibuat.`);
    }
  }

  const oldCount = await prisma.tentangSection.count();
  console.log(`Total bagian Tentang Kami: ${oldCount}`);

  for (const stat of STATISTIK) {
    const existing = await prisma.tentangStatistik.findFirst({ where: { label: stat.label } });
    if (!existing) {
      await prisma.tentangStatistik.create({ data: stat });
      console.log(`Statistik "${stat.label}" dibuat.`);
    }
  }

  const statCount = await prisma.tentangStatistik.count();
  console.log(`Total statistik: ${statCount}`);

  const portalOld = await prisma.portalKonten.findMany({ where: { kategori: "Tentang Kami" }, orderBy: [{ urutan: "asc" }] });
  const kept = portalOld.filter((item) => item.slug === "tentang-kami" || !["perjalanan-kami", "pencapaian-kami", "program-pembelajaran", "pendekatan-pembelajaran", "tutor-dan-pendampingan", "visi-dan-misi", "komitmen-kami"].includes(item.slug));

  if (kept.length < portalOld.length) {
    const removed = portalOld.filter((item) => !kept.includes(item));
    console.log(`Konten lama kategori "Tentang Kami" yang dipindahkan (tidak dihapus dari source): ${removed.map((r) => r.slug).join(", ")}`);
  }

  await prisma.$disconnect();
  console.log("Selesai. Seluruh konten lama tetap tersimpan di tabel portal_konten; bagian baru dapat dikelola di halaman admin.");
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});