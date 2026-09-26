"use client";

import { useEffect } from "react";
import { getApiBase } from "@/lib/storefront-context";
import { toWhatsAppNumber } from "@/lib/ar-phone";

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
}: {
  slug: string;
  phone: string;
  address: string;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = `quiero-menu:viewed:${slug}`;
    if (!sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "1");
      fetch(
        `${getApiBase()}/storefront/${encodeURIComponent(slug)}/view`,
        { method: "POST" },
      ).catch(() => {});
    }
  }, [slug]);

  const track = (type: "whatsapp" | "maps") => {
    try {
      navigator.sendBeacon?.(
        `${getApiBase()}/storefront/${encodeURIComponent(slug)}/events?type=${type}`,
      );
    } catch {
      // Nunca romper la navegación del comensal.
    }
  };

  const digits = toWhatsAppNumber(phone) ?? "";
  const waHref = digits ? `https://wa.me/${digits}` : "";
  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : "";

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
