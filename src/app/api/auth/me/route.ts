import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: session });
}
