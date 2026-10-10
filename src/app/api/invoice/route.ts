import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const role = session.role === "PENGAJAR" ? "PENGAJAR" : "MURID";
  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [{ targetRole: role, targetUserId: null }, { targetUserId: session.userId }],
      // Auto-hide invoices whose linked payment has been confirmed by admin
      NOT: { relatedPayment: { status: "SUCCESS" } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      periode: true,
      targetRole: true,
      fileName: true,
      fileMimeType: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, data: invoices }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ ok: false, message: "ID invoice wajib diisi." }, { status: 400 });

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      OR: [{ targetRole: session.role === "PENGAJAR" ? "PENGAJAR" : "MURID", targetUserId: null }, { targetUserId: session.userId }],
    },
    select: {
      fileData: true,
      fileName: true,
      fileMimeType: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ ok: false, message: "Invoice tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: invoice });
}
