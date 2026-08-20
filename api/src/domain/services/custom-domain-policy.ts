const DOMAIN_RE =
  /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function normalizeDomain(input: string): string {
  let d = (input ?? '').trim().toLowerCase();
  d = d.replace(/^[a-z]+:\/\//, '');
  d = d.split('/')[0];
  d = d.split(':')[0];
  d = d.replace(/\.$/, '');
  return d;
}

export function isOwnDomain(domain: string, ownDomains: string[]): boolean {
  const normalized = ownDomains.map(normalizeDomain).filter(Boolean);
  return normalized.some((own) => domain === own || domain.endsWith(`.${own}`));
}

export function validateDomain(domain: string): string | null {
  if (!domain) return 'Ingresá un dominio.';
  if (domain.includes(' ')) return 'El dominio no puede contener espacios.';
  if (!DOMAIN_RE.test(domain)) {
    return 'El dominio no tiene un formato válido (ej: menu.mirestaurante.com).';
  }
  return null;
}
