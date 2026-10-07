import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const jadwal = await prisma.jadwal.findMany({
    include: {
      pengajar: { include: { user: true } },
      murid: { include: { user: true } },
    },
    orderBy: { tanggal: "asc" },
  });

  return NextResponse.json(
    {
      ok: true,
      data: jadwal.map((item) => ({
        id: item.id,
        pengajarId: item.pengajarId,
        muridId: item.muridId,
        kelompokId: item.kelompokId,
        kelompokNama: item.kelompokNama,
        startedAt: item.startedAt || null,
        mataPelajaran: item.mataPelajaran,
        tanggal: item.tanggal,
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai,
        mode: item.mode,
        ruangan: item.ruangan,
        catatan: item.catatan,
        status: item.status,
        pengajar: item.pengajar.user.name,
        murid: item.murid.user.name,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const selectedMuridIds: string[] = Array.isArray(body.muridIds) ? (body.muridIds as unknown[]).map(String).filter(Boolean) : [String(body.muridId || "")].filter(Boolean);
  if (!selectedMuridIds.length) return NextResponse.json({ ok: false, message: "Pilih minimal satu murid." }, { status: 400 });
  const kelompokNama = String(body.kelompokNama || "").trim() || (selectedMuridIds.length > 1 ? `Kelompok ${new Date(body.tanggal).toLocaleDateString("id-ID")}` : null);
  const kelompokId = selectedMuridIds.length > 1 ? `kelompok-${crypto.randomUUID()}` : null;
  const sharedData = {
    pengajarId: String(body.pengajarId),
    mataPelajaran: String(body.mataPelajaran || "Matematika"),
    tanggal: new Date(body.tanggal),
    jamMulai: String(body.jamMulai || "08:00"),
    jamSelesai: String(body.jamSelesai || "09:30"),
    startedAt: body.startedAt ? new Date(body.startedAt) : null,
    mode: body.mode === "ONLINE" ? ("ONLINE" as const) : ("OFFLINE" as const),
    ruangan: body.ruangan ? String(body.ruangan) : null,
    catatan: body.catatan ? String(body.catatan) : null,
    status: String(body.status || "TERJADWAL"),
    kelompokId,
    kelompokNama,
  };
  const createdIds = await prisma.$transaction(
    selectedMuridIds.map((muridId) => prisma.jadwal.create({ data: { ...sharedData, muridId }, select: { id: true } })),
  );
  const jadwal = await prisma.jadwal.findMany({
    where: { id: { in: createdIds.map((item) => item.id) } },
    include: { pengajar: { include: { user: true } }, murid: { include: { user: true } } },
  });

  return NextResponse.json({ ok: true, data: jadwal });
}
