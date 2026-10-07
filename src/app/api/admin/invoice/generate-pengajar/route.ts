import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const feeId = String(body.feeId || "").trim();
  if (!feeId) return NextResponse.json({ ok: false, message: "feeId wajib diisi." }, { status: 400 });

  const fee = await prisma.fee.findUnique({ where: { id: feeId }, include: { pengajar: { include: { user: true } } } });
  if (!fee) return NextResponse.json({ ok: false, message: "Fee tidak ditemukan." }, { status: 404 });

  const invoiceTitle = `Invoice Fee ${fee.periode} - ${fee.pengajar.user.name}`;
  const amount = fee.totalFee;

  const inv = await prisma.invoice.create({ data: { title: invoiceTitle, periode: fee.periode, targetRole: "PENGAJAR", amount, targetUserId: fee.pengajar.user.id } });

  return NextResponse.json({ ok: true, data: inv });
}
