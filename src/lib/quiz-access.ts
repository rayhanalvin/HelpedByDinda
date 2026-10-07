import { getKelasGroup } from "@/lib/kelas";

export function isSameLocalDate(first: Date, second: Date) {
  return first.toLocaleDateString("en-CA") === second.toLocaleDateString("en-CA");
}

export function isQuizScheduleActive(schedule: { tanggal: Date; jamMulai: string; jamSelesai: string; status: string }, now = new Date()) {
  if (schedule.status === "SELESAI" || !isSameLocalDate(schedule.tanggal, now)) return false;
  const [startHour, startMinute] = schedule.jamMulai.split(":").map(Number);
  const [endHour, endMinute] = schedule.jamSelesai.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  return Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function canQuizUseClass(quizClass: string, studentClass: string) {
  if (quizClass === studentClass) return true;
  return Boolean(getKelasGroup(quizClass) && getKelasGroup(quizClass) === getKelasGroup(studentClass));
}

export function normalizeQuestions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((question): question is { id: string; pertanyaan: string; opsi: string[]; jawabanBenar: number; pembahasan: string } => {
    if (!question || typeof question !== "object") return false;
    const item = question as Record<string, unknown>;
    return typeof item.pertanyaan === "string" && Array.isArray(item.opsi) && typeof item.jawabanBenar === "number";
  });
}
