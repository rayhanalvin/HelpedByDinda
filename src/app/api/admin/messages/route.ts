import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, body: true, type: true, readAt: true, createdAt: true, recipient: { select: { name: true, email: true, role: true } } },
  });
  return NextResponse.json({ ok: true, data: messages }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const contentType = req.headers.get("content-type") || "";
  let title = "";
  let messageBody = "";
  let targetRole = "ALL";
  let attachmentDataUrl: string | null = null;
  let attachmentFilename: string | null = null;
  let attachmentMime: string | null = null;

  const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
  const maxSize = 8 * 1024 * 1024; // 8MB

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    title = String(form.get("title") || "").trim();
    messageBody = String(form.get("body") || "").trim();
    targetRole = String(form.get("targetRole") || "ALL").toUpperCase();
    const file = form.get("attachment");
    if (file instanceof File) {
      if (!allowed.has(file.type)) return NextResponse.json({ ok: false, message: "Format lampiran tidak didukung." }, { status: 400 });
      if (file.size > maxSize) return NextResponse.json({ ok: false, message: "Ukuran lampiran melebihi batas 8 MB." }, { status: 400 });
      const bytes = Buffer.from(await file.arrayBuffer());
      attachmentDataUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
      attachmentFilename = file.name;
      attachmentMime = file.type;
    }
  } else {
    const body = await req.json();
    title = String(body.title || "").trim();
    messageBody = String(body.body || "").trim();
    targetRole = String(body.targetRole || "ALL").toUpperCase();
  }
  if (!title || !messageBody) return NextResponse.json({ ok: false, message: "Judul dan isi pesan wajib diisi." }, { status: 400 });
  if (!["ALL", "MURID", "PENGAJAR"].includes(targetRole)) return NextResponse.json({ ok: false, message: "Target pesan tidak valid." }, { status: 400 });

  // Build a Prisma-friendly where filter depending on the selected target role
  let where: Prisma.UserWhereInput;
  if (targetRole === "ALL") {
    where = {
      OR: [{ role: "MURID" }, { role: "PENGAJAR" }],
    };
  } else if (targetRole === "MURID") {
    where = { role: "MURID" };
  } else {
    where = { role: "PENGAJAR" };
  }

  const recipients = await prisma.user.findMany({ where, select: { id: true } });

  // Create Message rows; if attachment present, store its dataUrl fields on the message record
  const createdCount = recipients.length;
  for (const recipient of recipients) {
    await prisma.message.create({
      data: {
        senderId: session.userId,
        recipientId: recipient.id,
        title,
        body: messageBody,
        type: "ADMIN_MESSAGE",
        attachmentData: attachmentDataUrl,
        attachmentName: attachmentFilename,
        attachmentMimeType: attachmentMime,
      },
    });
  }

  return NextResponse.json({ ok: true, count: createdCount }, { headers: { "Cache-Control": "no-store" } });
}
