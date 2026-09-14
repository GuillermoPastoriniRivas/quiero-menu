import type { StorefrontIndexEntry } from "@/types";

/** La región es una subdivisión administrativa con nombre distinto por país
 * (provincia, departamento, estado). Diccionario por país: un archivo, no una
 * migración. Un país no listado cae a fallback "Región". */
export const COUNTRY_LABELS: Record<string, { name: string; subdivision: string }> = {
  argentina: { name: "Argentina", subdivision: "Provincia" },
  uruguay: { name: "Uruguay", subdivision: "Departamento" },
  colombia: { name: "Colombia", subdivision: "Departamento" },
};

export function countryLabel(countrySlug: string): string {
  return COUNTRY_LABELS[countrySlug]?.name ?? countrySlug;
}

export function subdivisionLabel(countrySlug: string): string {
  return COUNTRY_LABELS[countrySlug]?.subdivision ?? "Región";
}

export interface CityGroup {
  citySlug: string;
  cityName: string;
  countrySlug: string;
  regionSlug: string;
  regionName: string;
  entries: StorefrontIndexEntry[];
}

/**
 * Agrupa el índice por país > región > ciudad para el directorio de 3 niveles
 * (/en/{pais}/{region}/{ciudad}). Locales sin geografía clasificada quedan
 * fuera de las URLs nuevas (no inventar datos): se siguen serviendo por slug.
 */
export function buildGeoIndex(entries: StorefrontIndexEntry[]) {
  const countries = new Map<
    string,
    Map<string, { regionName: string; cities: Map<string, CityGroup> }>
  >();
  const byCity = new Map<string, CityGroup[]>();

  for (const entry of entries) {
    if (!entry.citySlug || !entry.countrySlug || !entry.regionSlug) continue;

    const regions = countries.get(entry.countrySlug) ?? new Map();
    const region =
      regions.get(entry.regionSlug) ??
      { regionName: entry.region || entry.regionSlug, cities: new Map() };
    // byCity: todos los locales geo-clasificados por citySlug (join key).
    const groupList = byCity.get(entry.citySlug) ?? [];
    byCity.set(entry.citySlug, groupList);
    const cityGroup: CityGroup =
      region.cities.get(entry.citySlug) ??
      {
        citySlug: entry.citySlug,
        cityName: entry.city || entry.citySlug,
        countrySlug: entry.countrySlug,
        regionSlug: entry.regionSlug,
        regionName: region.regionName,
        entries: [],
      };
    region.cities.set(entry.citySlug, cityGroup);
    cityGroup.entries.push(entry);
    groupList.push(cityGroup);
    regions.set(entry.regionSlug, region);
    countries.set(entry.countrySlug, regions);
  }

  return { countries, byCity };
}

/** /en/{pais}/{region}/{ciudad} desde un grupo de ciudad. */
export function cityHref(city: CityGroup): string {
  return `/en/${city.countrySlug}/${city.regionSlug}/${city.citySlug}`;
}

/** /en/{pais}/{region}/{ciudad}/{rubro} para una página de categoría. */
export function categoryHref(city: CityGroup, plural: string): string {
  return `${cityHref(city)}/${plural}`;
}

/** Grupo de ciudad por slugs geo. Null si no está clasificada. */
export function findCityGroup(
  geo: ReturnType<typeof buildGeoIndex>,
  countrySlug: string,
  regionSlug: string,
  citySlug: string,
): CityGroup | null {
  return (
    geo.countries.get(countrySlug)?.get(regionSlug)?.cities.get(citySlug) ??
    null
  );
}
