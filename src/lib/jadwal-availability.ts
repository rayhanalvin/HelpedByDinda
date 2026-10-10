import { prisma } from "@/lib/db";

export const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type AvailabilityRule = {
  id: string;
  pengajarId: string;
  jenis: "RUTINE" | "SPECIFIK";
  hari?: string | null;
  tanggal?: Date | null;
  jamMulai: string;
  jamSelesai: string;
  mode: string;
  ruangan?: string | null;
  catatan?: string | null;
  isActive: boolean;
};

export type FreeRange = {
  start: string;
  end: string;
  mode: string;
  ruangan: string | null;
  ruleId: string;
};

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toDateKey(value: string | Date): string {
  return value instanceof Date ? dateKey(value) : String(value).slice(0, 10);
}

export function overlaps(timeStartA: string, timeEndA: string, timeStartB: string, timeEndB: string): boolean {
  return timeStartA < timeEndB && timeStartB < timeEndA;
}

/** UTC date range used to match jadwal rows created by admin (00:00) and pengajar (12:00) helpers. */
export function utcDayRange(dateKeyValue: string): { gte: Date; lt: Date } {
  const start = new Date(`${dateKeyValue}T00:00:00Z`);
  const end = new Date(`${dateKeyValue}T00:00:00Z`);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

export async function getAvailabilityRules(pengajarId: string): Promise<AvailabilityRule[]> {
  const rules = await prisma.pengajarAvailability.findMany({
    where: { pengajarId, isActive: true },
    orderBy: [{ jenis: "asc" }, { createdAt: "asc" }],
  });
  return rules.map((rule) => ({
    id: rule.id,
    pengajarId: rule.pengajarId,
    jenis: rule.jenis as "RUTINE" | "SPECIFIK",
    hari: rule.hari,
    tanggal: rule.tanggal,
    jamMulai: rule.jamMulai,
    jamSelesai: rule.jamSelesai,
    mode: rule.mode,
    ruangan: rule.ruangan,
    catatan: rule.catatan,
    isActive: rule.isActive,
  }));
}

export function ruleAppliesOn(rule: AvailabilityRule, date: Date): boolean {
  if (rule.jenis === "SPECIFIK") {
    return rule.tanggal != null && toDateKey(rule.tanggal) === dateKey(date);
  }
  return rule.hari === DAY_NAMES[date.getDay()];
}

/** Returns the free time ranges for a teacher on a specific date, with booked jadwal carved out. */
export async function getAvailableRangesForDate(pengajarId: string, date: Date): Promise<FreeRange[]> {
  const key = dateKey(date);
  const rules = await getAvailabilityRules(pengajarId);
  const booked = await prisma.jadwal.findMany({
    where: { pengajarId, tanggal: utcDayRange(key), status: { notIn: ["CANCELED", "CANCELLED"] } },
    select: { jamMulai: true, jamSelesai: true },
  });
  const bookedTimes = booked
    .map((item) => ({ start: item.jamMulai, end: item.jamSelesai }))
    .sort((a, b) => a.start.localeCompare(b.start));

  const ranges: FreeRange[] = [];
  for (const rule of rules) {
    if (!ruleAppliesOn(rule, date)) continue;
    let cursor = rule.jamMulai;
    for (const bookedItem of bookedTimes) {
      if (!overlaps(cursor, rule.jamSelesai, bookedItem.start, bookedItem.end)) continue;
      if (cursor < bookedItem.start) {
        ranges.push({ start: cursor, end: bookedItem.start, mode: rule.mode, ruangan: rule.ruangan || null, ruleId: rule.id });
      }
      if (rule.jamSelesai > bookedItem.end) cursor = bookedItem.end;
    }
    if (cursor < rule.jamSelesai) {
      ranges.push({ start: cursor, end: rule.jamSelesai, mode: rule.mode, ruangan: rule.ruangan || null, ruleId: rule.id });
    }
  }
  return ranges;
}

/** True if the teacher already has another jadwal overlapping the given slot. */
export async function hasTeacherConflict(pengajarId: string, tanggalKey: string, jamMulai: string, jamSelesai: string, excludeIds: string[] = []): Promise<boolean> {
  const booked = await prisma.jadwal.findMany({
    where: { pengajarId, tanggal: utcDayRange(tanggalKey), status: { notIn: ["CANCELED", "CANCELLED"] }, id: { notIn: excludeIds } },
    select: { id: true, jamMulai: true, jamSelesai: true },
  });
  return booked.some((item) => overlaps(jamMulai, jamSelesai, item.jamMulai, item.jamSelesai));
}

/** True when a slot falls inside one of the teacher's availability rules (RUTINE or SPECIFIK). */
export async function isSlotCovered(pengajarId: string, tanggalKey: string, jamMulai: string, jamSelesai: string): Promise<boolean> {
  const keyDate = new Date(`${tanggalKey}T00:00:00Z`);
  const rules = await getAvailabilityRules(pengajarId);
  if (!rules.length) {
    // No availability rules configured → teacher is considered open (legacy behaviour).
    return true;
  }
  return rules.some((rule) => ruleAppliesOn(rule, keyDate) && overlaps(jamMulai, jamSelesai, rule.jamMulai, rule.jamSelesai));
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = String(value || "00:00").split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** Generates a compact list of bookable slots (e.g. every 60 min) from free ranges. */
export function rangesToSlots(ranges: FreeRange[], stepMinutes = 60): { start: string; end: string; mode: string; ruangan: string | null }[] {
  const slots: { start: string; end: string; mode: string; ruangan: string | null }[] = [];
  for (const range of ranges) {
    let cursor = timeToMinutes(range.start);
    const endMinutes = timeToMinutes(range.end);
    while (cursor + stepMinutes <= endMinutes) {
      slots.push({ start: minutesToTime(cursor), end: minutesToTime(cursor + stepMinutes), mode: range.mode, ruangan: range.ruangan });
      cursor += stepMinutes;
    }
  }
  return slots;
}