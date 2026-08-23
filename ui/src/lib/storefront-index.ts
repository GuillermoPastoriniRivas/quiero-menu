import type { StorefrontIndexEntry } from "@/types";
import { getApiBase } from "./storefront-context";

const CACHE_TTL_MS = 60_000;

let cached: { at: number; value: StorefrontIndexEntry[] } | null = null;

/**
 * Índice de storefronts indexables (solo server). Cache corto en proceso (60s)
 * para no golpear la API en cada request de sitemap / metadata / build.
 */
export async function getStorefrontIndex(): Promise<StorefrontIndexEntry[]> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${getApiBase()}/storefronts/index`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    const value = res.ok
      ? ((await res.json()) as StorefrontIndexEntry[])
      : [];
    cached = { at: now, value };
    return value;
  } catch {
    clearTimeout(timer);
    return cached?.value ?? [];
  }
}