import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { isValidKelas } from "@/lib/kelas";
import { getCurrentPeriod, getTeachingHoursByTeacher } from "@/lib/teaching-hours";
import { isMuridPaymentUnlocked } from "@/lib/murid-guards";

export async function GET() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      pengajar: { select: { id: true, spesialisasi: true, bio: true, nominalPerJam: true, ratePerSession: true, money: true, totalJamBulanIni: true, bankName: true, bankAccountNumber: true, bankAccountName: true, rateSessions: true } },
      murid: {
        select: { id: true, kelas: true, sekolah: true, namaWali: true, phoneWali: true, paketBulanan: true, programId: true, programNama: true, programKategori: true, statusBayarBulanIni: true, onboardingComplete: true, onboardingCategory: true },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }

  if (user.pengajar) {
    const synchronizedHours = (await getTeachingHoursByTeacher(getCurrentPeriod())).get(user.pengajar.id) || 0;
    return NextResponse.json({
      ok: true,
      user: {
        ...user,
        pengajar: {
          ...user.pengajar,
          totalJamBulanIni: synchronizedHours,
          rateSessions: (user.pengajar.rateSessions || []).map((rate) => ({ kelasGroup: rate.kelasGroup, mode: rate.mode, rate: rate.ratePerSession })),
        },
      },
    });
  }

  let access = { paymentUnlocked: true };
  if (user.murid && !user.pengajar) {
    const muridId = user.murid.id;
    access = { paymentUnlocked: await isMuridPaymentUnlocked(muridId) };
  }

  return NextResponse.json({ ok: true, user, ...access });
}

export async function DELETE() {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  // Reset avatarUrl to null/empty so it falls back to the default image depending on role.
  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: null },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

export async function PUT(req: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, string | null> = {};
  const muridUpdates: {
    kelas?: string;
    sekolah?: string;
    namaWali?: string;
    phoneWali?: string;
  } = {};
  const pengajarUpdates: { spesialisasi?: string; bio?: string | null } = {};

  if (typeof body.name === "string") {
    const cleanedName = body.name.trim();
    if (cleanedName) updates.name = cleanedName;
  }

  if (typeof body.phone === "string") {
    const cleanedPhone = body.phone.trim();
    updates.phone = cleanedPhone || null;
  }

  if (typeof body.email === "string") {
    const cleaned = body.email.trim().toLowerCase();
    if (!cleaned) {
      return NextResponse.json({ ok: false, message: "Email tidak boleh kosong." }, { status: 400 });
    }

    // Ensure uniqueness of email across users
    const existing = await prisma.user.findUnique({ where: { email: cleaned } });
    if (existing && existing.id !== session.userId) {
      return NextResponse.json({ ok: false, message: "Email sudah digunakan oleh akun lain." }, { status: 409 });
    }

    updates.email = cleaned;
  }

  if (typeof body.avatarUrl === "string") {
    // Allow explicit clearing of avatar when empty string is provided.
    const cleanedAvatar = body.avatarUrl.trim();
    if (cleanedAvatar) {
      updates.avatarUrl = cleanedAvatar;
    } else if (body.avatarUrl === "") {
      updates.avatarUrl = null;
    }
  }

  if (typeof body.kelas === "string") {
    const v = body.kelas.trim();
    if (v && !isValidKelas(v)) {
      return NextResponse.json({ ok: false, message: "Pilihan kelas atau semester tidak valid." }, { status: 400 });
    }
    if (v) muridUpdates.kelas = v;
  }

  if (typeof body.sekolah === "string") {
    muridUpdates.sekolah = body.sekolah.trim();
  }

  if (typeof body.namaWali === "string") {
    muridUpdates.namaWali = body.namaWali.trim() || null;
  }

  if (typeof body.phoneWali === "string") {
    muridUpdates.phoneWali = body.phoneWali.trim() || null;
  }

  if (typeof body.spesialisasi === "string") {
    const value = body.spesialisasi.trim();
    if (!value) return NextResponse.json({ ok: false, message: "Spesialisasi tidak boleh kosong." }, { status: 400 });
    pengajarUpdates.spesialisasi = value;
  }

  if (typeof body.bio === "string") {
    pengajarUpdates.bio = body.bio.trim() || null;
  }

  if (Object.keys(updates).length === 0 && Object.keys(muridUpdates).length === 0 && Object.keys(pengajarUpdates).length === 0) {
    return NextResponse.json({ ok: false, message: "Tidak ada data yang diubah." }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: session.userId },
      data: updates,
      select: { id: true, email: true, name: true, phone: true, avatarUrl: true, role: true },
    });
    const murid = await tx.murid.findUnique({ where: { userId: session.userId } });
    const updatedMurid = murid && Object.keys(muridUpdates).length > 0 ? await tx.murid.update({ where: { id: murid.id }, data: muridUpdates }) : murid;
    const pengajar = await tx.pengajar.findUnique({ where: { userId: session.userId } });
    const updatedPengajar = pengajar && Object.keys(pengajarUpdates).length > 0 ? await tx.pengajar.update({ where: { id: pengajar.id }, data: pengajarUpdates }) : pengajar;
    return { user, murid: updatedMurid, pengajar: updatedPengajar };
  });

  return NextResponse.json({ ok: true, ...result });
}
