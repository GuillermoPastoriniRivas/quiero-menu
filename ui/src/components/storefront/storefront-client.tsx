"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { StorefrontData } from "@/types";
import { StorefrontView } from "./storefront-view";
import { browserPathParam } from "@/lib/static-route-param";
import {
  getApiBase,
  resolveCustomDomainSlug,
} from "@/lib/storefront-context";
import {
  PREVIEW_READY_MESSAGE,
  isPreviewDraftMessage,
  type StorefrontPreviewDraft,
} from "@/lib/storefront-preview";

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
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState<StorefrontPreviewDraft | null>(null);

  useEffect(() => {
    const isPreview =
      new URLSearchParams(window.location.search).get("preview") === "1" &&
      window.self !== window.top;
    setPreview(isPreview);
    if (!isPreview) return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isPreviewDraftMessage(event.data)) return;
      setDraft(event.data.payload);
    };
    window.addEventListener("message", handler);
    window.parent.postMessage(
      { type: PREVIEW_READY_MESSAGE },
      window.location.origin,
    );
    return () => window.removeEventListener("message", handler);
  }, []);

  const viewData = useMemo(() => {
    if (!data || !draft) return data;
    return {
      ...data,
      restaurant: {
        ...data.restaurant,
        logoUrl: draft.logoUrl,
        bannerUrl: draft.bannerUrl,
        theme: { ...data.restaurant.theme, primaryColor: draft.primaryColor },
      },
    };
  }, [data, draft]);

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
    // La metadata SSR ya pone el nombre como título; acá lo reforzamos para
    // slugs que no están en el índice (dominios custom, locales nuevos).
    document.title = data.restaurant.name;
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
  }, [data]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    );
  if (!viewData || !slug)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Restaurante no encontrado
      </div>
    );
  return (
    <StorefrontView data={viewData} slug={slug} trackView={!preview} />
  );
}