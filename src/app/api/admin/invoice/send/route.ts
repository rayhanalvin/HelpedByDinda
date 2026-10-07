import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import nodemailer, { SendMailOptions } from "nodemailer";

function parseDataUrl(dataUrl: string | null | undefined) {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], base64: m[2] };
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const invoiceId = String(body.invoiceId || "").trim();
  if (!invoiceId) return NextResponse.json({ ok: false, message: "invoiceId wajib diisi." }, { status: 400 });

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return NextResponse.json({ ok: false, message: "Invoice tidak ditemukan." }, { status: 404 });

  let targets: Array<{ user: { id: string; email?: string | null; name?: string | null } }> = [];

  if (invoice.targetUserId) {
    // Send only to the specific user
    const user = await prisma.user.findUnique({ where: { id: invoice.targetUserId } });
    if (user) targets = [{ user: { id: user.id, email: user.email, name: user.name } }];
  } else {
    const roleUsers = await prisma.user.findMany({
      where: { role: invoice.targetRole === "PENGAJAR" ? "PENGAJAR" : "MURID" },
      select: { id: true, email: true, name: true },
    });
    targets = roleUsers.map((u) => ({ user: u }));
  }

  // Prepare attachment if present
  const parsed = parseDataUrl(invoice.fileData);
  const attachment = parsed ? { filename: invoice.fileName || "invoice", content: Buffer.from(parsed.base64, "base64"), contentType: parsed.mime } : null;

  // Nodemailer transport using SMTP env
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "587");
  const userMail = process.env.SMTP_USER || "helpedbydinda@gmail.com";
  const passMail = process.env.SMTP_PASS || "";
  const from = process.env.EMAIL_FROM || `Helped By Dinda <${userMail}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: userMail, pass: passMail },
  });

  const results: { userId: string | null; email: string | null; ok: boolean; error?: string }[] = [];

  for (const t of targets) {
    const user = (t as { user: { id: string; email?: string | null; name?: string | null } }).user;
    if (!user || !user.email) {
      results.push({ userId: user?.id || null, email: user?.email || null, ok: false, error: "Email tidak tersedia" });
      continue;
    }

    const mailOptions: SendMailOptions = {
      from,
      to: user.email,
      subject: invoice.title || `Invoice ${invoice.periode || ""}`,
      html: `
        <div style="font-family:Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
          <h2 style="color:#111827">${invoice.title || "Invoice Pembayaran"}</h2>
          <p>Halo <strong>${user.name || "Siswa"}</strong>,</p>
          <p>Berikut invoice untuk <strong>${invoice.periode || "periode terkait"}</strong>. Mohon cek dan lakukan pembayaran sesuai instruksi.</p>
          <p style="color:#6b7280; font-size:13px;">Jika butuh bantuan, balas email ini atau hubungi admin.</p>
        </div>
      `,
    };

    if (attachment) {
      mailOptions.attachments = [{ filename: attachment.filename, content: attachment.content, contentType: attachment.contentType }];
    }

    try {
      await transporter.sendMail(mailOptions);
      await prisma.reminderLog.create({
        data: {
          userId: user.id,
          tipe: invoice.targetRole === "PENGAJAR" ? "invoice_pengajar" : "invoice_murid",
          targetNama: user.name || "-",
          targetEmail: user.email,
          targetRole: invoice.targetRole === "PENGAJAR" ? "pengajar" : "murid",
          status: "sent",
          keterangan: `Invoice ${invoice.title || invoice.periode || ""} dikirim oleh admin.`,
        },
      });

      // Save corresponding notification to Message model for actor inbox dropdown
      const isTeacher = invoice.targetRole === "PENGAJAR";
      await prisma.message.create({
        data: {
          senderId: session.userId,
          recipientId: user.id,
          title: invoice.title || (isTeacher ? "Pemberitahuan Invoice Honor" : "Tagihan Invoice SPP Baru"),
          body: `Halo ${user.name || "Siswa/Pengajar"},\n\nInvoice Anda untuk periode ${invoice.periode || "terkait"} telah diunggah dan dikirimkan oleh admin.\nSilakan periksa lampiran detail tagihan yang dikirim ke email ${user.email} Anda.\n\nSimpan dan bayar tagihan Anda tepat waktu. Terima kasih!`,
          type: "ADMIN_MESSAGE",
        },
      });

      results.push({ userId: user.id, email: user.email, ok: true });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await prisma.reminderLog.create({
        data: {
          userId: user.id,
          tipe: invoice.targetRole === "PENGAJAR" ? "invoice_pengajar" : "invoice_murid",
          targetNama: user.name || "-",
          targetEmail: user.email,
          targetRole: invoice.targetRole === "PENGAJAR" ? "pengajar" : "murid",
          status: "failed",
          errorMessage: errMsg,
          keterangan: `Gagal mengirim invoice ${invoice.title || invoice.periode || ""}.`,
        },
      });
      results.push({ userId: user.id, email: user.email, ok: false, error: errMsg });
    }
  }

  const successCount = results.filter((r) => r.ok).length;
  const failedCount = results.length - successCount;

  return NextResponse.json({ ok: true, total: results.length, success: successCount, failed: failedCount, details: results }, { headers: { "Cache-Control": "no-store" } });
}
