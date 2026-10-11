import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { HOME_KATEGORI } from "@/lib/home-constants";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.homeSection.findMany({
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
  const kategori = String(body.kategori || "hero").trim();
  const judul = String(body.judul || "").trim();
  const isi = String(body.isi || "").trim();

  if (!judul || !isi) {
    return NextResponse.json({ ok: false, message: "Judul dan isi wajib diisi." }, { status: 400 });
  }
  if (!HOME_KATEGORI.some((item) => item.value === kategori)) {
    return NextResponse.json({ ok: false, message: "Kategori bagian tidak valid." }, { status: 400 });
  }

  const slug = slugify(String(body.slug || judul)) || `beranda-${Date.now()}`;
  const existing = await prisma.homeSection.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ ok: false, message: "Slug bagian sudah digunakan." }, { status: 409 });
  }

  const data = await prisma.homeSection.create({
    data: {
      slug,
      kategori,
      judul,
      ringkasan: body.ringkasan ? String(body.ringkasan).trim() : null,
      isi,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
      ikon: body.ikon ? String(body.ikon).trim() : null,
      tombolTeks: body.tombolTeks ? String(body.tombolTeks).trim() : null,
      tombolLink: body.tombolLink ? String(body.tombolLink).trim() : null,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
      urutan: Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : 0,
    },
  });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}