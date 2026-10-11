import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    let token: unknown;
    let email: unknown;
    let password: unknown;
    try {
      const body = await req.json();
      token = body?.token;
      email = body?.email;
      password = body?.password;
    } catch {
      return NextResponse.json({ ok: false, message: "Body permintaan tidak valid." }, { status: 400 });
    }

    const tokenStr = String(token || "");
    const passwordStr = String(password || "");
    const emailStr = String(email || "").trim().toLowerCase();

    if (!tokenStr || !emailStr || !passwordStr) {
      return NextResponse.json({ ok: false, message: "Email, kode verifikasi, dan sandi baru wajib diisi." }, { status: 400 });
    }

    if (passwordStr.length < 6) {
      return NextResponse.json({ ok: false, message: "Kata sandi minimal berisi 6 karakter." }, { status: 400 });
    }

    // Rate-limit: maksimal 5 percobaan kode sebelum harus minta kode baru
    const resetTokenStr = tokenStr;
    const attemptLock = await prisma.user.findFirst({
      where: {
        resetToken: resetTokenStr,
      },
      select: { id: true, resetAttempts: true },
    });

    if (attemptLock && attemptLock.resetAttempts >= 5) {
      return NextResponse.json(
        { ok: false, message: "Terlalu banyak percobaan. Silakan minta kode verifikasi baru." },
        { status: 429 },
      );
    }

    // Kode verifikasi hanya berlaku untuk akun dengan email yang sesuai.
    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenStr,
        email: emailStr,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      if (attemptLock) {
        await prisma.user.update({
          where: { id: attemptLock.id },
          data: { resetAttempts: { increment: 1 } },
        });
      }
      return NextResponse.json(
        { ok: false, message: "Kode verifikasi tidak sesuai dengan email Anda atau sudah kedaluwarsa. Silakan minta kode baru." },
        { status: 400 },
      );
    }

    // Salt and hash the new password
    const passwordHash = await bcrypt.hash(passwordStr, 10);

    // Reset database fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        resetAttempts: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Kata sandi Anda telah berhasil diperbarui! Silakan masuk kembali.",
    });
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json({ ok: false, message: "Gagal mengganti kata sandi. Coba lagi." }, { status: 500 });
  }
}
