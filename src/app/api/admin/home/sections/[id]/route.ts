import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { HOME_KATEGORI } from "@/lib/home-constants";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const existing = await prisma.homeSection.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Bagian tidak ditemukan." }, { status: 404 });
  }

  const kategori = body.kategori !== undefined ? String(body.kategori).trim() : existing.kategori;
  const judul = body.judul !== undefined ? String(body.judul).trim() : existing.judul;
  const isi = body.isi !== undefined ? String(body.isi).trim() : existing.isi;

  if (!judul || !isi) {
    return NextResponse.json({ ok: false, message: "Judul dan isi wajib diisi." }, { status: 400 });
  }
  if (!HOME_KATEGORI.some((item) => item.value === kategori)) {
    return NextResponse.json({ ok: false, message: "Kategori bagian tidak valid." }, { status: 400 });
  }

  if (body.slug !== undefined) {
    const slug = slugify(String(body.slug));
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.homeSection.findUnique({ where: { slug } });
      if (duplicate) {
        return NextResponse.json({ ok: false, message: "Slug bagian sudah digunakan." }, { status: 409 });
      }
    }
  }

  const data = await prisma.homeSection.update({
    where: { id },
    data: {
      slug: body.slug !== undefined ? (slugify(String(body.slug)) || existing.slug) : existing.slug,
      kategori,
      judul,
      ringkasan: body.ringkasan !== undefined ? (String(body.ringkasan).trim() || null) : existing.ringkasan,
      isi,
      imageUrl: body.imageUrl !== undefined ? (String(body.imageUrl).trim() || null) : existing.imageUrl,
      ikon: body.ikon !== undefined ? (String(body.ikon).trim() || null) : existing.ikon,
      tombolTeks: body.tombolTeks !== undefined ? (String(body.tombolTeks).trim() || null) : existing.tombolTeks,
      tombolLink: body.tombolLink !== undefined ? (String(body.tombolLink).trim() || null) : existing.tombolLink,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      urutan: body.urutan !== undefined ? (Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : existing.urutan) : existing.urutan,
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
  const existing = await prisma.homeSection.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Bagian tidak ditemukan." }, { status: 404 });
  }

  await prisma.homeSection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}