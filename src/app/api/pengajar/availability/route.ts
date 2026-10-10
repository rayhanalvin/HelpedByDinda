import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

function serializeRule(rule: {
  id: string;
  jenis: string;
  hari: string | null;
  tanggal: Date | null;
  jamMulai: string;
  jamSelesai: string;
  mode: string;
  ruangan: string | null;
  catatan: string | null;
  isActive: boolean;
}) {
  return {
    id: rule.id,
    jenis: rule.jenis.toUpperCase() === "SPECIFIK" ? "SPECIFIK" : "RUTINE",
    hari: rule.hari,
    tanggal: rule.tanggal ? rule.tanggal.toISOString() : null,
    jamMulai: rule.jamMulai,
    jamSelesai: rule.jamSelesai,
    mode: rule.mode.toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE",
    ruangan: rule.ruangan,
    catatan: rule.catatan,
    isActive: rule.isActive,
  };
}

async function getOwnedPengajar() {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") return null;
  return prisma.pengajar.findUnique({ where: { userId: session.userId } });
}

export async function GET() {
  const pengajar = await getOwnedPengajar();
  if (!pengajar) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const rules = await prisma.pengajarAvailability.findMany({ where: { pengajarId: pengajar.id }, orderBy: [{ createdAt: "asc" }] });
  return NextResponse.json({ ok: true, data: rules.map(serializeRule) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const pengajar = await getOwnedPengajar();
  if (!pengajar) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;
  const jenis = String(body.jenis || "RUTINE").toUpperCase() === "SPECIFIK" ? "SPECIFIK" : "RUTINE";
  const jamMulai = String(body.jamMulai || "");
  const jamSelesai = String(body.jamSelesai || "");
  if (!/^\d{2}:\d{2}$/.test(jamMulai) || !/^\d{2}:\d{2}$/.test(jamSelesai) || jamMulai >= jamSelesai) {
    return NextResponse.json({ ok: false, message: "Jam mulai dan selesai tidak valid." }, { status: 400 });
  }
  const tanggal = body.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(String(body.tanggal)) ? new Date(`${String(body.tanggal)}T00:00:00Z`) : null;
  const hari = jenis === "SPECIFIK" ? null : String(body.hari || "").trim() || null;
  if (jenis === "SPECIFIK" && !tanggal) return NextResponse.json({ ok: false, message: "Tanggal wajib untuk jadwal khusus." }, { status: 400 });
  if (jenis === "RUTINE" && !hari) return NextResponse.json({ ok: false, message: "Hari wajib untuk jadwal rutin." }, { status: 400 });
  const rule = await prisma.pengajarAvailability.create({
    data: {
      pengajarId: pengajar.id,
      jenis,
      hari,
      tanggal,
      jamMulai,
      jamSelesai,
      mode: String(body.mode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE",
      ruangan: String(body.ruangan || "").trim() || null,
      catatan: String(body.catatan || "").trim() || null,
    },
  });
  return NextResponse.json({ ok: true, data: serializeRule(rule) });
}