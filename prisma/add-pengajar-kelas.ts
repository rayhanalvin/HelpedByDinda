import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const raw = process.env.DATABASE_URL ?? "";
  const connectionString = raw
    .replace(/sslmode=require/gi, "sslmode=verify-full")
    .replace(/sslmode=prefer/gi, "sslmode=verify-full")
    .replace(/sslmode=verify-ca/gi, "sslmode=verify-full");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "pengajar_kelas" (
    "id" TEXT NOT NULL,
    "pengajarId" TEXT NOT NULL,
    "namaKelas" TEXT NOT NULL,
    "program" TEXT NOT NULL DEFAULT 'Reguler',
    "jenjang" TEXT NOT NULL DEFAULT 'SMA_SMK',
    "metode" TEXT NOT NULL DEFAULT 'ONLINE',
    "jenisKelas" TEXT NOT NULL DEFAULT 'PRIVATE',
    "jumlahSiswa" INTEGER NOT NULL DEFAULT 1,
    "feePerSiswa" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pengajar_kelas_pkey" PRIMARY KEY ("id")
  )`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "pengajar_kelas_pengajarId_idx" ON "pengajar_kelas"("pengajarId")`);
  const constraint = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM pg_constraint WHERE conname = 'pengajar_kelas_pengajarId_fkey'`);
  if (Number(constraint[0]?.count || 0) === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "pengajar_kelas" ADD CONSTRAINT "pengajar_kelas_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "pengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }
  console.log("pengajar_kelas table ready.");
  await prisma.$disconnect();
}

void main();