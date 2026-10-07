import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const berita = await prisma.berita.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, data: berita });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const judul = String(body.judul || "").trim();
  const isi = String(body.isi || "").trim();

  if (!judul || !isi) {
    return NextResponse.json({ ok: false, message: "Judul dan isi berita wajib diisi." }, { status: 400 });
  }

  const slug = String(body.slug || judul)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  const item = await prisma.berita.create({
    data: {
      judul,
      slug: slug || `berita-${Date.now()}`,
      ringkasan: body.ringkasan ? String(body.ringkasan) : isi.slice(0, 180),
      isi,
      thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl) : null,
      kategori: body.kategori ? String(body.kategori) : "Umum",
      authorName: body.authorName ? String(body.authorName) : "Helped By Dinda",
      isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
    },
  });

  return NextResponse.json({ ok: true, data: item });
}
