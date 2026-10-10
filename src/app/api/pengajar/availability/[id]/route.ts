import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

async function getOwnedPengajar() {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") return null;
  return prisma.pengajar.findUnique({ where: { userId: session.userId } });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pengajar = await getOwnedPengajar();
  if (!pengajar) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rule = await prisma.pengajarAvailability.findFirst({ where: { id, pengajarId: pengajar.id } });
  if (!rule) return NextResponse.json({ ok: false, message: "Rule jadwal tidak ditemukan." }, { status: 404 });
  const body = (await req.json()) as Record<string, unknown>;
  const jenis = String(body.jenis || rule.jenis).toUpperCase() === "SPECIFIK" ? "SPECIFIK" : "RUTINE";
  const jamMulai = String(body.jamMulai || rule.jamMulai);
  const jamSelesai = String(body.jamSelesai || rule.jamSelesai);
  if (jamMulai >= jamSelesai) return NextResponse.json({ ok: false, message: "Jam mulai harus sebelum jam selesai." }, { status: 400 });
  const tanggal = body.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(String(body.tanggal)) ? new Date(`${String(body.tanggal)}T00:00:00Z`) : rule.tanggal;
  const hari = jenis === "SPECIFIK" ? null : String(body.hari || rule.hari || "").trim() || null;
  if (jenis === "SPECIFIK" && !tanggal) return NextResponse.json({ ok: false, message: "Tanggal wajib untuk jadwal khusus." }, { status: 400 });
  if (jenis === "RUTINE" && !hari) return NextResponse.json({ ok: false, message: "Hari wajib untuk jadwal rutin." }, { status: 400 });
  const updated = await prisma.pengajarAvailability.update({
    where: { id },
    data: {
      jenis,
      hari,
      tanggal,
      jamMulai,
      jamSelesai,
      mode: String(body.mode || rule.mode).toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE",
      ruangan: body.ruangan === undefined ? rule.ruangan : String(body.ruangan || "").trim() || null,
      catatan: body.catatan === undefined ? rule.catatan : String(body.catatan || "").trim() || null,
      isActive: body.isActive === undefined ? rule.isActive : Boolean(body.isActive),
    },
  });
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const pengajar = await getOwnedPengajar();
  if (!pengajar) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rule = await prisma.pengajarAvailability.findFirst({ where: { id, pengajarId: pengajar.id } });
  if (!rule) return NextResponse.json({ ok: false, message: "Rule jadwal tidak ditemukan." }, { status: 404 });
  await prisma.pengajarAvailability.delete({ where: { id } });
  return NextResponse.json({ ok: true, deletedId: id });
}