import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

function getSecret() {
  const rawSecret = process.env.AUTH_SECRET;
  if (!rawSecret) {
    throw new Error("AUTH_SECRET environment variable is required and must be set");
  }
  return new TextEncoder().encode(rawSecret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  role: "ADMIN" | "PENGAJAR" | "MURID";
};

export function normalizeRole(role?: string | null) {
  const normalized = String(role || "")
    .trim()
    .toUpperCase();
  if (normalized === "ADMIN" || normalized === "PENGAJAR" || normalized === "MURID") return normalized as SessionPayload["role"];
  return "MURID";
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload, role: normalizeRole(payload.role) }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const normalizedPayload = {
    ...(payload as Record<string, unknown>),
    role: normalizeRole(String((payload as Record<string, unknown>).role || "")),
  };
  return normalizedPayload as unknown as SessionPayload;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hbd_session")?.value;
  if (!token) return null;

  try {
    const session = await verifySessionToken(token);
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return null;
    return session;
  } catch {
    return null;
  }
}
