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
  ratePerSession: number;
  money: string | null;
  isActive: boolean;
  totalJamBulanIni: number;
  createdAt: Date;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  rateSessions?: {
    kelasGroup: string;
    mode: "ONLINE" | "OFFLINE";
    ratePerSession: number;
  }[];
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
  ratePerSession: item.ratePerSession,
  money: item.money,
  bio: item.bio,
  isActive: item.isActive,
  totalJamBulanIni: synchronizedHours,
  createdAt: item.createdAt.toISOString(),
  bankName: item.bankName,
  bankAccountNumber: item.bankAccountNumber,
  bankAccountName: item.bankAccountName,
  rateSessions: (item.rateSessions || []).map((rate) => ({ kelasGroup: rate.kelasGroup, mode: rate.mode, rate: rate.ratePerSession })),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const pengajar = await prisma.pengajar.findMany({
    include: { user: true, rateSessions: true },
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
        ratePerSession: Number(body.ratePerSession ?? body.nominalPerJam ?? 75000),
        money: body.money === undefined ? null : String(body.money || "").trim() || null,
        isActive: true,
        totalJamBulanIni: Number(body.totalJamBulanIni || 0),
        bankName: String(body.bankName || "").trim() || null,
        bankAccountNumber: String(body.bankAccountNumber || "").trim() || null,
        bankAccountName: String(body.bankAccountName || "").trim() || null,
      },
      include: { user: true },
    });
  });

  const rateSessions = body.rateSessions;

  if (Array.isArray(rateSessions)) {
    for (const rate of rateSessions) {
      if (!rate || typeof rate !== "object") continue;
      const entry = rate as Record<string, unknown>;
      const kelasGroup = String(entry.kelasGroup || "").trim();
      const mode = String(entry.mode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE";
      const rateValue = Number(entry.rate ?? entry.ratePerSession ?? 0);
      if (!kelasGroup || Number.isNaN(rateValue)) continue;
      await prisma.pengajarRate.upsert({
        where: { pengajarId_kelasGroup_mode: { pengajarId: pengajar.id, kelasGroup, mode } },
        create: { pengajarId: pengajar.id, kelasGroup, mode, ratePerSession: rateValue },
        update: { ratePerSession: rateValue },
      });
    }
  }

  return NextResponse.json({ ok: true, data: serializePengajar(pengajar as PengajarWithUser) });
}
