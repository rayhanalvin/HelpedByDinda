import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { requireMuridPaid } from "@/lib/murid-guards";
import { utcDayRange, hasTeacherConflict } from "@/lib/jadwal-availability";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  let requests;
  if (session.role === "ADMIN") {
    requests = await prisma.rescheduleRequest.findMany({
      include: {
        murid: { include: { user: { select: { name: true } } } },
        pengajar: { include: { user: { select: { name: true } } } },
        jadwal: { select: { mataPelajaran: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (session.role === "PENGAJAR") {
    requests = await prisma.rescheduleRequest.findMany({
      where: { pengajar: { userId: session.userId } },
      include: {
        murid: { include: { user: { select: { name: true } } } },
        pengajar: { include: { user: { select: { name: true } } } },
        jadwal: { select: { mataPelajaran: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    const paid = await requireMuridPaid(session);
    if (!paid.ok) return paid.response;
    requests = await prisma.rescheduleRequest.findMany({
      where: { murid: { userId: session.userId } },
      include: {
        murid: { include: { user: { select: { name: true } } } },
        pengajar: { include: { user: { select: { name: true } } } },
        jadwal: { select: { mataPelajaran: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      data: requests.map((request) => ({
        id: request.id,
        muridId: request.muridId,
        muridNama: request.murid.user.name,
        pengajarId: request.pengajarId,
        pengajarNama: request.pengajar.user.name,
        jadwalId: request.jadwalId,
        mataPelajaran: request.jadwal.mataPelajaran,
        tanggalLama: request.tanggalLama.toISOString(),
        jamMulaiLama: request.jamMulaiLama,
        jamSelesaiLama: request.jamSelesaiLama,
        tanggalBaru: request.tanggalBaru.toISOString(),
        jamMulaiBaru: request.jamMulaiBaru,
        jamSelesaiBaru: request.jamSelesaiBaru,
        catatan: request.catatan,
        status: request.status,
        handledBy: request.handledBy,
        createdAt: request.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "MURID") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const paid = await requireMuridPaid(session);
  if (!paid.ok) return paid.response;

  const body = (await req.json()) as Record<string, unknown>;
  const jadwalId = String(body.jadwalId || "");
  const tanggalBaru = String(body.tanggalBaru || "");
  const jamMulaiBaru = String(body.jamMulaiBaru || "");
  const jamSelesaiBaru = String(body.jamSelesaiBaru || "");
  const catatan = String(body.catatan || "").trim() || null;

  if (!jadwalId || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalBaru) || !/^\d{2}:\d{2}$/.test(jamMulaiBaru) || !/^\d{2}:\d{2}$/.test(jamSelesaiBaru) || jamMulaiBaru >= jamSelesaiBaru) {
    return NextResponse.json({ ok: false, message: "Lengkapi tanggal dan jam pengganti yang valid." }, { status: 400 });
  }

  const jadwal = await prisma.jadwal.findFirst({ where: { id: jadwalId, murid: { userId: session.userId } }, include: { pengajar: true } });
  if (!jadwal) return NextResponse.json({ ok: false, message: "Jadwal belajar tidak ditemukan." }, { status: 404 });
  if (jadwal.startedAt) return NextResponse.json({ ok: false, message: "Sesi sudah dimulai, tidak dapat reschedule." }, { status: 409 });
  if (new Date(`${tanggalBaru}T12:00:00Z`) <= new Date()) return NextResponse.json({ ok: false, message: "Tanggal pengganti harus di masa depan." }, { status: 400 });

  const active = await prisma.rescheduleRequest.findFirst({
    where: { jadwalId, muridId: jadwal.muridId, status: "PENDING" },
  });
  if (active) return NextResponse.json({ ok: false, message: "Pengajuan reschedule untuk sesi ini sedang pending. Tersabur atuh admin." }, { status: 409 });

  const conflict = await hasTeacherConflict(jadwal.pengajarId, tanggalBaru, jamMulaiBaru, jamSelesaiBaru, [jadwal.id]);
  if (conflict) return NextResponse.json({ ok: false, message: "Pengajar sudah terisi pada jam pengganti tersebut. Pilih slot lain." }, { status: 409 });

  const created = await prisma.rescheduleRequest.create({
    data: {
      muridId: jadwal.muridId,
      pengajarId: jadwal.pengajarId,
      jadwalId: jadwal.id,
      tanggalLama: jadwal.tanggal,
      jamMulaiLama: jadwal.jamMulai,
      jamSelesaiLama: jadwal.jamSelesai,
      tanggalBaru: new Date(`${tanggalBaru}T12:00:00Z`),
      jamMulaiBaru,
      jamSelesaiBaru,
      catatan,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, data: created });
}