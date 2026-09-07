/**
 * Normaliza un nombre de ciudad a slug URL-safe: minúsculas, sin acentos,
 * espacios y separadores colapsados a un solo guión. Se guarda en
 * Restaurant.citySlug al escribir la ciudad y es la join key de las
 * páginas de directorio (/en/{citySlug}).
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
