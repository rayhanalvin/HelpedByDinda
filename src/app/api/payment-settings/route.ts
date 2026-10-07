import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

const settingsId = "default";

export async function GET() {
  const settings = await prisma.paymentSettings.findUnique({
    where: { id: settingsId },
    select: { bankName: true, accountNumber: true, accountName: true, centerAddress: true, centerLat: true, centerLng: true, googleMapsUrl: true },
  });
  return NextResponse.json({ ok: true, data: settings }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = {
    bankName: String(body.bankName || "").trim() || null,
    accountNumber: String(body.accountNumber || "").trim() || null,
    accountName: String(body.accountName || "").trim() || null,
    centerAddress: String(body.centerAddress || "").trim() || null,
    googleMapsUrl: String(body.googleMapsUrl || "").trim() || null,
  };

  const settings = await prisma.paymentSettings.upsert({
    where: { id: settingsId },
    update: data,
    create: { id: settingsId, ...data },
  });

  // If admin provided a centerAddress, also ensure siteSettings.address is updated to avoid divergence.
  if (data.centerAddress) {
    // geocode the provided address and persist coordinates and canonical formatted address when available
    const { geocodeAddress } = await import("@/lib/geocode");
    const geo = await geocodeAddress(data.centerAddress);
    const canonical = geo?.formatted ?? data.centerAddress;
    await prisma.paymentSettings.update({ where: { id: settings.id }, data: { centerLat: geo?.lat ?? null, centerLng: geo?.lng ?? null, centerAddress: canonical } });
    await prisma.siteSettings.upsert({ where: { id: "default" }, update: { address: canonical }, create: { id: "default", address: canonical } });
  }

  return NextResponse.json({ ok: true, data: settings });
}
