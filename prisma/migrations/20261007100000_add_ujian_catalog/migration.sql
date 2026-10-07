-- Additive migration: ujian (exam catalog) table
CREATE TABLE IF NOT EXISTS "ujian" (
    "id" TEXT NOT NULL,
    "namaUjian" TEXT NOT NULL,
    "mataPelajaran" TEXT NOT NULL,
    "kelasSasaran" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "jam" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "pengajarId" TEXT,
    "pengajarNama" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ujian_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ujian_kelasSasaran_tanggal_idx" ON "ujian"("kelasSasaran", "tanggal");
CREATE INDEX IF NOT EXISTS "ujian_isPublished_tanggal_idx" ON "ujian"("isPublished", "tanggal");

ALTER TABLE "ujian" ADD CONSTRAINT "ujian_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "pengajar"("id") ON DELETE SET NULL ON UPDATE CASCADE;