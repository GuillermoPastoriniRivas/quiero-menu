import type { MetadataRoute } from 'next';
import { getStorefrontIndex } from '@/lib/storefront-index';

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
    ...storefronts,
  ];
}