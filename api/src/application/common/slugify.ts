/**
 * Normaliza un nombre de ciudad a slug URL-safe: minúsculas, sin acentos,
 * espacios y separadores colapsados a un solo guión. Se guarda en
 * Restaurant.citySlug al escribir la ciudad y es la join key de las
 * páginas de directorio (/en/{countrySlug}/{regionSlug}/{citySlug}).
 * Sirve igual para cities, regions (provincia/departamento/estado) y países:
 * son todos subdivisiones con distinto nombre y misma normalización.
 */
export function slugifyCity(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * countrySlug URL-friendly (SEO: "argentina", no "ar") desde el código/
 * nombre de país que existe en Restaurant.country. Fallback: normalización.
 */
const COUNTRY_SLUG_BY_CODE: Record<string, string> = {
  AR: 'argentina',
  UY: 'uruguay',
  CO: 'colombia',
};

export function countrySlugFrom(country: string): string {
  if (!country) return '';
  const code = country.trim().toUpperCase();
  if (COUNTRY_SLUG_BY_CODE[code]) return COUNTRY_SLUG_BY_CODE[code];
  return slugifyCity(country);
}
