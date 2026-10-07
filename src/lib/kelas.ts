export type KelasGroup = "SD" | "SMP" | "SMA_SMK" | "MAHASISWA" | "UTBK";

export const KELAS_GROUPS: { value: KelasGroup; label: string }[] = [
  { value: "SD", label: "SD Kelas 1–6" },
  { value: "SMP", label: "SMP Kelas 7–9" },
  { value: "SMA_SMK", label: "SMA/SMK Kelas 10–12" },
  { value: "MAHASISWA", label: "Mahasiswa Semester 1–8" },
  { value: "UTBK", label: "UTBK / Persiapan" },
];

export const KELAS_OPTIONS: { value: string; label: string; group: KelasGroup }[] = [
  ...Array.from({ length: 6 }, (_, index) => ({ value: `SD${index + 1}`, label: `SD Kelas ${index + 1}`, group: "SD" as const })),
  ...Array.from({ length: 3 }, (_, index) => ({ value: `SMP${index + 7}`, label: `SMP Kelas ${index + 7}`, group: "SMP" as const })),
  ...Array.from({ length: 3 }, (_, index) => ({ value: `SMA${index + 10}`, label: `SMA/SMK Kelas ${index + 10}`, group: "SMA_SMK" as const })),
  ...Array.from({ length: 8 }, (_, index) => ({ value: `UNIV${index + 1}`, label: `Mahasiswa Semester ${index + 1}`, group: "MAHASISWA" as const })),
  { value: "UTBK", label: "Intensif UTBK / Persiapan", group: "UTBK" },
];

const LEGACY_KELAS_LABELS: Record<string, string> = {
  SD: "SD Kelas 1–6",
  SMP: "SMP Kelas 7–9",
  SMA: "SMA/SMK Kelas 10–12",
};

export function isValidKelas(value: string) {
  return KELAS_OPTIONS.some((option) => option.value === value) || Object.hasOwn(LEGACY_KELAS_LABELS, value);
}

export function getKelasGroup(code?: string | null): KelasGroup | null {
  if (!code) return null;
  const option = KELAS_OPTIONS.find((item) => item.value === code);
  if (option) return option.group;
  if (code === "SD" || code === "SMP" || code === "SMA") return code === "SMA" ? "SMA_SMK" : code;
  return code === "UTBK" ? "UTBK" : null;
}

export function getKelasValue(code?: string | null) {
  if (code === "SD") return "SD1";
  if (code === "SMP") return "SMP7";
  if (code === "SMA") return "SMA10";
  return code || "SMA10";
}

export function getKelasLabel(code?: string | null) {
  if (!code) return "-";
  const found = KELAS_OPTIONS.find((o) => o.value === code);
  return found ? found.label : LEGACY_KELAS_LABELS[code] || code;
}
