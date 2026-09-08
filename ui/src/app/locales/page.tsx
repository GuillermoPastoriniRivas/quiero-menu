import Link from "next/link";
import type { Metadata } from "next";
import { getStorefrontIndex } from "@/lib/storefront-index";
import { StoreCard } from "@/components/directory/store-card";
import { DirectorySearch } from "@/components/directory/directory-search";
import { isFeatured, sortFeaturedFirst } from "@/lib/featured";
import { DirectoryJsonLd } from "@/components/directory/directory-json-ld";
import type { StorefrontIndexEntry } from "@/types";

// El directorio cambia cuando los locales editan su menú: siempre fresco
// (el índice tiene cache propia de 60s contra la API).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Locales con menú digital | quiero.menu" },
  description:
    "Mirá el menú de los locales de tu ciudad, pedí directo por WhatsApp y seguí tu pedido en vivo. Sin apps y sin comisiones.",
  alternates: { canonical: "https://quiero.menu/locales" },
};

function groupByCity(
  entries: StorefrontIndexEntry[],
): Map<string, StorefrontIndexEntry[]> {
  const groups = new Map<string, StorefrontIndexEntry[]>();
  for (const entry of entries) {
    const key = entry.citySlug || "";
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }
  return groups;
}

export default async function LocalesPage() {
  const index = await getStorefrontIndex();
  const withCity = index.filter((e) => e.citySlug);
  const noCity = index.filter((e) => !e.citySlug);
  const groups = groupByCity(withCity);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <DirectoryJsonLd
        items={index.map((e) => ({
          url: `https://quiero.menu/${e.slug}`,
          name: e.name,
        }))}
      />

      <header className="border-b border-outline-variant/40 bg-surface-container-lowest/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface"
          >
            quiero<span className="text-primary">.menu</span>
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Crear mi menú gratis
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Locales con menú digital
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Todos los menús están actualizados y funcionando. Tocá un local,
          mirá su carta y pedí directo, sin apps y sin comisiones.
        </p>

        {index.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-outline-variant/60 p-10 text-center">
            <p className="text-on-surface-variant">
              Todavía no hay locales publicados.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
            >
              Sé el primero
            </Link>
          </div>
        ) : null}

        <DirectorySearch placeholder="Buscá un local o un plato… ej: milanesa, pizza, empanadas">
          {[...groups.entries()].map(([citySlug, entries]) => (
            <section key={citySlug} className="mt-12">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-on-surface">
                  {entries[0]?.city || citySlug}
                </h2>
                <Link
                  href={`/en/${citySlug}`}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Ver todos los locales →
                </Link>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortFeaturedFirst(entries, { citySlug })
                  .slice(0, 6)
                  .map((entry) => (
                    <StoreCard
                      key={entry.slug}
                      entry={entry}
                      featured={isFeatured(entry, { citySlug })}
                    />
                  ))}
              </div>
            </section>
          ))}

          {noCity.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-on-surface">
                Otros locales
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {noCity.map((entry) => (
                  <Link
                    key={entry.slug}
                    href={`/${entry.slug}`}
                    className="rounded-full border border-outline-variant/50 px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    {entry.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </DirectorySearch>

        <section className="mt-16 rounded-3xl bg-surface-container-low p-8 text-center sm:p-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
            ¿Tenés un local y no estás acá?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">
            Publicá tu menú digital gratis en 5 minutos: sacale una foto y la
            IA lo carga solo. Empieza gratis, sin tarjeta.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Crear mi menú gratis
          </Link>
        </section>
      </main>
    </div>
  );
}
