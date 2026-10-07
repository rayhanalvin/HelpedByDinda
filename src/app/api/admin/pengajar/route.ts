import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getTeachingHoursByTeacher } from "@/lib/teaching-hours";

type PengajarWithUser = {
  id: string;
  userId: string;
  spesialisasi: string;
  bio: string | null;
  nominalPerJam: number;
  isActive: boolean;
  totalJamBulanIni: number;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
};

const serializePengajar = (item: PengajarWithUser, synchronizedHours = item.totalJamBulanIni) => ({
  id: item.id,
  userId: item.userId,
  name: item.user.name,
  email: item.user.email,
  phone: item.user.phone,
  avatarUrl: item.user.avatarUrl,
  spesialisasi: item.spesialisasi,
  nominalPerJam: item.nominalPerJam,
  bio: item.bio,
  isActive: item.isActive,
  totalJamBulanIni: synchronizedHours,
  bankName: item.bankName,
  bankAccountNumber: item.bankAccountNumber,
  bankAccountName: item.bankAccountName,
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const pengajar = await prisma.pengajar.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  const hoursByTeacher = await getTeachingHoursByTeacher(getCurrentPeriod());

  return NextResponse.json(
    {
      ok: true,
      data: pengajar.map((item) => serializePengajar(item as PengajarWithUser, hoursByTeacher.get(item.id) || 0)),
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
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
    return NextResponse.json({ ok: false, message: "Email pengajar wajib diisi." }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ ok: false, message: "Email pengajar sudah terdaftar." }, { status: 409 });
  }

  const password = String(body.password || "teacher123");
  const hashed = await bcrypt.hash(password, 10);

  const pengajar = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: hashed,
        name: String(body.name || "Pengajar Baru"),
        phone: String(body.phone || ""),
        avatarUrl: String(body.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"),
        role: "PENGAJAR",
      },
    });

    return tx.pengajar.create({
      data: {
        userId: user.id,
        spesialisasi: String(body.spesialisasi || "Umum"),
        bio: String(body.bio || ""),
        nominalPerJam: Number(body.nominalPerJam || 75000),
        isActive: true,
        totalJamBulanIni: Number(body.totalJamBulanIni || 0),
        bankName: String(body.bankName || "").trim() || null,
        bankAccountNumber: String(body.bankAccountNumber || "").trim() || null,
        bankAccountName: String(body.bankAccountName || "").trim() || null,
      },
      include: { user: true },
    });
  });

  return NextResponse.json({ ok: true, data: serializePengajar(pengajar as PengajarWithUser) });
}
