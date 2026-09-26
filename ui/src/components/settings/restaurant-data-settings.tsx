"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useActivationStore } from "@/stores/activation.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/ui/material-icon";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { GalleryEditor } from "@/components/settings/gallery-editor";
import { RESTAURANT_CATEGORIES } from "@/lib/restaurant-categories";
import { formatArPhone, formatWhatsAppDisplay, toWhatsAppNumber, whatsAppLink } from "@/lib/ar-phone";
import { currentPosition, geocodeAddress, mapsLink, roundCoordinates, type Coordinates } from "@/lib/geocode";
import { cn } from "@/lib/utils";
import type { PhotoGalleryImage, Restaurant } from "@/types";

const SELECT_CLASSES =
  "h-11 w-full rounded-xl border-none bg-surface-container-low px-4 py-2 text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm";

const CURRENCIES = [
  { value: "ARS", label: "Peso argentino (ARS)" },
  { value: "UYU", label: "Peso uruguayo (UYU)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "COP", label: "Peso colombiano (COP)" },
];

interface FormState {
  name: string;
  category: string;
  description: string;
  phone: string;
  instagram: string;
  address: string;
  city: string;
  coordinates: Coordinates | null;
  photoGallery: PhotoGalleryImage[];
  currency: string;
}

function fromRestaurant(r: Restaurant): FormState {
  return {
    name: r.name ?? "",
    category: r.category ?? "",
    description: r.description ?? "",
    phone: r.phone ?? "",
    instagram: r.socialLinks?.instagram ?? "",
    address: r.address ?? "",
    city: r.city ?? "",
    coordinates: r.coordinates ?? null,
    photoGallery: r.photoGallery ?? [],
    currency: r.currency || "ARS",
  };
}

function prettyPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (value.trim().startsWith("+") && !digits.startsWith("54")) return value.trim();
  const formatted = formatArPhone(value);
  return formatted.replace(/\D/g, "").length === 10 ? formatted : value;
}

function Section({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm transition-shadow target:ring-2 target:ring-primary/40 sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MaterialIcon name={icon} size="md" />
        </span>
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-base font-bold text-on-surface">{title}</h2>
          <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function RestaurantDataForm({ restaurant }: { restaurant: Restaurant }) {
  const update = useRestaurantStore((s) => s.update);
  const refreshActivation = useActivationStore((s) => s.fetch);
  const initial = useMemo(() => fromRestaurant(restaurant), [restaurant]);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState<"address" | "device" | null>(null);

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const whatsapp = toWhatsAppNumber(form.phone);
  const phoneTyped = form.phone.replace(/\D/g, "").length > 0;

  const locateByAddress = async () => {
    if (!form.address.trim()) {
      toast.error("Escribí la dirección primero.");
      return;
    }
    setLocating("address");
    try {
      const found = await geocodeAddress([form.address, form.city, "Argentina"]);
      if (!found) {
        toast.error("No encontramos esa dirección. Probá con calle y altura, o usá tu ubicación estando en el local.");
        return;
      }
      set({ coordinates: roundCoordinates(found) });
      toast.success("Ubicación encontrada. Revisala en el mapa y guardá.");
    } catch {
      toast.error("No pudimos buscar la dirección. Probá de nuevo en un rato.");
    } finally {
      setLocating(null);
    }
  };

  const locateByDevice = async () => {
    setLocating("device");
    try {
      set({ coordinates: roundCoordinates(await currentPosition()) });
      toast.success("Listo, usamos tu ubicación actual. Guardá para aplicarla.");
    } catch {
      toast.error("No pudimos acceder a tu ubicación. Revisá los permisos del navegador.");
    } finally {
      setLocating(null);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre del local no puede quedar vacío.");
      return;
    }
    setSaving(true);
    try {
      await update({
        name: form.name.trim(),
        category: (form.category || undefined) as never,
        description: form.description,
        phone: prettyPhone(form.phone),
        address: form.address,
        city: form.city,
        coordinates: form.coordinates,
        photoGallery: form.photoGallery,
        currency: form.currency,
        socialLinks: { ...(restaurant.socialLinks ?? {}), instagram: form.instagram.trim() || undefined },
      });
      const fresh = useRestaurantStore.getState().restaurant;
      if (fresh) setForm(fromRestaurant(fresh));
      refreshActivation();
      toast.success("Datos guardados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const currencyOptions = CURRENCIES.some((c) => c.value === form.currency)
    ? CURRENCIES
    : [...CURRENCIES, { value: form.currency, label: form.currency }];

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      <Section id="local" icon="storefront" title="Tu local" description="Cómo te ven tus clientes en el menú y en el buscador.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="r-name">Nombre</Label>
            <Input id="r-name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-category">Rubro</Label>
            <select
              id="r-category"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
              className={SELECT_CLASSES}
            >
              <option value="">Sin clasificar</option>
              {RESTAURANT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="r-description">Sobre el local</Label>
            <Textarea
              id="r-description"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="Qué hacés, qué te hace distinto, si hacés delivery..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-currency">Moneda de los precios</Label>
            <select
              id="r-currency"
              value={form.currency}
              onChange={(e) => set({ currency: e.target.value })}
              className={SELECT_CLASSES}
            >
              {currencyOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section
        id="whatsapp"
        icon="chat"
        title="WhatsApp y redes"
        description="El botón de WhatsApp del menú abre un chat con este número."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="r-phone">Celular con WhatsApp</Label>
            <Input
              id="r-phone"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              onBlur={() => set({ phone: prettyPhone(form.phone) })}
              placeholder="343 412-3456"
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={phoneTyped && !whatsapp}
            />
            {whatsapp ? (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1 font-semibold text-success">
                  <MaterialIcon name="check_circle" size="xs" />
                  Te escriben al {formatWhatsAppDisplay(whatsapp)}
                </span>
                <a
                  href={whatsAppLink(form.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                >
                  <WhatsAppIcon className="size-3.5" />
                  Probar
                </a>
              </p>
            ) : (
              <p className={cn("text-xs", phoneTyped ? "font-semibold text-error" : "text-on-surface-variant")}>
                {phoneTyped
                  ? "Falta el código de área o sobran números. Ej: 343 412-3456 o 11 5555-1234."
                  : "Con código de área, sin el 0 ni el 15."}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-instagram">Instagram</Label>
            <Input
              id="r-instagram"
              value={form.instagram}
              onChange={(e) => set({ instagram: e.target.value })}
              placeholder="@tulocal"
              autoCapitalize="none"
            />
          </div>
        </div>
      </Section>

      <Section
        id="ubicacion"
        icon="location_on"
        title="Ubicación"
        description="Para el botón Cómo llegar y para aparecer en los locales cercanos."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="r-address">Dirección</Label>
            <Input
              id="r-address"
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="San Martín 123"
              autoComplete="street-address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-city">Ciudad</Label>
            <Input
              id="r-city"
              value={form.city}
              onChange={(e) => set({ city: e.target.value })}
              placeholder="Concepción del Uruguay"
              autoComplete="address-level2"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 text-sm">
            {form.coordinates ? (
              <p className="flex items-center gap-1.5 font-semibold text-on-surface">
                <MaterialIcon name="check_circle" size="sm" className="text-success" />
                Ubicación marcada
                <a
                  href={mapsLink(form.coordinates)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 font-bold text-primary hover:underline"
                >
                  Ver en el mapa
                </a>
              </p>
            ) : (
              <p className="text-on-surface-variant">Todavía no marcaste el punto en el mapa.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="button" variant="outline" onClick={locateByAddress} disabled={locating !== null}>
              <MaterialIcon name={locating === "address" ? "progress_activity" : "search"} size="sm" className={cn(locating === "address" && "animate-spin")} />
              Buscar dirección
            </Button>
            <Button type="button" variant="outline" onClick={locateByDevice} disabled={locating !== null}>
              <MaterialIcon name={locating === "device" ? "progress_activity" : "my_location"} size="sm" className={cn(locating === "device" && "animate-spin")} />
              Estoy en el local
            </Button>
          </div>
        </div>
      </Section>

      <Section
        id="fotos"
        icon="add_photo_alternate"
        title="Fotos del local"
        description="Aparecen en tu página y en el buscador de locales. Tus platos, el salón o la fachada."
      >
        <GalleryEditor value={form.photoGallery} onChange={(photoGallery) => set({ photoGallery })} disabled={saving} />
      </Section>

      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 border-t border-outline-variant/30 bg-surface-container-lowest/95 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0",
          !dirty && "max-lg:hidden",
        )}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
          {dirty && (
            <>
              <span className="mr-auto text-sm font-semibold text-on-surface-variant">Tenés cambios sin guardar</span>
              <Button type="button" variant="ghost" onClick={() => setForm(initial)} disabled={saving}>
                Descartar
              </Button>
            </>
          )}
          <Button type="button" onClick={handleSave} disabled={saving || !dirty} size="lg">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RestaurantDataSettings() {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  if (!restaurant) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <RestaurantDataForm key={restaurant.id} restaurant={restaurant} />;
}
