import Link from "next/link";
import type { Metadata } from "next";
import { getStorefrontIndexState } from "@/lib/storefront-index";
import { StoreCard } from "@/components/directory/store-card";
import { DirectorySearch } from "@/components/directory/directory-search";
import { isFeatured, sortFeaturedFirst } from "@/lib/featured";
import { DirectoryJsonLd } from "@/components/directory/directory-json-ld";
import type { StorefrontIndexEntry } from "@/types";

// El directorio cambia cuando los locales editan su menú: siempre fresco
// (el índice tiene cache propia de 60s contra la API).
export const dynamic = "force-dynamic";

const baseMetadata: Metadata = {
  title: { absolute: "Locales con menú digital | quiero.menu" },
  description:
    "Mirá el menú de los locales de tu ciudad, pedí directo por WhatsApp y seguí tu pedido en vivo. Sin apps y sin comisiones.",
  alternates: { canonical: "https://quiero.menu/locales" },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; open?: string }>;
}): Promise<Metadata> {
  const query = await searchParams;
  const filtered = Boolean(query.q || query.city || query.open);
  return filtered
    ? { ...baseMetadata, robots: { index: false, follow: true } }
    : baseMetadata;
}

interface CitySection {
  slug: string;
  name: string;
  href: string;
  entries: StorefrontIndexEntry[];
}

function groupByCity(
  entries: StorefrontIndexEntry[],
): CitySection[] {
  const groups = new Map<string, CitySection>();
  for (const entry of entries) {
    if (!entry.citySlug) continue;
    const existing = groups.get(entry.citySlug);
    if (existing) {
      existing.entries.push(entry);
      continue;
    }
    // Locales geo-clasificados => ruta /en/{pais}/{region}/{ciudad}; si aún
    // no tienen región, conservan la URL /en/{ciudad} (no 404ear lo indexado).
    const href =
      entry.countrySlug && entry.regionSlug
        ? `/en/${entry.countrySlug}/${entry.regionSlug}/${entry.citySlug}`
        : `/en/${entry.citySlug}`;
    groups.set(entry.citySlug, {
      slug: entry.citySlug,
      name: entry.city || entry.citySlug,
      href,
      entries: [entry],
    });
  }
  return [...groups.values()];
}

export default async function LocalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; open?: string }>;
}) {
  const [indexState, query] = await Promise.all([
    getStorefrontIndexState(),
    searchParams,
  ]);
  const index = indexState.entries;
  const withCity = index.filter((e) => e.citySlug);
  const noCity = index.filter((e) => !e.citySlug);
  const groups = groupByCity(withCity);
  const cities = groups
    .map((g) => ({ slug: g.slug, name: g.name, count: g.entries.length }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
          ¿Qué tenés ganas de comer?
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Buscá un plato, compará precios publicados y abrí la carta del local.
          No necesitás crear una cuenta.
        </p>

        {indexState.status === "unavailable" ? (
          <div role="alert" className="mt-8 rounded-2xl border border-amber-700/20 bg-amber-100/60 p-5 text-amber-950">
            <p className="font-bold">El directorio no está disponible en este momento.</p>
            <p className="mt-1 text-sm">No mostramos un inventario vacío porque no pudimos verificar los locales. Recargá la página en unos minutos.</p>
          </div>
        ) : null}

        {indexState.status === "stale" ? (
          <p className="mt-6 rounded-xl bg-amber-100/60 px-4 py-3 text-sm text-amber-950">
            Estamos mostrando la última versión disponible del directorio.
          </p>
        ) : null}

        {indexState.status === "fresh" && index.length === 0 ? (
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

        <DirectorySearch
          placeholder="Buscá un plato o un local…"
          cities={cities}
          initialQuery={query.q ?? ""}
          initialCitySlug={query.city ?? ""}
          initialOpenNow={query.open === "1"}
        >
          {groups.map((section) => (
            <section key={section.slug} className="mt-12">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-on-surface">
                  {section.name}
                </h2>
                <Link
                  href={section.href}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Ver todos los locales →
                </Link>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortFeaturedFirst(section.entries, { citySlug: section.slug })
                  .slice(0, 6)
                  .map((entry) => (
                    <StoreCard
                      key={entry.slug}
                      entry={entry}
                      featured={isFeatured(entry, { citySlug: section.slug })}
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
