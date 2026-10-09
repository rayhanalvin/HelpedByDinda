import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { feePeriodRange, getFeePeriodWindow, getReferenceDate, type FeePeriodType } from "@/lib/fee-periods";
import { getTeachingHoursByTeacherRange } from "@/lib/teaching-hours";

function getPeriodType(value: string | null): FeePeriodType {
  return value === "WEEKLY" ? "WEEKLY" : value === "CUSTOM" ? "CUSTOM" : "MONTHLY";
}

async function synchronizePayouts(type: FeePeriodType, referenceDate: Date, manualNominal?: number | null, manualTotalFee?: number | null, customRange?: ReturnType<typeof feePeriodRange>) {
  const period = customRange || getFeePeriodWindow(type, referenceDate);
  const [teachers, hoursByTeacher] = await Promise.all([
    prisma.pengajar.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true, email: true } } },
    }),
    getTeachingHoursByTeacherRange(period.start, period.end),
  ]);

  for (const teacher of teachers) {
    const totalJam = hoursByTeacher.get(teacher.id) || 0;
    const monthlyFee = type === "MONTHLY" ? await prisma.fee.findFirst({ where: { pengajarId: teacher.id, periode: period.key } }) : null;
    const nominalPerJam = manualNominal ?? monthlyFee?.nominalPerJam ?? teacher.nominalPerJam;
    const totalFee = manualTotalFee ?? (manualNominal ? totalJam * manualNominal : totalJam * nominalPerJam);

    await prisma.feePayout.upsert({
      where: { pengajarId_periodType_periodKey: { pengajarId: teacher.id, periodType: type, periodKey: period.key } },
      create: {
        pengajarId: teacher.id,
        periodType: type,
        periodKey: period.key,
        periodLabel: customRange ? `Kustom ${customRange.start.toISOString().slice(0, 10)} - ${customRange.end.toISOString().slice(0, 10)}` : null,
        periodStart: period.start,
        periodEnd: period.end,
        totalJam,
        nominalPerJam,
        totalFee,
        manualTotalFee: manualTotalFee && manualTotalFee > 0 ? manualTotalFee : null,
        status: monthlyFee?.status || "PENDING",
        paidAt: monthlyFee?.paidAt || null,
        payoutMethod: monthlyFee?.payoutMethod || null,
        payoutReference: monthlyFee?.payoutReference || null,
      },
      update: {
        periodStart: period.start,
        periodEnd: period.end,
        totalJam,
        nominalPerJam,
        totalFee: manualTotalFee && manualTotalFee > 0 ? manualTotalFee : totalFee,
        manualTotalFee: manualTotalFee && manualTotalFee > 0 ? manualTotalFee : null,
        ...(manualNominal !== null && manualNominal !== undefined ? { nominalPerJam: manualNominal } : {}),
        ...(monthlyFee ? { status: monthlyFee.status, paidAt: monthlyFee.paidAt, payoutMethod: monthlyFee.payoutMethod, payoutReference: monthlyFee.payoutReference } : {}),
      },
    });
  }

  return { period, teachers };
}

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(req.url).searchParams;
  const type = getPeriodType(searchParams.get("periodType"));
  const referenceDate = getReferenceDate(searchParams.get("date"));
  const customRange = type === "CUSTOM" ? feePeriodRange(type, searchParams.get("start"), searchParams.get("end")) : null;
  const manualNominalRaw = searchParams.get("nominalPerJam");
  const manualTotalRaw = searchParams.get("manualTotalFee");
  const manualNominal = manualNominalRaw && !Number.isNaN(Number(manualNominalRaw)) ? Number(manualNominalRaw) : null;
  const manualTotalFee = manualTotalRaw && !Number.isNaN(Number(manualTotalRaw)) ? Number(manualTotalRaw) : null;
  const { period } = await synchronizePayouts(type, referenceDate, manualNominal, manualTotalFee, customRange);
  const payouts = await prisma.feePayout.findMany({
    where: { periodType: type, periodKey: period.key },
    orderBy: { createdAt: "asc" },
    include: {
      pengajar: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return NextResponse.json(
    {
      ok: true,
      period: { type, key: period.key, start: period.start, end: period.end },
      data: payouts.map((payout) => ({
        id: payout.id,
        pengajarId: payout.pengajarId,
        pengajarNama: payout.pengajar.user.name,
        email: payout.pengajar.user.email,
        periodType: payout.periodType,
        periodKey: payout.periodKey,
        periodLabel: payout.periodLabel,
        totalJam: payout.totalJam,
        nominalPerJam: payout.nominalPerJam,
        totalFee: payout.totalFee,
        manualTotalFee: payout.manualTotalFee,
        status: payout.status,
        paidAt: payout.paidAt,
        payoutMethod: payout.payoutMethod,
        payoutReference: payout.payoutReference,
        bankName: payout.pengajar.bankName,
        accountName: payout.pengajar.bankAccountName,
        accountNumber: payout.pengajar.bankAccountNumber,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ ok: false, message: "ID tracking fee wajib diisi." }, { status: 400 });
  const payoutMethod = String(body.payoutMethod || "BANK_TRANSFER").toUpperCase();
  if (payoutMethod !== "BANK_TRANSFER") return NextResponse.json({ ok: false, message: "Pembayaran fee hanya tersedia melalui transfer bank." }, { status: 400 });

  const payout = await prisma.feePayout.findUnique({ where: { id } });
  if (!payout) return NextResponse.json({ ok: false, message: "Tracking fee tidak ditemukan." }, { status: 404 });
  const paidAt = body.paidAt ? new Date(String(body.paidAt)) : new Date();
  const updated = await prisma.$transaction(async (transaction) => {
    const updateData: { status: "PAID"; paidAt: Date; payoutMethod: string; payoutReference: string | null; nominalPerJam?: number; totalFee?: number; manualTotalFee?: number | null } = {
      status: "PAID",
      paidAt,
      payoutMethod,
      payoutReference: String(body.payoutReference || "").trim() || null,
    };
    const newNominal = body.nominalPerJam !== undefined && body.nominalPerJam !== "" ? Number(body.nominalPerJam) : null;
    const newManualTotal = body.manualTotalFee !== undefined && body.manualTotalFee !== "" ? Number(body.manualTotalFee) : null;
    if (newNominal !== null && !Number.isNaN(newNominal) && newNominal > 0) {
      updateData.nominalPerJam = newNominal;
      updateData.totalFee = newManualTotal !== null && !Number.isNaN(newManualTotal) && newManualTotal > 0 ? newManualTotal : payout.totalJam * newNominal;
      updateData.manualTotalFee = newManualTotal !== null && !Number.isNaN(newManualTotal) && newManualTotal > 0 ? newManualTotal : null;
    } else if (newManualTotal !== null && !Number.isNaN(newManualTotal) && newManualTotal >= 0) {
      updateData.totalFee = newManualTotal;
      updateData.manualTotalFee = newManualTotal > 0 ? newManualTotal : null;
    }
    const result = await transaction.feePayout.update({
      where: { id },
      data: updateData,
    });

    if (payout.periodType === "MONTHLY") {
      await transaction.fee.updateMany({
        where: { pengajarId: payout.pengajarId, periode: payout.periodKey },
        data: { status: "PAID", paidAt, payoutMethod, payoutReference: String(body.payoutReference || "").trim() || null },
      });
    }
    return result;
  });

  return NextResponse.json({ ok: true, data: updated });
}
