export interface Coordinates {
  lat: number;
  lng: number;
}

export async function geocodeAddress(parts: (string | null | undefined)[]): Promise<Coordinates | null> {
  const query = parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
  if (!query) return null;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error("geocode");
  const results = (await res.json()) as { lat: string; lon: string }[];
  if (results.length === 0) return null;
  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}

export function currentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      reject,
      { timeout: 10_000, enableHighAccuracy: true },
    );
  });
}

export function mapsLink(coordinates: Coordinates): string {
  return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
}

export function roundCoordinates(coordinates: Coordinates): Coordinates {
  return {
    lat: Math.round(coordinates.lat * 1e6) / 1e6,
    lng: Math.round(coordinates.lng * 1e6) / 1e6,
  };
}
