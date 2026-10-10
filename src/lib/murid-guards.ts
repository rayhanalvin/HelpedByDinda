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

/**
 * A murid is considered paid/unlocked ONLY when:
 * - there is no PENDING/PROCESSING payment (invoice belum dibayar / belum dikonfirmasi), and
 * - the most recent payment has been confirmed SUCCESS.
 * This is the source of truth and works even with multiple/repeat invoices.
 */
export async function isMuridPaymentUnlocked(muridId: string) {
  const pending = await prisma.payment.findFirst({
    where: { muridId, status: { in: ["PENDING", "PROCESSING"] } },
    select: { id: true },
  });
  if (pending) return false;
  const latest = await prisma.payment.findFirst({
    where: { muridId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });
  return latest?.status === "SUCCESS";
}

export async function requireMuridPaid(sessionUser?: { userId: string } | null) {
  const session = sessionUser ?? (await getSessionUser());
  if (!session) return { ok: false, response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }) };
  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  if (!murid) return { ok: false, response: NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan" }, { status: 404 }) };
  if (!(await isMuridPaymentUnlocked(murid.id))) {
    return { ok: false, response: NextResponse.json({ ok: false, message: "Akses terbatas: silakan lakukan pembayaran terlebih dahulu." }, { status: 403 }) };
  }
  return { ok: true, murid } as const;
}

export async function requireMuridFullAccess(sessionUser?: { userId: string } | null) {
  const session = sessionUser ?? (await getSessionUser());
  if (!session) return { ok: false, response: NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 }) };
  const murid = await prisma.murid.findUnique({ where: { userId: session.userId } });
  if (!murid) return { ok: false, response: NextResponse.json({ ok: false, message: "Profil murid tidak ditemukan" }, { status: 404 }) };
  if (!(await isMuridPaymentUnlocked(murid.id))) {
    return { ok: false, response: NextResponse.json({ ok: false, message: "Akses terbatas: silakan lakukan pembayaran terlebih dahulu." }, { status: 403 }) };
  }
  if (!murid.onboardingComplete) {
    return { ok: false, response: NextResponse.json({ ok: false, message: "Lengkapi formulir pendaftaran terlebih dahulu." }, { status: 403 }) };
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
