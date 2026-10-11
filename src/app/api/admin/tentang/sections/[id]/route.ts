import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { TENTANG_KATEGORI } from "@/lib/tentang-constants";

function isAllowedCategory(value: string) {
  return TENTANG_KATEGORI.some((item) => item.value === value);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const judul = String(body.judul || "").trim();
  const isi = String(body.isi || "").trim();
  const kategori = String(body.kategori || "lainnya").trim();

  if (!judul || !isi) {
    return NextResponse.json({ ok: false, message: "Judul dan isi bagian wajib diisi." }, { status: 400 });
  }
  if (!isAllowedCategory(kategori)) {
    return NextResponse.json({ ok: false, message: "Kategori bagian tidak valid." }, { status: 400 });
  }

  const existing = await prisma.tentangSection.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Bagian tidak ditemukan." }, { status: 404 });
  }

  const data = await prisma.tentangSection.update({
    where: { id },
    data: {
      kategori,
      judul,
      ringkasan: body.ringkasan !== undefined ? (body.ringkasan ? String(body.ringkasan).trim() : null) : existing.ringkasan,
      isi,
      imageUrl: body.imageUrl !== undefined ? (body.imageUrl ? String(body.imageUrl).trim() : null) : existing.imageUrl,
      isPublished: body.isPublished === undefined ? existing.isPublished : Boolean(body.isPublished),
      urutan: Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : existing.urutan,
    },
  });

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.tentangSection.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Bagian tidak ditemukan." }, { status: 404 });
  }

  await prisma.tentangSection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}