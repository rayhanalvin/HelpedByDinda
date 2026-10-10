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
  createdAt: Date;
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
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    id: string;
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
  namaWali: item.namaWali,
  phoneWali: item.phoneWali,
  paketBulanan: item.paketBulanan,
  statusBayarBulanIni: item.statusBayarBulanIni,
  isActive: item.isActive,
  createdAt: item.createdAt.toISOString(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const murid = await prisma.murid.findMany({
    include: { user: true, enrolledKelas: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: murid.map((item) => ({
      ...serializeMurid(item as MuridWithUser),
      enrolledKelas: (item.enrolledKelas || []).map((kelas) => ({
        id: kelas.id,
        kelas: kelas.kelas,
        mataPelajaran: kelas.mataPelajaran,
        programNama: kelas.programNama,
        isActive: kelas.isActive,
      })),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: false, message: "Email murid wajib diisi." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ ok: false, message: "Email murid sudah terdaftar." }, { status: 409 });
  }

  const kelas = String(body.kelas || "SMA10");
  if (!isValidKelas(kelas)) {
    return NextResponse.json({ ok: false, message: "Pilihan kelas atau semester tidak valid." }, { status: 400 });
  }

  const password = String(body.password || "student123");
  const hashed = await bcrypt.hash(password, 10);
  const enrolledKelas = Array.isArray(body.enrolledKelas) ? (body.enrolledKelas as unknown[]).filter(Boolean) : [];
  const primaryKelas = enrolledKelas.length ? String(enrolledKelas[0]) : kelas;
  const pengajarId = body.pengajarId ? String(body.pengajarId) : null;

  const murid = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: hashed,
        name: String(body.name || "Murid Baru"),
        phone: String(body.phone || ""),
        avatarUrl: String(body.avatarUrl || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"),
        role: "MURID",
      },
    });

    return tx.murid.create({
      data: {
        userId: user.id,
        kelas: primaryKelas,
        sekolah: String(body.sekolah || ""),
        idSiswa: body.idSiswa ? String(body.idSiswa) : null,
        pengelompokan: body.pengelompokan ? String(body.pengelompokan) : null,
        namaPanggilan: body.namaPanggilan ? String(body.namaPanggilan) : null,
        jurusan: body.jurusan ? String(body.jurusan) : null,
        kampus: body.kampus ? String(body.kampus) : null,
        alamatRumah: body.alamatRumah ? String(body.alamatRumah) : null,
        jenisKelas: body.jenisKelas ? String(body.jenisKelas) : null,
        metodeBimbel: body.metodeBimbel ? String(body.metodeBimbel) : null,
        jenisBimbingan: body.jenisBimbingan ? String(body.jenisBimbingan) : null,
        tanggalMulai: body.tanggalMulai ? new Date(body.tanggalMulai) : null,
        lokasiBimbel: body.lokasiBimbel ? String(body.lokasiBimbel) : null,
        alamatBimbel: body.alamatBimbel ? String(body.alamatBimbel) : null,
        pengajarId,
        catatan: body.catatan ? String(body.catatan) : null,
        hargaPendaftaran: body.hargaPendaftaran !== undefined && body.hargaPendaftaran !== null ? Number(body.hargaPendaftaran) : null,
        diskonPendaftaran: body.diskonPendaftaran !== undefined && body.diskonPendaftaran !== null ? Number(body.diskonPendaftaran) : null,
        defaultPassword: String(body.password || "student123"),
        namaWali: String(body.namaWali || ""),
        phoneWali: String(body.phoneWali || ""),
        paketBulanan: Number(body.paketBulanan || 900000),
        programId: body.programId ? String(body.programId) : null,
        programNama: body.programNama ? String(body.programNama) : null,
        programKategori: body.programKategori ? String(body.programKategori) : null,
        statusBayarBulanIni: "PENDING",
        isActive: true,
      },
      include: { user: true },
    });
  });

  if (enrolledKelas.length) {
    await prisma.muridKelas.createMany({
      data: (enrolledKelas as string[]).map((enrolled) => ({ muridId: murid.id, kelas: String(enrolled) })),
      skipDuplicates: true,
    });
  } else {
    await prisma.muridKelas.createMany({
      data: [{ muridId: murid.id, kelas: primaryKelas }],
      skipDuplicates: true,
    });
  }

  const withKelas = await prisma.murid.findUnique({ where: { id: murid.id }, include: { user: true, enrolledKelas: true } });
  return NextResponse.json({
    ok: true,
    data: {
      ...serializeMurid(withKelas as MuridWithUser),
      enrolledKelas: (withKelas?.enrolledKelas || []).map((kelas) => ({
        id: kelas.id,
        kelas: kelas.kelas,
        mataPelajaran: kelas.mataPelajaran,
        programNama: kelas.programNama,
        isActive: kelas.isActive,
      })),
    },
  });
}
