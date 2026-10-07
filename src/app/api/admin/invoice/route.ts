import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxSize = 8 * 1024 * 1024;

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, include: { targetUser: { select: { id: true } } } });
  return NextResponse.json({ ok: true, data: invoices }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("invoice");
  const title = String(form.get("title") || "");
  const periode = String(form.get("periode") || "");
  const targetRole = String(form.get("targetRole") || "MURID").toUpperCase();

  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "Pilih file invoice." }, { status: 400 });
  if (!allowed.has(file.type)) return NextResponse.json({ ok: false, message: "Format file tidak didukung." }, { status: 400 });
  if (file.size > maxSize) return NextResponse.json({ ok: false, message: "Ukuran file melebihi 8 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;

  const inv = await prisma.invoice.create({
    data: { title: title || null, periode: periode || null, targetRole: targetRole === "PENGAJAR" ? "PENGAJAR" : "MURID", amount: null, fileData: dataUrl, fileName: file.name, fileMimeType: file.type },
  });

  return NextResponse.json({ ok: true, data: inv });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "ID invoice wajib diisi." }, { status: 400 });
  const deleted = await prisma.invoice.deleteMany({ where: { id } });
  if (!deleted.count) return NextResponse.json({ ok: false, message: "Invoice tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, deletedId: id });
}
