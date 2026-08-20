'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { StorefrontData } from '@/types';
import { StorefrontView } from '@/components/storefront/storefront-view';
import { browserPathParam } from '@/lib/static-route-param';
import {
  getApiBase,
  resolveCustomDomainSlug,
} from '@/lib/storefront-context';

export default function StorefrontPage() {
  const pathname = usePathname();
  const pathSlug = browserPathParam(pathname, '__dynamic__');
  const [slug, setSlug] = useState<string | null>(
    pathSlug === '__dynamic__' ? null : pathSlug,
  );
  const [data, setData] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let resolvedSlug = slug;
      if (!resolvedSlug) {
        resolvedSlug = await resolveCustomDomainSlug();
      }
      if (cancelled || !resolvedSlug) {
        if (!cancelled) setLoading(false);
        return;
      }
      setSlug(resolvedSlug);
      const apiBase = getApiBase();
      fetch(`${apiBase}/storefront/${encodeURIComponent(resolvedSlug)}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((value: StorefrontData | null) => {
          if (!cancelled) setData(value);
        })
        .catch(() => {
          if (!cancelled) setData(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    document.title = data.restaurant.name;
    if (data.restaurant.logoUrl) {
      const existing = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (existing) {
        existing.href = data.restaurant.logoUrl;
        existing.removeAttribute('type');
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = data.restaurant.logoUrl;
        document.head.appendChild(link);
      }
    }
  }, [data]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  if (!data || !slug) return <div className="flex min-h-screen items-center justify-center">Restaurante no encontrado</div>;
  return <StorefrontView data={data} slug={slug} />;
}
