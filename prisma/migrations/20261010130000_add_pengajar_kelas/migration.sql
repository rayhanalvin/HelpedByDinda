-- Additive migration: PengajarKelas (flexible class & fee management per teacher)
CREATE TABLE IF NOT EXISTS "pengajar_kelas" (
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
);

CREATE INDEX IF NOT EXISTS "pengajar_kelas_pengajarId_idx" ON "pengajar_kelas"("pengajarId");

ALTER TABLE "pengajar_kelas" ADD CONSTRAINT "pengajar_kelas_pengajarId_fkey" FOREIGN KEY ("pengajarId") REFERENCES "pengajar"("id") ON DELETE CASCADE ON UPDATE CASCADE;