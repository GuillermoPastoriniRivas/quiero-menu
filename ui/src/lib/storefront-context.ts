export const KNOWN_HOSTS = ['quiero.menu', 'www.quiero.menu', 'localhost'];

export function isCustomDomainHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.host;
  return !KNOWN_HOSTS.includes(host) && !host.endsWith('.vercel.app');
}

/**
 * Base URL de la API (con /v1) según el host actual.
 * - En un dominio personalizado: same-origin (`<origin>/api/v1`). El vhost del
 *   dominio custom proxya `/api/` al backend pasando `Host $host`, así el
 *   backend puede resolver el tenant por host. Evita CORS.
 * - En hosts propios (quiero.menu, localhost): NEXT_PUBLIC_API_URL + /v1.
 */
export function getApiBase(): string {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  if (isCustomDomainHost()) {
    return `${window.location.origin}/api/v1`;
  }
  return `${api}/v1`;
}

export function getSocketUrl(): string {
  return getApiBase().replace(/\/api\/v1$/, '');
}

/**
 * Resuelve el slug del tenant cuando se entra por dominio personalizado.
 * En hosts propios devuelve null (el slug viene en el path).
 */
export async function resolveCustomDomainSlug(): Promise<string | null> {
  if (typeof window === 'undefined' || !isCustomDomainHost()) return null;
  try {
    const host = window.location.host;
    const res = await fetch(
      `${getApiBase()}/storefront/resolve?host=${encodeURIComponent(host)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.slug === 'string' ? data.slug : null;
  } catch {
    return null;
  }
}
