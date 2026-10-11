import { prisma } from "@/lib/db";

export type TentangSection = {
  id: string;
  slug: string;
  kategori: string;
  judul: string;
  ringkasan: string | null;
  isi: string;
  imageUrl: string | null;
  isPublished: boolean;
  urutan: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TentangStatistik = {
  id: string;
  label: string;
  nilai: string;
  ikon: string;
  urutan: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getTentangSections() {
  try {
    const contents = await prisma.tentangSection.findMany({
      where: { isPublished: true },
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    });
    return contents;
  } catch (error) {
    console.warn("Tentang sections unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getTentangStatistik() {
  try {
    const statistics = await prisma.tentangStatistik.findMany({
      orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
    });
    return statistics;
  } catch (error) {
    console.warn("Tentang statistics unavailable:", error instanceof Error ? error.message : error);
    return [];
  }
}