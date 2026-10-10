import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAvailableRangesForDate, getAvailabilityRules, dateKey, toDateKey, utcDayRange } from "@/lib/jadwal-availability";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pengajarId = url.searchParams.get("pengajarId") || "";
  const dateParam = url.searchParams.get("date") || "";
  const monthParam = url.searchParams.get("month") || "";

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
  const rules = await getAvailabilityRules(pengajarId);

  // ── Kalender bulanan ─────────────────────────────────────────────────────
  let year: number;
  let month: number; // 0-based
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    year = Number(monthParam.slice(0, 4));
    month = Number(monthParam.slice(5, 7)) - 1;
  } else {
    const now = new Date();
    year = now.getUTCFullYear();
    month = now.getUTCMonth();
  }
  const firstDay = new Date(Date.UTC(year, month, 1));
  const offsetFromMonday = (firstDay.getUTCDay() + 6) % 7; // Senin = 0
  const monthStartKey = dateKey(firstDay);
  const gridStart = new Date(Date.UTC(year, month, 1 - offsetFromMonday));
  const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: { key: string; iso: string; inMonth: boolean }[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    cells.push({ key: dateKey(date), iso: dateKey(date), inMonth: date.getUTCMonth() === month });
  }

  // Status per tanggal: hijau = tersedia, merah = penuh, abu-abu = tidak tersedia
  const statusByDate = new Map<string, "green" | "red" | "gray">();
  const availableDates: string[] = [];
  const fullyBookedDates: string[] = [];
  for (const cell of cells) {
    if (!cell.inMonth) continue;
    const probe = new Date(`${cell.key}T00:00:00Z`);
    const ranges = await getAvailableRangesForDate(pengajarId, probe);
    const dayJadwal = await prisma.jadwal.findMany({
      where: { pengajarId, tanggal: utcDayRange(cell.key), status: { notIn: ["CANCELED", "CANCELLED"] } },
      select: { id: true, jamMulai: true, jamSelesai: true },
    });
    if (!ranges.length) {
      statusByDate.set(cell.key, "gray");
    } else {
      const minutesCovered = ranges.reduce((sum, range) => {
        const [sh, sm] = range.start.split(":").map(Number);
        const [eh, em] = range.end.split(":").map(Number);
        return sum + ((eh * 60 + em) - (sh * 60 + sm));
      }, 0);
      if (dayJadwal.length && minutesCovered <= 0) {
        statusByDate.set(cell.key, "red");
        fullyBookedDates.push(cell.key);
      } else if (dayJadwal.length === 0 && minutesCovered <= 0) {
        statusByDate.set(cell.key, "gray");
      } else {
        // Masih ada slot tersisa namun sudah ada jadwal → hijau (masih tersedia) + tandai terisi sebagian
        statusByDate.set(cell.key, "green");
        availableDates.push(cell.key);
      }
    }
  }

  const targetKey = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : dateKey(base);
  const target = new Date(`${targetKey}T00:00:00Z`);
  const ranges = await getAvailableRangesForDate(pengajarId, target);
  const booked = await prisma.jadwal.findMany({
    where: { pengajarId, tanggal: utcDayRange(targetKey), status: { notIn: ["CANCELED", "CANCELLED"] } },
    select: { jamMulai: true, jamSelesai: true, mataPelajaran: true },
  });
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));

  return NextResponse.json(
    {
      ok: true,
      data: {
        pengajar: { id: pengajar.id, name: pengajar.user.name, avatarUrl: pengajar.user.avatarUrl, spesialisasi: pengajar.spesialisasi },
        month: { key: `${year}-${String(month + 1).padStart(2, "0")}`, label: monthLabel, year, month: month + 1 },
        cells,
        statusByDate: Object.fromEntries(statusByDate),
        availableDates,
        fullyBookedDates,
        targetDate: targetKey,
        today: dateKey(base),
        bookedTotal: booked.length,
        rules: rules.map((rule) => ({ ...rule, tanggal: rule.tanggal ? rule.tanggal.toISOString() : null })),
        ranges,
        booked,
      },
    },
    { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } },
  );
}