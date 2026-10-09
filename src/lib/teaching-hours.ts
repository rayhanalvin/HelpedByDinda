import { prisma } from "@/lib/db";
import { getKelasGroup } from "@/lib/kelas";
import { normalizeRateSessions, resolvePengajarRate } from "@/lib/pengajar-rates";

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

export type TeacherSessionInfo = {
  id: string;
  tanggal: Date;
  kelasGroup: string | null;
  mode: "ONLINE" | "OFFLINE";
};

export type TeachingSessionsResult = {
  hoursByTeacher: Map<string, number>;
  sessionsByTeacher: Map<string, TeacherSessionInfo[]>;
};

async function collectTeachingSessions(start: Date, end: Date): Promise<TeachingSessionsResult> {
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
          mode: true,
          tanggal: true,
          pengajar: { select: { userId: true } },
          murid: { select: { userId: true, kelas: true } },
          absensi: { where: { finishedAt: { not: null } }, select: { userId: true } },
        },
      },
    },
  });

  const hoursByTeacher = new Map<string, number>();
  const sessionsByTeacher = new Map<string, TeacherSessionInfo[]>();
  const countedSessions = new Set<string>();

  for (const item of attendance) {
    const teacherUserId = item.jadwal.pengajar.userId;
    const participants = new Set(item.jadwal.absensi.map((entry) => entry.userId));
    const sessionKey = item.jadwal.kelompokId || item.jadwal.id;
    if (item.userId !== teacherUserId || !participants.has(teacherUserId) || ![...participants].some((userId) => userId !== teacherUserId) || countedSessions.has(sessionKey)) continue;

    hoursByTeacher.set(item.jadwal.pengajarId, (hoursByTeacher.get(item.jadwal.pengajarId) || 0) + 1);
    const sessionInfo: TeacherSessionInfo = {
      id: item.jadwal.id,
      tanggal: item.jadwal.tanggal,
      kelasGroup: getKelasGroup(item.jadwal.murid?.kelas),
      mode: item.jadwal.mode === "OFFLINE" ? "OFFLINE" : "ONLINE",
    };
    const existing = sessionsByTeacher.get(item.jadwal.pengajarId) || [];
    existing.push(sessionInfo);
    sessionsByTeacher.set(item.jadwal.pengajarId, existing);
    countedSessions.add(sessionKey);
  }

  return { hoursByTeacher, sessionsByTeacher };
}

export async function getTeachingHoursByTeacherRange(start: Date, end: Date) {
  return (await collectTeachingSessions(start, end)).hoursByTeacher;
}

export async function getTeachingHoursByTeacher(period = getCurrentPeriod()) {
  const { start, end } = getPeriodRange(period);
  return getTeachingHoursByTeacherRange(start, end);
}

export async function getTeachingSessionsByTeacher(period = getCurrentPeriod(), teacherIds?: string[]) {
  const { start, end } = getPeriodRange(period);
  return getTeachingSessionsByTeacherRange(start, end, teacherIds);
}

export async function getTeachingSessionsByTeacherRange(start: Date, end: Date, teacherIds?: string[]) {
  const result = await collectTeachingSessions(start, end);
  if (!teacherIds || teacherIds.length === 0) return result;
  const filtered: TeachingSessionsResult = { hoursByTeacher: new Map(), sessionsByTeacher: new Map() };
  for (const id of teacherIds) {
    if (result.hoursByTeacher.has(id)) filtered.hoursByTeacher.set(id, result.hoursByTeacher.get(id)!);
    if (result.sessionsByTeacher.has(id)) filtered.sessionsByTeacher.set(id, result.sessionsByTeacher.get(id)!);
  }
  return filtered;
}

export async function getTotalFeeForTeacher(teacher: {
  id: string;
  nominalPerJam: number;
  ratePerSession: number;
}, period = getCurrentPeriod(), sessions?: TeacherSessionInfo[]) {
  const { sessionsByTeacher } = sessions
    ? { sessionsByTeacher: new Map<string, TeacherSessionInfo[]>([[teacher.id, sessions]]) }
    : await getTeachingSessionsByTeacher(period, [teacher.id]);
  const teacherSessions = sessionsByTeacher.get(teacher.id) || [];
  if (teacherSessions.length === 0) return { totalJam: 0, totalFee: 0, ratePerSession: teacher.ratePerSession };
  const rates = await prisma.pengajarRate.findMany({ where: { pengajarId: teacher.id } });
  const rateValues = rates.map((rate) => ({ kelasGroup: rate.kelasGroup, mode: rate.mode, rate: rate.ratePerSession }));
  const nominalPerSession = resolvePengajarRate(rateValues, teacher.ratePerSession);
  return { totalJam: teacherSessions.length, totalFee: teacherSessions.length * nominalPerSession, ratePerSession: nominalPerSession };
}
