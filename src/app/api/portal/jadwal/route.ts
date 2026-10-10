import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { requireMuridPaid, requireMuridOnboarded } from "@/lib/murid-guards";
import { groeperJadwal } from "@/lib/jadwal-groep";

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

  const jadwalTerkelompok = groeperJadwal(jadwal);

  return NextResponse.json(
    {
      data: jadwalTerkelompok.map((sessie) => ({
        id: sessie.id,
        pengajarId: sessie.pengajarId,
        muridId: sessie.muridId,
        kelompokId: sessie.kelompokId,
        kelompokNama: sessie.kelompokNama,
        kelompokMurid: sessie.kelompokMurid,
        isGroep: sessie.isGroep,
        leden: sessie.leden,
        mataPelajaran: sessie.mataPelajaran,
        startedAt: sessie.startedAt || null,
        tanggal: sessie.tanggal,
        jamMulai: sessie.jamMulai,
        jamSelesai: sessie.jamSelesai,
        mode: sessie.mode.toLowerCase() as "online" | "offline",
        ruangan: sessie.ruangan,
        catatan: sessie.catatan,
        status: sessie.status,
        pengajarNama: sessie.pengajar,
        muridNama: sessie.murid,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
