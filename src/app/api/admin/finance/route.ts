import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

type FinancePayload = {
  id: string;
  source: "PAYMENT" | "FEE" | "MANUAL";
  tanggal: string;
  tipe: "pendapatan" | "pengeluaran";
  kategori: "pembayaran_murid" | "fee_pengajar" | "operasional" | "promosi";
  keterangan: string;
  jumlah: number;
  status: "tercatat" | "dibayar";
};

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  // Retrieve incoming payments (success state) and outcoming fees as finance transactions
  const [payments, fees, manualTransactions] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "SUCCESS" },
      include: { user: { select: { name: true } } },
    }),
    prisma.fee.findMany({
      include: { pengajar: { include: { user: { select: { name: true } } } } },
    }),
    prisma.financeTransaction.findMany({ orderBy: { tanggal: "desc" } }),
  ]);

  const records = [
    ...payments.map((p) => ({
      id: p.id,
      source: "PAYMENT" as const,
      tanggal: p.paidAt?.toISOString().split("T")[0] || p.createdAt.toISOString().split("T")[0],
      tipe: "pendapatan",
      kategori: "pembayaran_murid",
      keterangan: `Pembayaran SPP Murid - ${p.user.name} (${p.paymentMethod || "-"}, Ref: ${p.orderId})`,
      jumlah: p.amount,
      status: "dibayar",
    })),
    ...fees.map((f) => ({
      id: f.id,
      source: "FEE" as const,
      tanggal: f.paidAt?.toISOString().split("T")[0] || f.createdAt.toISOString().split("T")[0],
      tipe: "pengeluaran",
      kategori: "fee_pengajar",
      keterangan: `Fee Honor Mengajar - ${f.pengajar.user.name} Periode ${f.periode} (${f.payoutMethod || "-"}${f.payoutReference ? `, Ref: ${f.payoutReference}` : ""})`,
      jumlah: f.totalFee,
      status: f.status === "PAID" ? "dibayar" : "tercatat",
    })),
    ...manualTransactions.map((transaction) => ({
      id: transaction.id,
      source: "MANUAL" as const,
      tanggal: transaction.tanggal.toISOString().split("T")[0],
      tipe: transaction.tipe as FinancePayload["tipe"],
      kategori: transaction.kategori as FinancePayload["kategori"],
      keterangan: transaction.keterangan,
      jumlah: transaction.jumlah,
      status: transaction.status as FinancePayload["status"],
    })),
  ];

  // Ensure the combined array is treated as the expected payload type
  const typedRecords: FinancePayload[] = records as FinancePayload[];

  // Sort by date descending
  typedRecords.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return NextResponse.json(
    {
      ok: true,
      data: typedRecords,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const keterangan = body.keterangan ?? body.kete;
  const { jumlah, tanggal, kategori } = body;
  const amount = Number(jumlah);
  if (!String(keterangan || "").trim() || !Number.isInteger(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(tanggal || ""))) {
    return NextResponse.json({ ok: false, message: "Tanggal, keterangan, dan nominal harus valid." }, { status: 400 });
  }

  const transaction = await prisma.financeTransaction.create({
    data: {
      tanggal: new Date(`${tanggal}T12:00:00`),
      tipe: "pengeluaran",
      kategori: kategori || "operasional",
      keterangan: String(keterangan).trim(),
      jumlah: amount,
      status: "tercatat",
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: transaction.id,
      source: "MANUAL",
      tanggal,
      tipe: "pengeluaran",
      kategori: kategori || "operasional",
      keterangan: String(keterangan).trim(),
      jumlah: amount,
      status: "tercatat",
    },
  });
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.source !== "MANUAL" || !body.id) return NextResponse.json({ ok: false, message: "Hanya transaksi manual yang dapat diedit." }, { status: 400 });
  const amount = Number(body.jumlah);
  if (!String(body.keterangan || "").trim() || !Number.isInteger(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(body.tanggal || ""))) {
    return NextResponse.json({ ok: false, message: "Tanggal, keterangan, dan nominal harus valid." }, { status: 400 });
  }

  const transaction = await prisma.financeTransaction.update({
    where: { id: String(body.id) },
    data: {
      tanggal: new Date(`${body.tanggal}T12:00:00`),
      kategori: String(body.kategori || "operasional"),
      keterangan: String(body.keterangan).trim(),
      jumlah: amount,
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: transaction.id,
      source: "MANUAL",
      tanggal: transaction.tanggal.toISOString().slice(0, 10),
      tipe: transaction.tipe,
      kategori: transaction.kategori,
      keterangan: transaction.keterangan,
      jumlah: transaction.jumlah,
      status: transaction.status,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.source !== "MANUAL" || !body.id) return NextResponse.json({ ok: false, message: "Transaksi pembayaran dan fee tidak dapat dihapus dari Finance." }, { status: 400 });
  await prisma.financeTransaction.delete({ where: { id: String(body.id) } });
  return NextResponse.json({ ok: true });
}
