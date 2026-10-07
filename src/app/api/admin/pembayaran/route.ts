import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    include: {
      murid: { include: { user: true } },
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    {
      ok: true,
      data: payments.map((item) => ({
        id: item.id,
        muridId: item.muridId,
        amount: item.amount,
        status: item.status,
        orderId: item.orderId,
        paidAt: item.paidAt,
        createdAt: item.createdAt,
        murid: item.murid.user.name,
        email: item.murid.user.email,
        paymentMethod: item.paymentMethod,
        recipientBankName: item.recipientBankName,
        recipientAccountNumber: item.recipientAccountNumber,
        recipientAccountName: item.recipientAccountName,
        paymentReference: item.paymentReference,
        paymentProofData: item.paymentProofData,
        paymentProofName: item.paymentProofName,
        paymentProofMimeType: item.paymentProofMimeType,
        paymentProofUploadedAt: item.paymentProofUploadedAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const payment = await prisma.payment.findUnique({ where: { id: String(body.id || "") } });
  if (!payment) return NextResponse.json({ ok: false, message: "Transaksi tidak ditemukan." }, { status: 404 });

  const status = String(body.status || "").toUpperCase();
  if (!["PENDING", "PROCESSING", "SUCCESS", "FAILED", "EXPIRED"].includes(status)) {
    return NextResponse.json({ ok: false, message: "Status pembayaran tidak valid." }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const nextPayment = await transaction.payment.update({
      where: { id: payment.id },
      data: {
        status: status as "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED",
        paymentReference: body.paymentReference ? String(body.paymentReference).trim() : payment.paymentReference,
        confirmedAt: status === "SUCCESS" ? new Date() : payment.confirmedAt,
        paidAt: status === "SUCCESS" ? new Date() : payment.paidAt,
      },
    });

    await transaction.murid.update({
      where: { id: payment.muridId },
      data: { statusBayarBulanIni: status as "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED" },
    });

    return nextPayment;
  });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ ok: false, message: "Transaksi tidak ditemukan." }, { status: 404 });

  await prisma.$transaction(async (transaction) => {
    await transaction.payment.delete({ where: { id } });
    const remainingActive = await transaction.payment.findFirst({
      where: { muridId: payment.muridId, status: { in: ["PENDING", "PROCESSING"] } },
    });
    const remainingSuccess = await transaction.payment.findFirst({
      where: { muridId: payment.muridId, status: "SUCCESS" },
      orderBy: { paidAt: "desc" },
    });
    await transaction.murid.update({
      where: { id: payment.muridId },
      data: { statusBayarBulanIni: remainingActive ? remainingActive.status : remainingSuccess ? "SUCCESS" : "PENDING" },
    });
  });

  return NextResponse.json({ ok: true });
}
