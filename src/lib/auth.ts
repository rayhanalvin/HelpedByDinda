import { DUMMY_ADMIN, DUMMY_MURID, DUMMY_PENGAJAR } from "@/lib/dummy-data";

export type AuthRole = "admin" | "pengajar" | "murid";

export interface AuthCredentials {
  email: string;
  password: string;
  role: AuthRole;
}

export function authenticate(credentials: AuthCredentials) {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const normalizedPassword = credentials.password.trim();

  if (credentials.role === "admin") {
    const isValid = DUMMY_ADMIN.email.toLowerCase() === normalizedEmail && DUMMY_ADMIN.password === normalizedPassword;
    return isValid ? { ok: true, user: DUMMY_ADMIN } : { ok: false, message: "Email atau password admin salah." };
  }

  if (credentials.role === "pengajar") {
    const teacher = DUMMY_PENGAJAR.find((item) => item.email.toLowerCase() === normalizedEmail);
    if (!teacher) {
      return { ok: false, message: "Akun pengajar tidak ditemukan." };
    }

    if (teacher.password !== normalizedPassword) {
      return { ok: false, message: "Password pengajar salah." };
    }

    return { ok: true, user: teacher };
  }

  const student = DUMMY_MURID.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!student) {
    return { ok: false, message: "Akun murid tidak ditemukan." };
  }

  if (student.password !== normalizedPassword) {
    return { ok: false, message: "Password murid salah." };
  }

  return { ok: true, user: student };
}
