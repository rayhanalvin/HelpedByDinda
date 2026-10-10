import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxSize = 8 * 1024 * 1024;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, message: "Invoice tidak ditemukan." }, { status: 404 });

  const form = await req.formData();
  const file = form.get("invoice");
  const title = String(form.get("title") || "");
  const periode = String(form.get("periode") || "");
  const amountRaw = String(form.get("amount") || "");
  const amount = amountRaw && !Number.isNaN(Number(amountRaw)) && Number(amountRaw) > 0 ? Number(amountRaw) : null;

  let dataUrl: string | null = null;
  let fileName: string | null = null;
  let fileMimeType: string | null = null;
  const removeFile = String(form.get("removeFile") || "") === "1";
  if (file instanceof File) {
    if (!allowed.has(file.type)) return NextResponse.json({ ok: false, message: "Format file tidak didukung." }, { status: 400 });
    if (file.size > maxSize) return NextResponse.json({ ok: false, message: "Ukuran file melebihi 8 MB." }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
    fileName = file.name;
    fileMimeType = file.type;
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const invoice = await transaction.invoice.update({
      where: { id },
      data: {
        title: title || existing.title,
        periode: periode || existing.periode,
        amount: amount ?? existing.amount,
        fileData: dataUrl ?? (removeFile ? null : existing.fileData),
        fileName: file ? fileName : removeFile ? null : existing.fileName,
        fileMimeType: file ? fileMimeType : removeFile ? null : existing.fileMimeType,
      },
    });

    // Sync the linked payment amount so the murid bill stays consistent.
    if (invoice.relatedPaymentId && invoice.targetRole === "MURID") {
      await transaction.payment.update({
        where: { id: invoice.relatedPaymentId },
        data: { amount: amount ?? existing.amount ?? (await transaction.murid.findUnique({ where: { userId: invoice.targetUserId || "" } }))?.paketBulanan ?? 0 },
      });
    }

    return invoice;
  });

  return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) return NextResponse.json({ ok: false, message: "Invoice tidak ditemukan." }, { status: 404 });

  // Alias for the DELETE helper: also cleans up related payment & recalculates murid status.
  const deleted = await prisma.$transaction(async (transaction) => {
    if (invoice.relatedPaymentId) {
      await transaction.payment.deleteMany({ where: { id: invoice.relatedPaymentId } });
    }
    await transaction.invoice.delete({ where: { id } });

    if (invoice.targetRole === "MURID" && invoice.targetUserId) {
      const murid = await transaction.murid.findUnique({ where: { userId: invoice.targetUserId } });
      if (murid) {
        const active = await transaction.payment.findFirst({
          where: { muridId: murid.id, status: { in: ["PENDING", "PROCESSING"] } },
          select: { status: true },
        });
        const success = active
          ? null
          : await transaction.payment.findFirst({ where: { muridId: murid.id, status: "SUCCESS" }, orderBy: { paidAt: "desc" }, select: { status: true } });
        await transaction.murid.update({
          where: { id: murid.id },
          data: { statusBayarBulanIni: active ? active.status : success ? "SUCCESS" : "PENDING" },
        });
      }
    }
    return { id };
  });

  return NextResponse.json({ ok: true, deletedId: id });
}