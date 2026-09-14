"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { StoreCard } from "@/components/directory/store-card";
import {
  searchStorefronts,
  fetchStorefrontIndex,
  filterIndexLocally,
  type StorefrontSearchResult,
  type StorefrontSearchSuggestion,
} from "@/lib/storefront-search";
import { isFeatured } from "@/lib/featured";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export interface DirectoryCityOption {
  slug: string;
  name: string;
  count: number;
}

const SUGGESTION_LABELS: Record<StorefrontSearchSuggestion["type"], string> = {
  dish: "Plato",
  restaurant: "Local",
  category: "Rubro",
  city: "Ciudad",
};

export function DirectorySearch({
  placeholder,
  citySlug,
  category,
  cities = [],
  initialQuery = "",
  initialCitySlug = "",
  initialOpenNow = false,
  children,
}: {
  placeholder: string;
  citySlug?: string;
  category?: string;
  cities?: DirectoryCityOption[];
  initialQuery?: string;
  initialCitySlug?: string;
  initialOpenNow?: boolean;
  children: React.ReactNode;
}) {
  const [q, setQ] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState(citySlug ?? initialCitySlug);
  const [openNow, setOpenNow] = useState(initialOpenNow);
  const [results, setResults] = useState<StorefrontSearchResult[] | null>(null);
  const [suggestions, setSuggestions] = useState<StorefrontSearchSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();

  const trimmed = q.trim();
  const effectiveCity = citySlug ?? selectedCity;
  const active =
    trimmed.length >= MIN_QUERY_LENGTH ||
    openNow ||
    (!citySlug && selectedCity.length > 0);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (trimmed.length >= MIN_QUERY_LENGTH) url.searchParams.set("q", trimmed);
    else url.searchParams.delete("q");
    if (!citySlug && selectedCity) url.searchParams.set("city", selectedCity);
    else url.searchParams.delete("city");
    if (openNow) url.searchParams.set("open", "1");
    else url.searchParams.delete("open");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [trimmed, selectedCity, openNow, citySlug]);

  useEffect(() => {
    if (!active) {
      setResults(null);
      setSuggestions([]);
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
          city: effectiveCity,
          category,
          openNow,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setResults(out.results);
        setSuggestions(out.suggestions);
        setTotal(out.total);
      } catch {
        if (controller.signal.aborted) return;
        try {
          const entries = await fetchStorefrontIndex(controller.signal);
          if (controller.signal.aborted) return;
          const out = filterIndexLocally(entries, {
            q: trimmed,
            city: effectiveCity,
            category,
            openNow,
          });
          setResults(out.results);
          setSuggestions([]);
          setTotal(out.total);
        } catch {
          if (!controller.signal.aborted) setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed, openNow, effectiveCity, category, active]);

  const chooseSuggestion = (suggestion: StorefrontSearchSuggestion) => {
    if (suggestion.type === "city") {
      if (!citySlug) setSelectedCity(suggestion.value);
      setQ("");
    } else {
      setQ(suggestion.label);
      if (!citySlug && suggestion.citySlug) setSelectedCity(suggestion.citySlug);
    }
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
  };

  const clearFilters = () => {
    setQ("");
    if (!citySlug) setSelectedCity("");
    setOpenNow(false);
    setSuggestionsOpen(false);
  };

  const showSuggestions =
    suggestionsOpen && trimmed.length >= MIN_QUERY_LENGTH && suggestions.length > 0;

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setSuggestionsOpen(false);
        }}
        className="mt-8 rounded-3xl border border-outline-variant/40 bg-surface-container-low p-3 shadow-sm sm:p-4"
      >
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MaterialIcon name="search" size="md" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              role="combobox"
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setSuggestionsOpen(true);
                setActiveSuggestion(-1);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
              onKeyDown={(event) => {
                if (!showSuggestions) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveSuggestion((current) => Math.min(current + 1, suggestions.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSuggestion((current) => Math.max(current - 1, 0));
                } else if (event.key === "Enter" && activeSuggestion >= 0) {
                  event.preventDefault();
                  chooseSuggestion(suggestions[activeSuggestion]);
                } else if (event.key === "Escape") {
                  setSuggestionsOpen(false);
                }
              }}
              placeholder={placeholder}
              aria-label={placeholder}
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls={showSuggestions ? listboxId : undefined}
              aria-activedescendant={activeSuggestion >= 0 ? `${listboxId}-${activeSuggestion}` : undefined}
              className="h-13 w-full rounded-2xl border border-outline-variant/50 bg-surface-container-lowest pl-12 pr-11 text-base text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
            {q ? (
              <button type="button" onClick={() => setQ("")} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high">
                <MaterialIcon name="close" size="sm" />
              </button>
            ) : null}

            {showSuggestions ? (
              <div id={listboxId} role="listbox" aria-label="Sugerencias de búsqueda" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-1.5 shadow-xl">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${suggestion.citySlug ?? ""}`}
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={index === activeSuggestion}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(suggestion)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left ${index === activeSuggestion ? "bg-primary/10 text-primary" : "text-on-surface hover:bg-surface-container-low"}`}
                  >
                    <span className="truncate font-semibold">{suggestion.label}</span>
                    <span className="shrink-0 text-xs text-on-surface-variant">
                      {SUGGESTION_LABELS[suggestion.type]}
                      {suggestion.count > 1 ? ` · ${suggestion.count}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!citySlug && cities.length > 0 ? (
            <label className="relative min-w-56">
              <span className="sr-only">Ciudad</span>
              <select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} className="h-13 w-full appearance-none rounded-2xl border border-outline-variant/50 bg-surface-container-lowest px-4 pr-10 text-sm font-bold text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20">
                <option value="">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city.slug} value={city.slug}>{city.name} ({city.count})</option>
                ))}
              </select>
              <MaterialIcon name="expand_more" size="sm" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            </label>
          ) : null}

          <button type="button" aria-pressed={openNow} onClick={() => setOpenNow((value) => !value)} className={`inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-bold transition-colors ${openNow ? "border-green-700/30 bg-green-600/15 text-green-800" : "border-outline-variant/50 bg-surface-container-lowest text-on-surface-variant hover:border-primary/40"}`}>
            <span className={`h-2 w-2 rounded-full ${openNow ? "bg-green-600" : "bg-outline-variant"}`} />
            Abiertos ahora
          </button>
        </div>
        <p className="px-2 pt-2 text-xs text-on-surface-variant">Buscá platos, locales o rubros. Los precios salen de las cartas publicadas.</p>
      </form>

      {!active ? (
        <div className="mt-8">{children}</div>
      ) : (
        <div className="mt-8" aria-live="polite" aria-busy={loading}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-on-surface-variant">
              {loading ? "Buscando…" : error ? "No pudimos consultar el directorio. Probá de nuevo." : `${total} ${total === 1 ? "opción" : "opciones"}${trimmed.length >= MIN_QUERY_LENGTH ? ` para “${trimmed}”` : ""}`}
            </p>
            {!loading && !error ? <button type="button" onClick={clearFilters} className="text-sm font-bold text-primary hover:underline">Limpiar filtros</button> : null}
          </div>

          {!loading && !error && results && results.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <StoreCard key={result.slug} entry={result} matchedItems={result.matchedItems} currency={result.currency} featured={isFeatured(result, { citySlug: result.citySlug || effectiveCity })} />
              ))}
            </div>
          ) : null}

          {!loading && !error && results && results.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-outline-variant/60 p-10 text-center">
              <p className="font-semibold text-on-surface">No encontramos una opción con esos filtros.</p>
              <p className="mt-1 text-sm text-on-surface-variant">Probá otro plato, buscá en todas las ciudades o quitá “Abiertos ahora”.</p>
              <button type="button" onClick={clearFilters} className="mt-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20">Ver todos los locales</button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
