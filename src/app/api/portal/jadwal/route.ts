import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { requireMuridPaid, requireMuridOnboarded } from "@/lib/murid-guards";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  let jadwal;
  if (session.role === "ADMIN") {
    jadwal = await prisma.jadwal.findMany({
      include: {
        pengajar: { include: { user: true } },
        murid: { include: { user: true } },
      },
      orderBy: { tanggal: "asc" },
    });
  } else if (session.role === "PENGAJAR") {
    jadwal = await prisma.jadwal.findMany({
      where: { pengajar: { userId: session.userId } },
      include: {
        pengajar: { include: { user: true } },
        murid: { include: { user: true } },
      },
      orderBy: { tanggal: "asc" },
    });
  } else {
    // Ensure murid has paid and onboarded before returning schedule
    const paid = await requireMuridPaid(session);
    if (!paid.ok) return paid.response;
    const onboard = await requireMuridOnboarded(session);
    if (!onboard.ok) return onboard.response;

    jadwal = await prisma.jadwal.findMany({
      where: { murid: { userId: session.userId } },
      include: {
        pengajar: { include: { user: true } },
        murid: { include: { user: true } },
      },
      orderBy: { tanggal: "asc" },
    });
  }

  const groupIds = Array.from(new Set(jadwal.map((schedule) => schedule.kelompokId).filter((id): id is string => Boolean(id))));
  const groupedSchedules = groupIds.length
    ? await prisma.jadwal.findMany({ where: { kelompokId: { in: groupIds } }, include: { murid: { include: { user: { select: { name: true } } } } } })
    : [];
  const participantsByGroup = new Map<string, string[]>();
  for (const schedule of groupedSchedules) {
    if (!schedule.kelompokId) continue;
    const names = participantsByGroup.get(schedule.kelompokId) || [];
    if (!names.includes(schedule.murid.user.name)) names.push(schedule.murid.user.name);
    participantsByGroup.set(schedule.kelompokId, names);
  }

  return NextResponse.json(
    {
      ok: true,
      data: jadwal.map((item) => ({
        id: item.id,
        pengajarId: item.pengajarId,
        muridId: item.muridId,
        kelompokId: item.kelompokId,
        kelompokNama: item.kelompokNama,
        kelompokMurid: item.kelompokId ? participantsByGroup.get(item.kelompokId) || [item.murid.user.name] : [],
        mataPelajaran: item.mataPelajaran,
        startedAt: item.startedAt || null,
        tanggal: item.tanggal,
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai,
        mode: item.mode.toLowerCase() as "online" | "offline",
        ruangan: item.ruangan,
        catatan: item.catatan,
        status: item.status,
        pengajarNama: item.pengajar.user.name,
        muridNama: item.murid.user.name,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
