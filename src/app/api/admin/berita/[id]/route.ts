import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.berita.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ ok: false, message: "Berita tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: item });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const judul = String(body.judul || "").trim();
  const isi = String(body.isi || "").trim();

  if (!judul || !isi) {
    return NextResponse.json({ ok: false, message: "Judul dan isi berita wajib diisi." }, { status: 400 });
  }

  const slug =
    String(body.slug || judul)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120) || `berita-${Date.now()}`;

  const item = await prisma.berita.update({
    where: { id },
    data: {
      judul,
      slug,
      ringkasan: body.ringkasan ? String(body.ringkasan) : isi.slice(0, 180),
      isi,
      thumbnailUrl: body.thumbnailUrl === null ? null : body.thumbnailUrl ? String(body.thumbnailUrl) : undefined,
      kategori: body.kategori ? String(body.kategori) : undefined,
      authorName: body.authorName ? String(body.authorName) : undefined,
      isPublished: body.isPublished === undefined ? undefined : Boolean(body.isPublished),
    },
  });

  return NextResponse.json({ ok: true, data: item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.berita.delete({ where: { id } });

  return NextResponse.json({ ok: true, message: "Berita berhasil dihapus." });
}
