import type { AttendanceSession } from "@/lib/dummy-data";

export const ATTENDANCE_STORAGE_KEY = "hbd-attendance-sessions";

export function readAttendanceSessions(): AttendanceSession[] {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function writeAttendanceSessions(sessions: AttendanceSession[]) {
  window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(sessions));
}

export function upsertAttendanceSession(session: AttendanceSession) {
  const sessions = readAttendanceSessions();
  const next = [...sessions.filter((item) => item.id !== session.id && !(item.userId === session.userId && item.jadwalId === session.jadwalId)), session];
  writeAttendanceSessions(next);
  return session;
}

export function updateAttendanceSession(sessionId: number, update: Partial<AttendanceSession>) {
  const sessions = readAttendanceSessions();
  const next = sessions.map((item) => (item.id === sessionId ? { ...item, ...update } : item));
  writeAttendanceSessions(next);
  return next.find((item) => item.id === sessionId);
}

export function getCurrentLocation(): Promise<AttendanceSession["mulaiLocation"]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Perangkat tidak mendukung lokasi."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: Math.round(coords.accuracy) }),
      () => reject(new Error("Izin lokasi diperlukan untuk mencatat absensi.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export function formatLocation(location?: AttendanceSession["mulaiLocation"]) {
  return location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Lokasi belum tersedia";
}

export function mapUrl(location?: AttendanceSession["mulaiLocation"]) {
  return location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : "#";
}
