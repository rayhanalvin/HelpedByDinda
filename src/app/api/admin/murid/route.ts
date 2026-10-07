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
  user: {
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
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
  isActive: item.isActive,
  createdAt: item.createdAt.toISOString(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const murid = await prisma.murid.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: murid.map((item) => serializeMurid(item as MuridWithUser)),
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
        kelas,
        sekolah: String(body.sekolah || ""),
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

  return NextResponse.json({ ok: true, data: serializeMurid(murid as MuridWithUser) });
}
