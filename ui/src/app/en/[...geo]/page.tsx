import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getStorefrontIndex } from "@/lib/storefront-index";
import { StoreCard } from "@/components/directory/store-card";
import { DirectorySearch } from "@/components/directory/directory-search";
import { isFeatured, sortFeaturedFirst } from "@/lib/featured";
import {
  DirectoryJsonLd,
  BreadcrumbsJsonLd,
} from "@/components/directory/directory-json-ld";
import {
  getDirectoryCategoryByPlural,
  getCategoryDef,
  slugifyCity,
  RESTAURANT_CATEGORIES,
  type RestaurantCategoryDef,
} from "@/lib/restaurant-categories";
import {
  buildGeoIndex,
  cityHref,
  categoryHref,
  findCityGroup,
  countryLabel,
  type CityGroup,
} from "@/lib/directory-geo";
import type { StorefrontIndexEntry } from "@/types";

const BASE_URL = "https://quiero.menu";

// Contenido dependiente del índice (menús que cambian): SSR por request.
export const dynamic = "force-dynamic";

const NO_INDEX: Metadata = {
  title: "Directorio",
  robots: { index: false, follow: false },
};

/**
 * La búsqueda activa (?q=) es una interfaz no indexable: sin archivo DXC
 * (googlebot ve la lista SSR completa), no indexamos query strings.
 */
function withNoindexIfFiltered(
  metadata: Metadata,
  query: { q?: string; open?: string },
): Metadata {
  return query.q || query.open
    ? { ...metadata, robots: { index: false, follow: true } }
    : metadata;
}

function breadcrumbsForCity(city: CityGroup) {
  return [
    { name: "quiero.menu", url: BASE_URL },
    { name: "Locales", url: `${BASE_URL}/locales` },
    {
      name: countryLabel(city.countrySlug),
      url: `${BASE_URL}/en/${city.countrySlug}`,
    },
    {
      name: city.regionName,
      url: `${BASE_URL}/en/${city.countrySlug}/${city.regionSlug}`,
    },
    {
      name: city.cityName,
      url: `${BASE_URL}/en/${city.countrySlug}/${city.regionSlug}/${city.citySlug}`,
    },
  ];
}

function siteHeader({ href, label }: { href: string; label: string }) {
  return (
    <header className="border-b border-outline-variant/40 bg-surface-container-lowest/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface"
        >
          quiero<span className="text-primary">.menu</span>
        </Link>
        <Link href={href} className="text-sm font-bold text-primary hover:underline">
          {label}
        </Link>
      </div>
    </header>
  );
}

function signupCta(cityName: string, copy: string) {
  return (
    <section className="mt-16 rounded-3xl bg-surface-container-low p-8 text-center sm:p-12">
      <h2 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
        ¿Tenés un local en {cityName}?
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">{copy}</p>
      <Link
        href="/onboarding"
        className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        Crear mi menú gratis
      </Link>
    </section>
  );
}

/* ---------------------------------------------------------------- hub pais */

function CountryHub({
  countrySlug,
  regions,
}: {
  countrySlug: string;
  regions: Map<string, { regionName: string; cities: Map<string, CityGroup> }>;
}) {
  const country = countryLabel(countrySlug);
  const regionList = [...regions.entries()]
    .map(([slug, { regionName, cities }]) => ({ slug, regionName, cities: [...cities.values()] }))
    .sort((a, b) => a.regionName.localeCompare(b.regionName));
  const total = regionList.reduce((acc, r) => acc + r.cities.length, 0);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <BreadcrumbsJsonLd
        items={[
          { name: "quiero.menu", url: BASE_URL },
          { name: "Locales", url: `${BASE_URL}/locales` },
          { name: country, url: `${BASE_URL}/en/${countrySlug}` },
        ]}
      />
      {siteHeader({ href: "/locales", label: "Todos los locales" })}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {total} {total === 1 ? "ciudad" : "ciudades"} con menú online
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Menús y pedidos a domicilio en {country}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Elegí tu ciudad y mirá la carta de cada local con precios reales y
          pedidos directos por WhatsApp.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regionList.map((region) => (
            <Link
              key={region.slug}
              href={`/en/${countrySlug}/${region.slug}`}
              className="group rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 transition-colors hover:border-primary/50"
            >
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface group-hover:text-primary">
                {region.regionName}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {region.cities.length}{" "}
                {region.cities.length === 1 ? "ciudad" : "ciudades"} ·{" "}
                {region.cities.reduce((acc, c) => acc + c.entries.length, 0)}{" "}
                {region.cities.reduce((acc, c) => acc + c.entries.length, 0) === 1
                  ? "local"
                  : "locales"}
              </p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {region.cities.slice(0, 4).map((c) => (
                  <span
                    key={c.citySlug}
                    className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant"
                  >
                    {c.cityName}
                  </span>
                ))}
              </p>
            </Link>
          ))}
        </div>
        {signupCta(
          country,
          "Publicá tu menú digital gratis y aparecé en este directorio.",
        )}
      </main>
    </div>
  );
}

/* --------------------------------------------------------------- hub region */

function RegionHub({
  countrySlug,
  regionName,
  cities,
}: {
  countrySlug: string;
  regionName: string;
  cities: CityGroup[];
}) {
  const country = countryLabel(countrySlug);
  const regionUrl = `${BASE_URL}/en/${countrySlug}`;
  const entries = cities.flatMap((c) => c.entries);

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
          { name: country, url: regionUrl },
          {
            name: regionName,
            url: `${regionUrl}/${cities[0]?.regionSlug ?? ""}`,
          },
        ]}
      />
      {siteHeader({ href: "/locales", label: "Todos los locales" })}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {entries.length} {entries.length === 1 ? "local" : "locales"} en{" "}
          {cities.length} {cities.length === 1 ? "ciudad" : "ciudades"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Locales de comida en {regionName}, {country}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Elegí tu ciudad. Cada local publica menú con precios reales y pedido
          directo por WhatsApp.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {cities
            .sort((a, b) => a.cityName.localeCompare(b.cityName))
            .map((city) => (
              <Link
                key={city.citySlug}
                href={cityHref(city)}
                className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
              >
                {city.cityName} ({city.entries.length})
              </Link>
            ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <StoreCard
              key={entry.slug}
              entry={entry}
              featured={isFeatured(entry, { citySlug: entry.citySlug })}
            />
          ))}
        </div>

        {signupCta(
          regionName,
          "Publicá tu menú digital gratis y aparecé en este directorio.",
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------- city */

function CityView({
  city,
  query,
}: {
  city: CityGroup;
  query: { q?: string; open?: string };
}) {
  const entries = city.entries;
  const href = cityHref(city);

  // Rubros presentes en la ciudad (con página propia), con cantidad de locales.
  const categoryCounts = new Map<string, number>();
  for (const entry of entries) {
    const def = getCategoryDef(entry.category);
    if (!def || def.value === "otro") continue;
    categoryCounts.set(def.plural, (categoryCounts.get(def.plural) ?? 0) + 1);
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
      <BreadcrumbsJsonLd items={breadcrumbsForCity(city)} />
      {siteHeader({ href, label: `Todos los locales de ${city.cityName}` })}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {entries.length} {entries.length === 1 ? "local" : "locales"}{" "}
          publicados
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Locales de comida en {city.cityName}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Explorá platos y precios publicados por cada local. Elegí una opción y
          abrí la carta completa para pedir directo.
        </p>

        {categories.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.plural}
                href={categoryHref(city, c.plural)}
                className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
              >
                {c.pluralLabel} ({categoryCounts.get(c.plural)})
              </Link>
            ))}
          </div>
        ) : null}

        <DirectorySearch
          citySlug={city.citySlug}
          placeholder={`Buscá en ${city.cityName}… ej: milanesa, empanadas, helado`}
          initialQuery={query.q ?? ""}
          initialOpenNow={query.open === "1"}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortFeaturedFirst(entries, { citySlug: city.citySlug }).map((entry) => (
              <StoreCard
                key={entry.slug}
                entry={entry}
                featured={isFeatured(entry, { citySlug: city.citySlug })}
              />
            ))}
          </div>
        </DirectorySearch>

        {signupCta(
          city.cityName,
          "Publicá tu menú digital gratis y recibí pedidos directos por WhatsApp, sin comisiones por venta.",
        )}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- categoria */

function CategoryView({
  city,
  categoryDef,
  query,
}: {
  city: CityGroup;
  categoryDef: RestaurantCategoryDef;
  query: { q?: string; open?: string };
}) {
  const entries = categoryDef
    ? city.entries.filter((e) => e.category === categoryDef.value)
    : [];

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
          ...breadcrumbsForCity(city),
          {
            name: categoryDef.pluralLabel,
            url: `${BASE_URL}${categoryHref(city, categoryDef.plural)}`,
          },
        ]}
      />
      {siteHeader({
        href: cityHref(city),
        label: `Todos los locales de ${city.cityName}`,
      })}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">
          {entries.length} {entries.length === 1 ? "local" : "locales"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          {categoryDef.pluralLabel} en {city.cityName}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
          Menús completos con precios reales, horarios actualizados y pedido
          directo por WhatsApp. Sin apps y sin comisiones.
        </p>

        <DirectorySearch
          citySlug={city.citySlug}
          category={categoryDef.value}
          initialQuery={query.q ?? ""}
          initialOpenNow={query.open === "1"}
          placeholder={`Buscá en ${categoryDef.pluralLabel.toLowerCase()}…`}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortFeaturedFirst(entries, {
              citySlug: city.citySlug,
              category: categoryDef.value,
            }).map((entry) => (
              <StoreCard
                key={entry.slug}
                entry={entry}
                featured={isFeatured(entry, {
                  citySlug: city.citySlug,
                  category: categoryDef.value,
                })}
              />
            ))}
          </div>
        </DirectorySearch>

        {signupCta(
          city.cityName,
          "Publicá tu menú digital gratis y aparecé en este directorio. Empezá gratis, sin tarjeta.",
        )}
      </main>
    </div>
  );
}

/* --------------------------------------------------- dispatch + metadata */

const hasGeo = (e: StorefrontIndexEntry) =>
  Boolean(e.citySlug && e.countrySlug && e.regionSlug);

/**
 * Agrupa TODOS los locales con citySlug (aunque no tengan país/región):
 * las URLs viejas /en/{ciudad} y /en/{ciudad}/{rubro} deben seguir
 * respondiendo. Si el local está geo-clasificado => 301 a la ruta nueva;
 * si no, 404 sería una regresión contra lo ya indexado.
 */
function groupByCity(entries: StorefrontIndexEntry[]) {
  const groups = new Map<string, StorefrontIndexEntry[]>();
  for (const entry of entries) {
    if (!entry.citySlug) continue;
    const list = groups.get(entry.citySlug) ?? [];
    list.push(entry);
    groups.set(entry.citySlug, list);
  }
  return groups;
}

/**
 * Dispatch del directorio de tres niveles (país > región > ciudad) sobre UNA
 * ruta catch-all: /en/[...geo]. Es obligatorio porque /en/{segmento} colisona
 * con /en/{pais} (hub nuevo) y /en/{ciudad} (URL vieja indexada). La resolución
 * es siempre por datos reales del índice, nunca por conjetura:
 *
 *   /en/{a}                              → ciudad vieja: 301 a la ruta nueva, o
 *                                          hub país si {a} es un país con datos.
 *   /en/{a}/{b}                          → ciudad+rubro viejo: 301, o hub região.
 *   /en/{pais}/{region}/{ciudad}         → página de ciudad.
 *   /en/{pais}/{region}/{ciudad}/{rubro} → página de rubro.
 */
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ geo: string[] }>;
  searchParams: Promise<{ q?: string; open?: string }>;
}): Promise<Metadata> {
  const [p, query] = await Promise.all([params, searchParams]);
  const segs = p.geo.map((s) => slugifyCity(s));
  const geo = buildGeoIndex(await getStorefrontIndex());

  if (segs.length === 1 && geo.countries.has(segs[0])) {
    const canonical = `${BASE_URL}/en/${segs[0]}`;
    const title = `Menús y pedidos a domicilio en ${countryLabel(segs[0])} | quiero.menu`;
    return withNoindexIfFiltered(
      {
        title: { absolute: title },
        description: `Todos los locales de comida de ${countryLabel(segs[0])} con menú digital completo: precios, horarios y pedidos directos por WhatsApp.`,
        alternates: { canonical },
        openGraph: {
          title,
          url: canonical,
          siteName: "quiero.menu",
          locale: "es_AR",
          type: "website",
        },
      },
      query,
    );
  }

  if (segs.length === 2 && geo.countries.has(segs[0])) {
    const cities = [...(geo.countries.get(segs[0])?.get(segs[1])?.cities.values() ?? [])];
    if (cities.length === 0) return NO_INDEX;
    const entries = cities.flatMap((c) => c.entries);
    const canonical = `${BASE_URL}/en/${segs[0]}/${segs[1]}`;
    const title = `Menús y pedidos a domicilio en ${cities[0].regionName}, ${countryLabel(segs[0])} | quiero.menu`;
    return withNoindexIfFiltered(
      {
        title: { absolute: title },
        description: `Locales de comida en ${cities[0].regionName}: menús con precios reales, horarios y pedidos directos. ${entries.length} locales publicados.`,
        alternates: { canonical },
        openGraph: {
          title,
          url: canonical,
          siteName: "quiero.menu",
          locale: "es_AR",
          type: "website",
        },
      },
      query,
    );
  }

  const city =
    segs.length >= 3 ? findCityGroup(geo, segs[0], segs[1], segs[2]) : null;
  if (!city || city.entries.length === 0) return NO_INDEX;
  const categoryDef =
    segs.length === 4 ? getDirectoryCategoryByPlural(segs[3]) : null;
  if (segs.length === 4 && !categoryDef) return NO_INDEX;
  if (
    categoryDef &&
    !city.entries.some((e) => e.category === categoryDef.value)
  ) {
    return NO_INDEX;
  }
  const cityName = city.cityName;
  const canonical = `${BASE_URL}${
    categoryDef ? categoryHref(city, categoryDef.plural) : cityHref(city)
  }`;
  const base = categoryDef
    ? {
        title: {
          absolute: `${categoryDef.pluralLabel} en ${cityName} | Menús y pedidos | quiero.menu`,
        },
        description: `${categoryDef.pluralLabel} en ${cityName} con menú completo y precios actualizados. Compara locales, mirá la carta y pedí directo por WhatsApp, sin apps y sin comisiones.`,
        keywords: [
          `${categoryDef.pluralLabel.toLowerCase()} ${cityName}`,
          `delivery de ${categoryDef.cuisine.toLowerCase()} ${cityName}`,
          `pedir ${categoryDef.cuisine.toLowerCase()} ${cityName}`,
        ],
      }
    : {
        title: {
          absolute: `Menús y pedidos a domicilio en ${cityName} | quiero.menu`,
        },
        description: `Todos los locales de comida de ${cityName} con menú digital completo y actualizado: precios, horarios y pedidos directos por WhatsApp. Sin apps y sin comisiones.`,
        keywords: [
          `comida ${cityName}`,
          `delivery ${cityName}`,
          `menús ${cityName}`,
          `restaurantes ${cityName}`,
        ],
      };
  return withNoindexIfFiltered(
    {
      ...base,
      alternates: { canonical },
      openGraph: {
        title: base.title,
        description: base.description,
        url: canonical,
        siteName: "quiero.menu",
        locale: "es_AR",
        type: "website",
      },
    },
    query,
  );
}

export default async function GeoDirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ geo: string[] }>;
  searchParams: Promise<{ q?: string; open?: string }>;
}) {
  const [p, query] = await Promise.all([params, searchParams]);
  const segs = p.geo.map((s) => slugifyCity(s));
  const index = await getStorefrontIndex();
  const geo = buildGeoIndex(index);
  const legacyByCity = groupByCity(index);

  if (segs.length === 1) {
    const legacyEntries = legacyByCity.get(segs[0]) ?? [];
    const first = legacyEntries.find(hasGeo);
    if (first) {
      // Migración: /en/{ciudad} -> /en/{pais}/{region}/{ciudad}.
      permanentRedirect(
        `/en/${first.countrySlug}/${first.regionSlug}/${segs[0]}`,
      );
    }
    const regions = geo.countries.get(segs[0]);
    if (regions) {
      return <CountryHub countrySlug={segs[0]} regions={regions} />;
    }
    notFound();
  }

  if (segs.length === 2) {
    const regions = geo.countries.get(segs[0]);
    if (regions) {
      const region = regions.get(segs[1]);
      if (!region) notFound();
      return (
        <RegionHub
          countrySlug={segs[0]}
          regionName={region.regionName}
          cities={[...region.cities.values()]}
        />
      );
    }
    const categoryDef = getDirectoryCategoryByPlural(segs[1]);
    const legacyEntries = categoryDef
      ? (legacyByCity.get(segs[0]) ?? []).filter(
          (e) => e.category === categoryDef.value,
        )
      : [];
    const first = legacyEntries.find(hasGeo);
    if (first) {
      // Migración: /en/{ciudad}/{rubro} -> /en/{pais}/{region}/{ciudad}/{rubro}.
      permanentRedirect(
        `/en/${first.countrySlug}/${first.regionSlug}/${segs[0]}/${segs[1]}`,
      );
    }
    notFound();
  }

  if (segs.length === 3) {
    const city = findCityGroup(geo, segs[0], segs[1], segs[2]);
    if (!city || city.entries.length === 0) notFound();
    return <CityView city={city} query={query} />;
  }

  if (segs.length === 4) {
    const city = findCityGroup(geo, segs[0], segs[1], segs[2]);
    const categoryDef = getDirectoryCategoryByPlural(segs[3]);
    if (!city || !categoryDef) notFound();
    if (!city.entries.some((e) => e.category === categoryDef.value)) notFound();
    return <CategoryView city={city} categoryDef={categoryDef} query={query} />;
  }

  notFound();
}
