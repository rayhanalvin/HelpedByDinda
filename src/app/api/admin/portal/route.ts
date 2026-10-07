import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

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

  const data = await prisma.portalKonten.findMany({
    orderBy: [{ kategori: "asc" }, { urutan: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const kategori = String(body.kategori || "").trim();
  const judul = String(body.judul || "").trim();
  const isi = String(body.isi || "").trim();

  if (!kategori || !judul || !isi) {
    return NextResponse.json({ ok: false, message: "Kategori, judul, dan isi wajib diisi." }, { status: 400 });
  }

  const slug = slugify(String(body.slug || judul)) || `portal-${Date.now()}`;
  const existing = await prisma.portalKonten.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ ok: false, message: "Slug portal sudah digunakan." }, { status: 409 });
  }

  const data = await prisma.portalKonten.create({
    data: {
      kategori,
      slug,
      judul,
      ringkasan: body.ringkasan ? String(body.ringkasan).trim() : null,
      isi,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
      isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
      urutan: Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : 0,
    },
  });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
