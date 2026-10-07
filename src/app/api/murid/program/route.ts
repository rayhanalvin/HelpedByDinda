import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "MURID") {
    return NextResponse.json({ ok: false, message: "Silakan masuk sebagai murid." }, { status: 401 });
  }

  const body = await request.json();
  const code = String(body.programId || body.code || "").trim();
  if (!code) return NextResponse.json({ ok: false, message: "Program belum dipilih." }, { status: 400 });

  const program = await prisma.program.findFirst({ where: { OR: [{ id: code }, { code }], isPublished: true } });
  if (!program) return NextResponse.json({ ok: false, message: "Program tidak ditemukan." }, { status: 404 });

  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  if (!murid) return NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan." }, { status: 404 });

  const updated = await prisma.murid.update({
    where: { id: murid.id },
    data: {
      programId: program.code,
      programNama: program.title,
      programKategori: program.category,
      paketBulanan: program.price,
    },
    select: { id: true, kelas: true, paketBulanan: true, programId: true, programNama: true, programKategori: true },
  });

  return NextResponse.json({ ok: true, data: { ...updated, program } });
}
