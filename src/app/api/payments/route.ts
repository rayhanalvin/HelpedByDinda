import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

function paymentView(payment: {
  id: string;
  muridId: string;
  amount: number;
  status: string;
  orderId: string;
  paymentUrl: string | null;
  paymentMethod: string | null;
  recipientBankName: string | null;
  recipientAccountNumber: string | null;
  recipientAccountName: string | null;
  paymentReference: string | null;
  paymentProofData: string | null;
  paymentProofName: string | null;
  paymentProofMimeType: string | null;
  paymentProofUploadedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: payment.id,
    muridId: payment.muridId,
    amount: payment.amount,
    status: payment.status,
    orderId: payment.orderId,
    paymentUrl: payment.paymentUrl,
    paymentMethod: payment.paymentMethod,
    recipientBankName: payment.recipientBankName,
    recipientAccountNumber: payment.recipientAccountNumber,
    recipientAccountName: payment.recipientAccountName,
    paymentReference: payment.paymentReference,
    paymentProofData: payment.paymentProofData,
    paymentProofName: payment.paymentProofName,
    paymentProofMimeType: payment.paymentProofMimeType,
    paymentProofUploadedAt: payment.paymentProofUploadedAt?.toISOString() || null,
    paidAt: payment.paidAt?.toISOString() || null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  if (!murid) return NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan." }, { status: 404 });

  const [payments, settings, latestInvoice] = await Promise.all([
    prisma.payment.findMany({ where: { muridId: murid.id }, orderBy: { createdAt: "desc" } }),
    prisma.paymentSettings.findUnique({ where: { id: "default" }, select: { bankName: true, accountNumber: true, accountName: true } }),
    prisma.invoice.findFirst({
      where: { targetRole: "MURID", targetUserId: session.userId, NOT: { relatedPayment: { status: "SUCCESS" } } },
      orderBy: { createdAt: "desc" },
      select: { id: true, periode: true, title: true, createdAt: true },
    }),
  ]);

  const latestActive = payments.find((payment) => payment.status === "PENDING" || payment.status === "PROCESSING") || payments[0];
  const billAmount = latestActive ? latestActive.amount : murid.paketBulanan;
  const billStatus = latestActive ? latestActive.status : murid.statusBayarBulanIni;
  const billPeriode = latestInvoice?.periode || (latestActive ? latestActive.createdAt.toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7));

  return NextResponse.json(
    { ok: true, data: payments.map(paymentView), settings, billAmount, billStatus, billPeriode, invoiceTitle: latestInvoice?.title || null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "MURID") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const paymentMethod = String(body.paymentMethod || "BANK_TRANSFER")
    .trim()
    .toUpperCase();
  if (paymentMethod !== "BANK_TRANSFER") return NextResponse.json({ ok: false, message: "Pembayaran hanya tersedia melalui transfer bank." }, { status: 400 });

  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  const settings = await prisma.paymentSettings.findUnique({ where: { id: "default" } });
  if (!murid || !settings) return NextResponse.json({ ok: false, message: "Data pembayaran belum dikonfigurasi admin." }, { status: 400 });
  if (!Number.isFinite(murid.paketBulanan) || murid.paketBulanan <= 0) return NextResponse.json({ ok: false, message: "Nominal tagihan murid belum dikonfigurasi admin." }, { status: 400 });

  const existingActivePayment = await prisma.payment.findFirst({
    where: { muridId: murid.id, status: { in: ["PENDING", "PROCESSING"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existingActivePayment) {
    return NextResponse.json({ ok: false, message: "Masih ada transaksi pembayaran aktif. Gunakan satu metode yang sudah dipilih atau tunggu transaksi selesai." }, { status: 409 });
  }

  const orderId = `HBD-${murid.id}-${Date.now()}`;
  const payment = await prisma.payment.create({
    data: {
      muridId: murid.id,
      userId: session.userId,
      amount: murid.paketBulanan,
      orderId,
      paymentMethod,
      recipientBankName: settings.bankName,
      recipientAccountNumber: settings.accountNumber,
      recipientAccountName: settings.accountName,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, data: paymentView(payment) });
}
