import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "MURID") {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payment = await prisma.payment.findFirst({ where: { id, userId: session.userId } });
  if (!payment) {
    return NextResponse.json({ ok: false, message: "Transaksi pembayaran tidak ditemukan." }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("proof");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "Pilih gambar atau PDF bukti pembayaran." }, { status: 400 });
  }
  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ ok: false, message: "Format bukti harus JPG, PNG, WEBP, atau PDF." }, { status: 400 });
  }
  if (file.size > MAX_PROOF_SIZE) {
    return NextResponse.json({ ok: false, message: "Ukuran bukti pembayaran maksimal 5 MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      paymentProofData: dataUrl,
      paymentProofName: file.name,
      paymentProofMimeType: file.type,
      paymentProofUploadedAt: new Date(),
      status: payment.status === "SUCCESS" ? payment.status : "PROCESSING",
    },
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: updated.id,
      status: updated.status,
      paymentProofData: updated.paymentProofData,
      paymentProofName: updated.paymentProofName,
      paymentProofMimeType: updated.paymentProofMimeType,
      paymentProofUploadedAt: updated.paymentProofUploadedAt,
    },
  });
}
