import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { namaUjian, mataPelajaran, kelasSasaran, tanggal, jam, deskripsi, lokasi, pengajarId, pengajarNama, isPublished } = body;

  const existing = await prisma.ujian.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, message: "Ujian tidak ditemukan." }, { status: 404 });

  if (!namaUjian || !mataPelajaran || !kelasSasaran || !tanggal || !jam) {
    return NextResponse.json({ ok: false, message: "Nama ujian, mata pelajaran, kelas sasaran, tanggal, dan jam wajib diisi." }, { status: 400 });
  }

  const parsedDate = new Date(String(tanggal));
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ ok: false, message: "Tanggal tidak valid." }, { status: 400 });
  }

  let finalPengajarId = existing.pengajarId;
  let finalPengajarNama = String(pengajarNama || existing.pengajarNama).trim();
  if (pengajarId && String(pengajarId) !== existing.pengajarId) {
    const pengajar = await prisma.pengajar.findUnique({
      where: { id: String(pengajarId) },
      select: { id: true, user: { select: { name: true } } },
    });
    finalPengajarId = pengajar?.id || null;
    finalPengajarNama = finalPengajarNama || pengajar?.user.name || existing.pengajarNama;
  }

  const ujian = await prisma.ujian.update({
    where: { id },
    data: {
      namaUjian: String(namaUjian).trim(),
      mataPelajaran: String(mataPelajaran).trim(),
      kelasSasaran: String(kelasSasaran),
      tanggal: parsedDate,
      jam: String(jam).trim(),
      deskripsi: String(deskripsi || existing.deskripsi).trim(),
      lokasi: String(lokasi || existing.lokasi).trim(),
      pengajarId: finalPengajarId,
      pengajarNama: finalPengajarNama,
      isPublished: Boolean(isPublished),
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: ujian.id,
      namaUjian: ujian.namaUjian,
      mataPelajaran: ujian.mataPelajaran,
      kelasSasaran: ujian.kelasSasaran,
      tanggal: ujian.tanggal.toISOString().split("T")[0],
      jam: ujian.jam,
      deskripsi: ujian.deskripsi,
      lokasi: ujian.lokasi,
      pengajarId: ujian.pengajarId,
      pengajarNama: ujian.pengajarNama,
      isPublished: ujian.isPublished,
    },
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.ujian.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, message: "Ujian tidak ditemukan." }, { status: 404 });

  await prisma.ujian.delete({ where: { id } });
  return NextResponse.json({ ok: true, message: "Ujian berhasil dihapus." });
}