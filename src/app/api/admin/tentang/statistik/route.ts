import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.tentangStatistik.findMany({
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const label = String(body.label || "").trim();
  const nilai = String(body.nilai || "").trim();

  if (!label || !nilai) {
    return NextResponse.json({ ok: false, message: "Label dan nilai statistik wajib diisi." }, { status: 400 });
  }

  const maxUrutan = await prisma.tentangStatistik.aggregate({ _max: { urutan: true } });
  const data = await prisma.tentangStatistik.create({
    data: {
      label,
      nilai,
      ikon: String(body.ikon || "GraduationCap").trim() || "GraduationCap",
      urutan: Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : (maxUrutan._max.urutan ?? 0) + 1,
    },
  });

  return NextResponse.json({ ok: true, data }, { status: 201 });
}