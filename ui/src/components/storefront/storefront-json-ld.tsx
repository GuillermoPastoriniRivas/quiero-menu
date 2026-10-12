import type { StorefrontData } from "@/types";
import { getCategoryDef } from "@/lib/restaurant-categories";
import { serializeJsonLd } from "@/lib/json-ld";

function omitEmpty(value: string | null | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

const SCHEMA_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * Rango de precios visible, derivado del menú. Google lo muestra como texto.
 */
function priceRange(data: StorefrontData): string | undefined {
  const prices = data.categories
    .filter((cat) => cat.isVisible)
    .flatMap((cat) => cat.items.filter((item) => item.isVisible))
    .map((item) => item.basePrice)
    .filter((p) => typeof p === "number" && p > 0);
  if (prices.length === 0) return undefined;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const format = (n: number) =>
    `${data.restaurant.currency} ${n.toLocaleString("es-AR")}`;
  return min === max ? format(min) : `${format(min)} - ${format(max)}`;
}

export function StorefrontJsonLd({
  data,
  slug,
}: {
  data: StorefrontData;
  slug: string;
}) {
  const { restaurant, categories } = data;
  const url = `https://quiero.menu/${slug}`;
  const image = omitEmpty(restaurant.logoUrl) || omitEmpty(restaurant.bannerUrl);
  const categoryDef = getCategoryDef(restaurant.category);
  // Las fichas sin dueño (claimed=false) se publican sin precios: el menú es
  // informativo y no queremos fijar precios que pueden estar desactualizados.
  const showPrices = restaurant.claimed !== false;
  const price = showPrices ? priceRange(data) : undefined;
  const sameAs = Object.values(restaurant.socialLinks ?? {}).filter((value) => {
    try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
  });
  const updatedAt = new Date(restaurant.updatedAt);

  const openingHoursSpecification = data.operatingHours
    .filter((h) => !h.isClosed && isValidTime(h.opensAt) && isValidTime(h.closesAt))
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAY_NAMES[h.dayOfWeek] ?? "Monday"}`,
      opens: h.opensAt,
      closes: h.closesAt,
    }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${url}#restaurant`,
    name: restaurant.name,
    ...(omitEmpty(restaurant.description) ? { description: restaurant.description } : {}),
    url,
    ...(sameAs.length ? { sameAs } : {}),
    ...(image ? { image } : {}),
    ...(omitEmpty(restaurant.phone) ? { telephone: restaurant.phone } : {}),
    ...(categoryDef ? { servesCuisine: categoryDef.cuisine } : {}),
    ...(price ? { priceRange: price } : {}),
    ...(restaurant.coordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: restaurant.coordinates.lat,
            longitude: restaurant.coordinates.lng,
          },
        }
      : {}),
    ...(restaurant.address || restaurant.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(omitEmpty(restaurant.address)
              ? { streetAddress: restaurant.address }
              : {}),
            ...(omitEmpty(restaurant.city)
              ? { addressLocality: restaurant.city }
              : {}),
            ...(omitEmpty(restaurant.region) ? { addressRegion: restaurant.region } : {}),
            ...(omitEmpty(restaurant.country)
              ? { addressCountry: restaurant.country }
              : {}),
          },
        }
      : {}),
    ...(openingHoursSpecification.length > 0
      ? { openingHoursSpecification }
      : {}),
    ...(categories.some((cat) => cat.isVisible && cat.items.some((item) => item.isVisible)) ? { hasMenu: {
      "@type": "Menu",
      url,
      hasMenuSection: categories
        .filter((cat) => cat.isVisible)
        .map((cat) => ({
          "@type": "MenuSection",
          name: cat.name,
          ...(omitEmpty(cat.description)
            ? { description: cat.description }
            : {}),
          hasMenuItem: cat.items
            .filter((item) => item.isVisible)
            .map((item) => ({
              "@type": "MenuItem",
              name: item.name,
              ...(omitEmpty(item.description)
                ? { description: item.description }
                : {}),
              ...(omitEmpty(item.imageUrl) ? { image: item.imageUrl } : {}),
              ...(showPrices
                ? {
                    offers: {
                      "@type": "Offer",
                      price: item.basePrice,
                      priceCurrency: restaurant.currency,
                    },
                  }
                : {}),
            })),
        })),
    } } : {}),
  };
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: restaurant.name,
    mainEntity: { "@id": `${url}#restaurant` },
    ...(!Number.isNaN(updatedAt.getTime()) ? { dateModified: updatedAt.toISOString() } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd([jsonLd, page]) }}
    />
  );
}
