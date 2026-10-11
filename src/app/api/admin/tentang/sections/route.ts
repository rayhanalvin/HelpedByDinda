import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { TENTANG_KATEGORI } from "@/lib/tentang-constants";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function isAllowedCategory(value: string) {
  return TENTANG_KATEGORI.some((item) => item.value === value);
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.tentangSection.findMany({
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const kategori = String(body.kategori || "lainnya").trim();
  const judul = String(body.judul || "").trim();
  const isi = String(body.isi || "").trim();

  if (!kategori || !judul || !isi) {
    return NextResponse.json({ ok: false, message: "Kategori, judul, dan isi wajib diisi." }, { status: 400 });
  }
  if (!isAllowedCategory(kategori)) {
    return NextResponse.json({ ok: false, message: "Kategori bagian tidak valid." }, { status: 400 });
  }

  const slug = slugify(String(body.slug || judul)) || `bagian-${Date.now()}`;
  const existing = await prisma.tentangSection.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ ok: false, message: "Slug bagian sudah digunakan." }, { status: 409 });
  }

  const maxUrutan = await prisma.tentangSection.aggregate({ _max: { urutan: true } });
  const data = await prisma.tentangSection.create({
    data: {
      kategori,
      slug,
      judul,
      ringkasan: body.ringkasan ? String(body.ringkasan).trim() : null,
      isi,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
      isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
      urutan: Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : (maxUrutan._max.urutan ?? 0) + 1,
    },
  });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}