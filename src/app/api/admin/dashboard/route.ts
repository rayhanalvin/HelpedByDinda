import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getPeriodRange, getTeachingHoursByTeacher } from "@/lib/teaching-hours";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  // Aggregate stats from the database
  const period = getCurrentPeriod();
  const { start, end } = getPeriodRange(period);
  const monthStart = start;
  const monthEnd = end;

  const [totalMurid, totalPengajar, activePayments, monthPayments, feesThisMonth, teachingHours, upcomingUjian] = await Promise.all([
    prisma.murid.count({ where: { isActive: true } }),
    prisma.pengajar.count({ where: { isActive: true } }),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
    // Payments of the current period (any state) for the subscription overview
    prisma.payment.findMany({
      where: {
        OR: [
          { paidAt: { gte: monthStart, lt: monthEnd } },
          { paidAt: null, createdAt: { gte: monthStart, lt: monthEnd } },
        ],
      },
    }),
    // Only sum the fees for the current month (periode: YYYY-MM)
    prisma.fee.findMany({ where: { periode: period } }),
    getTeachingHoursByTeacher(period),
    prisma.ujian.findMany({
      take: 4,
      where: { isPublished: true, tanggal: { gte: new Date() } },
      orderBy: { tanggal: "asc" },
    }),
  ]);

  const totalPembayaranMasuk = activePayments
    .filter((p) => p.paidAt && p.paidAt >= monthStart && p.paidAt < monthEnd)
    .reduce((sum, p) => sum + p.amount, 0);
  const jumlahTransaksiBulanIni = monthPayments.filter((p) => p.status === "SUCCESS").length;
  const jumlahTransaksiMenunggu = monthPayments.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").length;
  const totalJamMengajar = [...teachingHours.values()].reduce((sum, hours) => sum + hours, 0);
  const totalFeeHarusDibayar = feesThisMonth.reduce((sum, f) => sum + (teachingHours.get(f.pengajarId) || 0) * f.nominalPerJam, 0);

  // Recent paid students of this month (for the realtime feed)
  const recentPembayaran = await prisma.payment.findMany({
    take: 5,
    where: {
      status: "SUCCESS",
      paidAt: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { paidAt: "desc" },
    include: { murid: { include: { user: { select: { name: true } } } } },
  });

  // Get recent absensi
  const recentAbsensi = await prisma.absensi.findMany({
    take: 4,
    orderBy: { waktuAbsen: "desc" },
    include: {
      user: { select: { name: true, role: true } },
    },
  });

  // Get next schedules
  const nextSchedules = await prisma.jadwal.findMany({
    take: 3,
    where: { status: "TERJADWAL" },
    orderBy: { tanggal: "asc" },
    include: {
      pengajar: { include: { user: { select: { name: true } } } },
      murid: { include: { user: { select: { name: true } } } },
    },
  });

  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(monthStart);

  return NextResponse.json({
    ok: true,
    data: {
      totalMurid,
      totalPengajar,
      totalPembayaranMasuk,
      totalFeeHarusDibayar,
      totalJamMengajar,
      period,
      monthLabel,
      jumlahTransaksiBulanIni,
      jumlahTransaksiMenunggu,
      recentPembayaran: recentPembayaran.map((p) => ({
        id: p.id,
        muridNama: p.murid.user.name,
        amount: p.amount,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
      })),
      upcomingUjian: upcomingUjian.map((u) => ({
        id: u.id,
        namaUjian: u.namaUjian,
        mataPelajaran: u.mataPelajaran,
        kelasSasaran: u.kelasSasaran,
        tanggal: u.tanggal.toISOString().split("T")[0],
        jam: u.jam,
        pengajarNama: u.pengajarNama,
      })),
      recentAbsensi: recentAbsensi.map((a) => ({
        id: a.id,
        userName: a.user.name,
        role: a.user.role.toLowerCase(),
        mataPelajaran: a.mataPelajaran,
        waktuAbsen: a.waktuAbsen,
        status: a.status.toLowerCase(),
      })),
      nextSchedules: nextSchedules.map((s) => ({
        id: s.id,
        mataPelajaran: s.mataPelajaran,
        mode: s.mode.toLowerCase(),
        pengajarNama: s.pengajar.user.name,
        muridNama: s.murid.user.name,
        tanggal: s.tanggal,
        jamMulai: s.jamMulai,
      })),
    },
  });
}
