import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { isMuridAllowedForMateri, serializeMaterial } from "@/lib/materi-access";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const material = await prisma.materi.findUnique({ where: { id }, include: { pengajar: { include: { user: true } } } });
  if (!material) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

  if (session.role === "ADMIN") return NextResponse.json({ ok: true, data: serializeMaterial(material) });

  if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!pengajar || pengajar.id !== material.pengajarId) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    return NextResponse.json({ ok: true, data: serializeMaterial(material) });
  }

  // MURID
  if (!material.isPublished) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  const murid = await prisma.murid.findUnique({ where: { userId: session.userId }, select: { kelas: true } });
  if (!murid) return NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan" }, { status: 404 });

  if (!isMuridAllowedForMateri(material.kelas, murid.kelas)) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  return NextResponse.json({ ok: true, data: serializeMaterial(material) });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const material = await prisma.materi.findUnique({ where: { id }, select: { pengajarId: true } });
  if (!material) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

  if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!pengajar || pengajar.id !== material.pengajarId) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  await prisma.materi.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
