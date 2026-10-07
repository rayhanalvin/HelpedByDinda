import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const materi = await prisma.materi.findMany({
    include: { pengajar: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: materi.map((item) => ({
      id: item.id,
      judul: item.judul,
      mataPelajaran: item.mataPelajaran,
      kategori: item.kategori,
      fileUrl: item.fileUrl,
      isPublished: item.isPublished,
      pengajar: item.pengajar.user.name,
    })),
  });
}
