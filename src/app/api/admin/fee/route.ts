import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getTeachingSessionsByTeacher } from "@/lib/teaching-hours";
import { normalizeRateSessions, resolvePengajarRate } from "@/lib/pengajar-rates";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const requestedPeriode = new URL(req.url).searchParams.get("periode");
  const periode = requestedPeriode && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriode) ? requestedPeriode : null;

  const fees = await prisma.fee.findMany({
    where: periode ? { periode } : undefined,
    orderBy: { createdAt: "desc" },
    include: { pengajar: { include: { user: { select: { name: true, email: true } }, rateSessions: true, kelas: { where: { isActive: true } } } } },
  });
  const hoursByTeacher = await getTeachingSessionsByTeacher(periode || getCurrentPeriod());

  return NextResponse.json({
    ok: true,
    data: fees.map((fee) => {
      const sessions = hoursByTeacher.sessionsByTeacher.get(fee.pengajarId) || [];
      const fallbackRate = fee.pengajar.ratePerSession ?? fee.pengajar.nominalPerJam;
      const totalFeeCurrent = sessions.reduce((sum, session) => sum + resolvePengajarRate(normalizeRateSessions(fee.pengajar.rateSessions), fallbackRate, { kelasGroup: session.kelasGroup, mode: session.mode }), 0);
      return {
        id: fee.id,
        pengajarId: fee.pengajarId,
        pengajarNama: fee.pengajar.user.name,
        email: fee.pengajar.user.email,
        periode: fee.periode,
        totalJam: sessions.length,
        nominalPerJam: fee.nominalPerJam,
        ratePerSession: fallbackRate,
        rateSessions: (fee.pengajar.rateSessions || []).map((rate) => ({ kelasGroup: rate.kelasGroup, mode: rate.mode, rate: rate.ratePerSession })),
          totalFee: totalFeeCurrent,
        totalFeeKelasBulanan: (fee.pengajar.kelas || []).reduce((sum, kelas) => sum + (kelas.jumlahSiswa || 0) * (kelas.feePerSiswa || 0), 0),
        jumlahKelasDiampu: fee.pengajar.kelas?.length || 0,
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
        teacherBankName: fee.payoutBankName ?? fee.pengajar?.bankName ?? null,
        teacherAccountNumber: fee.payoutAccountNumber ?? fee.pengajar?.bankAccountNumber ?? null,
        teacherAccountName: fee.payoutAccountName ?? fee.pengajar?.bankAccountName ?? null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const requestedPeriode = new URL(req.url).searchParams.get("periode");
  const periode = requestedPeriode && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriode) ? requestedPeriode : new Date().toISOString().slice(0, 7);
  const teachers = await prisma.pengajar.findMany({ where: { isActive: true }, include: { rateSessions: true } });

  for (const teacher of teachers) {
    const existing = await prisma.fee.findFirst({ where: { pengajarId: teacher.id, periode } });
    if (existing) continue;

    const sessions = await getTeachingSessionsByTeacher(periode, [teacher.id]);
    const teacherSessions = sessions.sessionsByTeacher.get(teacher.id) || [];
    const totalJam = teacherSessions.length;
    const fallbackRate = teacher.ratePerSession ?? teacher.nominalPerJam;
    const totalFee = teacherSessions.reduce((sum, session) => sum + resolvePengajarRate(normalizeRateSessions(teacher.rateSessions), fallbackRate, { kelasGroup: session.kelasGroup, mode: session.mode }), 0);
    await prisma.fee.create({
      data: {
        pengajarId: teacher.id,
        periode,
        totalJam,
        nominalPerJam: fallbackRate,
        totalFee: totalFee > 0 ? totalFee : totalJam * fallbackRate,
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
  const fee = await prisma.fee.findUnique({ where: { id: String(body.id || "") }, include: { pengajar: { include: { user: { select: { name: true } } } } } });
  if (!fee) return NextResponse.json({ ok: false, message: "Fee tidak ditemukan." }, { status: 404 });

  const payoutMethod = String(body.payoutMethod || "BANK_TRANSFER").toUpperCase();
  if (payoutMethod !== "BANK_TRANSFER") return NextResponse.json({ ok: false, message: "Pembayaran fee hanya tersedia melalui transfer bank." }, { status: 400 });

  const paidAt = body.paidAt ? new Date(String(body.paidAt)) : new Date();
  const payoutReference = String(body.payoutReference || "").trim() || null;

  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.fee.update({
      where: { id: fee.id },
      data: {
        status: "PAID",
        paidAt,
        payoutMethod,
        // snapshot the pengajar payout info at the time of payment
        payoutBankName: fee.pengajar.bankName,
        payoutAccountNumber: fee.pengajar.bankAccountNumber,
        payoutAccountName: fee.pengajar.bankAccountName,
        payoutReference,
      },
    });

    const existingTransaction = await transaction.financeTransaction.findFirst({
      where: { keterangan: { contains: fee.periode } },
    });
    if (!existingTransaction) {
      await transaction.financeTransaction.create({
        data: {
          tanggal: paidAt,
          tipe: "pengeluaran",
          kategori: "fee_pengajar",
          keterangan: `Fee Honor Mengajar - ${fee.pengajar.user?.name || fee.pengajarId} Periode ${fee.periode}${payoutReference ? `, Ref: ${payoutReference}` : ""}`,
          jumlah: fee.totalFee,
          status: "dibayar",
        },
      });
    }
    // Sinkronkan status ke tracking FeePayout bulanan agar tampilan pengajar konsisten
    await transaction.feePayout.updateMany({
      where: { pengajarId: fee.pengajarId, periodType: "MONTHLY", periodKey: fee.periode },
      data: { status: "PAID", paidAt: result.paidAt ?? paidAt, payoutMethod: result.payoutMethod, payoutReference: result.payoutReference, totalFee: result.totalFee },
    });
    return result;
  });

  return NextResponse.json({ ok: true, data: updated, financeSynced: true });
}
