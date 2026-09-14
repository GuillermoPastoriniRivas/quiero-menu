import type { MetadataRoute } from 'next';
import { getStorefrontIndexState } from '@/lib/storefront-index';
import { getCategoryDef } from '@/lib/restaurant-categories';
import {
  buildGeoIndex,
  cityHref,
  categoryHref,
  type CityGroup,
} from '@/lib/directory-geo';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://quiero.menu';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const indexState = await getStorefrontIndexState();
  if (indexState.status === 'unavailable') {
    throw new Error('Storefront index unavailable; refusing to publish an incomplete sitemap');
  }
  const index = indexState.entries;

  const storefronts: MetadataRoute.Sitemap = index.map((entry) => ({
    url: `${BASE_URL}/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const lastMod = (entries: { updatedAt: string }[]) => {
    const max = entries.reduce((acc, e) => {
      const t = new Date(e.updatedAt).getTime();
      return Number.isNaN(t) ? acc : Math.max(acc, t);
    }, 0);
    return max ? new Date(max) : now;
  };

  // Directorio jerárquico: /locales + hubs país/región + ciudad + ciudad×rubro
  // (/en/{pais}/{region}/{ciudad}[/{rubro}]).
  const geo = buildGeoIndex(index);
  const directory: MetadataRoute.Sitemap = [];
  if (index.length > 0) {
    directory.push({
      url: `${BASE_URL}/locales`,
      lastModified: lastMod(index),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  for (const [countrySlug, regions] of geo.countries) {
    const regionList = [...regions.entries()];
    const countryEntries = regionList.flatMap(([, r]) =>
      [...r.cities.values()].flatMap((c) => c.entries),
    );
    if (regionList.length < 1) continue;
    directory.push({
      url: `${BASE_URL}/en/${countrySlug}`,
      lastModified: lastMod(countryEntries),
      changeFrequency: 'daily',
      priority: 0.88,
    });
    for (const [regionSlug, region] of regionList) {
      if (region.cities.size === 0) continue;
      const cities = [...region.cities.values()];
      const regionEntries = cities.flatMap((c) => c.entries);
      directory.push({
        url: `${BASE_URL}/en/${countrySlug}/${regionSlug}`,
        lastModified: lastMod(regionEntries),
        changeFrequency: 'daily',
        priority: 0.86,
      });
      for (const city of cities) {
        directory.push({
          url: `${BASE_URL}${cityHref(city)}`,
          lastModified: lastMod(city.entries),
          changeFrequency: 'daily',
          priority: 0.85,
        });
        // Rubros con presencia en la ciudad.
        const byCategory = new Map<string, CityGroup['entries']>();
        for (const entry of city.entries) {
          const def = getCategoryDef(entry.category);
          if (!def || def.value === 'otro') continue;
          const list = byCategory.get(def.plural) ?? [];
          list.push(entry);
          byCategory.set(def.plural, list);
        }
        for (const [plural, catEntries] of byCategory) {
          directory.push({
            url: `${BASE_URL}${categoryHref(city, plural)}`,
            lastModified: lastMod(catEntries),
            changeFrequency: 'weekly',
            priority: 0.75,
          });
        }
      }
    }
  }

  // Locales con ciudad pero sin región clasificada: no hay URL nueva que
  // publicar (no se inventa la región). Aparecen cuando el backfill/admin
  // clasifique la región.

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...directory,
    ...storefronts,
  ];
}
