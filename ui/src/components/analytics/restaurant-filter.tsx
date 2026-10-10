"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminRestaurantListResponse } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Local = { id: string; name: string };

/** Busca en todos los locales, incluso los que no tienen una cohorte de alta. */
export function RestaurantFilter({
  value,
  onChange,
  known,
}: {
  value: string;
  onChange: (value: string) => void;
  known: Local[];
}) {
  const [term, setTerm] = useState("");
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    term: string;
    items: Local[];
    error?: string;
  }>();
  const [selected, setSelected] = useState<Local>();
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () => {
        api
          .get<AdminRestaurantListResponse>(
            `/admin/restaurants?q=${encodeURIComponent(term.trim())}&limit=25&page=1`,
          )
          .then((data) => {
            if (!cancelled)
              setResult({
                term,
                items: data.items.map(({ id, name }) => ({ id, name })),
              });
          })
          .catch(() => {
            if (!cancelled)
              setResult({
                term,
                items: [],
                error: "No se pudieron cargar los locales.",
              });
          });
      },
      term ? 350 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, retry]);
  const matches = result?.term === term ? result.items : [];
  const current = [selected, ...known, ...(result?.items ?? [])].find(
    (item) => item?.id === value,
  );
  const options = [...matches];
  if (value && !options.some((item) => item.id === value))
    options.unshift(current ?? { id: value, name: "Local seleccionado" });
  return (
    <div className="flex flex-wrap items-end gap-3 text-sm">
      <div className="space-y-1">
        <label htmlFor="behavior-search">Buscar un local</label>
        <Input
          id="behavior-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Nombre o ciudad"
          className="max-w-full"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="behavior-restaurant">Analizar</label>
        <select
          id="behavior-restaurant"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            setSelected(options.find((item) => item.id === next));
            onChange(next);
          }}
          className="h-10 max-w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3"
        >
          <option value="">Todos los locales</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {value && (
        <Button size="sm" variant="ghost" onClick={() => onChange("")}>
          Ver todos
        </Button>
      )}
      <div role="status" className="w-full text-xs text-on-surface-variant">
        {result?.term !== term ? (
          "Buscando locales…"
        ) : result.error ? (
          <>
            {result.error}{" "}
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="font-semibold text-primary underline"
            >
              Reintentar
            </button>
          </>
        ) : term && matches.length === 0 ? (
          "No encontramos locales con esa búsqueda."
        ) : (
          "Buscá por nombre o ciudad para encontrar otros locales."
        )}
      </div>
    </div>
  );
}
