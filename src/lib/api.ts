export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(input, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: isFormData ? init?.headers : { "Content-Type": "application/json", ...(init?.headers || {}) },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Request gagal.");
  }

  return data as T;
}
