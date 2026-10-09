import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import { requireMuridPaid, requireMuridOnboarded } from "@/lib/murid-guards";
import { isMuridAllowedForMateri, serializeMaterial, validateMaterialClass } from "@/lib/materi-access";

const materialInclude = { pengajar: { include: { user: true } } } as const;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME = [
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.ms-powerpoint", // .ppt
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
];

async function readFormData(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const body: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (key !== "file" && typeof value === "string") body[key] = value;
    }
    return { body, file };
  }
  return { body: await request.json(), file: null };
}

async function processFile(file: File | null) {
  if (!file) return null;
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Tipe berkas tidak didukung. Gunakan PDF, MP4, gambar, atau dokumen Word/PPT.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran berkas maksimal 25MB.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    fileData: `data:${file.type};base64,${buffer.toString("base64")}`,
    fileName: file.name,
    fileMimeType: file.type,
  };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  // When role is MURID, ensure paid and onboarded before returning materi
  if (session.role === "MURID") {
    const paid = await requireMuridPaid(session);
    if (!paid.ok) return paid.response;
    const onboard = await requireMuridOnboarded(session);
    if (!onboard.ok) return onboard.response;
  }

  const where = session.role === "ADMIN" ? {} : session.role === "PENGAJAR" ? { pengajar: { userId: session.userId } } : { isPublished: true };

  const materials = await prisma.materi.findMany({
    where,
    include: materialInclude,
    orderBy: { createdAt: "desc" },
  });

  const studentClass = session.role === "MURID" ? (await prisma.murid.findUnique({ where: { userId: session.userId }, select: { kelas: true } }))?.kelas : null;

  const filtered = studentClass ? materials.filter((item) => isMuridAllowedForMateri(item.kelas, studentClass)) : materials;

  return NextResponse.json(
    {
      ok: true,
      data: filtered.map((item) => serializeMaterial(item)),
      kelasMurid: studentClass,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { body, file } = await readFormData(request);
    const kelas = validateMaterialClass(body.kelasSasaran || body.kelas);
    if (!kelas) return NextResponse.json({ ok: false, message: "Target kelas atau semester materi tidak valid." }, { status: 400 });

    let pengajarId: string;
    if (session.role === "PENGAJAR") {
      const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!pengajar) return NextResponse.json({ ok: false, message: "Profil pengajar tidak ditemukan." }, { status: 404 });
      pengajarId = pengajar.id;
    } else {
      pengajarId = String(body.pengajarId || "");
      const pengajar = await prisma.pengajar.findUnique({ where: { id: pengajarId } });
      if (!pengajar) return NextResponse.json({ ok: false, message: "Pengajar materi tidak ditemukan." }, { status: 404 });
    }

    const filePayload = await processFile(file);
    if (!filePayload) return NextResponse.json({ ok: false, message: "Berkas materi wajib dilampirkan." }, { status: 400 });

    // Enforce publishing rules: only ADMIN may publish directly.
    const isPublishedRequested = String(body.isPublished) === "true";
    const finalIsPublished = session.role === "ADMIN" ? isPublishedRequested : false;

    const material = await prisma.materi.create({
      data: {
        pengajarId,
        judul: String(body.judul || "Materi Baru").trim(),
        deskripsi: String(body.deskripsi || "").trim() || null,
        mataPelajaran: String(body.mataPelajaran || "Umum").trim(),
        kelas: kelas,
        kategori: String(body.kategori || "Pembelajaran").trim(),
        fileUrl: body.fileUrl ? String(body.fileUrl).trim() : null,
        fileData: filePayload.fileData,
        fileName: filePayload.fileName,
        fileMimeType: filePayload.fileMimeType,
        bunnyVideoId: body.bunnyVideoId ? String(body.bunnyVideoId).trim() : null,
        thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl).trim() : null,
        isPublished: finalIsPublished,
      },
      include: materialInclude,
    });

    return NextResponse.json({ ok: true, data: serializeMaterial(material) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err instanceof Error ? err.message : "Gagal mengunggah materi." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSessionUser();
  if (!session || !["ADMIN", "PENGAJAR"].includes(session.role)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const { body, file } = await readFormData(request);
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });

  const material = await prisma.materi.findUnique({ where: { id }, select: { pengajarId: true } });
  if (!material) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

  if (session.role === "PENGAJAR") {
    const pengajar = await prisma.pengajar.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!pengajar || pengajar.id !== material.pengajarId) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const updateData: {
    isPublished?: boolean;
    judul?: string;
    deskripsi?: string | null;
    kelas?: string;
    mataPelajaran?: string;
    kategori?: string;
    fileData?: string | null;
    fileName?: string | null;
    fileMimeType?: string | null;
    fileUrl?: string | null;
    bunnyVideoId?: string | null;
    thumbnailUrl?: string | null;
  } = {};
  if (typeof body.isPublished !== "undefined") {
    updateData.isPublished = String(body.isPublished) === "true";
  }
  if (typeof body.judul !== "undefined") updateData.judul = String(body.judul).trim();
  if (typeof body.deskripsi !== "undefined") updateData.deskripsi = String(body.deskripsi).trim() || null;
  if (typeof body.mataPelajaran !== "undefined") updateData.mataPelajaran = String(body.mataPelajaran).trim() || "Umum";
  if (typeof body.kategori !== "undefined") updateData.kategori = String(body.kategori).trim() || "Pembelajaran";
  if (typeof body.kelasSasaran !== "undefined") {
    const validated = validateMaterialClass(body.kelasSasaran);
    if (!validated) return NextResponse.json({ ok: false, message: "Invalid kelas" }, { status: 400 });
    updateData.kelas = validated;
  }

  if (file) {
    const filePayload = await processFile(file);
    if (filePayload) {
      updateData.fileData = filePayload.fileData;
      updateData.fileName = filePayload.fileName;
      updateData.fileMimeType = filePayload.fileMimeType;
    }
  }
  if (typeof body.fileUrl !== "undefined") updateData.fileUrl = String(body.fileUrl).trim() || null;
  if (typeof body.bunnyVideoId !== "undefined") updateData.bunnyVideoId = String(body.bunnyVideoId).trim() || null;
  if (typeof body.thumbnailUrl !== "undefined") updateData.thumbnailUrl = String(body.thumbnailUrl).trim() || null;

  const updated = await prisma.materi.update({ where: { id }, data: updateData, include: materialInclude });
  return NextResponse.json({ ok: true, data: serializeMaterial(updated) });
}
