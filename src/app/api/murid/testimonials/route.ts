import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const items = await prisma.$queryRaw`SELECT id, "userId", "createdAt", rating, text FROM testimonials WHERE isPublished = true ORDER BY "createdAt" DESC LIMIT 20`;
  return NextResponse.json({ ok: true, data: items }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "MURID") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const text = String(body.text || "").trim();
  const rating = Number(body.rating || 5);
  if (!text || text.length < 10) return NextResponse.json({ ok: false, message: "Testimoni terlalu pendek." }, { status: 400 });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return NextResponse.json({ ok: false, message: "Rating tidak valid." }, { status: 400 });

  const created = await prisma.testimonials.create({ data: { userId: session.userId, text, rating, isPublished: false } });
  return NextResponse.json({ ok: true, data: { id: created.id } }, { status: 201 });
}
