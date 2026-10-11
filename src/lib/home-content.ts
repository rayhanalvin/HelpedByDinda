import { prisma } from "@/lib/db";
import { HOME_FALLBACKS } from "@/lib/home-constants";

export type HomeSection = {
  id: string;
  slug: string;
  kategori: string;
  judul: string;
  ringkasan: string | null;
  isi: string;
  imageUrl: string | null;
  ikon: string | null;
  tombolTeks: string | null;
  tombolLink: string | null;
  isActive: boolean;
  urutan: number;
};

export async function getHomeSections() {
  try {
    const sections = await prisma.homeSection.findMany({
      where: { isActive: true },
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    });
    return sections.map((section) => {
      const fallback = HOME_FALLBACKS[section.slug] || {};
      return { ...section, ...fallback };
    });
  } catch (error) {
    console.warn("Home sections unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getHomeSectionByKategori(kategori: string) {
  const sections = await getHomeSections();
  return sections.find((section) => section.kategori === kategori) || null;
}