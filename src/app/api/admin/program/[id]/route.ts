import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";

async function requireAdmin() {
  const session = await getSessionUser();
  return session?.role === "ADMIN";
}

function parseProgram(body: Record<string, unknown>) {
  const title = String(body.title || body.judul || "").trim();
  const category = String(body.category || body.kategori || "").trim();
  if (!title || !category) return { error: "Judul dan kategori program wajib diisi." };
  const subjects = Array.isArray(body.subjects) ? body.subjects.map(String) : String(body.subjects || "").split("\n").map((value) => value.trim()).filter(Boolean);
  const facilities = Array.isArray(body.facilities) ? body.facilities.map(String) : String(body.facilities || "").split("\n").map((value) => value.trim()).filter(Boolean);
  return {
    data: {
      code: String(body.code || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).trim(),
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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = parseProgram((await request.json()) as Record<string, unknown>);
  if (parsed.error) return NextResponse.json({ ok: false, message: parsed.error }, { status: 400 });
  try {
    const data = await prisma.program.update({ where: { id }, data: parsed.data! });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code: string }).code;
      if (code === "P2002") {
        return NextResponse.json({ ok: false, message: `Kode program "${parsed.data!.code}" sudah dipakai program lain.` }, { status: 409 });
      }
      if (code === "P2025") {
        return NextResponse.json({ ok: false, message: "Program tidak ditemukan. Mungkin sudah dihapus." }, { status: 404 });
      }
    }
    console.error("Gagal memperbarui program:", error);
    return NextResponse.json({ ok: false, message: "Gagal memperbarui program. Silakan coba lagi." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ ok: false, message: "Program tidak ditemukan. Mungkin sudah dihapus." }, { status: 404 });
    }
    console.error("Gagal menghapus program:", error);
    return NextResponse.json({ ok: false, message: "Gagal menghapus program. Silakan coba lagi." }, { status: 500 });
  }
}
