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

const FOUNDER_NAME = "Dinda Rizky Febriyanti";
const FOUNDER_TITLE = "Founder & Academic Director";

const bannerFallbacks = new Map<string, { judul: string; ringkasan: string; isi: string }>([
  [
    "login-banner",
    {
      judul: "Bimbingan Belajar Modern dan Terarah",
      ringkasan: `${FOUNDER_NAME}||${FOUNDER_TITLE}||Bimbingan Belajar Modern dan Terarah`,
      isi: [
        "Jadwal mengajar dan absensi digital 100% transparan",
        "Akses materi video Bunny Stream dan modul latihan PDF",
        "Pembayaran praktis langsung otomatis via Midtrans Snap",
      ].join("\n"),
    },
  ],
  [
    "register-banner",
    {
      judul: "Mulai Perjalanan Belajar yang Lebih Terarah",
      ringkasan: `${FOUNDER_NAME}||${FOUNDER_TITLE}||Bangun kebiasaan belajar bersama kami`,
      isi: [
        "Jadwal mengajar dan absensi digital 100% transparan",
        "Akses materi video Bunny Stream dan modul latihan PDF",
        "Pembayaran praktis langsung otomatis via Midtrans Snap",
      ].join("\n"),
    },
  ],
]);

function stripAcademicTitle(name: string) {
  return name
    .trim()
    .replace(/\s*,\s*(S\.?\s?[A-Z][A-Za-z.&\s]*|S\.\s?[A-Z]\.?|A\.?[A-Za-z]\.?[A-Za-z]?\.?)\s*$/i, "")
    .replace(/\s+(S\.?\s?[A-Z][A-Za-z.&\s]*)$/i, "")
    .trim();
}

export function sanitizeBannerContent<T extends PortalContent>(content: T): T {
  const fallback = bannerFallbacks.get(content.slug);
  if (!fallback) return content;

  const ringkasanSegments = (content.ringkasan || fallback.ringkasan).split("||");
  const [rawName, rawTitle, rawSub] = ringkasanSegments;
  const creatorName = stripAcademicTitle(rawName || fallback.ringkasan.split("||")[0]);
  const creatorTitle = rawTitle?.trim() || FOUNDER_TITLE;
  const subTitle = rawSub?.trim() || fallback.ringkasan.split("||")[2];

  return {
    ...content,
    judul: content.judul?.trim() ? content.judul : fallback.judul,
    ringkasan: [creatorName, creatorTitle, subTitle].filter(Boolean).join("||"),
    isi: content.isi?.trim() ? content.isi : fallback.isi,
    imageUrl: content.imageUrl || null,
  };
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
    if (!content) return null;
    if (bannerFallbacks.has(slug)) return sanitizeBannerContent(hideEditorHint(content));
    return hideEditorHint(content);
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
