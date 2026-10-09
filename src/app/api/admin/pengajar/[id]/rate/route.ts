import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pengajar = await prisma.pengajar.findUnique({ where: { id } });
  if (!pengajar) return NextResponse.json({ ok: false, message: "Pengajar tidak ditemukan." }, { status: 404 });

  const body = await request.json();
  const ratePerSession = body.ratePerSession !== undefined && body.ratePerSession !== "" ? Number(body.ratePerSession) : null;
  const rateSessions = Array.isArray(body.rateSessions) ? body.rateSessions : null;

  if (ratePerSession !== null && Number.isNaN(ratePerSession)) {
    return NextResponse.json({ ok: false, message: "Nominal tarif harus berupa angka." }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (ratePerSession !== null) {
      await tx.pengajar.update({ where: { id }, data: { ratePerSession } });
    }

    if (rateSessions) {
      const existingRates = await tx.pengajarRate.findMany({ where: { pengajarId: id } });
      const seen = new Set<string>();
      for (const raw of rateSessions) {
        if (!raw || typeof raw !== "object") continue;
        const entry = raw as Record<string, unknown>;
        const kelasGroup = String(entry.kelasGroup || "").trim();
        const mode = String(entry.mode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE";
        const rateValue = Number(entry.rate ?? entry.ratePerSession ?? 0);
        if (!kelasGroup || Number.isNaN(rateValue)) continue;
        seen.add(`${kelasGroup}|${mode}`);
        await tx.pengajarRate.upsert({
          where: { pengajarId_kelasGroup_mode: { pengajarId: id, kelasGroup, mode } },
          create: { pengajarId: id, kelasGroup, mode, ratePerSession: rateValue },
          update: { ratePerSession: rateValue },
        });
      }
      for (const existing of existingRates) {
        if (!seen.has(`${existing.kelasGroup}|${existing.mode}`)) {
          await tx.pengajarRate.delete({ where: { id: existing.id } });
        }
      }
    }

    return tx.pengajar.findUnique({
      where: { id },
      include: { user: { select: { name: true } }, rateSessions: true },
    });
  });

  return NextResponse.json({
    ok: true,
    data: {
      id: updated!.id,
      ratePerSession: updated!.ratePerSession,
      rateSessions: updated!.rateSessions.map((rate) => ({ kelasGroup: rate.kelasGroup, mode: rate.mode, rate: rate.ratePerSession })),
    },
  });
}