"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { StoreCard } from "@/components/directory/store-card";
import {
  searchStorefronts,
  fetchStorefrontIndex,
  filterIndexLocally,
  type StorefrontSearchResult,
} from "@/lib/storefront-search";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/**
 * Buscador del directorio. El comensal no busca "Leonardo's": busca
 * "milanesa" y decide si abre ahora. Por eso busca también dentro de las
 * cartas y tiene el filtro "Abiertos ahora".
 *
 * Sin búsqueda activa muestra el contenido SSR (children) — el HTML que
 * indexa Google. Con búsqueda activa muestra los resultados client-side.
 */
export function DirectorySearch({
  placeholder,
  citySlug,
  children,
}: {
  placeholder: string;
  citySlug?: string;
  children: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [results, setResults] = useState<StorefrontSearchResult[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = q.trim();
  const active = trimmed.length >= MIN_QUERY_LENGTH || openNow;

  useEffect(() => {
    if (!active) {
      setResults(null);
      setError(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(false);
      try {
        const out = await searchStorefronts({
          q: trimmed,
          city: citySlug,
          openNow,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setResults(out.results);
        setTotal(out.total);
      } catch {
        if (controller.signal.aborted) return;
        // Fallback: el endpoint de búsqueda puede no estar deployado todavía.
        // Filtramos el índice en el cliente (nombre/rubro/descripción).
        try {
          const entries = await fetchStorefrontIndex(controller.signal);
          if (controller.signal.aborted) return;
          const out = filterIndexLocally(entries, {
            q: trimmed,
            city: citySlug,
            openNow,
          });
          setResults(out.results);
          setTotal(out.total);
        } catch {
          if (!controller.signal.aborted) setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed, openNow, citySlug, active]);

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <MaterialIcon
            name="search"
            size="md"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-12 w-full rounded-full border border-outline-variant/50 bg-surface-container-lowest pl-12 pr-11 text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
            >
              <MaterialIcon name="close" size="sm" />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-pressed={openNow}
          onClick={() => setOpenNow((v) => !v)}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold transition-colors ${
            openNow
              ? "border-green-700/30 bg-green-600/15 text-green-800"
              : "border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:border-primary/40"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${openNow ? "bg-green-600" : "bg-outline-variant"}`}
          />
          Abiertos ahora
        </button>
      </form>

      {!active ? (
        <div className="mt-8">{children}</div>
      ) : (
        <div className="mt-8" aria-live="polite">
          <p className="text-sm font-semibold text-on-surface-variant">
            {loading
              ? "Buscando…"
              : error
                ? "No pudimos buscar. Probá de nuevo."
                : `${total} ${total === 1 ? "local" : "locales"} ${
                    trimmed.length >= MIN_QUERY_LENGTH ? `con "${trimmed}"` : "abiertos ahora"
                  }`}
          </p>

          {!loading && !error && results && results.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <StoreCard
                  key={r.slug}
                  entry={r}
                  matchedItems={r.matchedItems}
                  currency={r.currency}
                />
              ))}
            </div>
          ) : null}

          {!loading && !error && results && results.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-outline-variant/60 p-10 text-center">
              <p className="font-semibold text-on-surface">
                {trimmed.length >= MIN_QUERY_LENGTH
                  ? `Nadie publica algo con "${trimmed}" todavía.`
                  : "No hay locales abiertos en este momento."}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {trimmed.length >= MIN_QUERY_LENGTH
                  ? "Probá con otro plato o el nombre del local."
                  : "Volvé más tarde o mirá todos los locales."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setOpenNow(false);
                }}
                className="mt-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20"
              >
                Ver todos
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
