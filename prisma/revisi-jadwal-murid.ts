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

  // ---- Murid extra columns (identitas bimbingan + biaya) ----
  const muridColumns: [string, string][] = [
    ["idSiswa", "TEXT"],
    ["pengelompokan", "TEXT"],
    ["namaPanggilan", "TEXT"],
    ["jurusan", "TEXT"],
    ["kampus", "TEXT"],
    ["alamatRumah", "TEXT"],
    ["jenisKelas", "TEXT"],
    ["metodeBimbel", "TEXT"],
    ["jenisBimbingan", "TEXT"],
    ["tanggalMulai", "TIMESTAMP(3)"],
    ["lokasiBimbel", "TEXT"],
    ["alamatBimbel", "TEXT"],
    ["pengajarId", "TEXT"],
    ["catatan", "TEXT"],
    ["hargaPendaftaran", "INTEGER"],
    ["diskonPendaftaran", "INTEGER"],
    ["defaultPassword", "TEXT"],
  ];
  for (const [column, type] of muridColumns) {
    const exists = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM information_schema.columns WHERE table_name = 'murid' AND column_name = '${column}'`,
    );
    if (Number(exists[0]?.count || 0) === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "murid" ADD COLUMN "${column}" ${type}`);
      console.log(`murid.${column} added.`);
    } else {
      console.log(`murid.${column} exists.`);
    }
  }
  const fk = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM pg_constraint WHERE conname = 'murid_pengajarId_fkey'`);
  if (Number(fk[0]?.count || 0) === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "murid" ADD CONSTRAINT "murid_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "pengajar"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    console.log("murid_pengajarId_fkey added.");
  }

  // ---- MuridKelas join table ----
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "murid_kelas" (
    "id" TEXT NOT NULL,
    "muridId" TEXT NOT NULL,
    "kelas" TEXT NOT NULL,
    "mataPelajaran" TEXT,
    "programNama" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "murid_kelas_pkey" PRIMARY KEY ("id")
  )`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "murid_kelas_muridId_idx" ON "murid_kelas"("muridId")`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "murid_kelas_muridId_kelas_key" ON "murid_kelas"("muridId", "kelas")`);
  const mkFk = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM pg_constraint WHERE conname = 'murid_kelas_muridId_fkey'`);
  if (Number(mkFk[0]?.count || 0) === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "murid_kelas" ADD CONSTRAINT "murid_kelas_muridId_fkey" FOREIGN KEY ("muridId") REFERENCES "murid"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  // ---- PengajarAvailability ----
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "pengajar_availability" (
    "id" TEXT NOT NULL,
    "pengajarId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'RUTINE',
    "hari" TEXT,
    "tanggal" TIMESTAMP(3),
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'ONLINE',
    "ruangan" TEXT,
    "catatan" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pengajar_availability_pkey" PRIMARY KEY ("id")
  )`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "pengajar_availability_pengajarId_idx" ON "pengajar_availability"("pengajarId")`);
  const paFk = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM pg_constraint WHERE conname = 'pengajar_availability_pengajarId_fkey'`);
  if (Number(paFk[0]?.count || 0) === 0) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "pengajar_availability" ADD CONSTRAINT "pengajar_availability_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "pengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
  }

  // ---- RescheduleRequest ----
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "reschedule_requests" (
    "id" TEXT NOT NULL,
    "muridId" TEXT NOT NULL,
    "pengajarId" TEXT NOT NULL,
    "jadwalId" TEXT NOT NULL,
    "tanggalLama" TIMESTAMP(3) NOT NULL,
    "jamMulaiLama" TEXT NOT NULL,
    "jamSelesaiLama" TEXT NOT NULL,
    "tanggalBaru" TIMESTAMP(3) NOT NULL,
    "jamMulaiBaru" TEXT NOT NULL,
    "jamSelesaiBaru" TEXT NOT NULL,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "handledBy" TEXT,
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reschedule_requests_pkey" PRIMARY KEY ("id")
  )`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reschedule_requests_muridId_idx" ON "reschedule_requests"("muridId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reschedule_requests_pengajarId_idx" ON "reschedule_requests"("pengajarId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reschedule_requests_status_idx" ON "reschedule_requests"("status")`);
  const rkFks: [string, string, string][] = [
    ["reschedule_requests_muridId_fkey", '"muridId"', '"murid"("id")'],
    ["reschedule_requests_pengajarId_fkey", '"pengajarId"', '"pengajar"("id")'],
    ["reschedule_requests_jadwalId_fkey", '"jadwalId"', '"jadwal"("id")'],
  ];
  for (const [name, column, ref] of rkFks) {
    const exists = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`SELECT COUNT(*)::bigint AS count FROM pg_constraint WHERE conname = '${name}'`);
    if (Number(exists[0]?.count || 0) === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "reschedule_requests" ADD CONSTRAINT "${name}" FOREIGN KEY (${column}) REFERENCES ${ref} ON DELETE CASCADE ON UPDATE CASCADE`);
    }
  }

  console.log("Migration 20261010 revisi murid + jadwal tersedia + reschedule complete.");
  await prisma.$disconnect();
}

void main();