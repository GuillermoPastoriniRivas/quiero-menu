"use client";

import { useEffect } from "react";
import { trackStorefront } from '@/lib/behavior';
import { toWhatsAppNumber } from "@/lib/ar-phone";
import { directoryMapsUrl } from "@/lib/directory-location";

/**
 * Pings de la ficha de inventario: vista por sesión + clicks de contacto
 * (WhatsApp/Maps). Mismo patrón que storefront-view (sendBeacon sin
 * preflight, sobrevive la navegación) pero con componente propio para no
 * montar el storefront de pedidos entero encima de una ficha.
 */
export function FichaContactButtons({
  slug,
  phone,
  address,
  name,
  city,
  region,
  countrySlug,
  lat,
  lng,
}: {
  slug: string;
  phone: string;
  address: string;
  name: string;
  city: string;
  region?: string;
  countrySlug?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  useEffect(() => {
    trackStorefront(slug, 'storefront_view', { claimed: false }, 'view');
  }, [slug]);

  const track = (type: "whatsapp" | "maps") => {
    trackStorefront(slug, 'contact_click', { contact: type });
  };

  const digits = toWhatsAppNumber(phone) ?? "";
  const waHref = digits ? `https://wa.me/${digits}` : "";
  const mapsHref = directoryMapsUrl({ name, address, city, region, countrySlug, lat, lng });

  return (
    <div className="flex flex-wrap gap-3">
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp")}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Contactar por WhatsApp
        </a>
      ) : null}
      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("maps")}
          className="rounded-full border border-outline-variant/50 px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary/50 hover:text-primary"
        >
          Ver en Google Maps
        </a>
      ) : null}
    </div>
  );
}
