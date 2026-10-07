import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const pengajar = await prisma.pengajar.findUnique({ where: { id } });
  if (!pengajar) return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });

  const updated = await prisma.pengajar.update({
    where: { id },
    data: {
      bankName: String(body.bankName || "").trim() || null,
      bankAccountNumber: String(body.bankAccountNumber || "").trim() || null,
      bankAccountName: String(body.bankAccountName || "").trim() || null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ ok: true, data: updated });
}
