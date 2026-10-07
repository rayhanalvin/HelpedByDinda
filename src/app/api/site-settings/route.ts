import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

const settingsId = "default";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: settingsId } });
  return NextResponse.json({ ok: true, data: settings }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = {
    name: String(body.name || "").trim() || null,
    tagline: String(body.tagline || "").trim() || null,
    logoUrl: String(body.logoUrl || "").trim() || null,
    wordmark: String(body.wordmark || "").trim() || null,
    supportEmail: String(body.supportEmail || "").trim() || null,
    phone: String(body.phone || "").trim() || null,
    address: String(body.address || "").trim() || null,
  };

  const settings = await prisma.siteSettings.upsert({ where: { id: settingsId }, update: data, create: { id: settingsId, ...data } });

  // If admin provided an address, also persist into paymentSettings.centerAddress to keep both in sync.
  if (data.address) {
    const { geocodeAddress } = await import("@/lib/geocode");
    const geo = await geocodeAddress(data.address);
    const canonical = geo?.formatted ?? data.address;
    await prisma.paymentSettings.upsert({ where: { id: "default" }, update: { centerAddress: canonical, centerLat: geo?.lat ?? null, centerLng: geo?.lng ?? null }, create: { id: "default", centerAddress: canonical, centerLat: geo?.lat ?? null, centerLng: geo?.lng ?? null } });
  }
  return NextResponse.json({ ok: true, data: settings });
}
