import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { hasTeacherConflict } from "@/lib/jadwal-availability";

function toDateKey(value: Date): string {
  const copy = new Date(value);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const action = String(body.action || "").toUpperCase();
  if (action !== "APPROVED" && action !== "REJECTED") return NextResponse.json({ ok: false, message: "Action tidak valid." }, { status: 400 });

  const request = await prisma.rescheduleRequest.findUnique({ where: { id }, include: { jadwal: { select: { id: true, kelompokId: true, pengajarId: true } } } });
  if (!request) return NextResponse.json({ ok: false, message: "Pengajuan reschedule tidak ditemukan." }, { status: 404 });

  let isOwner = false;
  let handledBy = "";
  if (session.role === "ADMIN") {
    isOwner = true;
    handledBy = "ADMIN";
  } else if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    isOwner = pengajar?.id === request.pengajarId;
    handledBy = "PENGAJAR";
  }
  if (!isOwner) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (request.status !== "PENDING") return NextResponse.json({ ok: false, message: "Pengajuan ini sudah diproses." }, { status: 409 });

  if (action === "APPROVED") {
    const conflict = await hasTeacherConflict(request.pengajarId, toDateKey(request.tanggalBaru), request.jamMulaiBaru, request.jamSelesaiBaru, [request.jadwalId]);
    if (conflict) return NextResponse.json({ ok: false, message: "Pengajar sudah terisi pada slot pengganti. Ditolak automatic dan mengurangi slot lain." }, { status: 409 });

    const tanggalLamaKey = toDateKey(request.tanggalLama);
    const tanggalBaruKey = toDateKey(request.tanggalBaru);
    await prisma.$transaction(async (tx) => {
      await tx.rescheduleRequest.update({ where: { id }, data: { status: "APPROVED", handledBy, handledById: session.userId, handledAt: new Date() } });
      if (request.jadwal.kelompokId) {
        // For group sessions the whole group moves.
        await tx.jadwal.updateMany({
          where: { kelompokId: request.jadwal.kelompokId },
          data: { tanggal: new Date(`${tanggalBaruKey}T12:00:00Z`), jamMulai: request.jamMulaiBaru, jamSelesai: request.jamSelesaiBaru },
        });
      } else {
        await tx.jadwal.update({
          where: { id: request.jadwalId },
          data: { tanggal: new Date(`${tanggalBaruKey}T12:00:00Z`), jamMulai: request.jamMulaiBaru, jamSelesai: request.jamSelesaiBaru },
        });
      }
    });
    void tanggalLamaKey;
    return NextResponse.json({ ok: true, message: "Reschedule disetujui. Jadwal murid dan pengajar otomatis diperbarui." });
  }

  await prisma.rescheduleRequest.update({ where: { id }, data: { status: "REJECTED", handledBy, handledById: session.userId, handledAt: new Date() } });
  return NextResponse.json({ ok: true, message: "Pengajuan reschedule ditolak. Jadwal awal tetap berlaku." });
}