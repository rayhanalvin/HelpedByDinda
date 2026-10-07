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
    where: { email: "dinda@helpedbydinda.id" },
    update: {
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
    create: {
      email: "dinda@helpedbydinda.id",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Dinda Ayu Lestari",
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

  // Additional admin account requested by user
  const produktifUser = await prisma.user.upsert({
    where: { email: "produktifdinda@gmail.com" },
    update: {
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
    create: {
      email: "produktifdinda@gmail.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Produktif Dinda",
      phone: "081234567890",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      role: "ADMIN",
    },
  });

  await prisma.admin.upsert({
    where: { userId: produktifUser.id },
    update: {},
    create: { userId: produktifUser.id },
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
