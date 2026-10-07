import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { isValidKelas } from "@/lib/kelas";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.nama || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const avatarUrl = typeof body.avatarUrl === "string" && body.avatarUrl ? body.avatarUrl.trim() : null;
    const kelas = String(body.kelas || "SMA10");
    const sekolah = String(body.sekolah || "");
    const namaWali = String(body.namaWali || "");
    const phoneWali = String(body.phoneWali || "");
    const programId = String(body.programId || "").trim();

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, message: "Nama, email, dan password wajib diisi." }, { status: 400 });
    }

    if (!isValidKelas(kelas)) {
      return NextResponse.json({ ok: false, message: "Pilihan kelas atau semester tidak valid." }, { status: 400 });
    }

    // Check existing email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, message: "Email sudah terdaftar." }, { status: 409 });
    }

    // Create user and murid record within a transaction
    const passwordHash = await bcrypt.hash(password, 10);

    const selectedProgram = programId ? await prisma.program.findFirst({ where: { OR: [{ id: programId }, { code: programId }], isPublished: true } }) : null;

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          phone: null,
          avatarUrl: avatarUrl,
          role: "MURID",
        },
      });

      const murid = await tx.murid.create({
        data: {
          userId: user.id,
          kelas,
          sekolah,
          namaWali: namaWali || null,
          phoneWali: phoneWali || null,
          onboardingComplete: false,
          onboardingCategory: null,
          paketBulanan: selectedProgram?.price || 0,
          programId: selectedProgram?.code || null,
          programNama: selectedProgram?.title || null,
          programKategori: selectedProgram?.category || null,
          statusBayarBulanIni: "PENDING",
        },
      });

      return { user, murid };
    });

    return NextResponse.json({ ok: true, user: { id: created.user.id, email: created.user.email, name: created.user.name } });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ ok: false, message: "Gagal mendaftar akun." }, { status: 500 });
  }
}
