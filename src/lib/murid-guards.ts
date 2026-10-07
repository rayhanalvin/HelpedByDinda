import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function requireMuridSession() {
  const session = await getSessionUser();
  if (!session || session.role !== "MURID") {
    return { ok: false, response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, session } as const;
}

export async function requireMuridPaid(sessionUser?: { userId: string } | null) {
  const session = sessionUser ?? (await getSessionUser());
  if (!session) return { ok: false, response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }) };
  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  if (!murid) return { ok: false, response: NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan" }, { status: 404 }) };
  if (murid.statusBayarBulanIni !== "SUCCESS") {
    return { ok: false, response: NextResponse.json({ ok: false, message: "Akses terbatas: silakan lakukan pembayaran terlebih dahulu." }, { status: 403 }) };
  }
  return { ok: true, murid } as const;
}

export async function requireMuridOnboarded(sessionUser?: { userId: string } | null) {
  const session = sessionUser ?? (await getSessionUser());
  if (!session) return { ok: false, response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }) };
  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  if (!murid) return { ok: false, response: NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan" }, { status: 404 }) };
  if (!murid.onboardingComplete) {
    return { ok: false, response: NextResponse.json({ ok: false, message: "Lengkapi formulir pendaftaran terlebih dahulu." }, { status: 403 }) };
  }
  return { ok: true, murid } as const;
}
