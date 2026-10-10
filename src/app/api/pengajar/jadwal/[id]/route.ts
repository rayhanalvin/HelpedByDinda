import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { hasTeacherConflict, toDateKey } from "@/lib/jadwal-availability";

async function getOwnedSchedule(id: string) {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") return { session: null, schedule: null };
  const schedule = await prisma.jadwal.findFirst({ where: { id, pengajar: { userId: session.userId } } });
  return { session, schedule };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, schedule } = await getOwnedSchedule(id);
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!schedule) return NextResponse.json({ ok: false, message: "Jadwal tidak ditemukan." }, { status: 404 });
  const groupIds = schedule.kelompokId ? (await prisma.jadwal.findMany({ where: { kelompokId: schedule.kelompokId }, select: { id: true } })).map((item) => item.id) : [schedule.id];
  const hasAttendance = await prisma.absensi.findFirst({ where: { jadwalId: { in: groupIds } }, select: { id: true } });
  if (hasAttendance) return NextResponse.json({ ok: false, message: "Jadwal tidak dapat diubah setelah ada presensi atau pengajuan izin/sakit." }, { status: 409 });
  const body = (await request.json()) as Record<string, unknown>;
  const tanggal = String(body.tanggal || "");
  const jamMulai = String(body.jamMulai || "");
  const jamSelesai = String(body.jamSelesai || "");
  if (!body.muridId || !body.mataPelajaran || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !/^\d{2}:\d{2}$/.test(jamMulai) || !/^\d{2}:\d{2}$/.test(jamSelesai) || jamMulai >= jamSelesai) {
    return NextResponse.json({ ok: false, message: "Lengkapi data jadwal dengan benar." }, { status: 400 });
  }
  const conflict = await hasTeacherConflict(schedule.pengajarId, toDateKey(new Date(`${tanggal}T12:00:00Z`)), jamMulai, jamSelesai, groupIds);
  if (conflict) return NextResponse.json({ ok: false, message: "Kamu sudah punya jadwal pada jam tersebut. Jadwal tidak diperbarui agar tidak bentrok." }, { status: 409 });
  const sharedData = {
    kelompokNama: schedule.kelompokId ? String(body.kelompokNama || schedule.kelompokNama || "") : null,
    mataPelajaran: String(body.mataPelajaran).trim(),
    tanggal: new Date(`${tanggal}T12:00:00`),
    jamMulai,
    jamSelesai,
    mode: String(body.mode).toUpperCase() === "OFFLINE" ? ("OFFLINE" as const) : ("ONLINE" as const),
    ruangan: String(body.ruangan || "").trim() || null,
    catatan: String(body.catatan || "").trim() || null,
  };
  let updated;
  if (schedule.kelompokId) {
    await prisma.jadwal.updateMany({ where: { kelompokId: schedule.kelompokId }, data: sharedData });
    updated = await prisma.jadwal.findUnique({ where: { id }, include: { murid: { include: { user: true } }, pengajar: { include: { user: true } } } });
  } else {
    const muridId = String((Array.isArray(body.muridIds) ? body.muridIds[0] : body.muridId) || schedule.muridId);
    const murid = await prisma.murid.findUnique({ where: { id: muridId }, select: { id: true } });
    if (!murid) return NextResponse.json({ ok: false, message: "Murid tidak ditemukan." }, { status: 404 });
    updated = await prisma.jadwal.update({ where: { id }, data: { ...sharedData, muridId }, include: { murid: { include: { user: true } }, pengajar: { include: { user: true } } } });
  }
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, schedule } = await getOwnedSchedule(id);
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!schedule) return NextResponse.json({ ok: false, message: "Jadwal tidak ditemukan." }, { status: 404 });
  const groupIds = schedule.kelompokId ? (await prisma.jadwal.findMany({ where: { kelompokId: schedule.kelompokId }, select: { id: true } })).map((item) => item.id) : [schedule.id];
  const hasAttendance = await prisma.absensi.findFirst({ where: { jadwalId: { in: groupIds } }, select: { id: true } });
  if (hasAttendance) return NextResponse.json({ ok: false, message: "Jadwal tidak dapat dihapus setelah ada data presensi." }, { status: 409 });
  if (schedule.kelompokId) await prisma.jadwal.deleteMany({ where: { kelompokId: schedule.kelompokId } });
  else await prisma.jadwal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
