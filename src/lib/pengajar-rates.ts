import { prisma } from "@/lib/db";

export type PengajarRateKey = { kelasGroup: string; mode: "ONLINE" | "OFFLINE" };

export type PengajarRateValue = {
  kelasGroup: string;
  mode: "ONLINE" | "OFFLINE";
  rate: number;
};

export const RATE_KELAS_GROUPS: { value: string; label: string }[] = [
  { value: "SD", label: "SD Kelas 1–6" },
  { value: "SMP", label: "SMP Kelas 7–9" },
  { value: "SMA_SMK", label: "SMA/SMK Kelas 10–12" },
  { value: "MAHASISWA", label: "Mahasiswa Semester 1–8" },
  { value: "UTBK", label: "UTBK / Persiapan" },
];

export const RATE_MODE_LABELS: Record<"ONLINE" | "OFFLINE", string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

export const MODE_ICON_LABELS: Record<"ONLINE" | "OFFLINE", string> = {
  ONLINE: "🌐",
  OFFLINE: "🏫",
};

export function normalizeRateSessions(value: unknown): PengajarRateValue[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: PengajarRateValue[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as Record<string, unknown>;
    const kelasGroup = String(entry.kelasGroup || "").trim();
    const mode = String(entry.mode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE";
    const rate = Number(entry.rate ?? entry.ratePerSession ?? 0);
    if (!kelasGroup || Number.isNaN(rate)) continue;
    const key = `${kelasGroup}|${mode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ kelasGroup, mode, rate });
  }
  return result;
}

type RateContext = {
  kelasGroup?: string | null;
  mode?: string | null;
};

export function resolvePengajarRate(rates: PengajarRateValue[], fallback: number, ctx: RateContext = {}): number {
  const group = (ctx.kelasGroup || "").trim();
  const mode = (ctx.mode || "ONLINE").toUpperCase() === "OFFLINE" ? "OFFLINE" : "ONLINE";
  if (group) {
    const exact = rates.find((rate) => rate.kelasGroup === group && rate.mode === mode);
    if (exact) return exact.rate;
    const anyMode = rates.find((rate) => rate.kelasGroup === group);
    if (anyMode) return anyMode.rate;
  }
  const any = rates.find((rate) => rate.mode === mode);
  if (any && !group) return any.rate;
  return fallback;
}

export async function loadPengajarRates(pengajarId: string): Promise<PengajarRateValue[]> {
  const rows = await prisma.pengajarRate.findMany({ where: { pengajarId } });
  return rows.map((row) => ({ kelasGroup: row.kelasGroup, mode: row.mode, rate: row.ratePerSession }));
}

export function rateLabel(value: PengajarRateValue): string {
  const group = RATE_KELAS_GROUPS.find((item) => item.value === value.kelasGroup);
  return `${group?.label || value.kelasGroup} • ${RATE_MODE_LABELS[value.mode]}`;
}