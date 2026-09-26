import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import type { StorefrontIndexEntry } from "@/types";
import { getCategoryDef } from "@/lib/restaurant-categories";
import { formatCurrency } from "@/lib/format";
import { toWhatsAppNumber } from "@/lib/ar-phone";
import type { StorefrontSearchMatch } from "@/lib/storefront-search";

function waDigits(phone: string | undefined): string {
  return toWhatsAppNumber(phone) ?? "";
}

/** Ícono del placeholder cuando el local no tiene foto, por rubro. */
const CATEGORY_ICONS: Record<string, string> = {
  pizzeria: "restaurant_menu",
  hamburgueseria: "restaurant",
  heladeria: "icecream",
  cafe: "bakery_dining",
  empanaderia: "bakery_dining",
  sushi: "restaurant",
};

/**
 * Card de local para las páginas de directorio. Server component por defecto;
 * en resultados de búsqueda recibe `matchedItems` (los platos que coinciden,
 * con precio) para mostrar el porqué del resultado sin entrar al local.
 */
export function StoreCard({
  entry,
  matchedItems,
  currency,
  featured = false,
  distanceKm,
}: {
  entry: StorefrontIndexEntry;
  matchedItems?: StorefrontSearchMatch[];
  currency?: string;
  featured?: boolean;
  /** Distancia en km desde el usuario (solo en la sección "Cerca de ti"). */
  distanceKm?: number | null;
}) {
  const categoryDef = getCategoryDef(entry.category);
  const showDishChips = matchedItems && matchedItems.length > 0 && currency;
  const unclaimed = entry.claimed === false;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <Link
        href={`/${entry.slug}`}
        className="relative block h-28 overflow-hidden"
        aria-label={`Menú de ${entry.name}`}
      >
        {entry.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.bannerUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // Sin foto: placeholder por rubro con ícono, sobre gradiente suave.
          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
            <MaterialIcon
              name={CATEGORY_ICONS[entry.category] ?? "storefront"}
              size="xl"
              className="text-primary/35"
            />
          </div>
        )}
        {entry.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.logoUrl}
            alt={entry.name}
            className="absolute bottom-2 left-3 h-12 w-12 rounded-xl border border-outline-variant/40 bg-white object-cover shadow-sm"
          />
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/${entry.slug}`}
            className="font-[family-name:var(--font-heading)] text-base font-bold leading-tight text-on-surface hover:text-primary"
          >
            {entry.name}
          </Link>
          <span className="flex shrink-0 items-center gap-1.5">
            {featured ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                <MaterialIcon name="star" size="xs" fill />
                Destacado
              </span>
            ) : null}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                entry.isOpen
                  ? "bg-green-100 text-green-800"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {entry.hoursKnown === false
                ? "Horario no publicado"
                : entry.isOpen
                  ? "Abierto ahora"
                  : "Cerrado ahora"}
            </span>
          </span>
        </div>

        <p className="text-xs font-semibold text-on-surface-variant">
          {categoryDef ? `${categoryDef.label} · ` : ""}
          {entry.city}
          {distanceKm != null
            ? ` · a ${distanceKm < 1
                ? `${Math.round(distanceKm * 1000)} m`
                : `${distanceKm.toLocaleString("es", { maximumFractionDigits: 1 })} km`
              }`
            : ""}
        </p>

        {entry.description?.trim() ? (
          <p className="line-clamp-2 text-sm text-on-surface-variant">
            {entry.description}
          </p>
        ) : null}

        {showDishChips ? (
          <div className="flex flex-wrap gap-1.5">
            {matchedItems!.map((mi) => (
              <span
                key={mi.name}
                className="max-w-full truncate rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
              >
                {mi.name}
                {mi.basePrice > 0
                  ? ` · ${formatCurrency(mi.basePrice, currency!)}`
                  : ""}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-end gap-2 pt-2">
          {waDigits(entry.phone) ? (
            <a
              href={`https://wa.me/${waDigits(entry.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Escribirle por WhatsApp a ${entry.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C4A] transition-colors hover:bg-[#25D366]/25"
            >
              <WhatsAppIcon className="size-4" />
            </a>
          ) : null}
          <Link
            href={`/${entry.slug}`}
            className="gradient-cta inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.03]"
          >
            {unclaimed ? "Ver ficha" : "Ver menú"}
            <MaterialIcon name="arrow_forward" size="xs" />
          </Link>
        </div>
      </div>
    </article>
  );
}
