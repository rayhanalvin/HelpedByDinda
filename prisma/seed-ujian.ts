import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const seed = [
    {
      namaUjian: "Try Out UTBK SNBT Tahap 1",
      mataPelajaran: "TPS Pengetahuan Kuantitatif",
      kelasSasaran: "UTBK",
      tanggal: "2025-12-20",
      jam: "08:00",
      deskripsi: "Simulasi UTBK SNBT lengkap dengan pembahasan interaktif bersama tutor setelah ujian selesai.",
      lokasi: "Ruang Ujian 1 (Online via Zoom)",
      pengajarNama: "Budi Santoso",
      isPublished: true,
    },
    {
      namaUjian: "Ujian Akhir Semester Matematika",
      mataPelajaran: "Matematika",
      kelasSasaran: "SMA",
      tanggal: "2025-12-10",
      jam: "10:00",
      deskripsi: "Ujian akhir semester berfokus pada integral, turunan, dan aplikasi fungsi. Siapkan kalkulator sainsmu!",
      lokasi: "Ruang 2 - Lantai 1",
      pengajarNama: "Budi Santoso",
      isPublished: true,
    },
    {
      namaUjian: "Ujian Tengah Semester Bahasa Inggris",
      mataPelajaran: "Bahasa Inggris",
      kelasSasaran: "SMP",
      tanggal: "2025-11-28",
      jam: "09:00",
      deskripsi: "Materi tenses, reading comprehension, dan vocabulary. Jangan lupa latihan listening di aplikasi.",
      lokasi: "Ruang 3 - Lantai 2",
      pengajarNama: "Siti Rahmawati",
      isPublished: true,
    },
    {
      namaUjian: "Latihan Literasi Membaca SD",
      mataPelajaran: "Bahasa Indonesia",
      kelasSasaran: "SD",
      tanggal: "2025-11-25",
      jam: "14:00",
      deskripsi: "Latihan membaca pemahaman dan menemukan ide pokok paragraf untuk anak SD kelas 5-6.",
      lokasi: "Ruang Kelas 1",
      pengajarNama: "Ratna Wulandari",
      isPublished: true,
    },
    {
      namaUjian: "Try Out Fisika & Penalaran",
      mataPelajaran: "Fisika",
      kelasSasaran: "SMA",
      tanggal: "2025-12-30",
      jam: "08:30",
      deskripsi: "Draft try out fisika dengan sistem penilaian otomatis dan pembahasan video.",
      lokasi: "Ruang Ujian 2",
      pengajarNama: "Andi Pratama",
      isPublished: false,
    },
  ];

  for (const item of seed) {
    const pengajar = await prisma.pengajar.findFirst({
      where: { user: { name: item.pengajarNama } },
      select: { id: true },
    });
    await prisma.ujian.create({
      data: {
        ...item,
        tanggal: new Date(`${item.tanggal}T07:00:00Z`),
        pengajarId: pengajar?.id || null,
      },
    });
  }
  console.log("Seeded", seed.length, "ujian records.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
