import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const role = url.searchParams.get("role");

  const where: Prisma.AbsensiWhereInput = {};
  if (from || to) {
    where.tanggal = {};
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.tanggal.gte = new Date(`${from}T00:00:00`);
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.tanggal.lte = new Date(`${to}T23:59:59.999`);
  }

  const absensi = await prisma.absensi.findMany({
    where,
    include: { jadwal: { include: { murid: { include: { user: true } }, pengajar: { include: { user: true } } } }, user: true },
    orderBy: { tanggal: "asc" },
  });

  const filtered = role ? absensi.filter((a) => (role === "PENGAJAR" ? a.userId === a.jadwal.pengajar.userId : a.userId !== a.jadwal.pengajar.userId)) : absensi;

  // Build simple CSV for PDF conversion or direct CSV download
  const rows = [["Tanggal", "Waktu", "Peran", "Nama", "Mata Pelajaran", "Status", "Catatan"]];
  for (const item of filtered) {
    const tanggal = item.tanggal.toISOString().slice(0, 10);
    const waktu = item.waktuAbsen ? item.waktuAbsen.toISOString().slice(11, 19) : "";
    const roleLabel = item.userId === item.jadwal.pengajar.userId ? "PENGAJAR" : "MURID";
    const nama = item.user.name || "";
    rows.push([tanggal, waktu, roleLabel, nama, item.mataPelajaran, item.status, item.catatan || ""]);
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="absensi_export_${from || "all"}_${to || "all"}.csv"` } });
}
