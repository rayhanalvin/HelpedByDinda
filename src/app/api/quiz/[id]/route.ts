import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { normalizeQuestions } from "@/lib/quiz-access";
import { validateMaterialClass } from "@/lib/materi-access";

async function getAuthorizedQuiz(id: string) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) return { session, quiz: null };
  const quiz = await prisma.quiz.findUnique({ where: { id }, include: { jadwal: { include: { murid: true } }, pengajar: { include: { user: true } } } });
  if (!quiz) return { session, quiz: null };
  if (session.role === "PENGAJAR" && quiz.pengajar.userId !== session.userId) return { session, quiz: null };
  return { session, quiz };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { session, quiz } = await getAuthorizedQuiz(id);
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!quiz) return NextResponse.json({ ok: false, message: "Quiz tidak ditemukan atau tidak boleh diubah." }, { status: 404 });
  const body = await request.json();
  const data: { judul?: string; deskripsi?: string | null; mataPelajaran?: string; kelas?: string; durasiMenit?: number; questions?: object; isPublished?: boolean } = {};
  if (body.judul !== undefined) data.judul = String(body.judul).trim();
  if (body.deskripsi !== undefined) data.deskripsi = String(body.deskripsi).trim() || null;
  if (body.mataPelajaran !== undefined) data.mataPelajaran = String(body.mataPelajaran).trim();
  if (body.durasiMenit !== undefined) data.durasiMenit = Math.max(1, Number(body.durasiMenit));
  if (body.kelas !== undefined) {
    const kelas = validateMaterialClass(body.kelas);
    if (!kelas) return NextResponse.json({ ok: false, message: "Target kelas tidak valid." }, { status: 400 });
    data.kelas = kelas;
  }
  if (body.questions !== undefined) {
    const questions = normalizeQuestions(body.questions);
    if (!questions.length) return NextResponse.json({ ok: false, message: "Quiz harus memiliki minimal satu soal." }, { status: 400 });
    data.questions = questions;
  }
  if (session.role === "ADMIN" && body.isPublished !== undefined) data.isPublished = Boolean(body.isPublished);
  const updated = await prisma.quiz.update({ where: { id }, data, include: { jadwal: { include: { murid: true } }, pengajar: { include: { user: true } } } });
  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { session, quiz } = await getAuthorizedQuiz(id);
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!quiz) return NextResponse.json({ ok: false, message: "Quiz tidak ditemukan atau tidak boleh dihapus." }, { status: 404 });
  await prisma.quiz.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
