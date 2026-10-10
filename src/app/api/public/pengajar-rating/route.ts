import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** API publik: rating & ulasan pengajar, tersinkron real-time dari penilaian murid (AsesmenPengajar). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pengajarId = url.searchParams.get("pengajarId") || "";

  if (!pengajarId) {
    return NextResponse.json({ ok: false, message: "PengajarId wajib." }, { status: 400 });
  }

  const pengajar = await prisma.pengajar.findUnique({
    where: { id: pengajarId },
    select: { id: true },
  });
  if (!pengajar) return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });

  const assessments = await prisma.asesmenPengajar.findMany({
    where: { pengajarId, status: { in: ["TERKIRIM", "TERBIT"] } },
    include: { murid: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = assessments.length;
  const average =
    total > 0
      ? Math.round((assessments.reduce((sum, item) => sum + item.rating, 0) / total) * 10) / 10
      : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: assessments.filter((item) => item.rating === star).length,
  }));

  return NextResponse.json(
    {
      ok: true,
      data: {
        pengajarId,
        total,
        average,
        distribution,
        reviews: assessments.map((item) => ({
          id: item.id,
          rating: item.rating,
          pemahamanMateri: item.pemahamanMateri,
          komunikasi: item.komunikasi,
          ketepatanWaktu: item.ketepatanWaktu,
          deskripsi: item.deskripsi,
          muridNama: item.murid.user.name,
          createdAt: item.createdAt.toISOString(),
        })),
      },
    },
    { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } },
  );
}