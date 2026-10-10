import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { hasTeacherConflict, utcDayRange, toDateKey } from "@/lib/jadwal-availability";
import { groeperJadwal } from "@/lib/jadwal-groep";

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

  const sessies = groeperJadwal(jadwal);

  return NextResponse.json(
    {
      ok: true,
      data: sessies.map((item) => ({
        id: item.id,
        pengajarId: item.pengajarId,
        muridId: item.muridId,
        kelompokId: item.kelompokId,
        kelompokNama: item.kelompokNama,
        kelompokMurid: item.kelompokMurid,
        isGroep: item.isGroep,
        leden: item.leden,
        startedAt: item.startedAt || null,
        mataPelajaran: item.mataPelajaran,
        tanggal: item.tanggal,
        jamMulai: item.jamMulai,
        jamSelesai: item.jamSelesai,
        mode: item.mode,
        ruangan: item.ruangan,
        catatan: item.catatan,
        status: item.status,
        pengajar: item.pengajar,
        murid: item.murid,
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
  const tanggalKey = toDateKey(body.tanggal ? new Date(body.tanggal) : new Date());
  const jamMulai = String(body.jamMulai || "08:00");
  const jamSelesai = String(body.jamSelesai || "09:30");
  if (jamMulai >= jamSelesai) return NextResponse.json({ ok: false, message: "Jam mulai harus sebelum jam selesai." }, { status: 400 });
  const conflict = await hasTeacherConflict(String(body.pengajarId), tanggalKey, jamMulai, jamSelesai);
  if (conflict) return NextResponse.json({ ok: false, message: "Pengajar sudah terisi pada jam tersebut. Jadwal tidak ditambahkan agar tidak bentrok." }, { status: 409 });
  const kelompokNama = String(body.kelompokNama || "").trim() || (selectedMuridIds.length > 1 ? `Kelompok ${new Date(body.tanggal).toLocaleDateString("id-ID")}` : null);
  const kelompokId = selectedMuridIds.length > 1 ? `kelompok-${crypto.randomUUID()}` : null;
  const sharedData = {
    pengajarId: String(body.pengajarId),
    mataPelajaran: String(body.mataPelajaran || "Matematika"),
    tanggal: new Date(body.tanggal),
    jamMulai,
    jamSelesai,
    startedAt: body.startedAt ? new Date(body.startedAt) : null,
    mode: body.mode === "ONLINE" ? ("ONLINE" as const) : ("OFFLINE" as const),
    ruangan: body.ruangan ? String(body.ruangan) : null,
    catatan: body.catatan ? String(body.catatan) : null,
    status: String(body.status || "TERJADWAL"),
    kelompokId,
    kelompokNama,
  };
  const createdIds = await prisma.$transaction(selectedMuridIds.map((muridId) => prisma.jadwal.create({ data: { ...sharedData, muridId }, select: { id: true } })));
  const jadwal = await prisma.jadwal.findMany({
    where: { id: { in: createdIds.map((item) => item.id) } },
    include: { pengajar: { include: { user: true } }, murid: { include: { user: true } } },
  });

  return NextResponse.json({ ok: true, data: jadwal });
}
