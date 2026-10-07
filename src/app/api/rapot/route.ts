import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

function currentPeriodLabel() {
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date());
}

function validScore(value: unknown, min: number, max: number) {
  const score = Number(value);
  return Number.isInteger(score) && score >= min && score <= max ? score : null;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const [rapot, assessments] = await Promise.all([
    prisma.rapot.findMany({
      where: session.role === "ADMIN" ? {} : session.role === "PENGAJAR" ? { pengajar: { userId: session.userId } } : { murid: { userId: session.userId } },
      include: { murid: { include: { user: { select: { name: true } } } }, pengajar: { include: { user: { select: { name: true } } } } },
      orderBy: [{ updatedAt: "desc" }],
    }),
    prisma.asesmenPengajar.findMany({
      where: session.role === "ADMIN" ? {} : session.role === "PENGAJAR" ? { pengajar: { userId: session.userId } } : { murid: { userId: session.userId } },
      include: { murid: { include: { user: { select: { name: true } } } }, pengajar: { include: { user: { select: { name: true, avatarUrl: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const [studentSchedules, teacherSchedules] = await Promise.all([
    session.role === "PENGAJAR"
      ? prisma.jadwal.findMany({ where: { pengajar: { userId: session.userId } }, include: { murid: { include: { user: { select: { name: true } } } } } })
      : Promise.resolve([]),
    session.role === "MURID"
      ? prisma.jadwal.findMany({ where: { murid: { userId: session.userId }, pengajar: { isActive: true } }, include: { pengajar: { include: { user: { select: { name: true, avatarUrl: true } } } } } })
      : Promise.resolve([]),
  ]);

  const students = Array.from(new Map(studentSchedules.map((schedule) => [schedule.muridId, { id: schedule.muridId, name: schedule.murid.user.name, kelas: schedule.murid.kelas, sekolah: schedule.murid.sekolah }])).values());
  const teachers = Array.from(new Map(teacherSchedules.map((schedule) => [schedule.pengajarId, { id: schedule.pengajarId, name: schedule.pengajar.user.name, avatarUrl: schedule.pengajar.user.avatarUrl, spesialisasi: schedule.pengajar.spesialisasi }])).values());

  const pengajar = session.role === "PENGAJAR" ? await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true, user: { select: { name: true } } } }) : null;
  const murid = session.role === "MURID" ? await prisma.murid.findUnique({ where: { userId: session.userId }, select: { id: true, user: { select: { name: true } } } }) : null;

  return NextResponse.json({ ok: true, data: { rapot, assessments, students, teachers, period: currentPeriodLabel(), pengajarId: pengajar?.id || null, pengajarNama: pengajar?.user.name || null, muridId: murid?.id || null, muridNama: murid?.user.name || null } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const type = String(body.type || "").toUpperCase();
  const periode = String(body.periode || currentPeriodLabel()).trim();
  if (!periode) return NextResponse.json({ ok: false, message: "Periode wajib diisi." }, { status: 400 });

  if (session.role === "PENGAJAR" && type === "RAPOT") {
    const muridId = String(body.muridId || "");
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!pengajar || !muridId) return NextResponse.json({ ok: false, message: "Pilih murid yang memiliki jadwal dengan Anda." }, { status: 400 });
    const linkedSchedule = await prisma.jadwal.findFirst({ where: { muridId, pengajarId: pengajar.id }, select: { id: true } });
    if (!linkedSchedule) return NextResponse.json({ ok: false, message: "Murid tidak terhubung dengan jadwal pengajar ini." }, { status: 403 });

    const scores = {
      nilaiQuiz: validScore(body.nilaiQuiz, 0, 100),
      kehadiran: validScore(body.kehadiran, 0, 100),
      nilaiSekolah: validScore(body.nilaiSekolah, 0, 100),
      keaktifan: validScore(body.keaktifan, 0, 100),
    };
    const deskripsi = String(body.deskripsi || "").trim();
    const rekomendasi = String(body.rekomendasi || "").trim();
    if (Object.values(scores).some((score) => score === null) || !deskripsi || !rekomendasi) {
      return NextResponse.json({ ok: false, message: "Nilai, catatan, dan rekomendasi wajib diisi dengan benar." }, { status: 400 });
    }
    const scoreData = { nilaiQuiz: scores.nilaiQuiz!, kehadiran: scores.kehadiran!, nilaiSekolah: scores.nilaiSekolah!, keaktifan: scores.keaktifan! };
    const nilaiAkhir = Math.round((scoreData.nilaiQuiz + scoreData.kehadiran + scoreData.nilaiSekolah + scoreData.keaktifan) / 4);
    const rapot = await prisma.rapot.upsert({
      where: { muridId_pengajarId_periode: { muridId, pengajarId: pengajar.id, periode } },
      create: { muridId, pengajarId: pengajar.id, periode, ...scoreData, nilaiAkhir, deskripsi, rekomendasi },
      update: { ...scoreData, nilaiAkhir, deskripsi, rekomendasi, status: "TERBIT" },
      include: { murid: { include: { user: { select: { name: true } } } }, pengajar: { include: { user: { select: { name: true } } } } },
    });
    return NextResponse.json({ ok: true, data: rapot });
  }

  if (session.role === "MURID" && type === "ASESMEN") {
    const pengajarId = String(body.pengajarId || "");
    const murid = await prisma.murid.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!murid || !pengajarId) return NextResponse.json({ ok: false, message: "Pilih pengajar yang memiliki jadwal dengan Anda." }, { status: 400 });
    const linkedSchedule = await prisma.jadwal.findFirst({ where: { muridId: murid.id, pengajarId }, select: { id: true } });
    if (!linkedSchedule) return NextResponse.json({ ok: false, message: "Pengajar tidak terhubung dengan jadwal Anda." }, { status: 403 });

    const rating = validScore(body.rating, 1, 5);
    const pemahamanMateri = validScore(body.pemahamanMateri, 1, 5);
    const komunikasi = validScore(body.komunikasi, 1, 5);
    const ketepatanWaktu = validScore(body.ketepatanWaktu, 1, 5);
    const deskripsi = String(body.deskripsi || "").trim();
    if ([rating, pemahamanMateri, komunikasi, ketepatanWaktu].some((score) => score === null) || !deskripsi) {
      return NextResponse.json({ ok: false, message: "Lengkapi rating dan deskripsi penilaian." }, { status: 400 });
    }
    const assessment = await prisma.asesmenPengajar.upsert({
      where: { muridId_pengajarId_periode: { muridId: murid.id, pengajarId, periode } },
      create: { muridId: murid.id, pengajarId, periode, rating: rating!, pemahamanMateri: pemahamanMateri!, komunikasi: komunikasi!, ketepatanWaktu: ketepatanWaktu!, deskripsi },
      update: { rating: rating!, pemahamanMateri: pemahamanMateri!, komunikasi: komunikasi!, ketepatanWaktu: ketepatanWaktu!, deskripsi, status: "TERKIRIM" },
      include: { murid: { include: { user: { select: { name: true } } } }, pengajar: { include: { user: { select: { name: true } } } } },
    });
    return NextResponse.json({ ok: true, data: assessment });
  }

  return NextResponse.json({ ok: false, message: "Jenis data tidak sesuai dengan role Anda." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, message: "ID rapot wajib diisi." }, { status: 400 });
  const rapot = await prisma.rapot.findUnique({ where: { id }, include: { pengajar: { select: { userId: true } } } });
  if (!rapot) return NextResponse.json({ ok: false, message: "Rapot tidak ditemukan." }, { status: 404 });
  if (session.role === "PENGAJAR" && rapot.pengajar.userId !== session.userId) return NextResponse.json({ ok: false, message: "Rapot ini bukan milik Anda." }, { status: 403 });
  await prisma.rapot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
