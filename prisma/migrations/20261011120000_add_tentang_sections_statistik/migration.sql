-- Tabel bagian halaman Tentang Kami (dikelola per bagian dari admin)
CREATE TABLE IF NOT EXISTS "tentang_sections" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "kategori" TEXT NOT NULL DEFAULT 'lainnya',
  "judul" TEXT NOT NULL,
  "ringkasan" TEXT,
  "isi" TEXT NOT NULL,
  "imageUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "urutan" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tentang_sections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tentang_sections_slug_key" ON "tentang_sections" ("slug");

CREATE INDEX IF NOT EXISTS "tentang_sections_kategori_idx" ON "tentang_sections" ("kategori");

-- Tabel kartu statistik halaman Tentang Kami
CREATE TABLE IF NOT EXISTS "tentang_statistik" (
  "id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "nilai" TEXT NOT NULL,
  "ikon" TEXT NOT NULL DEFAULT 'GraduationCap',
  "urutan" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tentang_statistik_pkey" PRIMARY KEY ("id")
);