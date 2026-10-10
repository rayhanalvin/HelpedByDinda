import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-session";
import * as XLSX from "xlsx";

const COLUMN_ALIASES: Record<string, string> = {
  idsiswa: "idSiswa",
  id: "idSiswa",
  "id siswa": "idSiswa",
  pengelompokan: "pengelompokan",
  "nama lengkap": "name",
  nama: "name",
  "nama panggilan": "namaPanggilan",
  panggilan: "namaPanggilan",
  kelas: "kelas",
  semester: "kelas",
  jurusan: "jurusan",
  "sekolah / kampus": "kampus",
  sekolah: "sekolah",
  kampus: "kampus",
  "alamat rumah": "alamatRumah",
  alamat: "alamatRumah",
  "nomor whatsapp": "phone",
  whatsapp: "phone",
  phone: "phone",
  email: "email",
  "jenis kelas": "jenisKelas",
  "metode bimbel": "metodeBimbel",
  "metode": "metodeBimbel",
  "jenis bimbingan": "jenisBimbingan",
  "tanggal mulai": "tanggalMulai",
  "lokasi bimbel": "lokasiBimbel",
  "alamat bimbel": "alamatBimbel",
  pengajar: "pengajarNama",
  "catatan tambahan": "catatan",
  catatan: "catatan",
  "special diskon": "diskonPendaftaran",
  diskon: "diskonPendaftaran",
  "harga pendaftaran": "hargaPendaftaran",
  "harga / bulan": "hargaBulanan",
  "harga bulanan": "hargaBulanan",
  paket: "hargaBulanan",
  "nama wali": "namaWali",
  "whatsapp wali": "phoneWali",
  "password awal": "password",
  password: "password",
};

function headerKey(header: string): string {
  const normalized = String(header || "").toLowerCase().replace(/[_\-\s]+/g, " ").trim();
  return COLUMN_ALIASES[normalized] || normalized;
}

function cellText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function cellNumber(value: unknown): number | null {
  const text = cellText(value).replace(/[^0-9]/g, "");
  return text ? Number(text) : null;
}

function parseKelas(value: unknown, fallback: string): string {
  const text = cellText(value).toUpperCase();
  if (!text) return fallback;
  if (/^SD/i.test(text)) return `SD${text.replace(/\D/g, "").slice(0, 1) || "1"}`;
  if (/^SMP/i.test(text)) return `SMP${text.replace(/\D/g, "").slice(0, 1) || "7"}`;
  if (/^(SMA|SMK)/i.test(text)) return `SMA${text.replace(/\D/g, "").slice(0, 2) || "10"}`;
  if (/^UNIV|MAHAS/i.test(text)) return `UNIV${text.replace(/\D/g, "").slice(0, 1) || "1"}`;
  if (/^UTBK/i.test(text)) return "UTBK";
  return fallback;
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const base64 = String(body.file || "");
  if (!base64) return NextResponse.json({ ok: false, message: "File Excel wajib." }, { status: 400 });

  const buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return NextResponse.json({ ok: false, message: "File Excel tidak punya sheet." }, { status: 400 });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" }) as Record<string, unknown>[];
  if (!rows.length) return NextResponse.json({ ok: false, message: "File Excel kosong." }, { status: 400 });

  const pengajarByName = new Map<string, string>();
  const pengajarRows = await prisma.pengajar.findMany({ select: { id: true, user: { select: { name: true } } } });
  for (const p of pengajarRows) pengajarByName.set((p.user.name || "").toLowerCase().trim(), p.id);

  let createdCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const rawRow of rows) {
    const row: Record<string, string | number | null> = {};
    for (const [header, value] of Object.entries(rawRow)) {
      row[headerKey(header)] = cellText(value);
    }
    const email = cellText(row.email).toLowerCase();
    const name = cellText(row.name);
    if (!email && !name) {
      skippedCount += 1;
      continue;
    }
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        skippedCount += 1;
        errors.push(`${email}: sudah terdaftar`);
        continue;
      }
    }

    const kelasValue = parseKelas(row.kelas, "SMA10");
    const password = cellText(row.password) || "student123";
    const hashed = await bcrypt.hash(password, 10);
    const pengajarId = cellText(row.pengajarNama) ? pengajarByName.get(cellText(row.pengajarNama).toLowerCase().trim()) || null : null;
    const tanggalMulaiRaw = cellText(row.tanggalMulai);
    const tanggalMulai = tanggalMulaiRaw ? new Date(tanggalMulaiRaw) : undefined;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: email || `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}-${Date.now()}@helped.local`,
            passwordHash: hashed,
            name,
            phone: cellText(row.phone),
            role: "MURID",
          },
        });
        return tx.murid.create({
          data: {
            userId: user.id,
            kelas: kelasValue,
            sekolah: cellText(row.sekolah),
            idSiswa: cellText(row.idSiswa) || null,
            pengelompokan: cellText(row.pengelompokan) || null,
            namaPanggilan: cellText(row.namaPanggilan) || null,
            jurusan: cellText(row.jurusan) || null,
            kampus: cellText(row.kampus) || null,
            alamatRumah: cellText(row.alamatRumah) || null,
            jenisKelas: cellText(row.jenisKelas) || null,
            metodeBimbel: cellText(row.metodeBimbel) || null,
            jenisBimbingan: cellText(row.jenisBimbingan) || null,
            tanggalMulai,
            lokasiBimbel: cellText(row.lokasiBimbel) || null,
            alamatBimbel: cellText(row.alamatBimbel) || null,
            pengajarId,
            catatan: cellText(row.catatan) || null,
            hargaPendaftaran: cellNumber(row.hargaPendaftaran),
            diskonPendaftaran: cellNumber(row.diskonPendaftaran),
            paketBulanan: cellNumber(row.hargaBulanan) || 900000,
            defaultPassword: password,
            namaWali: cellText(row.namaWali) || null,
            phoneWali: cellText(row.phoneWali) || null,
            statusBayarBulanIni: "PENDING",
            isActive: true,
          },
        });
      });
      await prisma.muridKelas.createMany({ data: [{ muridId: created.id, kelas: kelasValue }], skipDuplicates: true });
      createdCount += 1;
    } catch (error) {
      skippedCount += 1;
      errors.push(`${name || email}: ${error instanceof Error ? error.message : "gagal"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    message: `Impor berhasil: ${createdCount} murid baru, ${skippedCount} dipakas/keberebahut.`,
    data: { createdCount, skippedCount, errors: errors.slice(0, 20) },
  });
}