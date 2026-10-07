import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

// Public-ish endpoint for actor dashboards to fetch recent reminders (read-only)
export async function GET() {
  const session = await getSessionUser();
  if (!session || !["PENGAJAR", "MURID"].includes(session.role)) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const logs = await prisma.reminderLog.findMany({
    where: { userId: session.userId },
    orderBy: { sentAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ ok: true, data: logs });
}
