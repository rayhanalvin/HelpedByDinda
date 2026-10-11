import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminUser = await prisma.user.upsert({
    where: { email: "cs.helpeddinda@gmail.com" },
    update: {
      passwordHash: await bcrypt.hash("dindaadmin", 10),
      role: "ADMIN",
    },
    create: {
      email: "cs.helpeddinda@gmail.com",
      passwordHash: await bcrypt.hash("dindaadmin", 10),
      name: "Dinda Rizky Febriyanti",
      phone: "081234567890",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      role: "ADMIN",
    },
  });

  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "budi.santoso@helpedbydinda.id" },
    update: {},
    create: {
      email: "budi.santoso@helpedbydinda.id",
      passwordHash: await bcrypt.hash("teacher123", 10),
      name: "Budi Santoso",
      phone: "081211223344",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "PENGAJAR",
    },
  });

  await prisma.pengajar.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      spesialisasi: "Matematika SMA & UTBK",
      bio: "Pengajar Matematika berpengalaman 7+ tahun.",
      nominalPerJam: 75000,
      ratePerSession: 75000,
      isActive: true,
      totalJamBulanIni: 42,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "rizky.m@student.id" },
    update: {},
    create: {
      email: "rizky.m@student.id",
      passwordHash: await bcrypt.hash("student123", 10),
      name: "Rizky Maulana",
      phone: "082199881122",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      role: "MURID",
    },
  });

  await prisma.murid.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      kelas: "SMA",
      sekolah: "SMAN 1 Jakarta",
      namaWali: "Ir. Hendra Maulana",
      phoneWali: "08119900112",
      paketBulanan: 900000,
      statusBayarBulanIni: "PENDING",
      isActive: true,
    },
  });

  const portalContents = [
    {
      kategori: "Beranda",
      slug: "beranda",
      judul: "Bimbingan Belajar Modern Bersama Helped By Dinda",
      ringkasan: "Menghubungkan murid, pengajar hebat, dan admin dalam satu sistem terintegrasi. Absensi digital realtime, materi terstruktur, dan rekap transparan tanpa repot.",
      isi: "Kami membantu murid belajar lebih terarah bersama pengajar yang kompeten melalui pendampingan dan materi yang terstruktur.",
      urutan: 1,
    },
    {
      kategori: "Program Belajar",
      slug: "program-belajar",
      judul: "Pilihan Program Belajar Sesuai Kebutuhanmu",
      ringkasan: "Semua program dilengkapi akses portal murid digital, absensi terverifikasi, video materi, dan pembayaran praktis.",
      isi: "Temukan program belajar yang sesuai jenjang, tujuan akademik, dan kebutuhan setiap murid.",
      urutan: 2,
    },
    {
      kategori: "Daftar Pengajar",
      slug: "daftar-pengajar",
      judul: "Tutor Pilihan yang Ramah, Kompeten, & Menginspirasi",
      ringkasan: "Seluruh pengajar Helped By Dinda melalui proses kurasi dan memiliki kemampuan pedagogik yang empatik.",
      isi: "Kenali para pengajar yang siap mendampingi proses belajar dengan pendekatan suportif dan terarah.",
      urutan: 3,
    },
    {
      kategori: "Tentang Kami",
      slug: "tentang-kami",
      judul: "Dedikasi Kami untuk Kemajuan Pendidikan Anak Bangsa",
      ringkasan: "Helped By Dinda lahir dari keyakinan bahwa setiap anak dapat berprestasi bila didampingi mentor yang peduli dan berempati.",
      isi: "Helped By Dinda hadir untuk membantu setiap murid belajar dengan pendampingan yang peduli, metode yang jelas, dan ruang untuk berkembang.",
      urutan: 4,
    },
    {
      kategori: "Kontak",
      slug: "kontak",
      judul: "Ada Pertanyaan Seputar Program Belajar?",
      ringkasan: "Jangan ragu berkonsultasi. Tim akademik Helped By Dinda siap membantu menentukan program dan tutor yang tepat.",
      isi: "Silakan hubungi tim kami untuk berkonsultasi mengenai program belajar, jadwal, atau kebutuhan pendidikan lainnya.",
      urutan: 5,
    },
  ];

  for (const content of portalContents) {
    await prisma.portalKonten.upsert({
      where: { slug: content.slug },
      update: {},
      create: content,
    });
  }

  const tentangSections = [
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
      isi: "## 2021\nHelped by Dinda memulai perjalanan sebagai bimbingan belajar kecil dengan satu tutor dan satu murid.\n\n## 2022\nProgram bimbingan berkembang ke jenjang SD, SMP, dan SMA dengan pendekatan personal.\n\n## 2023\nSistem digital hadir: absensi realtime, materi terstruktur, dan laporan perkembangan murid.\n\n## 2024\nMenjangkau 100+ murid dan menghadirkan program persiapan UTBK serta kelas kelompok.\n\n## 2025 - Sekarang\nTerus bertumbuh bersama keluarga murid dalam membangun kebiasaan belajar yang sehat dan menyenangkan.",
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
      isi: "Pemahaman konsep yang mendalam agar murid tidak hanya menghafal\nLatihan soal bertahap untuk membangun kepercayaan diri\nPenguatan motivasi dan kebiasaan belajar yang sehat\nUmpan balik rutin dari tutor agar perkembangan selalu terpantau",
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

  for (const section of tentangSections) {
    await prisma.tentangSection.upsert({
      where: { slug: section.slug },
      update: {},
      create: section,
    });
  }

  for (const stat of [
    { label: "Siswa yang Dibimbing", nilai: "100+", ikon: "Users", urutan: 1 },
    { label: "Tahun Berdiri", nilai: "2021", ikon: "Calendar", urutan: 2 },
    { label: "Tutor Berpengalaman", nilai: "15+", ikon: "GraduationCap", urutan: 3 },
    { label: "Kepuasan Keluarga", nilai: "98%", ikon: "Heart", urutan: 4 },
  ]) {
    const existing = await prisma.tentangStatistik.findFirst({ where: { label: stat.label } });
    if (!existing) {
      await prisma.tentangStatistik.create({ data: stat });
    }
  }

  const programs = [
    {
      code: "sd",
      category: "SD",
      title: "Bimbingan Tematik & Berhitung Ceria",
      target: "Siswa Kelas 1 - 6 SD",
      price: 650000,
      description: "Pendampingan harian untuk membangun dasar logika berhitung, literasi membaca cepat, dan PR sekolah tanpa stres.",
      subjects: ["Matematika Dasar & Logika", "Bahasa Indonesia & Membaca", "IPA & Tematik Terpadu"],
      facilities: ["2 sesi bimbingan per minggu", "Presensi kehadiran digital", "Modul materi PDF bergambar", "Laporan evaluasi belajar bulanan"],
      popular: false,
    },
    {
      code: "smp",
      category: "SMP",
      title: "Mastery Konsep MIPA & Bahasa Inggris SMP",
      target: "Siswa Kelas 7 - 9 SMP",
      price: 750000,
      description: "Mempersiapkan siswa menguasai konsep esensial SMP dengan trik penyelesaian soal terstruktur.",
      subjects: ["Matematika Aljabar & Geometri", "Fisika & Biologi Terpadu", "Bahasa Inggris Grammar & Vocab"],
      facilities: ["2 sesi per minggu", "Presensi digital", "Akses video pembelajaran", "Simulasi ujian"],
      popular: false,
    },
    {
      code: "sma",
      category: "SMA",
      title: "Prestasi Akademik & Pengawalan Nilai Rapor SMA",
      target: "Siswa Kelas 10 - 12 SMA",
      price: 900000,
      description: "Fokus menjaga nilai rapor tetap tinggi untuk seleksi SNBP serta penguatan konsep MIPA tingkat lanjut.",
      subjects: ["Matematika Wajib & Lanjut", "Fisika Mekanika & Listrik", "Kimia & Biologi SMA"],
      facilities: ["3 sesi per minggu", "Akses video materi", "Katalog pengingat ujian", "Konsultasi PR"],
      popular: true,
    },
    {
      code: "utbk",
      category: "UTBK",
      title: "Super Intensif Lolos UTBK SNBT",
      target: "Kelas 12 & Alumni",
      price: 1100000,
      description: "Program persiapan intensif menembus PTN favorit dengan strategi soal dan manajemen waktu.",
      subjects: ["Tes Potensi Skolastik", "Penalaran Matematika", "Literasi Bahasa Indonesia & Inggris"],
      facilities: ["4 sesi per minggu", "Simulasi CBT", "Analisis kelemahan subtes", "Mentoring personal"],
      popular: true,
    },
  ];

  for (const program of programs) {
    await prisma.program.upsert({ where: { code: program.code }, update: program, create: program });
  }

  console.log("Seed data berhasil dibuat");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
