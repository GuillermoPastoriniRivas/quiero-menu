import Link from "next/link";
import type { Restaurant } from "@/types";
import { getCategoryDef } from "@/lib/restaurant-categories";

export function StorefrontDirectoryLinks({ restaurant }: { restaurant: Restaurant }) {
  const { countrySlug, regionSlug, citySlug, city } = restaurant;
  if (restaurant.status !== 'active' || !countrySlug || !regionSlug || !citySlug) return null;
  const href = `https://quiero.menu/en/${countrySlug}/${regionSlug}/${citySlug}`;
  const category = getCategoryDef(restaurant.category);
  return (
    <nav aria-label="Explorar locales de la zona" className="flex flex-wrap justify-center gap-x-4 gap-y-2 py-4 text-xs text-on-surface-variant">
      <Link href={href} className="hover:underline">Locales en {city}</Link>
      {category && category.value !== "otro" && (
        <Link href={`${href}/${category.plural}`} className="hover:underline">{category.pluralLabel} en {city}</Link>
      )}
    </nav>
  );
}
