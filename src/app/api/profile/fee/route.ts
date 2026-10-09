import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getTeachingHoursByTeacher } from "@/lib/teaching-hours";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId } });

  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Profil pengajar tidak ditemukan." }, { status: 404 });
  }

  const fees = await prisma.fee.findMany({
    where: {
      pengajarId: pengajar.id,
    },
    orderBy: [{ createdAt: "desc" }],
  });
  const payouts = await prisma.feePayout.findMany({
    where: { pengajarId: pengajar.id },
    orderBy: [{ periodStart: "desc" }],
  });

  return NextResponse.json({
    ok: true,
    data: fees.map((fee) => ({
      id: fee.id,
      pengajarId: fee.pengajarId,
      pengajarNama: "",
      periode: fee.periode,
      totalJam: fee.totalJam,
      nominalPerJam: fee.nominalPerJam,
      totalFee: fee.totalFee,
      status: fee.status,
      teacherBankName: fee.payoutBankName ?? pengajar.bankName,
      teacherAccountNumber: fee.payoutAccountNumber ?? pengajar.bankAccountNumber,
      teacherAccountName: fee.payoutAccountName ?? pengajar.bankAccountName,
      payoutMethod: fee.payoutMethod,
      payoutReference: fee.payoutReference,
      paymentProofData: fee.paymentProofData,
      paymentProofName: fee.paymentProofName,
      paymentProofMimeType: fee.paymentProofMimeType,
      paymentProofUploadedAt: fee.paymentProofUploadedAt,
      paidAt: fee.paidAt,
    })),
    payouts: payouts.map((payout) => ({
      id: payout.id,
      periodType: payout.periodType,
      periodKey: payout.periodKey,
      periodLabel: payout.periodLabel,
      periodStart: payout.periodStart,
      periodEnd: payout.periodEnd,
      totalJam: payout.totalJam,
      nominalPerJam: payout.nominalPerJam,
      totalFee: payout.totalFee,
      manualTotalFee: payout.manualTotalFee,
      status: payout.status,
      paidAt: payout.paidAt,
      payoutMethod: payout.payoutMethod,
      payoutReference: payout.payoutReference,
    })),
  });
}
