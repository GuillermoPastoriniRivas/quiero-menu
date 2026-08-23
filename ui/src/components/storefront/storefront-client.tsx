"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { StorefrontData } from "@/types";
import { StorefrontView } from "./storefront-view";
import { browserPathParam } from "@/lib/static-route-param";
import {
  getApiBase,
  resolveCustomDomainSlug,
} from "@/lib/storefront-context";

export function StorefrontClient({
  slug: slugProp,
  initialData,
}: {
  slug: string;
  initialData: StorefrontData | null;
}) {
  const pathname = usePathname();
  const pathSlug = browserPathParam(pathname, "__dynamic__");
  const isDynamic = slugProp === "__dynamic__";
  const [slug, setSlug] = useState<string | null>(
    isDynamic ? (pathSlug === "__dynamic__" ? null : pathSlug) : slugProp,
  );
  const [data, setData] = useState<StorefrontData | null>(initialData);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!initialData) setLoading(true);
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
          if (!cancelled && !initialData) setData(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!data) return;
    if (isDynamic) {
      document.title = data.restaurant.name;
    }
    if (data.restaurant.logoUrl) {
      const existing = document.querySelector(
        'link[rel="icon"]',
      ) as HTMLLinkElement | null;
      if (existing) {
        existing.href = data.restaurant.logoUrl;
        existing.removeAttribute("type");
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = data.restaurant.logoUrl;
        document.head.appendChild(link);
      }
    }
  }, [data, isDynamic]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    );
  if (!data || !slug)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Restaurante no encontrado
      </div>
    );
  return <StorefrontView data={data} slug={slug} />;
}