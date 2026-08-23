import type { StorefrontData } from "@/types";
import { getApiBase } from "./storefront-context";

export async function fetchStorefrontData(
  slug: string,
): Promise<StorefrontData | null> {
  try {
    const res = await fetch(
      `${getApiBase()}/storefront/${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as StorefrontData;
  } catch {
    return null;
  }
}