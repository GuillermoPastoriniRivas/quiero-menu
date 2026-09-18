import Link from "next/link";
import type { StorefrontData } from "@/types";
import { formatCurrency } from "@/lib/format";

type FichaCategory = StorefrontData["categories"][number];
type FichaItem = FichaCategory["items"][number];

function itemPriceLabel(item: FichaItem, currency: string): string | null {
  const prices = item.variants
    .map((v) => v.priceOverride ?? item.basePrice)
    .filter((p) => p > 0);
  if (prices.length === 0) {
    return item.basePrice > 0 ? formatCurrency(item.basePrice, currency) : null;
  }
  const min = Math.min(...prices);
  const label = formatCurrency(min, currency);
  return prices.some((p) => p !== min) ? `desde ${label}` : label;
}

function formatReviewDate(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function FichaMenu({ data, slug }: { data: StorefrontData; slug: string }) {
  const { restaurant } = data;
  const categories = data.categories.filter((c) => c.items.length > 0);
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="ficha-menu-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2
          id="ficha-menu-title"
          className="font-[family-name:var(--font-heading)] text-2xl font-extrabold tracking-tight text-on-surface"
        >
          Menú
        </h2>
        {restaurant.updatedAt ? (
          <span className="text-xs text-on-surface-variant">
            Revisado el {formatReviewDate(restaurant.updatedAt)}
          </span>
        ) : null}
      </div>

      <p className="mt-3 rounded-2xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
        Menú armado con información pública del local. Los precios pueden no
        estar actualizados: confirmalos por WhatsApp antes de pedir.{" "}
        <Link
          href={`/${slug}/reclamar`}
          className="font-bold text-primary hover:underline"
        >
          ¿Sos el dueño? Actualizalo y recibí pedidos.
        </Link>
      </p>

      {categories.length > 1 ? (
        <nav
          aria-label="Categorías del menú"
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
        >
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#cat-${cat.id}`}
              className="shrink-0 rounded-full border border-outline-variant/50 px-4 py-1.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
            >
              {cat.name}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-6 space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface">
              {cat.name}
            </h3>
            {cat.description ? (
              <p className="mt-1 text-sm text-on-surface-variant">
                {cat.description}
              </p>
            ) : null}
            <ul className="mt-3 divide-y divide-outline-variant/30">
              {cat.items.map((item) => {
                const price = itemPriceLabel(item, restaurant.currency);
                return (
                  <li key={item.id} className="flex gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-bold text-on-surface">
                          {item.name}
                        </span>
                        {price ? (
                          <span className="shrink-0 font-extrabold text-on-surface">
                            {price}
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-0.5 text-sm text-on-surface-variant">
                          {item.description}
                        </p>
                      ) : null}
                      {item.variants.length > 1 ? (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {item.variants
                            .map((v) => {
                              const p = v.priceOverride ?? item.basePrice;
                              return p > 0
                                ? `${v.name} ${formatCurrency(p, restaurant.currency)}`
                                : v.name;
                            })
                            .join(" · ")}
                        </p>
                      ) : null}
                      {!item.isAvailable ? (
                        <span className="mt-1 inline-block text-xs font-bold text-on-surface-variant">
                          No disponible
                        </span>
                      ) : null}
                    </div>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
