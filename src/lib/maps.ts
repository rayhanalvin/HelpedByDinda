export function extractIframeSrc(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const m = input.match(/<iframe[^>]+src=(?:"|')([^"']+)(?:"|')[^>]*>/i);
    if (m && m[1]) return m[1];
  } catch {
    // ignore
  }
  return null;
}

export function toEmbedUrl(input: string | null | undefined, fallbackAddress?: string) {
  const fallback = fallbackAddress || "Jl. Damai No.60, RT.5/RW.2, Petukangan Selatan, Pesanggrahan, Kota Jakarta Selatan";
  if (!input) return `https://maps.google.com/maps?q=${encodeURIComponent(fallback)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const trimmed = input.trim();

  // If admin pasted entire iframe HTML, extract src and use it.
  const iframeSrc = extractIframeSrc(trimmed);
  if (iframeSrc) return iframeSrc;

  // Try to parse as URL; if it looks like an embed or contains output=embed, use it directly.
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname.toLowerCase();

    // If input is already an embed URL, preserve and use it directly.
    if (trimmed.includes("pb=") || trimmed.includes("output=embed") || pathname.includes("/embed") || pathname.includes("/maps/embed")) {
      return trimmed;
    }

    // For common google maps links or shortlinks, fall back to a search-based embed using q=.
    if (host.includes("google") || host.includes("maps") || host.includes("goo.gl") || host.includes("g.page") || host.includes("maps.app.goo.gl")) {
      if (fallbackAddress) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(fallbackAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      }
      return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // Non-google URL: attempt to embed via q= using the raw URL string as query.
    return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  } catch {
    // Not a URL: treat as address text
    return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
}
