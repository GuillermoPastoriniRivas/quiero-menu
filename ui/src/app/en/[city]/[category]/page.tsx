import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStorefrontIndex } from "@/lib/storefront-index";
import { StoreCard } from "@/components/directory/store-card";
import {
  DirectoryJsonLd,
  BreadcrumbsJsonLd,
} from "@/components/directory/directory-json-ld";
import {
  getDirectoryCategoryByPlural,
  slugifyCity,
} from "@/lib/restaurant-categories";

const BASE_URL = "https://quiero.menu";

// Contenido dependiente del índice (menús que cambian): SSR por request.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; category: string }>;
}): Promise<Metadata> {
  const { city, category } = await params;
  const citySlug = slugifyCity(city);
  const categoryDef = getDirectoryCategoryByPlural(category);
  const entries = (await getStorefrontIndex()).filter(
    (e) => e.citySlug === citySlug && categoryDef && e.category === categoryDef.value,
  );
  if (!categoryDef || entries.length === 0) {
    return { title: "Directorio", robots: { index: false, follow: false } };
  }

  const cityName = entries[0]?.city || citySlug;
  const title = `${categoryDef.pluralLabel} en ${cityName} | Menús y pedidos | quiero.menu`;
  const description = `${categoryDef.pluralLabel} en ${cityName} con menú completo y precios actualizados. Compara locales, mirá la carta y pedí directo por WhatsApp, sin apps y sin comisiones.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}/en/${citySlug}/${categoryDef.plural}` },
    keywords: [
      `${categoryDef.pluralLabel.toLowerCase()} ${cityName}`,
      `delivery de ${categoryDef.cuisine.toLowerCase()} ${cityName}`,
      `pedir ${categoryDef.cuisine.toLowerCase()} ${cityName}`,
    ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/en/${citySlug}/${categoryDef.plural}`,
      siteName: "quiero.menu",
      locale: "es_AR",
      type: "website",
    },
  };
}

export default async function CityCategoryDirectoryPage({
  params,
}: {
  params: Promise<{ city: string; category: string }>;
}) {
  const { city, category } = await params;
  const citySlug = slugifyCity(city);
  const categoryDef = getDirectoryCategoryByPlural(category);
  if (!categoryDef) notFound();

  const entries = (await getStorefrontIndex()).filter(
    (e) => e.citySlug === citySlug && e.category === categoryDef.value,
  );
  if (entries.length === 0) notFound();

  const cityName = entries[0]?.city || citySlug;

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
          {
            name: categoryDef.pluralLabel,
            url: `${BASE_URL}/en/${citySlug}/${categoryDef.plural}`,
          },
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
            href={`/en/${citySlug}`}
            className="text-sm font-bold text-primary hover:underline"
          >
            Todos los locales de {cityName}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {entries.length} {entries.length === 1 ? "local" : "locales"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          {categoryDef.pluralLabel} en {cityName}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Menús completos con precios reales, horarios actualizados y pedido
          directo por WhatsApp. Sin apps y sin comisiones.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <StoreCard key={entry.slug} entry={entry} />
          ))}
        </div>

        <section className="mt-16 rounded-3xl bg-surface-container-low p-8 text-center sm:p-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
            ¿Tenés un local en {cityName}?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">
            Publicá tu menú digital gratis y aparecé en este directorio.
            Empezá gratis, sin tarjeta.
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
