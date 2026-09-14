import type { StorefrontIndexEntry } from "@/types";
import { getApiBase } from "./storefront-context";

const CACHE_TTL_MS = 60_000;

let cached: { at: number; value: StorefrontIndexEntry[] } | null = null;

export interface StorefrontIndexState {
  entries: StorefrontIndexEntry[];
  status: "fresh" | "stale" | "unavailable";
}

/**
 * Índice de storefronts indexables (solo server). Cache corto en proceso (60s)
 * para no golpear la API en cada request de sitemap / metadata / build.
 */
export async function getStorefrontIndex(): Promise<StorefrontIndexEntry[]> {
  return (await getStorefrontIndexState()).entries;
}

export async function getStorefrontIndexState(): Promise<StorefrontIndexState> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return { entries: cached.value, status: "fresh" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${getApiBase()}/storefronts/index`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return cached
        ? { entries: cached.value, status: "stale" }
        : { entries: [], status: "unavailable" };
    }
    const value = (await res.json()) as StorefrontIndexEntry[];
    cached = { at: now, value };
    return { entries: value, status: "fresh" };
  } catch {
    clearTimeout(timer);
    return cached
      ? { entries: cached.value, status: "stale" }
      : { entries: [], status: "unavailable" };
  }
}
