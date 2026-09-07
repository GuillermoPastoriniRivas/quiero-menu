import type { MetadataRoute } from 'next';
import { getStorefrontIndex } from '@/lib/storefront-index';
import { getCategoryDef } from '@/lib/restaurant-categories';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://quiero.menu';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const index = await getStorefrontIndex();

  const storefronts: MetadataRoute.Sitemap = index.map((entry) => ({
    url: `${BASE_URL}/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Directorio: hub + una URL por ciudad + una por categoría×ciudad.
  const lastMod = (entries: { updatedAt: string }[]) => {
    const max = entries.reduce((acc, e) => {
      const t = new Date(e.updatedAt).getTime();
      return Number.isNaN(t) ? acc : Math.max(acc, t);
    }, 0);
    return max ? new Date(max) : now;
  };

  const byCity = new Map<string, typeof index>();
  for (const entry of index) {
    if (!entry.citySlug) continue;
    const list = byCity.get(entry.citySlug) ?? [];
    list.push(entry);
    byCity.set(entry.citySlug, list);
  }

  const directory: MetadataRoute.Sitemap = [];
  if (index.length > 0) {
    directory.push({
      url: `${BASE_URL}/locales`,
      lastModified: lastMod(index),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }
  for (const [citySlug, entries] of byCity) {
    directory.push({
      url: `${BASE_URL}/en/${citySlug}`,
      lastModified: lastMod(entries),
      changeFrequency: 'daily',
      priority: 0.85,
    });
    const byCategory = new Map<string, typeof entries>();
    for (const entry of entries) {
      const def = getCategoryDef(entry.category);
      if (!def || def.value === 'otro') continue;
      const list = byCategory.get(def.plural) ?? [];
      list.push(entry);
      byCategory.set(def.plural, list);
    }
    for (const [plural, catEntries] of byCategory) {
      directory.push({
        url: `${BASE_URL}/en/${citySlug}/${plural}`,
        lastModified: lastMod(catEntries),
        changeFrequency: 'weekly',
        priority: 0.75,
      });
    }
  }

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
