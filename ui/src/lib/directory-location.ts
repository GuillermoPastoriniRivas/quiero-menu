/** Usa coordenadas reales cuando existen; de lo contrario contextualiza la
 * dirección para no mandar calles homónimas a otra ciudad. */
export function directoryMapsUrl(local: {
  name: string;
  address?: string;
  city?: string;
  region?: string;
  countrySlug?: string;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  const coordinates = typeof local.lat === "number" && Number.isFinite(local.lat) &&
    typeof local.lng === "number" && Number.isFinite(local.lng);
  if (!coordinates && !local.address?.trim()) return null;
  const query = coordinates
    ? `${local.lat},${local.lng}`
    : [local.name, local.address, local.city, local.region, local.countrySlug]
        .filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}
