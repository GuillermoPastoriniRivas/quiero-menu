import type { StorefrontData } from "@/types";

function omitEmpty(value: string | null | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    url,
    ...(image ? { image } : {}),
    ...(omitEmpty(restaurant.phone) ? { telephone: restaurant.phone } : {}),
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
            ...(omitEmpty(restaurant.country)
              ? { addressCountry: restaurant.country }
              : {}),
          },
        }
      : {}),
    menu: {
      "@type": "Menu",
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
              offers: {
                "@type": "Offer",
                price: item.basePrice,
                priceCurrency: restaurant.currency,
              },
            })),
        })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}