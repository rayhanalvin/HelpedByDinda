import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableRangesForDate, getAvailabilityRules, dateKey, toDateKey } from "@/lib/jadwal-availability";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pengajarId = url.searchParams.get("pengajarId") || "";
  const dateParam = url.searchParams.get("date") || "";

  if (!pengajarId) {
    return NextResponse.json({ ok: false, message: "PengajarId wajib." }, { status: 400 });
  }

  const pengajar = await prisma.pengajar.findUnique({
    where: { id: pengajarId },
    include: { user: { select: { name: true, avatarUrl: true } } },
  });
  if (!pengajar) {
    return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });
  }

  const base = new Date();
  const startKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : dateKey(base);
  const startDate = new Date(`${startKey}T00:00:00Z`);
  const dates: { key: string; label: string; day: string }[] = [];
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = dateKey(date);
    const label = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short" }).format(date);
    dates.push({ key, label, day: new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date) });
  }

  const rules = await getAvailabilityRules(pengajarId);

  // Resolve dates with at least one free range (next 42 days for scrolling).
  const availableDates: string[] = [];
  const checkFrom = new Date(base);
  for (let offset = 0; offset < 42 && availableDates.length < 21; offset += 1) {
    const probe = new Date(checkFrom);
    probe.setDate(checkFrom.getDate() + offset);
    const probedKey = dateKey(probe);
    const ranges = await getAvailableRangesForDate(pengajarId, probe);
    if (probedKey >= startKey && ranges.length) availableDates.push(probedKey);
  }

  const target = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? new Date(`${dateParam}T00:00:00Z`) : startDate;
  const ranges = await getAvailableRangesForDate(pengajarId, target);
  const booked = await prisma.jadwal.findMany({
    where: { pengajarId, tanggal: { gte: new Date(`${toDateKey(target)}T00:00:00Z`), lt: new Date(`${toDateKey(target)}T23:59:59Z`) } },
    select: { jamMulai: true, jamSelesai: true, mataPelajaran: true },
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        pengajar: { id: pengajar.id, name: pengajar.user.name, avatarUrl: pengajar.user.avatarUrl, spesialisasi: pengajar.spesialisasi },
        dates,
        bookedTotal: booked.length,
        availableDates,
        rules: rules.map((rule) => ({ ...rule, tanggal: rule.tanggal ? rule.tanggal.toISOString() : null })),
        ranges,
        booked,
      },
    },
    { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } },
  );
}