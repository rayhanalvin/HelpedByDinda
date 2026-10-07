export async function apiFetch(path: string, init?: RequestInit) {
  const base = path.startsWith("/") ? path : `/${path}`;
  return fetch(base, { ...init, credentials: "include" });
}
