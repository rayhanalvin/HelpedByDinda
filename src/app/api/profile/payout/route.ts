import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId } });
  if (!pengajar) return NextResponse.json({ ok: false, message: "Profil pengajar tidak ditemukan." }, { status: 404 });

  return NextResponse.json({
    ok: true,
    data: {
      bankName: pengajar.bankName,
      bankAccountNumber: pengajar.bankAccountNumber,
      bankAccountName: pengajar.bankAccountName,
    },
  });
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId } });
  if (!pengajar) return NextResponse.json({ ok: false, message: "Profil pengajar tidak ditemukan." }, { status: 404 });
  const updates: {
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
  } = {};

  if (Object.prototype.hasOwnProperty.call(body, "bankName")) {
    if (body.bankName === null) {
      updates.bankName = null;
    } else if (typeof body.bankName === "string") {
      const v = body.bankName.trim();
      if (v) updates.bankName = v;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "bankAccountNumber")) {
    if (body.bankAccountNumber === null) {
      updates.bankAccountNumber = null;
    } else if (typeof body.bankAccountNumber === "string") {
      const v = body.bankAccountNumber.trim();
      if (v) updates.bankAccountNumber = v;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "bankAccountName")) {
    if (body.bankAccountName === null) {
      updates.bankAccountName = null;
    } else if (typeof body.bankAccountName === "string") {
      const v = body.bankAccountName.trim();
      if (v) updates.bankAccountName = v;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, message: "Tidak ada data yang diubah." }, { status: 400 });
  }

  const updated = await prisma.pengajar.update({
    where: { id: pengajar.id },
    data: updates,
  });

  return NextResponse.json({ ok: true, data: updated });
}
