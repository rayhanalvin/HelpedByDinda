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

async function requireAdmin() {
  const session = await getSessionUser();
  return session?.role === "ADMIN";
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const kategori = String(body.kategori || "").trim();
  const judul = String(body.judul || "").trim();
  const isi = String(body.isi || "").trim();

  if (!kategori || !judul || !isi) {
    return NextResponse.json({ ok: false, message: "Kategori, judul, dan isi wajib diisi." }, { status: 400 });
  }

  const slug = slugify(String(body.slug || judul)) || `portal-${Date.now()}`;
  const duplicate = await prisma.portalKonten.findFirst({ where: { slug, NOT: { id } } });
  if (duplicate) {
    return NextResponse.json({ ok: false, message: "Slug portal sudah digunakan." }, { status: 409 });
  }

  const data = await prisma.portalKonten.update({
    where: { id },
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

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.portalKonten.delete({ where: { id } });
  return NextResponse.json({ ok: true, message: "Konten portal berhasil dihapus." });
}
