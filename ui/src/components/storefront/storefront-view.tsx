"use client";

import { useState, useMemo, useEffect } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type {
  StorefrontData,
  MenuItem,
  MenuItemVariant,
  MenuItemOption,
  CouponValidation,
} from "@/types";
import { useCartStore, CartItem } from "@/stores/cart.store";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Logo } from "@/components/ui/logo";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/brand-icons";
import { DeliveryType } from "@/types";
import type { StorefrontOrderResponse } from "@/types";
import {
  getLastOrder,
  saveLastOrder,
  clearLastOrder,
  LastOrder,
} from "@/lib/repeat-order";
import { getApiBase } from "@/lib/storefront-context";

type FullMenuItem = MenuItem & {
  variants: MenuItemVariant[];
  options: MenuItemOption[];
};

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export function StorefrontView({
  data,
  slug,
  trackView = true,
}: {
  data: StorefrontData;
  slug: string;
  trackView?: boolean;
}) {
  const {
    restaurant,
    categories,
    deliveryZones,
    showPoweredByFooter,
    isOpen,
    todayHours,
  } = data;
  const cart = useCartStore();
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // ── Helpers ──
  const cleanPhone = restaurant.phone
    ? restaurant.phone.replace(/\D/g, "")
    : "";
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : "";
  const googleMapsUrl = restaurant.coordinates
    ? `https://www.google.com/maps?q=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`
    : restaurant.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address + (restaurant.city ? `, ${restaurant.city}` : ""))}`
      : "";
  const instagramHandle =
    restaurant.socialLinks?.instagram?.replace(/^@/, "") || "";
  const instagramUrl = instagramHandle
    ? instagramHandle.startsWith("http")
      ? instagramHandle
      : `https://instagram.com/${instagramHandle}`
    : "";

  // Hoy (calculado en el server con la timezone del local)
  const todayHoursLabel = todayHours
    ? todayHours.isClosed
      ? "Cerrado hoy"
      : `Hoy ${todayHours.opensAt} – ${todayHours.closesAt}`
    : null;

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [repeatOrder, setRepeatOrder] = useState<LastOrder | null>(null);
  const [repeatError, setRepeatError] = useState("");

  // Registrar una vista del menú por sesion (para la conversion en analytics)
  useEffect(() => {
    if (!trackView) return;
    if (typeof window === "undefined") return;
    const flag = `quiero-menu:viewed:${slug}`;
    if (!sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "1");
      fetch(`${getApiBase()}/storefront/${encodeURIComponent(slug)}/view`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [slug, trackView]);

  // Ultimo pedido para "repetir"
  useEffect(() => {
    if (typeof window === "undefined") return;
    setRepeatOrder(getLastOrder(slug));
  }, [slug]);

  // Scrollspy: actualiza la categoria activa al scrollear
  useEffect(() => {
    if (categories.length === 0) return;
    const onScroll = () => {
      // Salta cuando el titulo de la seccion todavia se ve en pantalla (40% de la altura), no cuando ya paso por arriba
      const OFFSET = Math.round(window.innerHeight * 0.4);
      let current: string | null = categories[0].id;
      for (const cat of categories) {
        const el = document.getElementById(`cat-${cat.id}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - OFFSET <= 0) {
          current = cat.id;
        } else {
          break;
        }
      }
      setActiveCategory((prev) => (prev === current ? prev : current));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  const pm = restaurant.paymentMethods ?? {
    cashEnabled: true,
    cardEnabled: true,
    transferEnabled: true,
  };
  const availablePaymentMethods = useMemo(
    () => [
      ...(pm.cashEnabled ? [{ value: "efectivo", label: "Efectivo" }] : []),
      ...(pm.cardEnabled ? [{ value: "tarjeta", label: "Tarjeta" }] : []),
      ...(pm.transferEnabled
        ? [{ value: "transferencia", label: "Transferencia" }]
        : []),
    ],
    [pm.cashEnabled, pm.cardEnabled, pm.transferEnabled],
  );

  // Ensure selected payment method is valid
  const cartPaymentMethod = useCartStore((s) => s.paymentMethod);
  const cartSetPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  useEffect(() => {
    if (
      availablePaymentMethods.length > 0 &&
      !availablePaymentMethods.some((m) => m.value === cartPaymentMethod)
    ) {
      cartSetPaymentMethod(availablePaymentMethods[0].value);
    }
  }, [availablePaymentMethods, cartPaymentMethod, cartSetPaymentMethod]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Tu navegador no soporta geolocalizacion");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cart.setLocation(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Permiso de ubicacion denegado"
            : "No se pudo obtener tu ubicacion",
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Item detail dialog state
  const [selectedItem, setSelectedItem] = useState<FullMenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");

  const openItemDetail = (item: FullMenuItem) => {
    if (!item.isAvailable) return;
    if (!isOpen) return;
    setSelectedItem(item);
    const firstVariant =
      item.variants.length > 0
        ? [...item.variants].sort((a, b) => a.displayOrder - b.displayOrder)[0]
        : null;
    setSelectedVariantId(firstVariant?.id ?? null);
    setSelectedOptionIds([]);
    setItemQuantity(1);
    setItemNotes("");
  };

  const closeItemDetail = () => {
    setSelectedItem(null);
    setSelectedVariantId(null);
    setSelectedOptionIds([]);
    setItemQuantity(1);
    setItemNotes("");
  };

  const selectedVariant = useMemo(() => {
    if (!selectedItem || !selectedVariantId) return null;
    return (
      selectedItem.variants.find((v) => v.id === selectedVariantId) ?? null
    );
  }, [selectedItem, selectedVariantId]);

  const availableOptions = useMemo(() => {
    if (!selectedItem) return [];
    return selectedItem.options.filter(
      (o) =>
        o.isAvailable &&
        (o.variantId === null || o.variantId === selectedVariantId),
    );
  }, [selectedItem, selectedVariantId]);

  const optionGroups = useMemo(() => {
    const groups: Record<string, MenuItemOption[]> = {};
    for (const opt of availableOptions) {
      const group = opt.optionGroup || "Extras";
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    }
    return groups;
  }, [availableOptions]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return categories.flatMap((cat) =>
      cat.items
        .filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.description ?? "").toLowerCase().includes(q),
        )
        .map((item) => ({ cat, item })),
    );
  }, [searchQuery, categories]);

  const maxSelections = selectedVariant?.maxSelections ?? 0;

  const toggleOption = (optionId: string) => {
    setSelectedOptionIds((prev) => {
      if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
      if (maxSelections > 0 && prev.length >= maxSelections) return prev;
      return [...prev, optionId];
    });
  };

  const itemUnitPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const base = selectedVariant?.priceOverride ?? selectedItem.basePrice;
    const optionsTotal = selectedOptionIds.reduce((sum, id) => {
      const opt = availableOptions.find((o) => o.id === id);
      return sum + (opt?.priceDelta ?? 0);
    }, 0);
    return base + optionsTotal;
  }, [selectedItem, selectedVariant, selectedOptionIds, availableOptions]);

  const itemTotalPrice = itemUnitPrice * itemQuantity;

  const addToCart = () => {
    if (!selectedItem) return;
    if (!isOpen) return;
    const selectedOpts = availableOptions.filter((o) =>
      selectedOptionIds.includes(o.id),
    );
    const cartItem: CartItem = {
      menuItemId: selectedItem.id,
      menuItemName: selectedItem.name,
      variantId: selectedVariant?.id,
      variantName: selectedVariant?.name,
      quantity: itemQuantity,
      unitPrice: itemUnitPrice,
      selectedOptionIds: selectedOpts.map((o) => o.id),
      selectedOptionNames: selectedOpts.map((o) => o.name),
      notes: itemNotes,
    };
    cart.addItem(cartItem);
    closeItemDetail();
  };

  const subtotal = cart.subtotal();
  const deliveryZone = deliveryZones.find((z) => z.id === cart.deliveryZoneId);
  const appliedCoupon = cart.appliedCoupon;
  const freeDelivery =
    !!appliedCoupon?.freeDelivery &&
    cart.deliveryType === DeliveryType.DELIVERY;
  const deliveryFee =
    cart.deliveryType === DeliveryType.DELIVERY && deliveryZone
      ? freeDelivery
        ? 0
        : deliveryZone.price
      : 0;
  const discount = appliedCoupon
    ? appliedCoupon.freeDelivery
      ? 0
      : Math.min(appliedCoupon.discount, subtotal)
    : 0;
  const total = subtotal - discount + deliveryFee;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || couponBusy) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await fetch(
        `${getApiBase()}/storefront/${encodeURIComponent(slug)}/coupon/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal: cart.subtotal() }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Cupon invalido");
      cart.setCoupon(code, data as CouponValidation);
      setCouponInput("");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "No se pudo aplicar el cupon";
      setCouponError(message);
      cart.setCoupon(null, null);
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRepeatOrder = () => {
    if (!repeatOrder) return;
    if (!isOpen) return;
    setRepeatError("");
    const allItems = categories.flatMap((c) => c.items);
    const restored: CartItem[] = [];
    for (const saved of repeatOrder.items) {
      const current = allItems.find(
        (i) => i.id === saved.menuItemId && i.isAvailable && i.isVisible,
      );
      if (!current) continue;
      const variant = current.variants.find((v) => v.id === saved.variantId);
      const validOptionIds = saved.selectedOptionIds.filter((oid: string) =>
        current.options.some(
          (o) =>
            o.id === oid &&
            o.isAvailable &&
            (o.variantId === null || o.variantId === saved.variantId),
        ),
      );
      const validOptionNames = current.options
        .filter((o) => validOptionIds.includes(o.id))
        .map((o) => o.name);
      restored.push({
        menuItemId: current.id,
        menuItemName: current.name,
        variantId: variant?.id,
        variantName: variant?.name,
        quantity: saved.quantity,
        unitPrice: saved.unitPrice,
        selectedOptionIds: validOptionIds,
        selectedOptionNames: validOptionNames,
        notes: saved.notes,
      });
    }
    if (restored.length === 0) {
      setRepeatError(
        "No pudimos recuperar tu pedido: algunos productos ya no estan disponibles.",
      );
      clearLastOrder(slug);
      setRepeatOrder(null);
      return;
    }
    const count = cart.items.length;
    for (let i = 0; i < count; i++) cart.removeItem(0);
    restored.forEach((item) => cart.addItem(item));
    cart.setCustomer({
      customerName: repeatOrder.customerName || "",
      customerPhone: repeatOrder.customerPhone || "",
      customerAddress: repeatOrder.customerAddress || "",
    });
    cart.setDelivery({ deliveryType: repeatOrder.deliveryType });
    cart.setPaymentMethod(repeatOrder.paymentMethod);
    setRepeatOrder(null);
  };

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    document
      .getElementById(`cat-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCheckout = async () => {
    if (!isOpen) return;
    setSubmitting(true);
    try {
      const body = {
        items: cart.items.map((i) => ({
          menuItemId: i.menuItemId,
          variantId: i.variantId,
          quantity: i.quantity,
          selectedOptionIds: i.selectedOptionIds,
          notes: i.notes,
        })),
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        customerAddress: cart.customerAddress || undefined,
        customerLatitude: cart.customerLatitude ?? undefined,
        customerLongitude: cart.customerLongitude ?? undefined,
        deliveryType: cart.deliveryType,
        deliveryZoneId: cart.deliveryZoneId || undefined,
        paymentMethod: cart.paymentMethod,
        couponCode: cart.couponCode || undefined,
        notes: cart.notes,
      };
      const res = await fetch(
        `${getApiBase()}/storefront/${encodeURIComponent(slug)}/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Error al crear el pedido");
      }
      const result: StorefrontOrderResponse = await res.json();
      saveLastOrder(slug, {
        items: cart.items,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        customerAddress: cart.customerAddress,
        deliveryType: cart.deliveryType,
        paymentMethod: cart.paymentMethod,
        savedAt: new Date().toISOString(),
      });
      cart.clear();
      router.push(
        `/tracking/${encodeURIComponent(result.order.code)}?slug=${encodeURIComponent(slug)}`,
      );
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Error al crear el pedido. Intenta de nuevo.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-surface antialiased"
      style={
        restaurant.theme?.primaryColor
          ? ({ "--primary": restaurant.theme.primaryColor } as CSSProperties)
          : undefined
      }
    >
      {/* ── Top App Bar ── */}
      <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 h-16 border-b border-outline-variant/10">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 min-w-0">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-7 w-7 rounded-lg object-cover"
                src={restaurant.logoUrl}
                alt={restaurant.name}
              />
            ) : (
              <Logo size="sm" showText={false} />
            )}
            <span
              className="truncate font-extrabold tracking-tight text-on-background text-lg"
              style={{ fontFamily: "var(--font-logo)" }}
            >
              {restaurant.name}
            </span>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar en el menu"
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <MaterialIcon name="search" size="md" className="text-on-surface" />
          </button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      {restaurant.bannerUrl ? (
        <section className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen remota de usuario */}
          <img
            className="w-full h-full object-cover"
            src={restaurant.bannerUrl}
            alt={restaurant.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
              <h1
                className="text-white text-2xl sm:text-3xl font-extrabold mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <span className="inline-flex items-center gap-1 bg-green-500/90 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    <MaterialIcon name="fiber_manual_record" size="xs" fill />
                    Abierto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-on-surface/45 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    <MaterialIcon name="cancel" size="xs" fill />
                    Cerrado
                  </span>
                )}
                {todayHoursLabel && (
                  <span className="text-white/90 text-sm font-medium flex items-center gap-1">
                    <MaterialIcon name="schedule" size="xs" />
                    {todayHoursLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1
            className="text-2xl sm:text-3xl font-extrabold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {restaurant.name}
          </h1>
          {todayHoursLabel && (
            <span className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
              <MaterialIcon name="schedule" size="xs" />
              {todayHoursLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Business Info Strip (mobile) ── */}
      {(restaurant.address ||
        restaurant.description ||
        whatsappUrl ||
        instagramUrl) && (
        <section className="px-4 sm:px-6 py-4 space-y-3 lg:hidden">
          {restaurant.address && (
            <a
              href={googleMapsUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              <MaterialIcon
                name="location_on"
                size="sm"
                className="text-primary shrink-0"
              />
              <span>
                {restaurant.address}
                {restaurant.city ? `, ${restaurant.city}` : ""}
              </span>
            </a>
          )}
          {(whatsappUrl || instagramUrl) && (
            <div className="flex gap-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 border border-green-600/20 bg-green-600/10 text-green-700 hover:bg-green-600/20 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 border border-purple-600/20 bg-purple-600/10 text-purple-700 hover:bg-purple-600/20 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  <InstagramIcon />
                  Instagram
                </a>
              )}
            </div>
          )}
          {restaurant.description && (
            <p className="text-sm text-on-surface-variant whitespace-pre-line">
              {restaurant.description}
            </p>
          )}
        </section>
      )}

      {/* ── Repeat last order banner ── */}
      {repeatOrder && cart.items.length === 0 && (
        <section className="px-4 sm:px-6 py-4">
          <div className="mx-auto max-w-7xl rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MaterialIcon name="history" size="md" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface">
                  ¿Pedís lo de siempre?
                </p>
                <p className="text-xs text-on-surface-variant">
                  {repeatOrder.items.reduce((s, it) => s + it.quantity, 0)}{" "}
                  ítems de tu último pedido
                  {repeatOrder.customerName
                    ? ` · ${repeatOrder.customerName}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRepeatOrder}>
                <MaterialIcon name="replay" size="sm" className="mr-1" />
                Repetir pedido
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  clearLastOrder(slug);
                  setRepeatOrder(null);
                }}
              >
                No, gracias
              </Button>
            </div>
          </div>
          {repeatError && (
            <p className="mx-auto max-w-7xl text-xs text-destructive mt-2">
              {repeatError}
            </p>
          )}
        </section>
      )}

      {/* ── Main Content ── */}
      <main className="pb-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:py-8">
            {/* ── Left sidebar (desktop) ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {(restaurant.address ||
                  restaurant.description ||
                  whatsappUrl ||
                  instagramUrl) && (
                  <div className="rounded-2xl border border-outline-variant/10 bg-white p-5 space-y-4">
                    {restaurant.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="h-14 w-14 rounded-xl object-cover"
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-surface-container flex items-center justify-center">
                        <Logo size="sm" showText={false} />
                      </div>
                    )}
                    <h2
                      className="text-lg font-bold text-on-surface"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {restaurant.name}
                    </h2>
                    {restaurant.address && (
                      <a
                        href={googleMapsUrl || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <MaterialIcon
                          name="location_on"
                          size="sm"
                          className="text-primary shrink-0 mt-0.5"
                        />
                        <span>
                          {restaurant.address}
                          {restaurant.city ? `, ${restaurant.city}` : ""}
                        </span>
                      </a>
                    )}
                    {todayHoursLabel && (
                      <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <MaterialIcon
                          name="schedule"
                          size="sm"
                          className="text-primary shrink-0"
                        />
                        {todayHoursLabel}
                      </p>
                    )}
                    {(whatsappUrl || instagramUrl) && (
                      <div className="flex flex-col gap-2">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 border border-green-600/20 bg-green-600/10 text-green-700 hover:bg-green-600/20 dark:border-green-400/20 dark:bg-green-400/10 dark:text-green-300 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                          >
                            <WhatsAppIcon />
                            WhatsApp
                          </a>
                        )}
                        {instagramUrl && (
                          <a
                            href={instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 border border-purple-600/20 bg-purple-600/10 text-purple-700 hover:bg-purple-600/20 dark:border-purple-400/20 dark:bg-purple-400/10 dark:text-purple-300 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                          >
                            <InstagramIcon />
                            Instagram
                          </a>
                        )}
                      </div>
                    )}
                    {restaurant.description && (
                      <p className="text-sm text-on-surface-variant whitespace-pre-line">
                        {restaurant.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* ── Center: menu ── */}
            <div className="min-w-0">
              {/* Categories nav */}
              {categories.length > 1 && (
                <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:mx-0 bg-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-0 py-3">
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className={`font-bold px-5 py-2 rounded-xl text-sm whitespace-nowrap active:scale-95 duration-200 transition-all ${
                          activeCategory === cat.id
                            ? "bg-primary text-white"
                            : "text-on-surface-variant bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu sections */}
              {categories.map((cat) => (
                <section
                  key={cat.id}
                  id={`cat-${cat.id}`}
                  className="mt-8 scroll-mt-32"
                >
                  <h2
                    className="text-xl font-bold text-on-surface mb-4"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="mb-3 text-sm text-on-surface-variant">
                      {cat.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0px_4px_12px_rgba(38,24,21,0.02)] border border-outline-variant/10 cursor-pointer transition-all hover:shadow-ambient active:scale-[0.99]"
                        onClick={() => openItemDetail(item)}
                      >
                        <div className="flex-1 flex flex-col min-w-0">
                          <h3
                            className="font-bold text-on-surface mb-1"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-on-surface-variant text-sm line-clamp-2 mb-3">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-auto">
                            <span
                              className="font-extrabold text-lg text-on-surface"
                              style={{ fontFamily: "var(--font-heading)" }}
                            >
                              {formatCurrency(
                                item.basePrice,
                                restaurant.currency,
                              )}
                            </span>
                            {!item.isAvailable ? (
                              <Badge variant="secondary">Agotado</Badge>
                            ) : !isOpen ? (
                              <button
                                disabled
                                className="bg-surface-container text-on-surface-variant p-2 rounded-xl flex items-center justify-center cursor-not-allowed"
                              >
                                <MaterialIcon name="add" size="md" />
                              </button>
                            ) : (
                              <button className="bg-primary text-white p-2 rounded-xl flex items-center justify-center active:scale-95 duration-150">
                                <MaterialIcon name="add" size="md" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="w-28 h-28 shrink-0">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className="w-full h-full object-cover rounded-xl"
                              src={item.imageUrl}
                              alt={item.name}
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-surface-container flex items-center justify-center">
                              <MaterialIcon
                                name="restaurant"
                                size="xl"
                                className="text-on-surface-variant/30"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Powered by footer ── */}
      {showPoweredByFooter && (
        <div className="mx-auto max-w-7xl px-4 pb-20 lg:pb-8">
          <div className="pt-6 pb-4 text-center">
            <a
              href="https://quiero.menu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-on-surface-variant hover:text-foreground transition-colors"
            >
              Powered by <span className="font-semibold">quiero.menu</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Item detail sheet ── */}
      <Sheet
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) closeItemDetail();
        }}
      >
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={`overflow-auto ${isDesktop ? "lg:max-w-md" : "h-[85vh] rounded-t-3xl"}`}
          showCloseButton={false}
        >
          {selectedItem && (
            <div className="space-y-5 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2
                    className="text-xl font-bold"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {selectedItem.name}
                  </h2>
                  {selectedItem.description && (
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {selectedItem.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeItemDetail}
                  className="ml-3 rounded-full p-2 hover:bg-surface-container-low transition-colors"
                >
                  <MaterialIcon name="close" size="md" />
                </button>
              </div>

              {selectedItem.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="h-48 w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="h-48 w-full rounded-2xl bg-surface-container flex items-center justify-center">
                  <MaterialIcon
                    name="restaurant"
                    size="xl"
                    className="text-on-surface-variant/30"
                  />
                </div>
              )}

              {/* Variants */}
              {selectedItem.variants.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Elegi una opcion
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[...selectedItem.variants]
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((variant) => {
                        const isSelected = selectedVariantId === variant.id;
                        const price =
                          variant.priceOverride ?? selectedItem.basePrice;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setSelectedOptionIds((prev) =>
                                prev.filter((id) => {
                                  const opt = selectedItem.options.find(
                                    (o) => o.id === id,
                                  );
                                  return (
                                    opt &&
                                    (opt.variantId === null ||
                                      opt.variantId === variant.id)
                                  );
                                }),
                              );
                            }}
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                              isSelected
                                ? "gradient-cta text-white shadow-md shadow-primary/20"
                                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            {variant.name}{" "}
                            {formatCurrency(price, restaurant.currency)}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Options */}
              {Object.keys(optionGroups).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(optionGroups).map(([group, options]) => (
                    <div key={group} className="space-y-2">
                      <Label className="text-sm font-semibold">
                        {group}
                        {maxSelections > 0 && (
                          <span className="ml-1 font-normal text-on-surface-variant">
                            (max. {maxSelections})
                          </span>
                        )}
                      </Label>
                      <div className="space-y-1.5">
                        {options.map((opt) => {
                          const isChecked = selectedOptionIds.includes(opt.id);
                          const isDisabled =
                            !isChecked &&
                            maxSelections > 0 &&
                            selectedOptionIds.length >= maxSelections;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(opt.id)}
                              disabled={isDisabled}
                              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-all ${
                                isChecked
                                  ? "bg-primary/10 ghost-border"
                                  : isDisabled
                                    ? "cursor-not-allowed bg-surface-container-low opacity-50"
                                    : "bg-surface-container-low hover:bg-surface-container"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded ${
                                    isChecked
                                      ? "gradient-cta text-white"
                                      : "border border-outline-variant"
                                  }`}
                                >
                                  {isChecked && (
                                    <MaterialIcon name="check" size="xs" />
                                  )}
                                </div>
                                <span>{opt.name}</span>
                              </div>
                              {opt.priceDelta > 0 && (
                                <span className="text-on-surface-variant">
                                  +
                                  {formatCurrency(
                                    opt.priceDelta,
                                    restaurant.currency,
                                  )}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Notas</Label>
                <Input
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Sin cebolla, bien cocido, etc."
                />
              </div>

              {/* Quantity + Add */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 space-y-3">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <MaterialIcon name="remove" size="md" />
                  </button>
                  <span className="min-w-[2rem] text-center text-lg font-bold">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <MaterialIcon name="add" size="md" />
                  </button>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={addToCart}
                  disabled={
                    !isOpen ||
                    (selectedItem.variants.length > 0 && !selectedVariantId)
                  }
                >
                  Agregar {formatCurrency(itemTotalPrice, restaurant.currency)}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Search sheet ── */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={`overflow-auto ${isDesktop ? "lg:max-w-md" : "h-[80vh] rounded-t-3xl"}`}
        >
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Buscar en el menu</SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-4">
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busca un plato o bebida..."
            />
            {searchQuery.trim().length === 0 ? (
              <p className="text-center py-8 text-sm text-on-surface-variant">
                Escribí para buscar en el menu.
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-center py-8 text-sm text-on-surface-variant">
                Sin resultados para &ldquo;{searchQuery.trim()}&rdquo;.
              </p>
            ) : (
              <div className="space-y-1">
                {searchResults.map(({ cat, item }) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                      openItemDetail(item);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl bg-surface-container-low p-3 text-left transition-colors hover:bg-surface-container"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {cat.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      {formatCurrency(item.basePrice, restaurant.currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Floating cart bar ── */}
      {cart.items.length > 0 && !checkoutOpen && !selectedItem && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
          <div className="mx-auto w-full max-w-md">
            <button
              onClick={() => setCheckoutOpen(true)}
              className="w-full gradient-cta text-white py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between font-bold active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MaterialIcon name="shopping_cart" size="lg" />
                  <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cart.items.length}
                  </span>
                </div>
                <span className="uppercase tracking-wider text-sm">
                  Ver Carrito
                </span>
              </div>
              <span className="text-lg">
                {formatCurrency(subtotal, restaurant.currency)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Checkout sheet ── */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          className={`overflow-auto ${isDesktop ? "lg:max-w-md" : "h-[90vh] rounded-t-3xl"}`}
        >
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Tu pedido</SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-4">
            {/* Cart items */}
            {cart.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-surface-container-low rounded-xl p-3"
              >
                <div>
                  <span className="font-medium">
                    {item.quantity}x {item.menuItemName}
                  </span>
                  {item.variantName && (
                    <span className="text-sm text-on-surface-variant">
                      {" "}
                      ({item.variantName})
                    </span>
                  )}
                  {item.selectedOptionNames.length > 0 && (
                    <p className="text-xs text-on-surface-variant">
                      {item.selectedOptionNames.join(", ")}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs italic text-on-surface-variant">
                      {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatCurrency(
                      item.unitPrice * item.quantity,
                      restaurant.currency,
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cart.removeItem(i)}
                  >
                    <MaterialIcon name="remove" size="xs" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={cart.customerName}
                  onChange={(e) =>
                    cart.setCustomer({ customerName: e.target.value })
                  }
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input
                  value={cart.customerPhone}
                  onChange={(e) =>
                    cart.setCustomer({ customerPhone: e.target.value })
                  }
                  placeholder="Tu telefono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={
                    cart.deliveryType === DeliveryType.PICKUP
                      ? "default"
                      : "outline"
                  }
                  className="flex-1"
                  onClick={() =>
                    cart.setDelivery({ deliveryType: DeliveryType.PICKUP })
                  }
                >
                  Retiro
                </Button>
                <Button
                  variant={
                    cart.deliveryType === DeliveryType.DELIVERY
                      ? "default"
                      : "outline"
                  }
                  className="flex-1"
                  onClick={() =>
                    cart.setDelivery({ deliveryType: DeliveryType.DELIVERY })
                  }
                >
                  Delivery
                </Button>
              </div>
              {cart.deliveryType === DeliveryType.DELIVERY && (
                <>
                  <div className="space-y-2">
                    <Label>Direccion</Label>
                    <Input
                      value={cart.customerAddress}
                      onChange={(e) =>
                        cart.setCustomer({ customerAddress: e.target.value })
                      }
                      placeholder="Tu direccion"
                    />
                    <button
                      type="button"
                      onClick={requestLocation}
                      disabled={gpsLoading}
                      className="w-full flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl py-2.5 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
                    >
                      {gpsLoading ? (
                        <MaterialIcon
                          name="progress_activity"
                          size="sm"
                          className="animate-spin"
                        />
                      ) : cart.customerLatitude ? (
                        <MaterialIcon
                          name="check_circle"
                          size="sm"
                          className="text-green-600"
                        />
                      ) : (
                        <MaterialIcon
                          name="my_location"
                          size="sm"
                          className="text-primary"
                        />
                      )}
                      {gpsLoading
                        ? "Obteniendo ubicacion..."
                        : cart.customerLatitude
                          ? "Ubicacion capturada"
                          : "Usar mi ubicacion"}
                    </button>
                    {cart.customerLatitude && cart.customerLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${cart.customerLatitude},${cart.customerLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <MaterialIcon name="map" size="xs" />
                        Ver en Maps
                      </a>
                    )}
                    {gpsError && (
                      <p className="text-xs text-destructive">{gpsError}</p>
                    )}
                  </div>
                  {deliveryZones.length > 0 && (
                    <div className="space-y-2">
                      <Label>Zona</Label>
                      <div className="flex flex-wrap gap-2">
                        {deliveryZones
                          .filter((z) => z.isActive)
                          .map((z) => (
                            <Button
                              key={z.id}
                              variant={
                                cart.deliveryZoneId === z.id
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                cart.setDelivery({ deliveryZoneId: z.id })
                              }
                            >
                              {z.name} (+
                              {formatCurrency(z.price, restaurant.currency)})
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {availablePaymentMethods.length > 0 && (
                <div className="space-y-2">
                  <Label>Metodo de pago</Label>
                  <div className="flex gap-2">
                    {availablePaymentMethods.map((method) => (
                      <Button
                        key={method.value}
                        variant={
                          cart.paymentMethod === method.value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        className="flex-1"
                        onClick={() => cart.setPaymentMethod(method.value)}
                      >
                        {method.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Cupon de descuento</Label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-green-50 border border-green-200 p-3">
                    <div className="flex items-center gap-2">
                      <MaterialIcon
                        name="confirmation_number"
                        size="sm"
                        className="text-green-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-green-700">
                          {appliedCoupon.freeDelivery
                            ? "Envío gratis"
                            : appliedCoupon.type === "percentage"
                              ? `${appliedCoupon.value}% de descuento`
                              : `${formatCurrency(appliedCoupon.discount, restaurant.currency)} de descuento`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => cart.setCoupon(null, null)}
                    >
                      <MaterialIcon name="close" size="sm" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      placeholder="Ej: BIENVENIDO10"
                      className="flex-1 uppercase"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={couponBusy || !couponInput.trim()}
                      onClick={applyCoupon}
                    >
                      {couponBusy ? "Aplicando..." : "Aplicar"}
                    </Button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-destructive">{couponError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={cart.notes}
                  onChange={(e) => cart.setNotes(e.target.value)}
                  placeholder="Instrucciones especiales"
                  rows={2}
                />
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, restaurant.currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>
                    Descuento{appliedCoupon ? ` (${appliedCoupon.code})` : ""}
                  </span>
                  <span>-{formatCurrency(discount, restaurant.currency)}</span>
                </div>
              )}
              {cart.deliveryType === DeliveryType.DELIVERY &&
                appliedCoupon?.freeDelivery && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Envio</span>
                    <span>Gratis</span>
                  </div>
                )}
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Envio</span>
                  <span>
                    {formatCurrency(deliveryFee, restaurant.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total, restaurant.currency)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={
                submitting ||
                !isOpen ||
                !cart.customerName ||
                !cart.customerPhone
              }
              onClick={handleCheckout}
            >
              {submitting
                ? "Creando pedido..."
                : isOpen
                  ? "Confirmar pedido"
                  : "Cerrado ahora"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
