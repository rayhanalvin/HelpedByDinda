import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { getCurrentPeriod, getTeachingHoursByTeacher } from "@/lib/teaching-hours";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  // Aggregate stats from the database
  const period = getCurrentPeriod();
  const [totalMurid, totalPengajar, activePayments, feesThisMonth, teachingHours] = await Promise.all([
    prisma.murid.count({ where: { isActive: true } }),
    prisma.pengajar.count({ where: { isActive: true } }),
    prisma.payment.findMany({ where: { status: "SUCCESS" } }),
    // Only sum the fees for the current month (periode: YYYY-MM)
    prisma.fee.findMany({ where: { periode: period } }),
    getTeachingHoursByTeacher(period),
  ]);

  const totalPembayaranMasuk = activePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalJamMengajar = [...teachingHours.values()].reduce((sum, hours) => sum + hours, 0);
  const totalFeeHarusDibayar = feesThisMonth.reduce((sum, f) => sum + (teachingHours.get(f.pengajarId) || 0) * f.nominalPerJam, 0);

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

  return NextResponse.json({
    ok: true,
    data: {
      totalMurid,
      totalPengajar,
      totalPembayaranMasuk,
      totalFeeHarusDibayar,
      totalJamMengajar,
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
