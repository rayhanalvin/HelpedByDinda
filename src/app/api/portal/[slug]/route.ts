import { NextResponse } from "next/server";
import { getPortalContent } from "@/lib/portal-content";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const content = await getPortalContent(slug);
  return NextResponse.json({ ok: true, data: content }, { headers: { "Cache-Control": "no-store" } });
}
