import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const label = String(body.label || "").trim();
  const nilai = String(body.nilai || "").trim();

  if (!label || !nilai) {
    return NextResponse.json({ ok: false, message: "Label dan nilai statistik wajib diisi." }, { status: 400 });
  }

  const existing = await prisma.tentangStatistik.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Statistik tidak ditemukan." }, { status: 404 });
  }

  const data = await prisma.tentangStatistik.update({
    where: { id },
    data: {
      label,
      nilai,
      ikon: String(body.ikon || existing.ikon).trim() || existing.ikon,
      urutan: Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : existing.urutan,
    },
  });

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.tentangStatistik.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, message: "Statistik tidak ditemukan." }, { status: 404 });
  }

  await prisma.tentangStatistik.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}