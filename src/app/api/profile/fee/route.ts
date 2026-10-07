import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getTeachingHoursByTeacher } from "@/lib/teaching-hours";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const requestedPeriode = new URL(req.url).searchParams.get("periode");
  const periode = requestedPeriode && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriode) ? requestedPeriode : undefined;
  const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId } });

  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Profil pengajar tidak ditemukan." }, { status: 404 });
  }

  const fees = await prisma.fee.findMany({
    where: {
      pengajarId: pengajar.id,
      ...(periode ? { periode } : {}),
    },
    orderBy: [{ periode: "desc" }, { createdAt: "desc" }],
  });
  const hoursByTeacher = await getTeachingHoursByTeacher(periode || getCurrentPeriod());
  const synchronizedHours = hoursByTeacher.get(pengajar.id) || 0;

  return NextResponse.json({
    ok: true,
    data: fees.map((fee) => ({
      id: fee.id,
      pengajarId: fee.pengajarId,
      pengajarNama: "",
      periode: fee.periode,
      totalJam: fee.periode === (periode || getCurrentPeriod()) ? synchronizedHours : fee.totalJam,
      nominalPerJam: fee.nominalPerJam,
      totalFee: fee.periode === (periode || getCurrentPeriod()) ? synchronizedHours * fee.nominalPerJam : fee.totalFee,
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
  });
}
