import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  // Allow optional query filters: from, to (ISO dates) and role (PENGAJAR|MURID)
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const role = url.searchParams.get("role");

  const where: Prisma.AbsensiWhereInput = {};
  if (from || to) {
    where.tanggal = {};
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.tanggal.gte = new Date(`${from}T00:00:00`);
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.tanggal.lte = new Date(`${to}T23:59:59.999`);
  }

  const absensi = await prisma.absensi.findMany({
    where,
    include: {
      jadwal: { include: { murid: { include: { user: true } }, pengajar: { include: { user: true } } } },
      user: true,
    },
    orderBy: { waktuAbsen: "desc" },
  });

  const filtered = role ? absensi.filter((a) => (role === "PENGAJAR" ? a.userId === a.jadwal.pengajar.userId : a.userId !== a.jadwal.pengajar.userId)) : absensi;
  const kelompokIds = Array.from(new Set(filtered.map((item) => item.jadwal.kelompokId).filter((id): id is string => Boolean(id))));
  const groupCounts = new Map<string, number>();
  if (kelompokIds.length) {
    const groups = await prisma.jadwal.groupBy({ by: ["kelompokId"], where: { kelompokId: { in: kelompokIds } }, _count: { _all: true } });
    for (const group of groups) groupCounts.set(group.kelompokId as string, group._count._all);
  }

  return NextResponse.json(
    {
      ok: true,
      data: filtered.map((item) => ({
        id: item.id,
        jadwalId: item.jadwalId,
        userId: item.userId,
        actorRole: item.userId === item.jadwal.pengajar.userId ? "PENGAJAR" : "MURID",
        status: item.status,
        waktuAbsen: item.waktuAbsen,
        catatan: item.catatan,
        buktiData: item.buktiData,
        buktiMimeType: item.buktiMimeType,
        buktiNama: item.buktiNama,
        startedAt: item.startedAt,
        finishedAt: item.finishedAt,
        startLocation: item.startLatitude !== null && item.startLongitude !== null ? { latitude: item.startLatitude, longitude: item.startLongitude, accuracy: item.startAccuracy } : null,
        endLocation: item.endLatitude !== null && item.endLongitude !== null ? { latitude: item.endLatitude, longitude: item.endLongitude, accuracy: item.endAccuracy } : null,
        mataPelajaran: item.mataPelajaran,
        tanggal: item.tanggal,
        nama: item.user.name,
        murid: item.jadwal.murid.user.name,
        pengajar: item.jadwal.pengajar.user.name,
        jadwalStatus: item.jadwal.status,
        jamMulai: item.jadwal.jamMulai,
        jamSelesai: item.jadwal.jamSelesai,
        mode: item.jadwal.mode,
        kelompokId: item.jadwal.kelompokId,
        kelompokNama: item.jadwal.kelompokNama,
        jumlahLeden: item.jadwal.kelompokId ? groupCounts.get(item.jadwal.kelompokId) || 1 : 1,
      })),
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
