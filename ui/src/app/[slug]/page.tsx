'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { StorefrontData } from '@/types';
import { StorefrontView } from '@/components/storefront/storefront-view';
import { browserPathParam } from '@/lib/static-route-param';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function StorefrontPage() {
  const pathname = usePathname();
  const slug = browserPathParam(pathname, '__dynamic__');
  const [data, setData] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug === '__dynamic__') return;
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/storefront/${encodeURIComponent(slug)}`)
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
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Cargando...</div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center">Restaurante no encontrado</div>;
  return <StorefrontView data={data} slug={slug} />;
}
