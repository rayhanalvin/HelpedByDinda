import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { requireMuridFullAccess } from "@/lib/murid-guards";

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  if (session.role === "MURID") {
    const access = await requireMuridFullAccess(session);
    if (!access.ok) return access.response;
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const attachmentId = new URL(req.url).searchParams.get("attachmentId");
  if (attachmentId) {
    const message = await prisma.message.findFirst({
      where: { id: attachmentId, recipientId: session.userId, deletedAt: null, createdAt: { gte: oneDayAgo } },
      select: { attachmentData: true, attachmentName: true, attachmentMimeType: true },
    });
    if (!message?.attachmentData) return NextResponse.json({ ok: false, message: "Lampiran tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true, data: { fileData: message.attachmentData, fileName: message.attachmentName || "lampiran", fileMimeType: message.attachmentMimeType || "application/octet-stream" } });
  }

  const messages = await prisma.message.findMany({
    where: {
      recipientId: session.userId,
      deletedAt: null,
      createdAt: { gte: oneDayAgo }, // Auto-hide messages older than 24 hours
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      readAt: true,
      createdAt: true,
      attachmentName: true,
      attachmentMimeType: true,
      sender: { select: { name: true } },
    },
  });
  const annotated = messages.map((message) => ({
    ...message,
    attachments: message.attachmentName ? [{ id: message.id, fileName: message.attachmentName, fileMimeType: message.attachmentMimeType }] : [],
  }));

  const unreadCount = messages.filter((message) => !message.readAt).length;
  return NextResponse.json({ ok: true, data: annotated, unreadCount }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ ok: false, message: "ID pesan wajib diisi." }, { status: 400 });
  const updated = await prisma.message.updateMany({ where: { id, recipientId: session.userId, deletedAt: null }, data: { readAt: new Date() } });
  if (!updated.count) return NextResponse.json({ ok: false, message: "Pesan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "ID pesan wajib diisi." }, { status: 400 });
  const deleted = await prisma.message.updateMany({ where: { id, recipientId: session.userId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (!deleted.count) return NextResponse.json({ ok: false, message: "Pesan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, id });
}
