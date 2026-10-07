import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "PENGAJAR") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const murid = await prisma.murid.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return NextResponse.json({ ok: true, data: murid.map((item) => ({ id: item.id, name: item.user.name, kelas: item.kelas })) }, { headers: { "Cache-Control": "no-store" } });
}
