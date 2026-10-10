import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { hasTeacherConflict, toDateKey } from "@/lib/jadwal-availability";

async function getPengajar() {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") return null;
  const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId } });
  return pengajar;
}

function parseSchedule(body: Record<string, unknown>, pengajarId: string) {
  const tanggal = String(body.tanggal || "");
  const jamMulai = String(body.jamMulai || "");
  const jamSelesai = String(body.jamSelesai || "");
  const muridIds = Array.isArray(body.muridIds) ? [...new Set(body.muridIds.map(String).filter(Boolean))] : [String(body.muridId || "")].filter(Boolean);
  if (!muridIds.length || !body.mataPelajaran || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !/^\d{2}:\d{2}$/.test(jamMulai) || !/^\d{2}:\d{2}$/.test(jamSelesai) || jamMulai >= jamSelesai) {
    return { error: "Lengkapi murid, mata pelajaran, tanggal, dan jam yang valid." };
  }
  return {
    data: {
      pengajarId,
      muridIds,
      kelompokNama: String(body.kelompokNama || "").trim(),
      mataPelajaran: String(body.mataPelajaran).trim(),
      tanggal: new Date(`${tanggal}T12:00:00`),
      jamMulai,
      jamSelesai,
      mode: String(body.mode).toUpperCase() === "OFFLINE" ? ("OFFLINE" as const) : ("ONLINE" as const),
      ruangan: String(body.ruangan || "").trim() || null,
      catatan: String(body.catatan || "").trim() || null,
      status: "TERJADWAL",
    },
  };
}

export async function GET() {
  const pengajar = await getPengajar();
  if (!pengajar) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const data = await prisma.jadwal.findMany({
    where: { pengajarId: pengajar.id },
    include: { pengajar: { include: { user: true } }, murid: { include: { user: true } } },
    orderBy: [{ tanggal: "asc" }, { jamMulai: "asc" }],
  });
  return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const pengajar = await getPengajar();
  if (!pengajar) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseSchedule(body, pengajar.id);
  if (parsed.error) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });
  if (!parsed.data) return NextResponse.json({ ok: false, message: "Data jadwal belum lengkap." }, { status: 400 });
  const conflict = await hasTeacherConflict(pengajar.id, toDateKey(parsed.data.tanggal), parsed.data.jamMulai, parsed.data.jamSelesai);
  if (conflict) return NextResponse.json({ ok: false, message: "Kamu sudah punya jadwal pada jam tersebut. Jadwal tidak ditambahkan agar tidak bentrok." }, { status: 409 });
  const murid = await prisma.murid.findMany({ where: { id: { in: parsed.data.muridIds } }, select: { id: true } });
  if (murid.length !== parsed.data.muridIds.length) return NextResponse.json({ ok: false, message: "Satu atau lebih murid tidak ditemukan." }, { status: 404 });
  const isGroup = parsed.data.muridIds.length > 1;
  const kelompokId = isGroup ? `kelompok-${crypto.randomUUID()}` : null;
  const kelompokNama = isGroup ? parsed.data.kelompokNama || `Kelompok ${parsed.data.tanggal.toLocaleDateString("id-ID")}` : null;
  const { muridIds, kelompokNama: _groupName, ...sharedData } = parsed.data;
  const created = await prisma.$transaction(muridIds.map((muridId) => prisma.jadwal.create({ data: { ...sharedData, muridId, kelompokId, kelompokNama } })));
  const data = await prisma.jadwal.findMany({ where: { id: { in: created.map((item) => item.id) } }, include: { pengajar: { include: { user: true } }, murid: { include: { user: true } } }, orderBy: { tanggal: "asc" } });
  return NextResponse.json({ ok: true, data });
}
