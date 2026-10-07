import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getTeachingHoursByTeacher } from "@/lib/teaching-hours";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const requestedPeriode = new URL(req.url).searchParams.get("periode");
  const periode = requestedPeriode && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriode) ? requestedPeriode : null;

  const fees = await prisma.fee.findMany({
    where: periode ? { periode } : undefined,
    orderBy: { createdAt: "desc" },
    include: { pengajar: { include: { user: { select: { name: true, email: true } } } } },
  });
  const hoursByTeacher = await getTeachingHoursByTeacher(periode || getCurrentPeriod());

  return NextResponse.json({
    ok: true,
    data: fees.map((fee) => ({
      id: fee.id,
      pengajarId: fee.pengajarId,
      pengajarNama: fee.pengajar.user.name,
      email: fee.pengajar.user.email,
      periode: fee.periode,
      totalJam: hoursByTeacher.get(fee.pengajarId) || 0,
      nominalPerJam: fee.nominalPerJam,
      totalFee: fee.periode === (periode || getCurrentPeriod()) ? (hoursByTeacher.get(fee.pengajarId) || 0) * fee.nominalPerJam : fee.totalFee,
      status: fee.status,
      payoutMethod: fee.payoutMethod,
      payoutBankName: fee.payoutBankName,
      payoutAccountNumber: fee.payoutAccountNumber,
      payoutAccountName: fee.payoutAccountName,
      payoutReference: fee.payoutReference,
      paymentProofData: fee.paymentProofData,
      paymentProofName: fee.paymentProofName,
      paymentProofMimeType: fee.paymentProofMimeType,
      paymentProofUploadedAt: fee.paymentProofUploadedAt,
      paidAt: fee.paidAt,
      // Effective payout info: prefer fee snapshot (payout*) when present,
      // otherwise fall back to current pengajar profile values.
      teacherBankName: fee.payoutBankName ?? fee.pengajar?.bankName ?? null,
      teacherAccountNumber: fee.payoutAccountNumber ?? fee.pengajar?.bankAccountNumber ?? null,
      teacherAccountName: fee.payoutAccountName ?? fee.pengajar?.bankAccountName ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const requestedPeriode = new URL(req.url).searchParams.get("periode");
  const periode = requestedPeriode && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriode) ? requestedPeriode : new Date().toISOString().slice(0, 7);
  const teachers = await prisma.pengajar.findMany({ where: { isActive: true } });

  for (const teacher of teachers) {
    const existing = await prisma.fee.findFirst({ where: { pengajarId: teacher.id, periode } });
    if (existing) continue;

    const totalJam = (await getTeachingHoursByTeacher(periode)).get(teacher.id) || 0;
    await prisma.fee.create({
      data: {
        pengajarId: teacher.id,
        periode,
        totalJam,
        nominalPerJam: teacher.nominalPerJam,
        totalFee: totalJam * teacher.nominalPerJam,
        status: "PENDING",
      },
    });
  }

  return NextResponse.json({ ok: true, message: "Rekap fee berhasil dibuat." });
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const fee = await prisma.fee.findUnique({ where: { id: String(body.id || "") }, include: { pengajar: true } });
  if (!fee) return NextResponse.json({ ok: false, message: "Fee tidak ditemukan." }, { status: 404 });

  const payoutMethod = String(body.payoutMethod || "BANK_TRANSFER").toUpperCase();
  if (payoutMethod !== "BANK_TRANSFER") return NextResponse.json({ ok: false, message: "Pembayaran fee hanya tersedia melalui transfer bank." }, { status: 400 });

  const updated = await prisma.fee.update({
    where: { id: fee.id },
    data: {
      status: "PAID",
      paidAt: body.paidAt ? new Date(String(body.paidAt)) : new Date(),
      payoutMethod,
      // snapshot the pengajar payout info at the time of payment
      payoutBankName: fee.pengajar.bankName,
      payoutAccountNumber: fee.pengajar.bankAccountNumber,
      payoutAccountName: fee.pengajar.bankAccountName,
      payoutReference: String(body.payoutReference || "").trim() || null,
    },
  });

  return NextResponse.json({ ok: true, data: updated });
}
