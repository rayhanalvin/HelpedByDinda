import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { isMuridPaymentUnlocked } from "@/lib/murid-guards";

const VALID_CATEGORIES = ["SD", "SMP", "SMA", "KULIAH"];

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "MURID") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const category = String(body.category || "").trim().toUpperCase();
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, message: "Kategori pendaftaran tidak valid. Pilih: SD, SMP, SMA, atau Kuliah." }, { status: 400 });
  }

  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  if (!murid) return NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan." }, { status: 404 });

  if (!(await isMuridPaymentUnlocked(murid.id))) {
    return NextResponse.json({ ok: false, message: "Silakan selesaikan pembayaran terlebih dahulu sebelum mengisi formulir pendaftaran." }, { status: 400 });
  }

  const updated = await prisma.murid.update({
    where: { id: murid.id },
    data: { onboardingCategory: category, onboardingComplete: true },
  });

  return NextResponse.json({ ok: true, data: { onboardingComplete: updated.onboardingComplete, onboardingCategory: updated.onboardingCategory } });
}
