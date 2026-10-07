import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxSize = 5 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) return NextResponse.json({ ok: false, message: "Fee tidak ditemukan." }, { status: 404 });
  const file = (await request.formData()).get("proof");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "Pilih bukti pembayaran." }, { status: 400 });
  if (!allowedMimeTypes.has(file.type)) return NextResponse.json({ ok: false, message: "Format harus JPG, PNG, WEBP, atau PDF." }, { status: 400 });
  if (file.size > maxSize) return NextResponse.json({ ok: false, message: "Ukuran maksimal 5 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const updated = await prisma.fee.update({
    where: { id },
    data: { paymentProofData: `data:${file.type};base64,${bytes.toString("base64")}`, paymentProofName: file.name, paymentProofMimeType: file.type, paymentProofUploadedAt: new Date() },
  });
  return NextResponse.json({
    ok: true,
    data: { id: updated.id, paymentProofData: updated.paymentProofData, paymentProofName: updated.paymentProofName, paymentProofMimeType: updated.paymentProofMimeType, paymentProofUploadedAt: updated.paymentProofUploadedAt },
  });
}
