"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { StoreCard } from "./store-card";
import { MaterialIcon } from "@/components/ui/material-icon";
import type { StorefrontIndexEntry } from "@/types";

const POS_KEY = "qm:user-pos";
const POS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface UserPos {
  lat: number;
  lng: number;
  at: number;
}

/**
 * Ubicación del usuario como store externo (localStorage). useSyncExternalStore
 * evita setState sincrónico en el efecto: la posición es dato externo que puede
 * cambiar (request de geolocalización) y se lee hidratado sin mismatches.
 */
const userPosStore = {
  listeners: new Set<() => void>(),
  cached: null as string | null,

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      this.listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },

  getSnapshot(): string | null {
    if (this.cached !== null) return this.cached;
    try {
      const raw = window.localStorage.getItem(POS_KEY);
      // Sin TTL válido => como si no existiera (se pide de nuevo).
      if (raw) {
        const parsed = JSON.parse(raw) as UserPos;
        if (
          typeof parsed.lat === "number" &&
          Date.now() - parsed.at < POS_TTL_MS
        ) {
          this.cached = raw;
        }
      }
    } catch {
      // localStorage puede fallar en modo privado: sin ubicación, sin sección.
    }
    return this.cached || null;
  },

  getServerSnapshot(): null {
    return null;
  },

  save(pos: UserPos) {
    try {
      window.localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      // Sin storage: la sección funciona igual, solo no queda recordada.
    }
    this.cached = null;
    for (const listener of this.listeners) listener();
  },
};

/**
 * Distancia haversine en km. Precisión de orden de magnitud basta: el
 * objetivo es ordenar el directorio, no navegación.
 */
function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function NearbyStores({
  entries,
}: {
  entries: StorefrontIndexEntry[];
}) {
  const rawPos = useSyncExternalStore(
    (cb) => userPosStore.subscribe(cb),
    () => userPosStore.getSnapshot(),
    () => userPosStore.getServerSnapshot(),
  );
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);
  const askedRef = useRef(false);

  const startGeolocation = useCallback(() => {
    askedRef.current = true;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        userPosStore.save({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          at: Date.now(),
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) setDenied(true);
      },
      { timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);

  // Si no hay posición guardada (o expiró), pedirla SOLO si el permiso está
  // concedido o es indeterminado: si el usuario lo negó, no volvemos a
  // molestarlo en cada visita ( queda el aviso con la explicación).
  useEffect(() => {
    if (askedRef.current) return;
    let cancelled = false;
    try {
      const stored: UserPos | null = rawPos
        ? (JSON.parse(rawPos) as UserPos)
        : null;
      if (stored && Date.now() - stored.at < POS_TTL_MS) return;
    } catch {
      // JSON corrupto en storage: pedimos de nuevo.
    }
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((p) => {
          if (cancelled) return;
          setDenied(p.state === "denied");
          if (p.state !== "denied") startGeolocation();
        })
        .catch(() => {
          if (!cancelled) startGeolocation();
        });
    } else {
      // Fuera del cuerpo sincrónico: evita cascada de renders en hidratación.
      const timer = setTimeout(startGeolocation, 0);
      return () => clearTimeout(timer);
    }
    return () => {
      cancelled = true;
    };
  }, [rawPos, startGeolocation]);

  const requestManually = useCallback(() => {
    startGeolocation();
  }, [startGeolocation]);

  let pos: UserPos | null = null;
  try {
    pos = rawPos ? (JSON.parse(rawPos) as UserPos) : null;
  } catch {
    pos = null;
  }

  const nearby = pos
    ? entries
        .filter((e) => typeof e.lat === "number" && typeof e.lng === "number")
        .map((e) => ({
          entry: e,
          km: distanceKm(pos!.lat, pos!.lng, e.lat!, e.lng!),
        }))
        .sort((a, b) => a.km - b.km)
    : [];

  if (nearby.length === 0) {
    if (locating) return null;
    // Con posición guardada pero sin locales geo-localizados cerca: no
    // re-pedimos nada, explicamos que aún no hay cobertura cerca de ahí.
    if (pos) {
      return (
        <div className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
          <p className="text-sm text-on-surface-variant">
            Todavía no hay locales con su carta publicada cerca tuyo. Podés ver
            todo el directorio en la lista de abajo.
          </p>
        </div>
      );
    }
    const copy = denied
      ? "La ubicación está bloqueada para este sitio. Activla en el navegador para ver los locales más cercanos primero."
      : "Compartí tu ubicación para ver los locales más cercanos primero.";
    return (
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low px-4 py-3">
        <p className="text-sm text-on-surface-variant">{copy}</p>
        <button
          type="button"
          onClick={requestManually}
          className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
        >
          {denied ? "Intentar de nuevo" : "Usar mi ubicación"}
        </button>
      </div>
    );
  }

  return (
    <section className="mt-10" aria-label="Locales cerca de ti">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-extrabold text-on-surface">
          <MaterialIcon name="near_me" size="sm" className="text-primary" />
          Cerca de ti
        </h2>
        <span className="text-xs text-on-surface-variant">
          {nearby.length} {nearby.length === 1 ? "local" : "locales"} por
          distancia
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {nearby.slice(0, 9).map(({ entry, km }) => (
          <StoreCard key={entry.slug} entry={entry} distanceKm={km} />
        ))}
      </div>
    </section>
  );
}
