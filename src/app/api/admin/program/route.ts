import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

async function requireAdmin() {
  const session = await getSessionUser();
  return session?.role === "ADMIN";
}

function parseProgram(body: Record<string, unknown>) {
  const title = String(body.title || body.judul || "").trim();
  const code = String(body.code || body.id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).trim();
  const category = String(body.category || body.kategori || "").trim();
  if (!code || !title || !category) return { error: "Kode, judul, dan kategori program wajib diisi." };

  const subjects = Array.isArray(body.subjects) ? body.subjects.map(String) : String(body.subjects || "").split("\n").map((value) => value.trim()).filter(Boolean);
  const facilities = Array.isArray(body.facilities) ? body.facilities.map(String) : String(body.facilities || "").split("\n").map((value) => value.trim()).filter(Boolean);
  return {
    data: {
      code,
      category,
      title,
      target: String(body.target || "").trim(),
      price: Number(body.price || body.harga || 0),
      description: String(body.description || body.deskripsi || "").trim(),
      subjects,
      facilities,
      popular: Boolean(body.popular),
      isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
    },
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const data = await prisma.program.findMany({ orderBy: [{ category: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const parsed = parseProgram((await request.json()) as Record<string, unknown>);
  if (parsed.error) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });
  const data = await prisma.program.create({ data: parsed.data! });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
