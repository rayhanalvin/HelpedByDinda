import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { requireMuridFullAccess } from "@/lib/murid-guards";

type ScheduleWithRelations = {
  id: string;
  mataPelajaran: string;
  tanggal: Date;
  jamMulai: string;
  jamSelesai: string;
  mode: string;
  ruangan: string | null;
  catatan: string | null;
  status: string;
  pengajar?: {
    user?: {
      id?: string;
      name?: string | null;
    } | null;
  } | null;
  murid?: {
    user?: {
      id?: string;
      name?: string | null;
    } | null;
  } | null;
};

type AttendanceRecord = {
  id: string;
  userId: string;
  status: string;
  waktuAbsen: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  startLatitude: number | null;
  startLongitude: number | null;
  startAccuracy: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
  endAccuracy: number | null;
  tanggal: Date;
  mataPelajaran: string;
  catatan: string | null;
  buktiData: string | null;
  buktiMimeType: string | null;
  buktiNama: string | null;
};

function parseClockToMinutes(value: string) {
  const [hour, minute] = String(value || "00:00")
    .split(":")
    .map(Number);
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

function getScheduleKind(schedule: { tanggal: Date; jamMulai: string; jamSelesai: string }, now: Date) {
  const scheduleDate = new Date(schedule.tanggal);
  const scheduleDay = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate()).getTime();
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (scheduleDay < currentDay) return "SELESAI";
  if (scheduleDay > currentDay) return "BELUM_AKTIF";

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseClockToMinutes(schedule.jamMulai);
  const endMinutes = parseClockToMinutes(schedule.jamSelesai);

  if (nowMinutes < startMinutes - 15) return "BELUM_AKTIF";
  if (nowMinutes <= startMinutes + 15) return "AKTIF";
  if (nowMinutes <= endMinutes + 15) return "BERJALAN";
  return "SELESAI";
}

function serializeAttendance(attendance: AttendanceRecord | null) {
  return attendance
    ? {
        id: attendance.id,
        userId: attendance.userId,
        status: attendance.status,
        waktuAbsen: attendance.waktuAbsen,
        startedAt: attendance.startedAt,
        finishedAt: attendance.finishedAt,
        startLocation: attendance.startLatitude !== null && attendance.startLongitude !== null ? { latitude: attendance.startLatitude, longitude: attendance.startLongitude, accuracy: attendance.startAccuracy } : null,
        endLocation: attendance.endLatitude !== null && attendance.endLongitude !== null ? { latitude: attendance.endLatitude, longitude: attendance.endLongitude, accuracy: attendance.endAccuracy } : null,
        tanggal: attendance.tanggal,
        mataPelajaran: attendance.mataPelajaran,
        catatan: attendance.catatan,
        buktiData: attendance.buktiData,
        buktiMimeType: attendance.buktiMimeType,
        buktiNama: attendance.buktiNama,
      }
    : null;
}

function normalizeSchedule(sched: ScheduleWithRelations, sessionUserId: string, attendance: AttendanceRecord | null, participantAttendance: AttendanceRecord | null) {
  return {
    id: sched.id,
    jadwalId: sched.id,
    kelompokId: (sched as { kelompokId?: string | null }).kelompokId || null,
    kelompokNama: (sched as { kelompokNama?: string | null }).kelompokNama || null,
    mataPelajaran: sched.mataPelajaran,
    tanggal: sched.tanggal,
    jamMulai: sched.jamMulai,
    jamSelesai: sched.jamSelesai,
    startedAt: (sched as { startedAt?: Date | null }).startedAt || null,
    mode: sched.mode,
    ruangan: sched.ruangan,
    catatan: sched.catatan,
    status: attendance && ["IZIN", "SAKIT"].includes(attendance.status) ? attendance.status : attendance?.finishedAt ? "SELESAI" : getScheduleKind(sched, new Date()),
    pengajar: sched.pengajar?.user?.name || "Pengajar",
    murid: sched.murid?.user?.name || "Murid",
    attendance: serializeAttendance(attendance),
    participantAttendance: serializeAttendance(participantAttendance),
    userId: sessionUserId,
  };
}

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const now = new Date();
  const startOfDay = fromParam ? new Date(fromParam) : new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = toParam ? new Date(toParam) : new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  let schedules: ScheduleWithRelations[] = [];

  if (session.role === "PENGAJAR") {
    schedules = await prisma.jadwal.findMany({
      where: {
        pengajar: { userId: session.userId },
        tanggal: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        pengajar: { include: { user: true } },
        murid: { include: { user: true } },
      },
      orderBy: { jamMulai: "asc" },
    });
  }

  if (session.role === "MURID") {
    const access = await requireMuridFullAccess(session);
    if (!access.ok) return access.response;
    schedules = await prisma.jadwal.findMany({
      where: {
        murid: { userId: session.userId },
        tanggal: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        pengajar: { include: { user: true } },
        murid: { include: { user: true } },
      },
      orderBy: { jamMulai: "asc" },
    });
  }

  const payload: ReturnType<typeof normalizeSchedule>[] = [];
  const scheduleIds = schedules.map((schedule) => schedule.id);
  const participantUserIds = Array.from(
    new Set([session.userId, ...schedules.map((schedule) => (session.role === "PENGAJAR" ? schedule.murid?.user?.id : schedule.pengajar?.user?.id)).filter((userId): userId is string => Boolean(userId))]),
  );
  const attendanceRows = scheduleIds.length ? await prisma.absensi.findMany({ where: { jadwalId: { in: scheduleIds }, userId: { in: participantUserIds } } }) : [];
  const attendanceByParticipant = new Map(attendanceRows.map((attendance) => [`${attendance.jadwalId}:${attendance.userId}`, attendance]));

  for (const schedule of schedules) {
    const participantUserId = session.role === "PENGAJAR" ? schedule.murid?.user?.id : schedule.pengajar?.user?.id;
    const attendance = attendanceByParticipant.get(`${schedule.id}:${session.userId}`) || null;
    const participantAttendance = participantUserId ? attendanceByParticipant.get(`${schedule.id}:${participantUserId}`) || null : null;
    payload.push(normalizeSchedule(schedule, session.userId, attendance, participantAttendance));
  }

  const groepAbsensi: Record<string, { muridId: string; muridNama: string; status: string | null }[]> = {};
  const ledenByGroep = new Map<string, { muridId: string; murid: string }[]>();
  if (session.role === "PENGAJAR") {
    const groepen = payload.filter((item) => item.kelompokId);
    if (groepen.length) {
      const groupIds = Array.from(new Set(groepen.map((item) => item.kelompokId as string)));
      const groupSchedules = await prisma.jadwal.findMany({ where: { kelompokId: { in: groupIds } }, include: { murid: { include: { user: { select: { name: true } } } } } });
      const memberIds = Array.from(new Set(groupSchedules.map((item) => item.murid.userId)));
      const rows = await prisma.absensi.findMany({ where: { jadwalId: { in: groupSchedules.map((item) => item.id) }, userId: { in: memberIds } } });
      const statusByMember = new Map<string, string>();
      for (const row of rows) {
        if (!statusByMember.has(`${row.jadwalId}:${row.userId}`)) statusByMember.set(`${row.jadwalId}:${row.userId}`, row.status);
      }
      for (const group of groepen) {
        const members = groupSchedules.filter((item) => item.kelompokId === group.kelompokId);
        ledenByGroep.set(group.kelompokId as string, members.map((member) => ({ muridId: member.muridId, murid: member.murid.user.name })));
        groepAbsensi[group.kelompokId as string] = members.map((member) => ({
          muridId: member.muridId,
          muridNama: member.murid.user.name,
          status: statusByMember.get(`${member.id}:${member.murid.userId}`) || null,
        }));
      }
    }
  }

  const activeSchedule = payload.find((item) => item.status === "AKTIF" || item.status === "BERJALAN") || payload[0] || null;

  return NextResponse.json(
    {
      ok: true,
      data: payload.map((item) => ({
        ...item,
        leden: item.kelompokId ? ledenByGroep.get(item.kelompokId) || [] : [],
      })),
      active: activeSchedule,
      groepAbsensi,
    },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    },
  );
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    action?: string;
    jadwalId?: string;
    location?: { latitude?: number; longitude?: number; accuracy?: number };
    status?: string;
    proofData?: string;
    proofMimeType?: string;
    proofName?: string;
    catatan?: string;
    entries?: { muridId?: string; status?: string }[];
  };
  const action = String(body.action || "").toLowerCase();
  const jadwalId = String(body.jadwalId || "");
  const location = body.location;

  if (!jadwalId || !["start", "finish", "absence", "group-attendance"].includes(action)) {
    return NextResponse.json({ ok: false, message: "Parameter absensi tidak valid." }, { status: 400 });
  }

  const schedule = await prisma.jadwal.findUnique({
    where: { id: jadwalId },
    include: {
      pengajar: { include: { user: true } },
      murid: { include: { user: true } },
    },
  });

  if (!schedule) {
    return NextResponse.json({ ok: false, message: "Jadwal tidak ditemukan." }, { status: 404 });
  }

  const belongsToUser = (session.role === "PENGAJAR" && schedule.pengajar.userId === session.userId) || (session.role === "MURID" && schedule.murid.userId === session.userId);

  if (!belongsToUser) {
    return NextResponse.json({ ok: false, message: "Jadwal tidak sesuai dengan akun Anda." }, { status: 403 });
  }

  if (action === "group-attendance") {
    if (session.role !== "PENGAJAR") {
      return NextResponse.json({ ok: false, message: "Alleen pengajar kan absensi groep invullen." }, { status: 403 });
    }
    const rawEntries = Array.isArray(body.entries) ? (body.entries as { muridId?: string; status?: string }[]) : [];
    const allowedStatuses = new Set(["HADIR", "IZIN", "SAKIT", "ALPHA"]);
    const normalized = rawEntries
      .filter((entry) => entry.muridId && allowedStatuses.has(String(entry.status || "").toUpperCase()))
      .map((entry) => ({ muridId: String(entry.muridId), status: String(entry.status || "").toUpperCase() as "HADIR" | "IZIN" | "SAKIT" | "ALPHA" }));

    if (schedule.kelompokId) {
      const group = await prisma.jadwal.findMany({
        where: { kelompokId: schedule.kelompokId },
        select: { id: true, muridId: true, murid: { select: { userId: true } }, mataPelajaran: true, tanggal: true, pengajar: { select: { userId: true } } },
      });
      const validMuridIds = new Set(group.map((item) => item.muridId));
      const selected = normalized.filter((entry) => validMuridIds.has(entry.muridId));
      const attendanceRows = await prisma.$transaction(async (transaction) => {
        const savedRows = [];
        for (const member of group) {
          const statusEntry = selected.find((entry) => entry.muridId === member.muridId);
          const status = statusEntry?.status || "ALPHA";
          const saved = await transaction.absensi.upsert({
            where: { jadwalId_userId: { jadwalId: member.id, userId: member.murid.userId } },
            create: {
              jadwalId: member.id,
              userId: member.murid.userId,
              status,
              waktuAbsen: new Date(),
              mataPelajaran: member.mataPelajaran,
              tanggal: member.tanggal,
              catatan: status === "HADIR" ? "Kehadiran oleh pengajar (sesi groep)." : `Kehadiran ${status.toLowerCase()} oleh pengajar (sesi groep).`,
            },
            update: { status, catatan: status === "HADIR" ? "Kehadiran oleh pengajar (sesi groep)." : `Kehadiran ${status.toLowerCase()} oleh pengajar (sesi groep).` },
          });
          savedRows.push({ muridId: member.muridId, muridNama: member.murid.userId, status: saved.status });
        }
        return savedRows;
      });
      return NextResponse.json({ ok: true, data: { absentie: attendanceRows } }, { headers: { "Cache-Control": "no-store" } });
    }

    // Private session: save single murid status
    if (!normalized.length) return NextResponse.json({ ok: false, message: "Pilih status kehadiran murid." }, { status: 400 });
    const entry = normalized[0];
    if (entry.muridId !== schedule.muridId) return NextResponse.json({ ok: false, message: "Murid niet bij deze sessie." }, { status: 403 });
    const saved = await prisma.absensi.upsert({
      where: { jadwalId_userId: { jadwalId: schedule.id, userId: schedule.murid.userId } },
      create: {
        jadwalId: schedule.id,
        userId: schedule.murid.userId,
        status: entry.status,
        waktuAbsen: new Date(),
        mataPelajaran: schedule.mataPelajaran,
        tanggal: schedule.tanggal,
        catatan: entry.status === "HADIR" ? "Kehadiran door pengajar." : `Kehadiran ${entry.status.toLowerCase()} door pengajar.`,
      },
      update: { status: entry.status, catatan: entry.status === "HADIR" ? "Kehadiran door pengajar." : `Kehadiran ${entry.status.toLowerCase()} door pengajar.` },
    });
    return NextResponse.json({ ok: true, data: saved });
  }

  const existing = await prisma.absensi.findUnique({
    where: {
      jadwalId_userId: {
        jadwalId: schedule.id,
        userId: session.userId,
      },
    },
  });

  if (action === "absence") {
    const status = String(body.status || "").toUpperCase();
    const proofData = String(body.proofData || "");
    const proofMimeType = String(body.proofMimeType || "").toLowerCase();
    const proofName = String(body.proofName || "Bukti absensi")
      .trim()
      .slice(0, 160);
    if (!["IZIN", "SAKIT"].includes(status)) return NextResponse.json({ ok: false, message: "Pilih status izin atau sakit." }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(proofMimeType) || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(proofData) || proofData.length > 4_200_000) {
      return NextResponse.json({ ok: false, message: "Lampirkan gambar JPG, PNG, atau WEBP maksimal 3 MB." }, { status: 400 });
    }
    const absenceSchedules =
      session.role === "PENGAJAR" && schedule.kelompokId
        ? await prisma.jadwal.findMany({ where: { kelompokId: schedule.kelompokId }, select: { id: true, mataPelajaran: true, tanggal: true } })
        : [{ id: schedule.id, mataPelajaran: schedule.mataPelajaran, tanggal: schedule.tanggal }];
    const existingGroupAttendance =
      session.role === "PENGAJAR" && schedule.kelompokId ? await prisma.absensi.findMany({ where: { userId: session.userId, jadwalId: { in: absenceSchedules.map((item) => item.id) } } }) : existing ? [existing] : [];
    if (existingGroupAttendance.some((item) => item.startedAt || item.finishedAt || ["HADIR", "TERLAMBAT"].includes(item.status))) {
      return NextResponse.json({ ok: false, message: "Absensi tidak dapat diubah setelah sesi dimulai." }, { status: 409 });
    }

    const catatan = String(body.catatan || "").trim() || `${session.role === "PENGAJAR" ? "Pengajar" : "Murid"} mengajukan ${status.toLowerCase()}.`;
    const attendance = await prisma.$transaction(async (transaction) => {
      let targetAttendance = existing;
      for (const target of absenceSchedules) {
        const saved = await transaction.absensi.upsert({
          where: { jadwalId_userId: { jadwalId: target.id, userId: session.userId } },
          create: {
            jadwalId: target.id,
            userId: session.userId,
            status: status as "IZIN" | "SAKIT",
            waktuAbsen: new Date(),
            mataPelajaran: target.mataPelajaran,
            tanggal: target.tanggal,
            catatan,
            buktiData: proofData,
            buktiMimeType: proofMimeType,
            buktiNama: proofName,
          },
          update: { status: status as "IZIN" | "SAKIT", waktuAbsen: new Date(), catatan, buktiData: proofData, buktiMimeType: proofMimeType, buktiNama: proofName },
        });
        if (target.id === schedule.id) targetAttendance = saved;
      }
      return targetAttendance;
    });
    return NextResponse.json({ ok: true, data: attendance }, { headers: { "Cache-Control": "no-store" } });
  }

  const hasValidLocation = location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude) && Math.abs(Number(location.latitude)) <= 90 && Math.abs(Number(location.longitude)) <= 180;
  if (!hasValidLocation) return NextResponse.json({ ok: false, message: "Lokasi perangkat wajib diizinkan untuk mencatat absensi." }, { status: 400 });

  const groupSchedules =
    session.role === "PENGAJAR" && schedule.kelompokId ? await prisma.jadwal.findMany({ where: { kelompokId: schedule.kelompokId }, select: { id: true, mataPelajaran: true, tanggal: true, jamMulai: true } }) : [schedule];

  if (action === "start") {
    if (existing && !(session.role === "PENGAJAR" && schedule.kelompokId)) {
      return NextResponse.json({ ok: true, data: existing });
    }

    const now = new Date();
    const attendance = await prisma.$transaction(async (transaction) => {
      let targetAttendance = existing;
      for (const groupSchedule of groupSchedules) {
        const startMinutes = parseClockToMinutes(groupSchedule.jamMulai);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const saved = await transaction.absensi.upsert({
          where: { jadwalId_userId: { jadwalId: groupSchedule.id, userId: session.userId } },
          create: {
            jadwalId: groupSchedule.id,
            userId: session.userId,
            status: nowMinutes <= startMinutes + 15 ? "HADIR" : "TERLAMBAT",
            waktuAbsen: now,
            startedAt: now,
            startLatitude: Number(location.latitude),
            startLongitude: Number(location.longitude),
            startAccuracy: Number.isFinite(location.accuracy) ? Number(location.accuracy) : null,
            mataPelajaran: groupSchedule.mataPelajaran,
            tanggal: groupSchedule.tanggal,
            catatan: "Presensi pengajar pada sesi kelompok.",
          },
          update: {},
        });
        if (groupSchedule.id === schedule.id) targetAttendance = saved;
      }
      return targetAttendance;
    });

    return NextResponse.json({ ok: true, data: attendance });
  }

  const finishedAt = existing?.finishedAt || new Date();
  const attendance = await prisma.$transaction(async (transaction) => {
    let targetAttendance = existing;
    let targetScheduleStatus = "BERJALAN";
    for (const groupSchedule of groupSchedules) {
      const current = await transaction.absensi.findUnique({ where: { jadwalId_userId: { jadwalId: groupSchedule.id, userId: session.userId } } });
      const saved = current
        ? await transaction.absensi.update({
            where: { id: current.id },
            data: {
              finishedAt,
              endLatitude: current.endLatitude ?? Number(location.latitude),
              endLongitude: current.endLongitude ?? Number(location.longitude),
              endAccuracy: current.endAccuracy ?? (Number.isFinite(location.accuracy) ? Number(location.accuracy) : null),
              catatan: current.catatan || "Sesi selesai tercatat.",
            },
          })
        : await transaction.absensi.create({
            data: {
              jadwalId: groupSchedule.id,
              userId: session.userId,
              status: "HADIR",
              waktuAbsen: new Date(),
              finishedAt,
              endLatitude: Number(location.latitude),
              endLongitude: Number(location.longitude),
              endAccuracy: Number.isFinite(location.accuracy) ? Number(location.accuracy) : null,
              mataPelajaran: groupSchedule.mataPelajaran,
              tanggal: groupSchedule.tanggal,
              catatan: "Sesi selesai tercatat.",
            },
          });

      const finishedAttendances = await transaction.absensi.findMany({ where: { jadwalId: groupSchedule.id }, select: { userId: true, finishedAt: true } });
      const requiredUserIds = [
        schedule.pengajar.userId,
        groupSchedule.id === schedule.id ? schedule.murid.userId : (await transaction.jadwal.findUniqueOrThrow({ where: { id: groupSchedule.id }, select: { murid: { select: { userId: true } } } })).murid.userId,
      ];
      const allParticipantsFinished = requiredUserIds.every((userId) => finishedAttendances.some((item) => item.userId === userId && item.finishedAt));
      await transaction.jadwal.update({ where: { id: groupSchedule.id }, data: { status: allParticipantsFinished ? "SELESAI" : "BERJALAN" } });
      if (groupSchedule.id === schedule.id) {
        targetAttendance = saved;
        targetScheduleStatus = allParticipantsFinished ? "SELESAI" : "BERJALAN";
      }
    }
    return { attendance: targetAttendance, scheduleStatus: targetScheduleStatus };
  });

  return NextResponse.json(
    { ok: true, data: attendance.attendance, scheduleStatus: attendance.scheduleStatus },
    {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    },
  );
}
