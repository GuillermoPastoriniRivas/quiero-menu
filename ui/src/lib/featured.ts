import type { StorefrontIndexEntry } from "@/types";

export interface FeaturedContext {
  citySlug: string;
  /** Rubro de la página de categoría (plural slug ya resuelto a value). */
  category?: string;
}

/**
 * ¿Este local destaca en este contexto? Un slot home vale en toda su
 * ciudad; uno de categoría vale en su página de rubro (y en la ciudad).
 */
export function isFeatured(
  entry: StorefrontIndexEntry,
  ctx: FeaturedContext,
): boolean {
  const slots = entry.featured ?? [];
  return slots.some((s) => {
    if (s.citySlug !== ctx.citySlug) return false;
    if (s.scope === "home") return true;
    if (ctx.category) return s.category === ctx.category;
    return true;
  });
}

/** Nuestros menús primero; los destacados encabezan cada grupo. Conserva el
 * orden de relevancia (o alfabético) de entrada entre locales equivalentes. */
export function sortDirectoryEntries<T extends StorefrontIndexEntry>(
  entries: T[],
  ctx?: FeaturedContext,
): T[] {
  const featured = (entry: T) =>
    Number(isFeatured(entry, ctx ?? { citySlug: entry.citySlug }));
  return [...entries].sort(
    (a, b) =>
      Number(b.claimed !== false) - Number(a.claimed !== false) ||
      featured(b) - featured(a),
  );
}
