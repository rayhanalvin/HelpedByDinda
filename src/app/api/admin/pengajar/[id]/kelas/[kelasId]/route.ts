import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

const serializeKelas = (kelas: {
  id: string;
  namaKelas: string;
  program: string;
  jenjang: string;
  metode: string;
  jenisKelas: string;
  jumlahSiswa: number;
  feePerSiswa: number;
  isActive: boolean;
}) => ({
  ...kelas,
  totalFee: (kelas.jumlahSiswa || 0) * (kelas.feePerSiswa || 0),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; kelasId: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id, kelasId } = await params;
  const kelas = await prisma.pengajarKelas.findFirst({ where: { id: kelasId, pengajarId: id } });
  if (!kelas) {
    return NextResponse.json({ ok: false, message: "Kelas tidak ditemukan." }, { status: 404 });
  }

  const body = await req.json();
  const updated = await prisma.pengajarKelas.update({
    where: { id: kelasId },
    data: {
      namaKelas: body.namaKelas !== undefined ? String(body.namaKelas).trim() : kelas.namaKelas,
      program: body.program !== undefined ? String(body.program) : kelas.program,
      jenjang: body.jenjang !== undefined ? String(body.jenjang) : kelas.jenjang,
      metode: body.metode !== undefined ? String(body.metode) : kelas.metode,
      jenisKelas: body.jenisKelas !== undefined ? String(body.jenisKelas) : kelas.jenisKelas,
      jumlahSiswa: body.jumlahSiswa !== undefined ? Math.max(0, Number(body.jumlahSiswa) || 0) : kelas.jumlahSiswa,
      feePerSiswa: body.feePerSiswa !== undefined ? Math.max(0, Number(body.feePerSiswa) || 0) : kelas.feePerSiswa,
      isActive: body.isActive === undefined ? kelas.isActive : Boolean(body.isActive),
    },
  });

  return NextResponse.json({ ok: true, data: serializeKelas(updated) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; kelasId: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id, kelasId } = await params;
  const kelas = await prisma.pengajarKelas.findFirst({ where: { id: kelasId, pengajarId: id } });
  if (!kelas) {
    return NextResponse.json({ ok: false, message: "Kelas tidak ditemukan." }, { status: 404 });
  }

  await prisma.pengajarKelas.delete({ where: { id: kelasId } });
  return NextResponse.json({ ok: true, message: "Kelas berhasil dihapus." });
}