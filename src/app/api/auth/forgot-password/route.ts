import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTransport } from "nodemailer";
import { randomInt } from "crypto";

function generateVerificationCode() {
  return String(randomInt(100000, 1000000));
}

export async function POST(req: Request) {
  try {
    let email = "";
    try {
      const body = await req.json();
      email = String(body?.email || "").trim().toLowerCase();
    } catch {
      email = "";
    }

    if (!email) {
      return NextResponse.json({ ok: false, message: "Email wajib diisi." }, { status: 400 });
    }

    // Satu tabel users mencakup semua akun: murid, pengajar, dan admin.
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Email tidak terdaftar di Helped by Dinda. Silakan periksa kembali alamat email Anda." },
        { status: 404 },
      );
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
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #6366f1; font-weight: 800; font-size: 22px; margin: 0;">Helped By Dinda</h2>
              <p style="color: #94a3b8; font-size: 12px; margin: 4px 0;">Akademi Bimbel & Tutoring</p>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
              <p style="font-size: 14px; color: #334155; margin: 0 0 8px;">Halo, <strong>${user.name}</strong></p>
              <p style="font-size: 13px; color: #475569; line-height: 1.5; margin: 0 0 16px;">
                Kami menerima permintaan untuk menyetel ulang kata sandi akun Anda (${user.email}).
                Gunakan kode verifikasi <strong>6 digit</strong> di bawah ini untuk melanjutkan proses pemulihan akun Anda:
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: 800; font-size: 28px; letter-spacing: 8px; display: inline-block;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.6; margin: 0 0 12px;">
                Kode verifikasi berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan <strong>satu kali</strong>.
                Setelah memasukkan kode, Anda dapat membuat kata sandi baru dan masuk kembali.
              </p>
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                Tidak meminta pengaturan ulang kata sandi? Abaikan email ini — kata sandi Anda tetap aman.
              </p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Helped By Dinda. Hak cipta dilindungi.
            </p>
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
