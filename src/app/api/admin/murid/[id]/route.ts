import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { isValidKelas } from "@/lib/kelas";

type MuridWithUser = {
  id: string;
  userId: string;
  kelas: string;
  sekolah: string;
  programId: string | null;
  programNama: string | null;
  programKategori: string | null;
  namaWali: string | null;
  phoneWali: string | null;
  paketBulanan: number;
  statusBayarBulanIni: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";
  isActive: boolean;
  idSiswa: string | null;
  pengelompokan: string | null;
  namaPanggilan: string | null;
  jurusan: string | null;
  kampus: string | null;
  alamatRumah: string | null;
  jenisKelas: string | null;
  metodeBimbel: string | null;
  jenisBimbingan: string | null;
  tanggalMulai: Date | null;
  lokasiBimbel: string | null;
  alamatBimbel: string | null;
  pengajarId: string | null;
  catatan: string | null;
  hargaPendaftaran: number | null;
  diskonPendaftaran: number | null;
  defaultPassword: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    passwordHash: string;
  };
};

const serializeMurid = (item: MuridWithUser) => ({
  id: item.id,
  userId: item.userId,
  name: item.user.name,
  email: item.user.email,
  phone: item.user.phone,
  avatarUrl: item.user.avatarUrl,
  kelas: item.kelas,
  sekolah: item.sekolah,
  programId: item.programId,
  programNama: item.programNama,
  programKategori: item.programKategori,
  namaWali: item.namaWali,
  phoneWali: item.phoneWali,
  paketBulanan: item.paketBulanan,
  statusBayarBulanIni: item.statusBayarBulanIni,
  idSiswa: item.idSiswa,
  pengelompokan: item.pengelompokan,
  namaPanggilan: item.namaPanggilan,
  jurusan: item.jurusan,
  kampus: item.kampus,
  alamatRumah: item.alamatRumah,
  jenisKelas: item.jenisKelas,
  metodeBimbel: item.metodeBimbel,
  jenisBimbingan: item.jenisBimbingan,
  tanggalMulai: item.tanggalMulai ? item.tanggalMulai.toISOString() : null,
  lokasiBimbel: item.lokasiBimbel,
  alamatBimbel: item.alamatBimbel,
  pengajarId: item.pengajarId,
  catatan: item.catatan,
  hargaPendaftaran: item.hargaPendaftaran,
  diskonPendaftaran: item.diskonPendaftaran,
  defaultPassword: item.defaultPassword,
  isActive: item.isActive,
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const murid = await prisma.murid.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!murid) {
    return NextResponse.json({ ok: false, message: "Murid tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: serializeMurid(murid as MuridWithUser) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const murid = await prisma.murid.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!murid) {
    return NextResponse.json({ ok: false, message: "Murid tidak ditemukan." }, { status: 404 });
  }

  const nextEmail = String(body.email || murid.user.email)
    .trim()
    .toLowerCase();
  if (nextEmail !== murid.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: nextEmail } });
    if (existing && existing.id !== murid.userId) {
      return NextResponse.json({ ok: false, message: "Email sudah dipakai pengguna lain." }, { status: 409 });
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: murid.userId },
    data: {
      email: nextEmail,
      name: String(body.name || murid.user.name),
      phone: String(body.phone ?? murid.user.phone ?? ""),
      avatarUrl: body.avatarUrl ? String(body.avatarUrl) : murid.user.avatarUrl,
      ...(body.password && String(body.password).trim() ? { passwordHash: await bcrypt.hash(String(body.password).trim(), 10) } : {}),
    },
  });

  const nextStatus = body.statusBayarBulanIni ? String(body.statusBayarBulanIni).toUpperCase() : murid.statusBayarBulanIni;
  const nextKelas = String(body.kelas || murid.kelas);
  if (!isValidKelas(nextKelas)) {
    return NextResponse.json({ ok: false, message: "Pilihan kelas atau semester tidak valid." }, { status: 400 });
  }

  const normalizedStatus =
    nextStatus === "PENDING" || nextStatus === "PROCESSING" || nextStatus === "SUCCESS" || nextStatus === "FAILED" || nextStatus === "EXPIRED" ? (nextStatus as MuridWithUser["statusBayarBulanIni"]) : murid.statusBayarBulanIni;

  const updatedMurid = await prisma.murid.update({
    where: { id },
    data: {
      kelas: nextKelas,
      sekolah: String(body.sekolah || murid.sekolah),
      idSiswa: body.idSiswa === undefined ? murid.idSiswa : String(body.idSiswa || "") || null,
      pengelompokan: body.pengelompokan === undefined ? murid.pengelompokan : String(body.pengelompokan || "") || null,
      namaPanggilan: body.namaPanggilan === undefined ? murid.namaPanggilan : String(body.namaPanggilan || "") || null,
      jurusan: body.jurusan === undefined ? murid.jurusan : String(body.jurusan || "") || null,
      kampus: body.kampus === undefined ? murid.kampus : String(body.kampus || "") || null,
      alamatRumah: body.alamatRumah === undefined ? murid.alamatRumah : String(body.alamatRumah || "") || null,
      jenisKelas: body.jenisKelas === undefined ? murid.jenisKelas : String(body.jenisKelas || "") || null,
      metodeBimbel: body.metodeBimbel === undefined ? murid.metodeBimbel : String(body.metodeBimbel || "") || null,
      jenisBimbingan: body.jenisBimbingan === undefined ? murid.jenisBimbingan : String(body.jenisBimbingan || "") || null,
      tanggalMulai: body.tanggalMulai === undefined ? murid.tanggalMulai : body.tanggalMulai ? new Date(body.tanggalMulai) : null,
      lokasiBimbel: body.lokasiBimbel === undefined ? murid.lokasiBimbel : String(body.lokasiBimbel || "") || null,
      alamatBimbel: body.alamatBimbel === undefined ? murid.alamatBimbel : String(body.alamatBimbel || "") || null,
      pengajarId: body.pengajarId === undefined ? murid.pengajarId : String(body.pengajarId || "") || null,
      catatan: body.catatan === undefined ? murid.catatan : String(body.catatan || "") || null,
      hargaPendaftaran: body.hargaPendaftaran === undefined ? murid.hargaPendaftaran : body.hargaPendaftaran === null ? null : Number(body.hargaPendaftaran),
      diskonPendaftaran: body.diskonPendaftaran === undefined ? murid.diskonPendaftaran : body.diskonPendaftaran === null ? null : Number(body.diskonPendaftaran),
      defaultPassword: body.password ? String(body.password) : murid.defaultPassword,
      namaWali: body.namaWali === undefined ? murid.namaWali : String(body.namaWali ?? ""),
      phoneWali: body.phoneWali === undefined ? murid.phoneWali : String(body.phoneWali ?? ""),
      paketBulanan: Number(body.paketBulanan ?? murid.paketBulanan),
      programId: body.programId === undefined ? murid.programId : String(body.programId || "") || null,
      programNama: body.programNama === undefined ? murid.programNama : String(body.programNama || "") || null,
      programKategori: body.programKategori === undefined ? murid.programKategori : String(body.programKategori || "") || null,
      statusBayarBulanIni: normalizedStatus,
      isActive: body.isActive ?? murid.isActive,
    },
    include: { user: true },
  });

  // Sync enrolled kelas
  if (body.enrolledKelas && Array.isArray(body.enrolledKelas)) {
    const enrolledKelas = (body.enrolledKelas as unknown[]).map(String).filter(Boolean);
    const primary = enrolledKelas.length ? enrolledKelas[0] : nextKelas;
    await prisma.muridKelas.deleteMany({ where: { muridId: id } });
    await prisma.muridKelas.createMany({
      data: (enrolledKelas.length ? enrolledKelas : [primary]).map((kelasValue) => ({ muridId: id, kelas: kelasValue })),
      skipDuplicates: true,
    });
    await prisma.murid.update({ where: { id }, data: { kelas: primary } });
  }

  const withKelas = await prisma.murid.findUnique({ where: { id }, include: { user: true, enrolledKelas: true } });
  const enrolledKelasData = (withKelas?.enrolledKelas || []).map((kelas) => ({
    id: kelas.id,
    kelas: kelas.kelas,
    mataPelajaran: kelas.mataPelajaran,
    programNama: kelas.programNama,
    isActive: kelas.isActive,
  }));

  return NextResponse.json({
    ok: true,
    data: serializeMurid({
      ...updatedMurid,
      user: {
        ...updatedUser,
        passwordHash: updatedUser.passwordHash,
      },
    } as MuridWithUser) as Record<string, unknown>,
    ...(enrolledKelasData.length ? { enrolledKelas: enrolledKelasData } : {}),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const murid = await prisma.murid.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!murid) {
    return NextResponse.json({ ok: false, message: "Murid tidak ditemukan." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.murid.delete({ where: { id } });
    await tx.user.delete({ where: { id: murid.userId } });
  });

  return NextResponse.json({ ok: true, deletedId: id, message: "Murid berhasil dihapus." });
}
