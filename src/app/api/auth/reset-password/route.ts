import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ ok: false, message: "Token dan sandi baru wajib diisi." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, message: "Kata sandi minimal berisi 6 karakter." }, { status: 400 });
    }

    // Rate-limit: maksimal 5 percobaan kode sebelum harus minta kode baru
    const resetTokenStr = String(token);
    const attemptLock = await prisma.user.findFirst({
      where: {
        ...(email ? { email: String(email).trim().toLowerCase() } : {}),
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

    // Locate the matching token (optionally scoped to the email)
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        ...(email ? { email: String(email).trim().toLowerCase() } : {}),
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
      return NextResponse.json({ ok: false, message: "Tautan reset tidak valid atau masa berlaku telah kedaluwarsa." }, { status: 400 });
    }

    // Salt and hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

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
