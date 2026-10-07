import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const programs = await prisma.program.findMany({
    where: { isPublished: true },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ ok: true, data: programs }, { headers: { "Cache-Control": "no-store" } });
}
