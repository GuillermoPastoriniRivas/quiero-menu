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

/** Destacados primero (orden alfabético previo se conserva en cada grupo). */
export function sortFeaturedFirst<T extends StorefrontIndexEntry>(
  entries: T[],
  ctx: FeaturedContext,
): T[] {
  const feat: T[] = [];
  const rest: T[] = [];
  for (const e of entries) {
    (isFeatured(e, ctx) ? feat : rest).push(e);
  }
  return [...feat, ...rest];
}
