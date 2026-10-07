import { prisma } from "@/lib/db";

const editorHintFallbacks = new Map([
  ["Kelola dan tampilkan informasi program belajar SD, SMP, SMA, serta UTBK dari panel admin.", "Jelajahi program belajar yang disusun sesuai jenjang, tujuan akademik, dan kebutuhan setiap murid."],
  ["Kelola judul dan pengantar halaman tentang kami dari panel admin.", "Helped By Dinda hadir untuk membantu setiap murid belajar dengan pendampingan yang peduli, metode yang jelas, dan ruang untuk berkembang."],
  ["Kelola judul dan pengantar halaman kontak dari panel admin.", "Hubungi tim Helped By Dinda untuk berkonsultasi tentang program belajar, jadwal, dan kebutuhan pendidikan."],
  ["Kelola pesan pengantar untuk halaman daftar pengajar publik.", "Kenali pengajar yang siap mendampingi proses belajar dengan pendekatan suportif dan terarah."],
]);

function hideEditorHint<T extends { isi: string }>(content: T): T {
  const fallback = editorHintFallbacks.get(content.isi);
  return fallback ? { ...content, isi: fallback } : content;
}

export type PortalContent = {
  id: string;
  kategori: string;
  slug: string;
  judul: string;
  ringkasan: string | null;
  isi: string;
  imageUrl: string | null;
  isPublished: boolean;
  urutan: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getPortalContent(slug: string) {
  try {
    const content = await prisma.portalKonten.findFirst({ where: { slug, isPublished: true } });
    return content ? hideEditorHint(content) : null;
  } catch (error) {
    console.warn("Portal content unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function getPortalContentsByCategory(kategori: string) {
  try {
    const contents = await prisma.portalKonten.findMany({
      where: { kategori, isPublished: true },
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    });
    return contents.map(hideEditorHint);
  } catch (error) {
    console.warn("Portal contents unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}
