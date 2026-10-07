import { prisma } from "@/lib/db";

export function getCurrentPeriod() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date());
}

export function getPeriodRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function parseClock(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function getScheduleHours(start: string, end: string) {
  const minutes = Math.max(0, parseClock(end) - parseClock(start));
  return Math.max(1, Math.round(minutes / 60));
}

export async function getTeachingHoursByTeacherRange(start: Date, end: Date) {
  const attendance = await prisma.absensi.findMany({
    where: {
      finishedAt: { not: null },
      status: { in: ["HADIR", "TERLAMBAT"] },
      jadwal: { tanggal: { gte: start, lt: end }, pengajar: { isActive: true } },
    },
    select: {
      userId: true,
      jadwal: {
        select: {
            id: true,
          pengajarId: true,
          kelompokId: true,
          muridId: true,
          jamMulai: true,
          jamSelesai: true,
          pengajar: { select: { userId: true } },
          murid: { select: { userId: true } },
          absensi: { where: { finishedAt: { not: null } }, select: { userId: true } },
        },
      },
    },
  });

  const hoursByTeacher = new Map<string, number>();
  const countedSessions = new Set<string>();
  for (const item of attendance) {
    const teacherUserId = item.jadwal.pengajar.userId;
    const participants = new Set(item.jadwal.absensi.map((entry) => entry.userId));
    const sessionKey = item.jadwal.kelompokId || item.jadwal.id;
    if (item.userId !== teacherUserId || !participants.has(teacherUserId) || ![...participants].some((userId) => userId !== teacherUserId) || countedSessions.has(sessionKey)) continue;

    const hours = getScheduleHours(item.jadwal.jamMulai, item.jadwal.jamSelesai);
    hoursByTeacher.set(item.jadwal.pengajarId, (hoursByTeacher.get(item.jadwal.pengajarId) || 0) + hours);
    countedSessions.add(sessionKey);
  }

  return hoursByTeacher;
}

export async function getTeachingHoursByTeacher(period = getCurrentPeriod()) {
  const { start, end } = getPeriodRange(period);
  return getTeachingHoursByTeacherRange(start, end);
}
