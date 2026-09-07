import type { StorefrontIndexEntry } from "@/types";
import { getApiBase } from "./storefront-context";
import {
  RESTAURANT_CATEGORIES,
  slugifyCity,
} from "./restaurant-categories";

export interface StorefrontSearchMatch {
  name: string;
  basePrice: number;
}

export interface StorefrontSearchResult extends StorefrontIndexEntry {
  currency: string;
  /** Platos de la carta que coinciden con la búsqueda (máx 3). */
  matchedItems: StorefrontSearchMatch[];
}

export interface StorefrontSearchResponse {
  results: StorefrontSearchResult[];
  total: number;
}

export async function searchStorefronts(
  params: {
    q?: string;
    city?: string;
    openNow?: boolean;
    signal?: AbortSignal;
  },
): Promise<StorefrontSearchResponse> {
  const search = new URLSearchParams();
  if (params.q && params.q.trim().length >= 2) search.set("q", params.q.trim());
  if (params.city) search.set("city", params.city);
  if (params.openNow) search.set("openNow", "true");

  const res = await fetch(`${getApiBase()}/storefronts/search?${search}`, {
    signal: params.signal,
  });
  if (!res.ok) throw new Error("search failed");
  return (await res.json()) as StorefrontSearchResponse;
}

export async function fetchStorefrontIndex(
  signal?: AbortSignal,
): Promise<StorefrontIndexEntry[]> {
  const res = await fetch(`${getApiBase()}/storefronts/index`, { signal });
  if (!res.ok) throw new Error("index failed");
  return (await res.json()) as StorefrontIndexEntry[];
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const CATEGORY_TEXT = new Map(
  RESTAURANT_CATEGORIES.map((c) => [
    c.value,
    normalize(`${c.label} ${c.cuisine} ${c.value}`),
  ]),
);

/**
 * Filtro client-side sobre el índice. Es el fallback cuando el endpoint de
 * búsqueda no está disponible (API vieja): matchea nombre, rubro y
 * descripción — sin platos, que solo el backend tiene.
 */
export function filterIndexLocally(
  entries: StorefrontIndexEntry[],
  params: { q?: string; city?: string; openNow?: boolean },
): StorefrontSearchResponse {
  const q = normalize(params.q ?? "");
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  const city = normalize(params.city ?? "");

  const results = entries
    .filter((e) => {
      if (city) {
        const entryCity = normalize(
          e.citySlug || slugifyCity(e.city || ""),
        );
        if (entryCity !== city) return false;
      }
      // Datos viejos sin isOpen: no filtrar por algo que no sabemos.
      if (params.openNow && e.isOpen === false) return false;
      if (tokens.length === 0) return true;
      const hay = normalize(
        `${e.name} ${e.description} ${CATEGORY_TEXT.get(e.category || "") ?? ""}`,
      );
      return tokens.every((t) => hay.includes(t));
    })
    .map((e) => ({ ...e, currency: "", matchedItems: [] }));

  return { results, total: results.length };
}
