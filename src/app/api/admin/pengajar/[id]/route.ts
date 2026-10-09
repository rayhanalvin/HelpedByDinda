import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

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
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  rateSessions?: {
    kelasGroup: string;
    mode: "ONLINE" | "OFFLINE";
    ratePerSession: number;
  }[];
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    passwordHash: string;
  };
};

const serializePengajar = (item: PengajarWithUser) => ({
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
  totalJamBulanIni: item.totalJamBulanIni,
  bankName: item.bankName,
  bankAccountNumber: item.bankAccountNumber,
  bankAccountName: item.bankAccountName,
  rateSessions: (item.rateSessions || []).map((rate) => ({ kelasGroup: rate.kelasGroup, mode: rate.mode, rate: rate.ratePerSession })),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pengajar = await prisma.pengajar.findUnique({
    where: { id },
    include: { user: true, rateSessions: true },
  });

  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: serializePengajar(pengajar as PengajarWithUser) });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const pengajar = await prisma.pengajar.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });
  }

  const nextEmail = String(body.email || pengajar.user.email)
    .trim()
    .toLowerCase();
  if (nextEmail !== pengajar.user.email) {
    const existing = await prisma.user.findUnique({ where: { email: nextEmail } });
    if (existing && existing.id !== pengajar.userId) {
      return NextResponse.json({ ok: false, message: "Email sudah dipakai pengguna lain." }, { status: 409 });
    }
  }

  const [updatedUser, updatedPengajar] = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: pengajar.userId },
      data: {
        email: nextEmail,
        name: String(body.name || pengajar.user.name),
        phone: String(body.phone ?? pengajar.user.phone ?? ""),
        avatarUrl: body.avatarUrl ? String(body.avatarUrl) : pengajar.user.avatarUrl,
        ...(body.password && String(body.password).trim() ? { passwordHash: await bcrypt.hash(String(body.password).trim(), 10) } : {}),
      },
    });

    const teacher = await tx.pengajar.update({
      where: { id },
      data: {
        spesialisasi: String(body.spesialisasi || pengajar.spesialisasi),
        bio: body.bio === undefined ? pengajar.bio : String(body.bio ?? ""),
        nominalPerJam: Number(body.nominalPerJam ?? pengajar.nominalPerJam),
        ratePerSession: Number(body.ratePerSession ?? body.nominalPerJam ?? pengajar.ratePerSession),
        money: body.money === undefined ? pengajar.money : String(body.money || "").trim() || null,
        isActive: body.isActive ?? pengajar.isActive,
        totalJamBulanIni: Number(body.totalJamBulanIni ?? pengajar.totalJamBulanIni),
        bankName: body.bankName === undefined ? pengajar.bankName : String(body.bankName || "").trim() || null,
        bankAccountNumber: body.bankAccountNumber === undefined ? pengajar.bankAccountNumber : String(body.bankAccountNumber || "").trim() || null,
        bankAccountName: body.bankAccountName === undefined ? pengajar.bankAccountName : String(body.bankAccountName || "").trim() || null,
      },
      include: { user: true, rateSessions: true },
    });
    return [user, teacher] as const;
  });

  const rateSessions = body.rateSessions;
  if (Array.isArray(rateSessions)) {
    const existingRates = await prisma.pengajarRate.findMany({ where: { pengajarId: id } });
    const seen = new Set<string>();
    for (const rate of rateSessions) {
      if (!rate || typeof rate !== "object") continue;
      const entry = rate as Record<string, unknown>;
      const kelasGroup = String(entry.kelasGroup || "").trim();
      const mode = String(entry.mode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE";
      const rateValue = Number(entry.rate ?? entry.ratePerSession ?? 0);
      if (!kelasGroup || Number.isNaN(rateValue)) continue;
      seen.add(`${kelasGroup}|${mode}`);
      await prisma.pengajarRate.upsert({
        where: { pengajarId_kelasGroup_mode: { pengajarId: id, kelasGroup, mode } },
        create: { pengajarId: id, kelasGroup, mode, ratePerSession: rateValue },
        update: { ratePerSession: rateValue },
      });
    }
    for (const existing of existingRates) {
      if (!seen.has(`${existing.kelasGroup}|${existing.mode}`)) {
        await prisma.pengajarRate.delete({ where: { id: existing.id } });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    data: serializePengajar({
      ...updatedPengajar,
      user: {
        ...updatedUser,
        passwordHash: updatedUser.passwordHash,
      },
    } as PengajarWithUser),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pengajar = await prisma.pengajar.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.pengajar.delete({ where: { id } });
    await tx.user.delete({ where: { id: pengajar.userId } });
  });

  return NextResponse.json({ ok: true, deletedId: id, message: "Pengajar berhasil dihapus." });
}
