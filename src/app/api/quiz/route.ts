import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { canQuizUseClass, isQuizScheduleActive, normalizeQuestions } from "@/lib/quiz-access";
import { validateMaterialClass } from "@/lib/materi-access";
import { requireMuridFullAccess } from "@/lib/murid-guards";

const include = { jadwal: { include: { murid: true } }, pengajar: { include: { user: true } } } as const;

function serializeQuiz(quiz: {
  id: string;
  jadwalId: string;
  judul: string;
  deskripsi: string | null;
  mataPelajaran: string;
  kelas: string;
  durasiMenit: number;
  questions: unknown;
  isPublished: boolean;
  jadwal: { tanggal: Date; jamMulai: string; jamSelesai: string; status: string; muridId: string };
  pengajar: { user: { name: string } };
}) {
  return {
    ...quiz,
    questions: normalizeQuestions(quiz.questions),
    pengajarNama: quiz.pengajar.user.name,
    schedule: { tanggal: quiz.jadwal.tanggal, jamMulai: quiz.jadwal.jamMulai, jamSelesai: quiz.jadwal.jamSelesai, status: quiz.jadwal.status },
  };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  if (session.role === "MURID") {
    const access = await requireMuridFullAccess(session);
    if (!access.ok) return access.response;
    const murid = await prisma.murid.findUnique({ where: { userId: session.userId }, select: { id: true, kelas: true } });
    if (!murid) return NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan." }, { status: 404 });
    const quizzes = await prisma.quiz.findMany({ where: { isPublished: true, jadwal: { muridId: murid.id } }, include, orderBy: { createdAt: "desc" } });
    const active = quizzes.filter((quiz) => isQuizScheduleActive(quiz.jadwal) && canQuizUseClass(quiz.kelas, murid.kelas));
    return NextResponse.json({ ok: true, data: active.map(serializeQuiz), kelas: murid.kelas }, { headers: { "Cache-Control": "no-store" } });
  }

  const where = session.role === "ADMIN" ? {} : { pengajar: { userId: session.userId } };
  const quizzes = await prisma.quiz.findMany({ where, include, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, data: quizzes.map(serializeQuiz) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const jadwalId = String(body.jadwalId || "");
  const schedule = await prisma.jadwal.findUnique({ where: { id: jadwalId }, include: { pengajar: true, murid: true } });
  if (!schedule) return NextResponse.json({ ok: false, message: "Jadwal tidak ditemukan." }, { status: 404 });
  if (session.role === "PENGAJAR" && schedule.pengajar.userId !== session.userId) return NextResponse.json({ ok: false, message: "Jadwal bukan tanggung jawab Anda." }, { status: 403 });
  const pengajarId = session.role === "ADMIN" ? String(body.pengajarId || schedule.pengajarId) : schedule.pengajarId;
  if (pengajarId !== schedule.pengajarId) return NextResponse.json({ ok: false, message: "Pengajar harus mengikuti jadwal admin." }, { status: 400 });
  const kelas = validateMaterialClass(body.kelas || schedule.murid.kelas);
  if (!kelas) return NextResponse.json({ ok: false, message: "Target kelas tidak valid." }, { status: 400 });
  const questions = normalizeQuestions(body.questions);
  if (!questions.length) return NextResponse.json({ ok: false, message: "Quiz harus memiliki minimal satu soal." }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      jadwalId,
      pengajarId,
      judul: String(body.judul || "Quiz").trim(),
      deskripsi: String(body.deskripsi || "").trim() || null,
      mataPelajaran: String(body.mataPelajaran || schedule.mataPelajaran),
      kelas,
      durasiMenit: Math.max(1, Number(body.durasiMenit || 20)),
      questions,
      isPublished: session.role === "ADMIN" ? Boolean(body.isPublished) : false,
    },
    include,
  });
  return NextResponse.json({ ok: true, data: serializeQuiz(quiz) }, { status: 201 });
}
