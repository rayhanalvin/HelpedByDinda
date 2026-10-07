export async function geocodeAddress(address: string) {
  if (!address || !address.trim()) return null;
  const cleaned = address.trim();

  // Prefer Google Geocoding API when API key is available
  const googleKey = process.env.GOOGLE_GEOCODE_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleaned)}&key=${googleKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.status === "OK" && Array.isArray(data.results) && data.results.length > 0) {
        const r = data.results[0];
        const loc = r.geometry?.location;
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          return { lat: loc.lat, lng: loc.lng, formatted: r.formatted_address };
        }
      }
    } catch {
      // fallthrough to nominatim
    }
  }

  // Fallback to Nominatim (OpenStreetMap) for geocoding when Google API key is not available
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleaned)}&limit=1`;
    const res2 = await fetch(nomUrl, { headers: { "User-Agent": "HelpedByDinda/1.0 (contact@helpedbydinda.id)" } });
    const arr = await res2.json();
    if (Array.isArray(arr) && arr.length > 0) {
      const item = arr[0];
      return { lat: Number(item.lat), lng: Number(item.lon), formatted: item.display_name };
    }
  } catch {
    // ignore
  }

  return null;
}
