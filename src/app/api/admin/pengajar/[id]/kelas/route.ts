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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pengajar = await prisma.pengajar.findUnique({ where: { id } });
  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });
  }

  const kelasList = await prisma.pengajarKelas.findMany({
    where: { pengajarId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, data: kelasList.map(serializeKelas) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pengajar = await prisma.pengajar.findUnique({ where: { id } });
  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });
  }

  const body = await req.json();
  const namaKelas = String(body.namaKelas || "").trim();
  if (!namaKelas) {
    return NextResponse.json({ ok: false, message: "Nama kelas wajib diisi." }, { status: 400 });
  }

  const jumlahSiswa = Math.max(0, Number(body.jumlahSiswa) || 0);
  const feePerSiswa = Math.max(0, Number(body.feePerSiswa) || 0);

  const kelas = await prisma.pengajarKelas.create({
    data: {
      pengajarId: id,
      namaKelas,
      program: String(body.program || "Reguler"),
      jenjang: String(body.jenjang || "SMA_SMK"),
      metode: String(body.metode || "ONLINE"),
      jenisKelas: String(body.jenisKelas || "PRIVATE"),
      jumlahSiswa,
      feePerSiswa,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    },
  });

  return NextResponse.json({ ok: true, data: serializeKelas(kelas) }, { status: 201 });
}