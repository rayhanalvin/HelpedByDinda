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

const GALERI: { slug: string; judul: string; imageUrl: string }[] = [
  {
    slug: "tentang-helped-by-dinda",
    judul: "Belajar Nyaman",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  },
  {
    slug: "perjalanan-kami",
    judul: "Fokus Bersama",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
  },
  {
    slug: "program-pembelajaran",
    judul: "Diskusi Kelompok",
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
  },
  {
    slug: "pendekatan-pembelajaran",
    judul: "Bimbingan Privat",
    imageUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
  },
  {
    slug: "tutor-dan-pendampingan",
    judul: "Tutor yang Ramah",
    imageUrl: "https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80",
  },
  {
    slug: "komitmen-kami",
    judul: "Semangat Belajar",
    imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
  },
];

async function main() {
  console.log("Mengisi galeri Suasana Belajar (hanya jika imageUrl kosong)...");
  let updated = 0;
  let skipped = 0;

  for (const item of GALERI) {
    const existing = await prisma.tentangSection.findUnique({ where: { slug: item.slug } });
    if (!existing) {
      console.log(`Bagian "${item.slug}" tidak ditemukan — dilewati.`);
      continue;
    }
    if (existing.imageUrl) {
      console.log(`Bagian "${item.slug}" sudah punya foto (dilewati agar tidak menimpa unggahan admin).`);
      skipped++;
      continue;
    }
    await prisma.tentangSection.update({
      where: { slug: item.slug },
      data: { imageUrl: item.imageUrl },
    });
    console.log(`Bagian "${item.slug}" diisi foto "${item.judul}".`);
    updated++;
  }

  await prisma.$disconnect();
  console.log(`Selesai. Diisi: ${updated}, dilewati: ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});