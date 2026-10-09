import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTransport } from "nodemailer";
import { randomBytes } from "crypto";

function generateVerificationCode() {
  const bytes = randomBytes(4);
  const num = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  return String(100000 + (num % 900000));
}

export async function POST(req: Request) {
  try {
    let email = "";
    try {
      const body = await req.json();
      email = String(body?.email || "").trim();
    } catch {
      email = "";
    }

    if (!email) {
      return NextResponse.json({ ok: false, message: "Email wajib diisi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // For security, don't leak whether the email exists.
      return NextResponse.json({ ok: true, message: "Koneksi berhasil. Jika email terdaftar, instruksi setel ulang sandi dikirimkan." });
    }

    // Generate 6-digit verification code
    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 3600000); // 1 hour validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: code,
        resetTokenExpiry: expiry,
        resetAttempts: 0,
      },
    });

    // Send email dispatch
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || "587");
    const userMail = process.env.SMTP_USER || "cs.helpeddinda@gmail.com";
    const passMail = process.env.SMTP_PASS || "";

    if (!passMail) {
      // Fallback: bila SMTP belum dikonfigurasi, tampilkan kode pada respons
      // agar alur pemulihan tetap berfungsi (mode pengembangan).
      return NextResponse.json(
        {
          ok: true,
          message: "Mode demo: SMTP belum dikonfigurasi, gunakan kode verifikasi berikut.",
          devCode: code,
        },
        { status: 200 },
      );
    }

    let transporter;
    try {
      transporter = createTransport({
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
        subject: "Kode Verifikasi Setel Ulang Kata Sandi Helped By Dinda",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6366f1; text-align: center;">Helped By Dinda</h2>
            <p>Halo, <strong>${user.name}</strong></p>
            <p>Kami menerima permintaan untuk menyetel ulang kata sandi akun Anda. Gunakan kode verifikasi di bawah ini untuk melanjutkan:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="background-color: #6366f1; color: white; padding: 16px 24px; border-radius: 8px; font-weight: bold; font-size: 24px; letter-spacing: 4px; display: inline-block;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">Kode ini hanya berlaku selama <strong>1 jam</strong> sejak sekarang. Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini dengan aman.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">© ${new Date().getFullYear()} Helped By Dinda. Seluruh hak cipta dilindungi.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.warn("SMTP send failed, falling back to demo mode:", mailError instanceof Error ? mailError.message : mailError);
      return NextResponse.json(
        {
          ok: true,
          message: "Mode demo: email tidak dapat dikirim, gunakan kode verifikasi di bawah ini.",
          devCode: code,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Instruksi pengiriman reset password berhasil dikirim ke email.",
    });
  } catch (error) {
    console.error("Forgot password API error:", error);
    return NextResponse.json({ ok: false, message: "Terjadi kesalahan internal pada server bimbingan." }, { status: 500 });
  }
}
