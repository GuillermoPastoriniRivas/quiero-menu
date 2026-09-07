import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontIndex } from "@/lib/storefront-index";
import { StoreCard } from "@/components/directory/store-card";
import { DirectorySearch } from "@/components/directory/directory-search";
import {
  DirectoryJsonLd,
  BreadcrumbsJsonLd,
} from "@/components/directory/directory-json-ld";
import {
  getCategoryDef,
  slugifyCity,
  RESTAURANT_CATEGORIES,
} from "@/lib/restaurant-categories";
import type { StorefrontIndexEntry } from "@/types";

const BASE_URL = "https://quiero.menu";

// Contenido dependiente del índice (menús que cambian): SSR por request.
export const dynamic = "force-dynamic";

function buildMetadata(entries: StorefrontIndexEntry[], citySlug: string): Metadata {
  const cityName = entries[0]?.city || citySlug;
  const title = `Menús y pedidos a domicilio en ${cityName} | quiero.menu`;
  const description = `Todos los locales de comida de ${cityName} con menú digital completo y actualizado: precios, horarios y pedidos directos por WhatsApp. Sin apps y sin comisiones.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}/en/${citySlug}` },
    keywords: [
      `comida ${cityName}`,
      `delivery ${cityName}`,
      `menús ${cityName}`,
      `restaurantes ${cityName}`,
    ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/en/${citySlug}`,
      siteName: "quiero.menu",
      locale: "es_AR",
      type: "website",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const citySlug = slugifyCity(city);
  const entries = (await getStorefrontIndex()).filter(
    (e) => e.citySlug === citySlug,
  );
  if (entries.length === 0) {
    return { title: "Directorio", robots: { index: false, follow: false } };
  }
  return buildMetadata(entries, citySlug);
}

export default async function CityDirectoryPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const citySlug = slugifyCity(city);
  const entries = (await getStorefrontIndex()).filter(
    (e) => e.citySlug === citySlug,
  );
  if (entries.length === 0) notFound();

  const cityName = entries[0]?.city || citySlug;

  // Rubros presentes en la ciudad (con página propia), con cantidad de locales.
  const categoryCounts = new Map<string, number>();
  for (const entry of entries) {
    const def = getCategoryDef(entry.category);
    if (!def || def.value === "otro") continue;
    categoryCounts.set(
      def.plural,
      (categoryCounts.get(def.plural) ?? 0) + 1,
    );
  }
  const categories = RESTAURANT_CATEGORIES.filter(
    (c) => (categoryCounts.get(c.plural) ?? 0) > 0 && c.value !== "otro",
  );

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <DirectoryJsonLd
        items={entries.map((e) => ({
          url: `${BASE_URL}/${e.slug}`,
          name: e.name,
        }))}
      />
      <BreadcrumbsJsonLd
        items={[
          { name: "quiero.menu", url: BASE_URL },
          { name: "Locales", url: `${BASE_URL}/locales` },
          { name: cityName, url: `${BASE_URL}/en/${citySlug}` },
        ]}
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
            href="/locales"
            className="text-sm font-bold text-primary hover:underline"
          >
            Todos los locales
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {entries.length} {entries.length === 1 ? "local" : "locales"} con
          menú online
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Locales de comida en {cityName}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Menús completos con precios reales, horarios actualizados y pedido
          directo. Elegí dónde pedir y tocá para ver la carta.
        </p>

        {categories.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.plural}
                href={`/en/${citySlug}/${c.plural}`}
                className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
              >
                {c.pluralLabel} ({categoryCounts.get(c.plural)})
              </Link>
            ))}
          </div>
        ) : null}

        <DirectorySearch
          citySlug={citySlug}
          placeholder={`Buscá en ${cityName}… ej: milanesa, empanadas, helado`}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <StoreCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </DirectorySearch>

        <section className="mt-16 rounded-3xl bg-surface-container-low p-8 text-center sm:p-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
            ¿Tenés un local en {cityName}?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">
            Publicá tu menú digital gratis y recibí pedidos directos por
            WhatsApp, sin comisiones por venta.
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
