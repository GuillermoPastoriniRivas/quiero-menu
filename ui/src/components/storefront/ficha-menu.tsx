import type { StorefrontData } from "@/types";

type FichaCategory = StorefrontData["categories"][number];

function formatReviewDate(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function FichaMenu({ data }: { data: StorefrontData }) {
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
              {cat.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-on-surface">
                      {item.name}
                    </span>
                    {item.description ? (
                      <p className="mt-0.5 text-sm text-on-surface-variant">
                        {item.description}
                      </p>
                    ) : null}
                    {item.variants.length > 1 ? (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {item.variants.map((v) => v.name).join(" · ")}
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
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
