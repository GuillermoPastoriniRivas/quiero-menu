import Link from "next/link";
import type { StorefrontData } from "@/types";
import { getCategoryDef } from "@/lib/restaurant-categories";
import { FichaContactButtons } from "@/components/storefront/inventory-ficha";
import {
  countryLabel,
  subdivisionLabel,
} from "@/lib/directory-geo";

/**
 * Ficha de inventario para locales SIN dueño (claimed=false): página pública
 * informativa con los datos que el equipo cargó + CTA de reclamo. NO es el
 * storefront de pedidos: no hay menú, carrito ni checkout.
 * Le sirve a Google (landing indexable del negocio) y al dueño (descubre su
 * ficha y la reclama, con el pre-llenado ya hecho por el sistema).
 */
export function FichaView({ data, slug }: { data: StorefrontData; slug: string }) {
  const restaurant = data.restaurant;
  const categoryDef = getCategoryDef(restaurant.category);

  const hoursText = data.isOpen
    ? "Abierto ahora"
    : data.operatingHours.length > 0
      ? "Cerrado ahora"
      : "Horarios no publicados";

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <header className="border-b border-outline-variant/40 bg-surface-container-lowest/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-on-surface"
          >
            quiero<span className="text-primary">.menu</span>
          </Link>
          <Link
            href="/locales"
            className="text-sm font-bold text-primary hover:underline"
          >
            Todos los locales
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-on-surface">
            ¿Tenés este local? Es tuyo.
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Armamos esta página con la información de tu negocio. Reclamala y
            convertila en tu menú digital con pedidos directos, sin comision.
          </p>
          <Link
            href={`/${slug}/reclamar`}
            className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Reclamar este local
          </Link>
        </div>

        {restaurant.logoUrl || restaurant.bannerUrl ? (
          <div className="mt-8 overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.bannerUrl || restaurant.logoUrl}
              alt={restaurant.name}
              className="h-48 w-full object-cover sm:h-64"
            />
          </div>
        ) : null}

        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            {categoryDef && categoryDef.value !== "otro" ? (
              <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {categoryDef.label}
              </span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                data.isOpen
                  ? "bg-green-100 text-green-800"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {hoursText}
            </span>
          </div>

          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            {restaurant.name}
          </h1>

          {restaurant.description ? (
            <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">
              {restaurant.description}
            </p>
          ) : null}

          <dl className="mt-6 space-y-2 text-sm text-on-surface-variant">
            {restaurant.address ? (
              <div className="flex gap-2">
                <dt className="font-bold text-on-surface">Dirección:</dt>
                <dd>
                  {restaurant.address}
                  {restaurant.city ? `, ${restaurant.city}` : ""}
                </dd>
              </div>
            ) : null}
            {restaurant.city ? (
              <div className="flex gap-2">
                <dt className="font-bold text-on-surface">Zona:</dt>
                <dd>
                  {restaurant.city}
                  {restaurant.regionSlug
                    ? `, ${subdivisionLabel(restaurant.countrySlug ?? "")} de ${
                        restaurant.region
                      }, ${countryLabel(restaurant.countrySlug ?? "")}`
                    : ""}
                </dd>
              </div>
            ) : null}
            {restaurant.phone ? (
              <div className="flex gap-2">
                <dt className="font-bold text-on-surface">Teléfono:</dt>
                <dd>{restaurant.phone}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6">
            <FichaContactButtons
              slug={slug}
              phone={restaurant.phone}
              address={restaurant.address}
            />
          </div>
        </div>

        <section className="mt-14 rounded-3xl bg-surface-container-low p-8 text-center sm:p-12">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-on-surface">
            Tu menú digital, listo en minutos
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">
            Completá el menú con la información que ya cargamos, publicá tu
            página y recibí pedidos directos por WhatsApp. Sin comisiones por
            venta.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Crear mi menú gratis
          </Link>
        </section>
      </main>
    </div>
  );
}
