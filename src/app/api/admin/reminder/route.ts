import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

function getJakartaDayRange() {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(dateParts.map((part) => [part.type, part.value]));
  const start = new Date(`${values.year}-${values.month}-${values.day}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  const { start, end } = getJakartaDayRange();
  const [logs, activeTeachers, pendingStudents, todaySchedules] = await Promise.all([
    prisma.reminderLog.findMany({ orderBy: { sentAt: "desc" } }),
    prisma.pengajar.count({ where: { isActive: true } }),
    prisma.murid.count({ where: { isActive: true, statusBayarBulanIni: "PENDING" } }),
    prisma.jadwal.count({
      where: {
        tanggal: {
          gte: start,
          lt: end,
        },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, data: logs, meta: { activeTeachers, pendingStudents, todaySchedules, attendanceTargets: todaySchedules * 2 } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const type = String(body.type || "")
    .trim()
    .toLowerCase();
  if (!["mengajar", "bayar", "absen", "invoice_murid", "invoice_pengajar"].includes(type)) return NextResponse.json({ ok: false, message: "Tipe pengingat tidak valid." }, { status: 400 });

  const targets: Array<{ userId: string; name: string; email: string; role: string }> = [];
  if (type === "mengajar") {
    const teachers = await prisma.user.findMany({ where: { role: "PENGAJAR" }, select: { id: true, name: true, email: true } });
    targets.push(...teachers.map((item) => ({ userId: item.id, name: item.name, email: item.email, role: "pengajar" })));
  } else if (type === "bayar") {
    const students = await prisma.user.findMany({ where: { role: "MURID" }, select: { id: true, name: true, email: true } });
    targets.push(...students.map((item) => ({ userId: item.id, name: item.name, email: item.email, role: "murid" })));
  } else {
    const { start, end } = getJakartaDayRange();
    const schedules = await prisma.jadwal.findMany({
      where: { tanggal: { gte: start, lt: end } },
      include: { pengajar: { include: { user: { select: { id: true, name: true, email: true } } } }, murid: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    for (const item of schedules) {
      targets.push({ userId: item.pengajar.user.id, name: item.pengajar.user.name, email: item.pengajar.user.email, role: "pengajar" });
      targets.push({ userId: item.murid.user.id, name: item.murid.user.name, email: item.murid.user.email, role: "murid" });
    }
  }

  const uniqueTargets = [...new Map(targets.map((item) => [item.userId, item])).values()];

  // Get current admin user ID to act as the sender for internal messages
  const adminUserId = session.userId;

  // Create corresponding in-app notification messages
  await prisma.message.createMany({
    data: uniqueTargets.map((target) => {
      let titleText = "Notifikasi Bimbingan";
      let bodyText = `Halo ${target.name}, terdapat pengingat dari akademik bimbingan belajar Helped By Dinda.`;

      if (type === "mengajar") {
        titleText = "Pengingat Jadwal Mengajar";
        bodyText = `Halo ${target.name}, mohon periksa jadwal mengajar Anda untuk besok secara berkala di portal. Tetap semangat mengajar!`;
      } else if (type === "bayar") {
        titleText = "Pengingat Tagihan SPP Bulanan";
        bodyText = `Halo murid ${target.name}, mohon periksa status pembayaran SPP Anda bulan ini dan selesaikan tagihan melalui tautan Midtrans Snap di portal Anda. Terima kasih!`;
      } else if (type === "absen") {
        titleText = "Pengingat Presensi Sesi";
        bodyText = `Halo ${target.name}, sesi bimbingan belajar Anda hari ini akan segera dimulai. Silakan lakukan presensi tepat waktu.`;
      }

      return {
        senderId: adminUserId,
        recipientId: target.userId,
        title: titleText,
        body: bodyText,
        type: "ADMIN_MESSAGE",
      };
    }),
  });

  const logs = await prisma.$transaction(
    uniqueTargets.map((target) =>
      prisma.reminderLog.create({
        data: {
          userId: target.userId,
          tipe: type,
          targetNama: target.name,
          targetEmail: target.email,
          targetRole: target.role,
          status: "sent",
          keterangan: `Pengingat ${type} dikirim oleh admin.`,
        },
      }),
    ),
  );

  if (type === "absen" && uniqueTargets.length === 0) {
    const emptyLog = await prisma.reminderLog.create({
      data: {
        tipe: type,
        targetNama: "Tidak ada peserta sesi hari ini",
        targetEmail: "-",
        targetRole: "sistem",
        status: "no_target",
        keterangan: "Pengingat presensi dipicu admin, tetapi tidak ditemukan jadwal sesi hari ini.",
      },
    });
    logs.push(emptyLog);
  }

  return NextResponse.json({ ok: true, data: logs }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "ID log wajib diisi." }, { status: 400 });

  const deleted = await prisma.reminderLog.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ ok: false, message: "Log tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, deletedId: id }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
