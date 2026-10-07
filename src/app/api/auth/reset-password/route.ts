import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ ok: false, message: "Token dan sandi baru wajib diisi." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ ok: false, message: "Kata sandi minimal berisi 6 karakter." }, { status: 400 });
    }

    // Locate the matching token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
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
