import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = (process.env.DATABASE_URL ?? "")
  .replace(/sslmode=require/gi, "sslmode=verify-full")
  .replace(/sslmode=prefer/gi, "sslmode=verify-full")
  .replace(/sslmode=verify-ca/gi, "sslmode=verify-full");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const banners = [
  {
    kategori: "Beranda",
    slug: "login-banner",
    judul: "Bimbingan Belajar Modern dan Terarah",
    ringkasan: "Dinda Rizky Febriyanti||Pendiri & Direktur Akademik||Bimbingan Belajar Modern dan Terarah",
    isi: [
      "Jadwal mengajar dan absensi digital 100% transparan",
      "Akses materi video Bunny Stream dan modul latihan PDF",
      "Pembayaran praktis langsung otomatis via Midtrans Snap",
    ].join("\n"),
    urutan: 6,
  },
  {
    kategori: "Beranda",
    slug: "register-banner",
    judul: "Mulai Perjalanan Belajar yang Lebih Terarah",
    ringkasan: "Dinda Rizky Febriyanti||Pendiri & Direktur Akademik||Bangun kebiasaan belajar bersama kami",
    isi: [
      "Jadwal mengajar dan absensi digital 100% transparan",
      "Akses materi video Bunny Stream dan modul latihan PDF",
      "Pembayaran praktis langsung otomatis via Midtrans Snap",
    ].join("\n"),
    urutan: 7,
  },
];

async function main() {
  for (const banner of banners) {
    const existing = await prisma.portalKonten.findUnique({ where: { slug: banner.slug } });
    if (!existing) {
      await prisma.portalKonten.create({ data: banner });
      console.log(`Banner dibuat: ${banner.slug}`);
    } else {
      console.log(`Banner sudah ada: ${banner.slug}`);
    }
  }
  console.log("Setup banner selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });