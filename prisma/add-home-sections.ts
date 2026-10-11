/**
 * DDL idempotent untuk tabel home_sections (HomeSection).
 * Pola proyek: jangan `prisma migrate deploy` (P3005 di Neon) — pakai raw SQL.
 * Jalankan sebelum setup-home-sections.ts: npm run db:home-sections (sudah otomatis run setup).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "home_sections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kategori" TEXT NOT NULL DEFAULT 'hero',
    "judul" TEXT NOT NULL,
    "ringkasan" TEXT,
    "isi" TEXT NOT NULL,
    "imageUrl" TEXT,
    "ikon" TEXT,
    "tombolTeks" TEXT,
    "tombolLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
  )`);

  const slugUnique = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM pg_indexes WHERE indexname = 'home_sections_slug_key'`
  );
  if (Number(slugUnique[0]?.count || 0) === 0) {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "home_sections_slug_key" ON "home_sections"("slug")`);
  }
  const kategoriIndex = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM pg_indexes WHERE indexname = 'home_sections_kategori_idx'`
  );
  if (Number(kategoriIndex[0]?.count || 0) === 0) {
    await prisma.$executeRawUnsafe(`CREATE INDEX "home_sections_kategori_idx" ON "home_sections"("kategori")`);
  }

  console.log("home_sections table ready.");
  await prisma.$disconnect();
  await pool.end();
}

void main();