import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

function serializeRule(rule: {
  id: string;
  pengajarId: string;
  jenis: string;
  hari: string | null;
  tanggal: Date | null;
  jamMulai: string;
  jamSelesai: string;
  mode: string;
  ruangan: string | null;
  catatan: string | null;
  isActive: boolean;
  createdAt: Date;
  pengajar?: { user?: { name?: string } };
}) {
  return {
    id: rule.id,
    pengajarId: rule.pengajarId,
    jenis: rule.jenis.toUpperCase() === "SPECIFIK" ? "SPECIFIK" : "RUTINE",
    hari: rule.hari,
    tanggal: rule.tanggal ? rule.tanggal.toISOString() : null,
    jamMulai: rule.jamMulai,
    jamSelesai: rule.jamSelesai,
    mode: rule.mode.toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE",
    ruangan: rule.ruangan,
    catatan: rule.catatan,
    isActive: rule.isActive,
    pengajarNama: rule.pengajar?.user?.name,
  };
}

type ParsedRule = {
  jenis: "RUTINE" | "SPECIFIK";
  hari: string | null;
  tanggal: Date | null;
  jamMulai: string;
  jamSelesai: string;
  mode: "ONLINE" | "OFFLINE";
  ruangan: string | null;
  catatan: string | null;
};

function parseRule(body: Record<string, unknown>): { error?: string; data?: ParsedRule } {
  const jenis = String(body.jenis || "RUTINE").toUpperCase() === "SPECIFIK" ? "SPECIFIK" : "RUTINE";
  const jamMulai = String(body.jamMulai || "");
  const jamSelesai = String(body.jamSelesai || "");
  if (!/^\d{2}:\d{2}$/.test(jamMulai) || !/^\d{2}:\d{2}$/.test(jamSelesai) || jamMulai >= jamSelesai) {
    return { error: "Jam mulai dan selesai tidak valid." };
  }
  const tanggal = body.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(String(body.tanggal)) ? new Date(`${String(body.tanggal)}T00:00:00Z`) : null;
  const hari = jenis === "SPECIFIK" ? null : String(body.hari || String(body.day || "")).trim() || null;
  if (jenis === "SPECIFIK" && !tanggal) {
    return { error: "Tanggal wajib untuk jadwal khusus." };
  }
  if (jenis === "RUTINE" && !hari) {
    return { error: "Hari wajib untuk jadwal rutin." };
  }
  return {
    data: {
      jenis,
      hari,
      tanggal,
      jamMulai,
      jamSelesai,
      mode: String(body.mode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE",
      ruangan: String(body.ruangan || "").trim() || null,
      catatan: String(body.catatan || "").trim() || null,
    } as ParsedRule,
  };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const rules = await prisma.pengajarAvailability.findMany({
    include: { pengajar: { include: { user: { select: { name: true } } } } },
    orderBy: [{ createdAt: "asc" }],
  });
  return NextResponse.json({ ok: true, data: rules.map(serializeRule) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Record<string, unknown>;
  const pengajarId = String(body.pengajarId || "");
  if (!pengajarId) return NextResponse.json({ ok: false, message: "Pilih pengajar." }, { status: 400 });
  const parsed = parseRule(body);
  if (parsed.error) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });
  const rule = await prisma.pengajarAvailability.create({
    data: { pengajarId, ...(parsed.data as ParsedRule) },
    include: { pengajar: { include: { user: { select: { name: true } } } } },
  });
  return NextResponse.json({ ok: true, data: serializeRule(rule) });
}