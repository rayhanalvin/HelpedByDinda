ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'IZIN';
ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'SAKIT';

ALTER TABLE "absensi"
  ADD COLUMN IF NOT EXISTS "buktiData" TEXT,
  ADD COLUMN IF NOT EXISTS "buktiMimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "buktiNama" TEXT;

CREATE TABLE IF NOT EXISTS "rapot" (
  "id" TEXT NOT NULL,
  "muridId" TEXT NOT NULL,
  "pengajarId" TEXT NOT NULL,
  "periode" TEXT NOT NULL,
  "nilaiQuiz" INTEGER NOT NULL DEFAULT 0,
  "kehadiran" INTEGER NOT NULL DEFAULT 0,
  "nilaiSekolah" INTEGER NOT NULL DEFAULT 0,
  "keaktifan" INTEGER NOT NULL DEFAULT 0,
  "nilaiAkhir" INTEGER NOT NULL DEFAULT 0,
  "deskripsi" TEXT NOT NULL,
  "rekomendasi" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'TERBIT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rapot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rapot_muridId_fkey" FOREIGN KEY ("muridId") REFERENCES "murid"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "rapot_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "pengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "rapot_muridId_pengajarId_periode_key" ON "rapot"("muridId", "pengajarId", "periode");
CREATE INDEX IF NOT EXISTS "rapot_pengajarId_updatedAt_idx" ON "rapot"("pengajarId", "updatedAt");
CREATE INDEX IF NOT EXISTS "rapot_muridId_updatedAt_idx" ON "rapot"("muridId", "updatedAt");

CREATE TABLE IF NOT EXISTS "asesmen_pengajar" (
  "id" TEXT NOT NULL,
  "muridId" TEXT NOT NULL,
  "pengajarId" TEXT NOT NULL,
  "periode" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "pemahamanMateri" INTEGER NOT NULL DEFAULT 5,
  "komunikasi" INTEGER NOT NULL DEFAULT 5,
  "ketepatanWaktu" INTEGER NOT NULL DEFAULT 5,
  "deskripsi" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'TERKIRIM',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asesmen_pengajar_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "asesmen_pengajar_muridId_fkey" FOREIGN KEY ("muridId") REFERENCES "murid"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "asesmen_pengajar_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "pengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "asesmen_pengajar_muridId_pengajarId_periode_key" ON "asesmen_pengajar"("muridId", "pengajarId", "periode");
CREATE INDEX IF NOT EXISTS "asesmen_pengajar_pengajarId_createdAt_idx" ON "asesmen_pengajar"("pengajarId", "createdAt");