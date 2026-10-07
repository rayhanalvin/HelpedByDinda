import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const current = await prisma.jadwal.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ ok: false, message: "Jadwal tidak ditemukan." }, { status: 404 });
    const currentGroup = current.kelompokId ? await prisma.jadwal.findMany({ where: { kelompokId: current.kelompokId }, select: { id: true } }) : [{ id: current.id }];
    const hasAttendance = await prisma.absensi.findFirst({ where: { jadwalId: { in: currentGroup.map((item) => item.id) } }, select: { id: true } });
    if (hasAttendance) return NextResponse.json({ ok: false, message: "Jadwal tidak dapat diubah setelah ada presensi atau pengajuan izin/sakit." }, { status: 409 });
    const selectedMuridIds: string[] = Array.isArray(body.muridIds) ? Array.from(new Set<string>((body.muridIds as unknown[]).map(String).filter((value) => value.length > 0))) : [String(body.muridId || current.muridId)];
    if (!selectedMuridIds.length) return NextResponse.json({ ok: false, message: "Pilih minimal satu murid." }, { status: 400 });
    const validStudents = await prisma.murid.findMany({ where: { id: { in: selectedMuridIds } }, select: { id: true } });
    if (validStudents.length !== selectedMuridIds.length) return NextResponse.json({ ok: false, message: "Satu atau lebih murid tidak ditemukan." }, { status: 404 });

    const isGroup = selectedMuridIds.length > 1 || Boolean(current.kelompokId);
    const kelompokId = isGroup ? current.kelompokId || `kelompok-${crypto.randomUUID()}` : null;
    const kelompokNama = isGroup ? String(body.kelompokNama || current.kelompokNama || `Kelompok ${new Date(body.tanggal).toLocaleDateString("id-ID")}`) : null;
    const sharedData = {
      pengajarId: String(body.pengajarId),
      kelompokNama,
      mataPelajaran: String(body.mataPelajaran),
      tanggal: new Date(body.tanggal),
      jamMulai: String(body.jamMulai),
      jamSelesai: String(body.jamSelesai),
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
      mode: body.mode === "ONLINE" || body.mode === "online" ? ("ONLINE" as const) : ("OFFLINE" as const),
      ruangan: body.ruangan ? String(body.ruangan) : null,
      catatan: body.catatan ? String(body.catatan) : null,
      status: String(body.status || "TERJADWAL"),
    };

    await prisma.$transaction(async (transaction) => {
      if (current.kelompokId) {
        await transaction.jadwal.deleteMany({ where: { kelompokId: current.kelompokId, muridId: { notIn: selectedMuridIds } } });
        await transaction.jadwal.updateMany({ where: { kelompokId: current.kelompokId }, data: { ...sharedData, kelompokId } });
      } else {
        await transaction.jadwal.update({ where: { id }, data: { ...sharedData, muridId: selectedMuridIds[0], kelompokId } });
      }

      if (kelompokId) {
        const existingMembers = await transaction.jadwal.findMany({ where: { kelompokId }, select: { muridId: true } });
        const existingIds = new Set(existingMembers.map((item) => item.muridId));
        await Promise.all(selectedMuridIds.filter((muridId) => !existingIds.has(muridId)).map((muridId) => transaction.jadwal.create({ data: { ...sharedData, kelompokId, muridId } })));
      }
    });
    const updated = await prisma.jadwal.findUnique({ where: { id }, include: { pengajar: { include: { user: true } }, murid: { include: { user: true } } } });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Gagal memperbarui jadwal." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const schedule = await prisma.jadwal.findUnique({ where: { id }, select: { id: true, kelompokId: true } });
    if (!schedule) return NextResponse.json({ ok: false, message: "Jadwal tidak ditemukan." }, { status: 404 });
    const groupIds = schedule.kelompokId ? (await prisma.jadwal.findMany({ where: { kelompokId: schedule.kelompokId }, select: { id: true } })).map((item) => item.id) : [id];
    const hasAttendance = await prisma.absensi.findFirst({ where: { jadwalId: { in: groupIds } }, select: { id: true } });
    if (hasAttendance) return NextResponse.json({ ok: false, message: "Jadwal tidak dapat dihapus setelah ada data presensi." }, { status: 409 });
    if (schedule.kelompokId) await prisma.jadwal.deleteMany({ where: { kelompokId: schedule.kelompokId } });
    else await prisma.jadwal.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Jadwal berhasil dihapus." });
  } catch (error) {
    return NextResponse.json({ ok: false, message: "Gagal menghapus jadwal." }, { status: 500 });
  }
}
