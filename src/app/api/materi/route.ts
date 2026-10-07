import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { requireMuridPaid, requireMuridOnboarded } from "@/lib/murid-guards";
import { isMuridAllowedForMateri, serializeMaterial, validateMaterialClass } from "@/lib/materi-access";

const materialInclude = { pengajar: { include: { user: true } } } as const;

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  // When role is MURID, ensure paid and onboarded before returning materi
  if (session.role === "MURID") {
    const paid = await requireMuridPaid(session);
    if (!paid.ok) return paid.response;
    const onboard = await requireMuridOnboarded(session);
    if (!onboard.ok) return onboard.response;
  }

  const where = session.role === "ADMIN" ? {} : session.role === "PENGAJAR" ? { pengajar: { userId: session.userId } } : { isPublished: true };

  const materials = await prisma.materi.findMany({
    where,
    include: materialInclude,
    orderBy: { createdAt: "desc" },
  });

  const studentClass = session.role === "MURID" ? (await prisma.murid.findUnique({ where: { userId: session.userId }, select: { kelas: true } }))?.kelas : null;

  const filtered = studentClass ? materials.filter((item) => isMuridAllowedForMateri(item.kelas, studentClass)) : materials;

  return NextResponse.json(
    {
      ok: true,
      data: filtered.map((item) => serializeMaterial(item)),
      kelasMurid: studentClass,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const kelas = validateMaterialClass(body.kelasSasaran || body.kelas);
  if (!kelas) return NextResponse.json({ ok: false, message: "Target kelas atau semester materi tidak valid." }, { status: 400 });

  let pengajarId: string;
  if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!pengajar) return NextResponse.json({ ok: false, message: "Profil pengajar tidak ditemukan." }, { status: 404 });
    pengajarId = pengajar.id;
  } else {
    pengajarId = String(body.pengajarId || "");
    const pengajar = await prisma.pengajar.findUnique({ where: { id: pengajarId } });
    if (!pengajar) return NextResponse.json({ ok: false, message: "Pengajar materi tidak ditemukan." }, { status: 404 });
  }

  // Enforce publishing rules: only ADMIN may publish directly.
  const isPublishedRequested = Boolean(body.isPublished);
  const finalIsPublished = session.role === "ADMIN" ? isPublishedRequested : false;

  const material = await prisma.materi.create({
    data: {
      pengajarId,
      judul: String(body.judul || "Materi Baru").trim(),
      deskripsi: String(body.deskripsi || "").trim() || null,
      mataPelajaran: String(body.mataPelajaran || "Umum").trim(),
      kelas: kelas,
      kategori: String(body.kategori || "Pembelajaran").trim(),
      fileUrl: body.fileUrl ? String(body.fileUrl).trim() : null,
      bunnyVideoId: body.bunnyVideoId ? String(body.bunnyVideoId).trim() : null,
      thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl).trim() : null,
      isPublished: finalIsPublished,
    },
    include: materialInclude,
  });

  return NextResponse.json({ ok: true, data: serializeMaterial(material) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });

  const material = await prisma.materi.findUnique({ where: { id }, select: { pengajarId: true } });
  if (!material) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

  if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!pengajar || pengajar.id !== material.pengajarId) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const updateData: { isPublished?: boolean; judul?: string; deskripsi?: string | null; kelas?: string; mataPelajaran?: string } = {};
  if (typeof body.isPublished !== "undefined") {
    const requested = Boolean(body.isPublished);
    if (session.role === "PENGAJAR" && requested) {
      return NextResponse.json({ ok: false, message: "Hanya admin yang dapat mempublikasikan materi." }, { status: 403 });
    }
    updateData.isPublished = requested;
  }
  if (typeof body.judul !== "undefined") updateData.judul = String(body.judul).trim();
  if (typeof body.deskripsi !== "undefined") updateData.deskripsi = String(body.deskripsi).trim() || null;
  if (typeof body.mataPelajaran !== "undefined") updateData.mataPelajaran = String(body.mataPelajaran).trim() || "Umum";
  if (typeof body.kelasSasaran !== "undefined") {
    const validated = validateMaterialClass(body.kelasSasaran);
    if (!validated) return NextResponse.json({ ok: false, message: "Invalid kelas" }, { status: 400 });
    updateData.kelas = validated;
  }

  const updated = await prisma.materi.update({ where: { id }, data: updateData, include: materialInclude });
  return NextResponse.json({ ok: true, data: serializeMaterial(updated) });
}
