import { getKelasGroup, getKelasLabel, isValidKelas } from "@/lib/kelas";

export function isMuridAllowedForMateri(materialClass: string, studentClass: string) {
  if (!materialClass || !studentClass) return false;
  if (materialClass === studentClass) return true;

  const matGroup = getKelasGroup(materialClass);
  const stuGroup = getKelasGroup(studentClass);
  if (matGroup && stuGroup && matGroup === stuGroup) return true;

  return false;
}

export function validateMaterialClass(value: unknown) {
  const materialClass = String(value || "").trim();
  return isValidKelas(materialClass) ? materialClass : null;
}

export function serializeMaterial(item: {
  id: string;
  judul: string;
  deskripsi: string | null;
  mataPelajaran: string;
  kelas: string;
  kategori: string;
  fileUrl: string | null;
  fileData: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  bunnyVideoId: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  createdAt: Date;
  pengajar?: { user: { name: string } } | null;
}) {
  return {
    id: item.id,
    judul: item.judul,
    deskripsi: item.deskripsi || "",
    mataPelajaran: item.mataPelajaran,
    kelasSasaran: item.kelas,
    kelasLabel: getKelasLabel(item.kelas),
    kategori: item.kategori,
    fileUrl: item.fileUrl,
    fileData: item.fileData,
    fileName: item.fileName,
    fileMimeType: item.fileMimeType,
    bunnyVideoId: item.bunnyVideoId,
    thumbnailUrl: item.thumbnailUrl,
    isPublished: item.isPublished,
    createdAt: item.createdAt,
    pengajarNama: item.pengajar?.user.name || "Pengajar",
  };
}
