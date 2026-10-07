import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const where: Prisma.AbsensiWhereInput = { userId: session.userId };
  if (from || to) {
    where.tanggal = {};
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.tanggal.gte = new Date(`${from}T00:00:00`);
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.tanggal.lte = new Date(`${to}T23:59:59.999`);
  }

  const rows = await prisma.absensi.findMany({ where, include: { jadwal: { include: { pengajar: { include: { user: true } }, murid: { include: { user: true } } } } }, orderBy: { tanggal: "asc" } });
  const header = ["Tanggal", "Waktu Mulai", "Waktu Selesai", "Mata Pelajaran", "Pengajar", "Murid", "Status", "Catatan"];
  const data = rows.map((item) => [
    item.tanggal.toISOString().slice(0, 10),
    item.startedAt?.toISOString() || "",
    item.finishedAt?.toISOString() || "",
    item.mataPelajaran,
    item.jadwal.pengajar.user.name,
    item.jadwal.murid.user.name,
    item.status,
    item.catatan || "",
  ]);
  const csv = [header, ...data].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="absensi_${session.role.toLowerCase()}.csv"` } });
}
