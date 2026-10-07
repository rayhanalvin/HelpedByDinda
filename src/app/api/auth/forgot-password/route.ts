import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";
import * as crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ ok: false, message: "Email wajib diisi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      // For security, don't leak whether the email exists.
      return NextResponse.json({ ok: true, message: "Koneksi berhasil. Jika email terdaftar, instruksi setel ulang sandi dikirimkan." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Send email dispatch
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || "587");
    const userMail = process.env.SMTP_USER || "cs.helpeddinda@gmail.com";
    const passMail = process.env.SMTP_PASS || "";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: userMail,
        pass: passMail,
      },
    });

    const mailOptions = {
      from: `"Helped By Dinda" <${userMail}>`,
      to: user.email,
      subject: "Setel Ulang Kata Sandi Akun Helped By Dinda",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
          <h2 style="color: #6366f1; text-align: center;">Helped By Dinda</h2>
          <p>Halo, <strong>${user.name}</strong></p>
          <p>Kami menerima permintaan untuk menyetel ulang kata sandi akun Anda. Silakan klik tautan di bawah ini untuk mengganti kata sandi Anda:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Setel Ulang Password</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">Tautan ini hanya berlaku selama <strong>1 jam</strong> dari sekarang. Jika Anda tidak mengajukan permintaan ini, silakan abaikan email ini dengan aman.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} Helped By Dinda. Seluruh hak cipta dilindungi.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      ok: true,
      message: "Instruksi pengiriman reset password berhasil dikirim ke email.",
    });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ ok: false, message: "Terjadi kesalahan internal pada server bimbingan." }, { status: 500 });
  }
}
