import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kelas = searchParams.get("kelas");
  const mine = searchParams.get("mine") === "true";

  const where: Record<string, unknown> = {};
  if (kelas && ["SD", "SMP", "SMA", "UTBK"].includes(kelas)) {
    where.kelasSasaran = kelas;
  }

  // Murid only see published exams; admin sees everything; pengajar sees own drafts + published all
  if (session.role === "MURID") {
    where.isPublished = true;
  } else if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (mine && pengajar) {
      where.pengajarId = pengajar.id;
    } else if (mine) {
      where.id = "__none__";
    }
  } else {
    const published = searchParams.get("published");
    if (published === "true") where.isPublished = true;
    else if (published === "false") where.isPublished = false;
  }

  const ujianList = await prisma.ujian.findMany({
    where,
    orderBy: [{ tanggal: "asc" }, { jam: "asc" }],
  });

  return NextResponse.json(
    {
      ok: true,
      data: ujianList.map((u) => ({
        id: u.id,
        namaUjian: u.namaUjian,
        mataPelajaran: u.mataPelajaran,
        kelasSasaran: u.kelasSasaran,
        tanggal: u.tanggal.toISOString().split("T")[0],
        jam: u.jam,
        deskripsi: u.deskripsi,
        lokasi: u.lokasi,
        pengajarId: u.pengajarId,
        pengajarNama: u.pengajarNama,
        isPublished: u.isPublished,
        createdAt: u.createdAt.toISOString(),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { namaUjian, mataPelajaran, kelasSasaran, tanggal, jam, deskripsi, lokasi, pengajarId, pengajarNama, isPublished } = body;

  if (!namaUjian || !mataPelajaran || !kelasSasaran || !tanggal || !jam) {
    return NextResponse.json({ ok: false, message: "Nama ujian, mata pelajaran, kelas sasaran, tanggal, dan jam wajib diisi." }, { status: 400 });
  }

  const validKelas = ["SD", "SMP", "SMA", "UTBK"];
  if (!validKelas.includes(String(kelasSasaran))) {
    return NextResponse.json({ ok: false, message: "Kelas sasaran tidak valid." }, { status: 400 });
  }

  const parsedDate = new Date(String(tanggal));
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ ok: false, message: "Tanggal tidak valid." }, { status: 400 });
  }

  let finalPengajarId: string | null = null;
  let finalPengajarNama = String(pengajarNama || "").trim();
  if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({
      where: { userId: session.userId },
      select: { id: true, user: { select: { name: true } } },
    });
    if (!pengajar) return NextResponse.json({ ok: false, message: "Profil pengajar tidak ditemukan." }, { status: 404 });
    finalPengajarId = pengajar.id;
    finalPengajarNama = finalPengajarNama || pengajar.user.name;
  } else if (pengajarId) {
    const pengajar = await prisma.pengajar.findUnique({
      where: { id: String(pengajarId) },
      select: { id: true, user: { select: { name: true } } },
    });
    if (pengajar) {
      finalPengajarId = pengajar.id;
      finalPengajarNama = finalPengajarNama || pengajar.user.name;
    }
  }
  if (!finalPengajarNama) {
    return NextResponse.json({ ok: false, message: "PIC pengajar wajib diisi." }, { status: 400 });
  }

  // Pengajar creates as draft by default (admin publishes via toggle)
  const finalIsPublished = session.role === "ADMIN" ? Boolean(isPublished) : false;

  const ujian = await prisma.ujian.create({
    data: {
      namaUjian: String(namaUjian).trim(),
      mataPelajaran: String(mataPelajaran).trim(),
      kelasSasaran: String(kelasSasaran),
      tanggal: parsedDate,
      jam: String(jam).trim(),
      deskripsi: String(deskripsi || "").trim(),
      lokasi: String(lokasi || "").trim(),
      pengajarId: finalPengajarId,
      pengajarNama: finalPengajarNama,
      isPublished: finalIsPublished,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        id: ujian.id,
        namaUjian: ujian.namaUjian,
        mataPelajaran: ujian.mataPelajaran,
        kelasSasaran: ujian.kelasSasaran,
        tanggal: ujian.tanggal.toISOString().split("T")[0],
        jam: ujian.jam,
        deskripsi: ujian.deskripsi,
        lokasi: ujian.lokasi,
        pengajarId: ujian.pengajarId,
        pengajarNama: ujian.pengajarNama,
        isPublished: ujian.isPublished,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
