import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getTeachingSessionsByTeacher } from "@/lib/teaching-hours";
import { getKelasGroup } from "@/lib/kelas";
import { normalizeRateSessions, resolvePengajarRate } from "@/lib/pengajar-rates";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, include: { rateSessions: true } });

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
  const fallbackRate = pengajar.ratePerSession ?? pengajar.nominalPerJam;
  const rateValues = normalizeRateSessions(pengajar.rateSessions);
  const currentPeriod = getCurrentPeriod();
  const sessions = await getTeachingSessionsByTeacher(currentPeriod, [pengajar.id]);
  const pengajarSessions = sessions.sessionsByTeacher.get(pengajar.id) || [];
  const totalJamLive = pengajarSessions.length;
  const totalFeeLive = pengajarSessions.reduce(
    (sum, session) => sum + resolvePengajarRate(rateValues, fallbackRate, { kelasGroup: session.kelasGroup, mode: session.mode }),
    0,
  );
  const attendance = await prisma.absensi.findMany({
    where: {
      jadwalId: { in: pengajarSessions.map((session) => session.id) },
      userId: pengajar.userId,
    },
    select: {
      id: true,
      tanggal: true,
      status: true,
      startedAt: true,
      finishedAt: true,
      mataPelajaran: true,
      jadwal: { select: { murid: { select: { kelas: true } }, mode: true } },
    },
    orderBy: [{ tanggal: "desc" }],
  });
  const kelasList = await prisma.pengajarKelas.findMany({
    where: { pengajarId: pengajar.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  const feeKelasBulanan = kelasList.reduce((sum, kelas) => sum + (kelas.jumlahSiswa || 0) * (kelas.feePerSiswa || 0), 0);
  const jumlahSiswaKelas = kelasList.reduce((sum, kelas) => sum + (kelas.jumlahSiswa || 0), 0);
  const activeFee = fees.find((fee) => fee.periode === currentPeriod) || null;
  const fallbackFeeTotal = activeFee ? activeFee.totalFee : totalFeeLive;
  // Skema admin: fee bulanan dihitung dari jumlah siswa × fee per siswa per kelas
  const totalFeePerStudent = feeKelasBulanan > 0 ? feeKelasBulanan : fallbackFeeTotal;

  return NextResponse.json({
    ok: true,
    currentPeriod,
    periode: currentPeriod,
    totalJam: totalJamLive,
    totalFee: totalFeePerStudent,
    feeKelasBulanan,
    jumlahSiswaKelas,
    kelasBulanan: kelasList.map((kelas) => ({
      id: kelas.id,
      namaKelas: kelas.namaKelas,
      program: kelas.program,
      jenjang: kelas.jenjang,
      metode: kelas.metode,
      jenisKelas: kelas.jenisKelas,
      jumlahSiswa: kelas.jumlahSiswa,
      feePerSiswa: kelas.feePerSiswa,
      totalFee: (kelas.jumlahSiswa || 0) * (kelas.feePerSiswa || 0),
    })),
    ratePerSession: fallbackRate,
    rateSessions: (pengajar.rateSessions || []).map((rate) => ({ kelasGroup: rate.kelasGroup, mode: rate.mode, rate: rate.ratePerSession })),
    data: fees.map((fee) => ({
      id: fee.id,
      pengajarId: fee.pengajarId,
      pengajarNama: "",
      periode: fee.periode,
      totalJam: fee.periode === currentPeriod ? totalJamLive : fee.totalJam,
      nominalPerJam: fee.nominalPerJam,
      ratePerSession: fallbackRate,
      totalFee: fee.periode === currentPeriod ? totalFeePerStudent : fee.totalFee,
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
    monthlyStatus: activeFee?.status || "PENDING",
    monthlyPaidAt: activeFee?.paidAt ? activeFee.paidAt.toISOString() : null,
    monthlyPayoutReference: activeFee?.payoutReference || null,
    monthlyPayoutMethod: activeFee?.payoutMethod || null,
    paymentProofData: activeFee?.paymentProofData || null,
    paymentProofName: activeFee?.paymentProofName || null,
    paymentProofMimeType: activeFee?.paymentProofMimeType || null,
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
    attendance: attendance.map((entry) => ({
      id: entry.id,
      tanggal: entry.tanggal.toISOString(),
      mataPelajaran: entry.mataPelajaran,
      status: entry.status,
      startedAt: entry.startedAt?.toISOString() || null,
      finishedAt: entry.finishedAt?.toISOString() || null,
      kelasGroup: getKelasGroup(entry.jadwal?.murid?.kelas),
      mode: entry.jadwal?.mode === "OFFLINE" ? "OFFLINE" : "ONLINE",
      rate: resolvePengajarRate(rateValues, fallbackRate, { kelasGroup: getKelasGroup(entry.jadwal?.murid?.kelas), mode: entry.jadwal?.mode === "OFFLINE" ? "OFFLINE" : "ONLINE" }),
    })),
  });
}
