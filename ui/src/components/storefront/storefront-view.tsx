'use client';

import { useState, useMemo, useEffect } from 'react';
import type { StorefrontData, MenuItem, MenuItemVariant, MenuItemOption } from '@/types';
import { useCartStore, CartItem } from '@/stores/cart.store';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MaterialIcon } from '@/components/ui/material-icon';
import { DeliveryType } from '@/types';
import type { StorefrontOrderResponse } from '@/types';

type FullMenuItem = MenuItem & { variants: MenuItemVariant[]; options: MenuItemOption[] };

export function StorefrontView({ data, slug }: { data: StorefrontData; slug: string }) {
  const { restaurant, categories, operatingHours, deliveryZones, showPoweredByFooter } = data;
  const cart = useCartStore();

  // ── Helpers ──
  const cleanPhone = restaurant.phone ? restaurant.phone.replace(/\D/g, '') : '';
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';
  const googleMapsUrl = restaurant.coordinates
    ? `https://www.google.com/maps?q=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`
    : restaurant.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address + (restaurant.city ? `, ${restaurant.city}` : ''))}`
      : '';
  const instagramHandle = restaurant.socialLinks?.instagram?.replace(/^@/, '') || '';
  const instagramUrl = instagramHandle
    ? instagramHandle.startsWith('http') ? instagramHandle : `https://instagram.com/${instagramHandle}`
    : '';

  // Today's operating hours
  const todayDayOfWeek = new Date().getDay(); // 0=Sun
  const todayHours = operatingHours.find((h) => h.dayOfWeek === todayDayOfWeek);
  const todayHoursLabel = todayHours
    ? todayHours.isClosed ? 'Cerrado hoy' : `Hoy ${todayHours.opensAt} – ${todayHours.closesAt}`
    : null;

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<StorefrontOrderResponse | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id ?? null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const pm = restaurant.paymentMethods ?? { cashEnabled: true, cardEnabled: true, transferEnabled: true };
  const availablePaymentMethods = [
    ...(pm.cashEnabled ? [{ value: 'efectivo', label: 'Efectivo' }] : []),
    ...(pm.cardEnabled ? [{ value: 'tarjeta', label: 'Tarjeta' }] : []),
    ...(pm.transferEnabled ? [{ value: 'transferencia', label: 'Transferencia' }] : []),
  ];

  // Ensure selected payment method is valid
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !availablePaymentMethods.some((m) => m.value === cart.paymentMethod)) {
      cart.setPaymentMethod(availablePaymentMethods[0].value);
    }
  }, [pm.cashEnabled, pm.cardEnabled, pm.transferEnabled]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalizacion');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cart.setLocation(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.code === 1 ? 'Permiso de ubicacion denegado' : 'No se pudo obtener tu ubicacion');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Item detail dialog state
  const [selectedItem, setSelectedItem] = useState<FullMenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const openItemDetail = (item: FullMenuItem) => {
    if (!item.isAvailable) return;
    setSelectedItem(item);
    const firstVariant = item.variants.length > 0
      ? [...item.variants].sort((a, b) => a.displayOrder - b.displayOrder)[0]
      : null;
    setSelectedVariantId(firstVariant?.id ?? null);
    setSelectedOptionIds([]);
    setItemQuantity(1);
    setItemNotes('');
  };

  const closeItemDetail = () => {
    setSelectedItem(null);
    setSelectedVariantId(null);
    setSelectedOptionIds([]);
    setItemQuantity(1);
    setItemNotes('');
  };

  const selectedVariant = useMemo(() => {
    if (!selectedItem || !selectedVariantId) return null;
    return selectedItem.variants.find((v) => v.id === selectedVariantId) ?? null;
  }, [selectedItem, selectedVariantId]);

  const availableOptions = useMemo(() => {
    if (!selectedItem) return [];
    return selectedItem.options.filter(
      (o) => o.isAvailable && (o.variantId === null || o.variantId === selectedVariantId),
    );
  }, [selectedItem, selectedVariantId]);

  const optionGroups = useMemo(() => {
    const groups: Record<string, MenuItemOption[]> = {};
    for (const opt of availableOptions) {
      const group = opt.optionGroup || 'Extras';
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    }
    return groups;
  }, [availableOptions]);

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
    const selectedOpts = availableOptions.filter((o) => selectedOptionIds.includes(o.id));
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
  const deliveryFee = cart.deliveryType === DeliveryType.DELIVERY && deliveryZone ? deliveryZone.price : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
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
        notes: cart.notes,
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/storefront/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al crear el pedido');
      const result: StorefrontOrderResponse = await res.json();
      setOrderResult(result);
      cart.clear();
    } catch {
      alert('Error al crear el pedido. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const handleConfirmationReceiptUpload = async (file: File) => {
    if (!orderResult) return;
    setUploadingReceipt(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/storefront/${slug}/receipt-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'receipt', contentType: file.type }),
      });
      if (!res.ok) throw new Error('Error al obtener URL de subida');
      const { uploadUrl, publicUrl } = await res.json();
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Error al subir comprobante');
      setReceiptUrl(publicUrl);
      // Update the order with the receipt URL
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/storefront/${slug}/orders/${orderResult.order.id}/receipt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: publicUrl }),
      });
    } catch {
      alert('Error al subir el comprobante. Intenta de nuevo.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface antialiased">
      {/* ── Top App Bar ── */}
      <header className="bg-surface/90 backdrop-blur-md flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <MaterialIcon name="receipt_long" size="md" className="text-primary" />
          <span className="font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Quiero Menu</span>
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <MaterialIcon name="search" size="md" className="text-on-surface" />
        </button>
      </header>

      <main className="pb-40">
        {/* ── Hero Section ── */}
        {restaurant.bannerUrl ? (
          <section className="relative h-64 w-full overflow-hidden">
            <img className="w-full h-full object-cover" src={restaurant.bannerUrl} alt={restaurant.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-on-surface/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <h1 className="text-white text-2xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{restaurant.name}</h1>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 bg-green-500/90 text-white px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                  <MaterialIcon name="fiber_manual_record" size="xs" fill />
                  Abierto
                </span>
                {todayHoursLabel && (
                  <span className="text-white/90 text-sm font-medium flex items-center gap-1">
                    <MaterialIcon name="schedule" size="xs" />
                    {todayHoursLabel}
                  </span>
                )}
              </div>
            </div>
          </section>
        ) : (
          <div className="px-6 py-8">
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>{restaurant.name}</h1>
            {todayHoursLabel && (
              <span className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                <MaterialIcon name="schedule" size="xs" />
                {todayHoursLabel}
              </span>
            )}
          </div>
        )}

        {/* ── Business Info Strip ── */}
        {(restaurant.address || restaurant.description || whatsappUrl || instagramUrl) && (
          <section className="px-6 py-4 space-y-3">
            {/* Address */}
            {restaurant.address && (
              <a
                href={googleMapsUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                <MaterialIcon name="location_on" size="sm" className="text-primary shrink-0" />
                <span>{restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ''}</span>
              </a>
            )}

            {/* Contact buttons */}
            {(whatsappUrl || instagramUrl) && (
              <div className="flex gap-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                  >
                    <MaterialIcon name="chat" size="sm" />
                    WhatsApp
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                  >
                    <MaterialIcon name="photo_camera" size="sm" />
                    Instagram
                  </a>
                )}
              </div>
            )}

            {/* About us */}
            {restaurant.description && (
              <p className="text-sm text-on-surface-variant whitespace-pre-line">{restaurant.description}</p>
            )}
          </section>
        )}

        {/* ── Categories Slider ── */}
        {categories.length > 1 && (
          <div className="mt-6 px-6">
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`font-bold px-6 py-2 rounded-xl text-sm whitespace-nowrap active:scale-95 duration-200 transition-all ${
                    activeCategory === cat.id
                      ? 'bg-primary-fixed text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Menu Sections ── */}
        {categories.map((cat) => (
          <section key={cat.id} className="mt-8 px-6">
            <h2 className="text-xl font-bold text-on-surface mb-4" style={{ fontFamily: 'var(--font-heading)' }}>{cat.name}</h2>
            {cat.description && <p className="mb-3 text-sm text-on-surface-variant">{cat.description}</p>}
            <div className="space-y-4">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white p-4 rounded-2xl shadow-[0px_4px_12px_rgba(38,24,21,0.02)] border border-outline-variant/10 cursor-pointer transition-all hover:shadow-ambient active:scale-[0.99]"
                  onClick={() => openItemDetail(item)}
                >
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-on-surface mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{item.name}</h3>
                    {item.description && <p className="text-on-surface-variant text-sm line-clamp-2 mb-3">{item.description}</p>}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-extrabold text-lg text-on-surface" style={{ fontFamily: 'var(--font-heading)' }}>
                        {formatCurrency(item.basePrice, restaurant.currency)}
                      </span>
                      {!item.isAvailable ? (
                        <Badge variant="secondary">Agotado</Badge>
                      ) : (
                        <button className="bg-primary text-white p-2 rounded-xl flex items-center justify-center active:scale-95 duration-150">
                          <MaterialIcon name="add" size="md" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-28 h-28 shrink-0">
                    {item.imageUrl ? (
                      <img className="w-full h-full object-cover rounded-xl" src={item.imageUrl} alt={item.name} />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-surface-container flex items-center justify-center">
                        <MaterialIcon name="restaurant" size="xl" className="text-on-surface-variant/30" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* ── Powered by footer ── */}
      {showPoweredByFooter && (
        <div className="mx-auto max-w-2xl px-4 pb-20">
          <div className="pt-6 pb-4 text-center">
            <a href="https://quiero.menu" target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-foreground transition-colors">
              Powered by <span className="font-semibold">quiero.menu</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Item detail sheet ── */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => { if (!open) closeItemDetail(); }}>
        <SheetContent side="bottom" className="h-[85vh] overflow-auto rounded-t-3xl">
          {selectedItem && (
            <div className="space-y-5 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{selectedItem.name}</h2>
                  {selectedItem.description && <p className="mt-1 text-sm text-on-surface-variant">{selectedItem.description}</p>}
                </div>
                <button onClick={closeItemDetail} className="ml-3 rounded-full p-2 hover:bg-surface-container-low transition-colors">
                  <MaterialIcon name="close" size="md" />
                </button>
              </div>

              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="h-48 w-full rounded-2xl object-cover" />
              ) : (
                <div className="h-48 w-full rounded-2xl bg-surface-container flex items-center justify-center">
                  <MaterialIcon name="restaurant" size="xl" className="text-on-surface-variant/30" />
                </div>
              )}

              {/* Variants */}
              {selectedItem.variants.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Elegi una opcion</Label>
                  <div className="flex flex-wrap gap-2">
                    {[...selectedItem.variants].sort((a, b) => a.displayOrder - b.displayOrder).map((variant) => {
                      const isSelected = selectedVariantId === variant.id;
                      const price = variant.priceOverride ?? selectedItem.basePrice;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariantId(variant.id);
                            setSelectedOptionIds((prev) =>
                              prev.filter((id) => {
                                const opt = selectedItem.options.find((o) => o.id === id);
                                return opt && (opt.variantId === null || opt.variantId === variant.id);
                              }),
                            );
                          }}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? 'gradient-cta text-white shadow-md shadow-primary/20'
                              : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          {variant.name} {formatCurrency(price, restaurant.currency)}
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
                        {maxSelections > 0 && <span className="ml-1 font-normal text-on-surface-variant">(max. {maxSelections})</span>}
                      </Label>
                      <div className="space-y-1.5">
                        {options.map((opt) => {
                          const isChecked = selectedOptionIds.includes(opt.id);
                          const isDisabled = !isChecked && maxSelections > 0 && selectedOptionIds.length >= maxSelections;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(opt.id)}
                              disabled={isDisabled}
                              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-all ${
                                isChecked
                                  ? 'bg-primary/10 ghost-border'
                                  : isDisabled
                                    ? 'cursor-not-allowed bg-surface-container-low opacity-50'
                                    : 'bg-surface-container-low hover:bg-surface-container'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex h-5 w-5 items-center justify-center rounded ${
                                  isChecked ? 'gradient-cta text-white' : 'border border-outline-variant'
                                }`}>
                                  {isChecked && <MaterialIcon name="check" size="xs" />}
                                </div>
                                <span>{opt.name}</span>
                              </div>
                              {opt.priceDelta > 0 && <span className="text-on-surface-variant">+{formatCurrency(opt.priceDelta, restaurant.currency)}</span>}
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
                <Input value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} placeholder="Sin cebolla, bien cocido, etc." />
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
                  <span className="min-w-[2rem] text-center text-lg font-bold">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <MaterialIcon name="add" size="md" />
                  </button>
                </div>
                <Button className="w-full" size="lg" onClick={addToCart} disabled={selectedItem.variants.length > 0 && !selectedVariantId}>
                  Agregar {formatCurrency(itemTotalPrice, restaurant.currency)}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Floating cart bar ── */}
      {cart.items.length > 0 && !checkoutOpen && !selectedItem && (
        <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-4">
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
              <span className="uppercase tracking-wider text-sm">Ver Carrito</span>
            </div>
            <span className="text-lg">{formatCurrency(subtotal, restaurant.currency)}</span>
          </button>
        </div>
      )}

      {/* ── Checkout sheet ── */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-auto rounded-t-3xl">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle>Tu pedido</SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-4">
            {/* Cart items */}
            {cart.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-container-low rounded-xl p-3">
                <div>
                  <span className="font-medium">{item.quantity}x {item.menuItemName}</span>
                  {item.variantName && <span className="text-sm text-on-surface-variant"> ({item.variantName})</span>}
                  {item.selectedOptionNames.length > 0 && <p className="text-xs text-on-surface-variant">{item.selectedOptionNames.join(', ')}</p>}
                  {item.notes && <p className="text-xs italic text-on-surface-variant">{item.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatCurrency(item.unitPrice * item.quantity, restaurant.currency)}</span>
                  <Button variant="ghost" size="sm" onClick={() => cart.removeItem(i)}>
                    <MaterialIcon name="remove" size="xs" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={cart.customerName} onChange={(e) => cart.setCustomer({ customerName: e.target.value })} placeholder="Tu nombre" />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input value={cart.customerPhone} onChange={(e) => cart.setCustomer({ customerPhone: e.target.value })} placeholder="Tu telefono" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={cart.deliveryType === DeliveryType.PICKUP ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => cart.setDelivery({ deliveryType: DeliveryType.PICKUP })}
                >Retiro</Button>
                <Button
                  variant={cart.deliveryType === DeliveryType.DELIVERY ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => cart.setDelivery({ deliveryType: DeliveryType.DELIVERY })}
                >Delivery</Button>
              </div>
              {cart.deliveryType === DeliveryType.DELIVERY && (
                <>
                  <div className="space-y-2">
                    <Label>Direccion</Label>
                    <Input value={cart.customerAddress} onChange={(e) => cart.setCustomer({ customerAddress: e.target.value })} placeholder="Tu direccion" />
                    <button
                      type="button"
                      onClick={requestLocation}
                      disabled={gpsLoading}
                      className="w-full flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl py-2.5 text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
                    >
                      {gpsLoading ? (
                        <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                      ) : cart.customerLatitude ? (
                        <MaterialIcon name="check_circle" size="sm" className="text-green-600" />
                      ) : (
                        <MaterialIcon name="my_location" size="sm" className="text-primary" />
                      )}
                      {gpsLoading ? 'Obteniendo ubicacion...' : cart.customerLatitude ? 'Ubicacion capturada' : 'Usar mi ubicacion'}
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
                    {gpsError && <p className="text-xs text-destructive">{gpsError}</p>}
                  </div>
                  {deliveryZones.length > 0 && (
                    <div className="space-y-2">
                      <Label>Zona</Label>
                      <div className="flex flex-wrap gap-2">
                        {deliveryZones.filter((z) => z.isActive).map((z) => (
                          <Button
                            key={z.id}
                            variant={cart.deliveryZoneId === z.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => cart.setDelivery({ deliveryZoneId: z.id })}
                          >
                            {z.name} (+{formatCurrency(z.price, restaurant.currency)})
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
                        variant={cart.paymentMethod === method.value ? 'default' : 'outline'}
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
                <Label>Notas</Label>
                <Textarea value={cart.notes} onChange={(e) => cart.setNotes(e.target.value)} placeholder="Instrucciones especiales" rows={2} />
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal, restaurant.currency)}</span></div>
              {deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Envio</span><span>{formatCurrency(deliveryFee, restaurant.currency)}</span></div>}
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total, restaurant.currency)}</span></div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={submitting || !cart.customerName || !cart.customerPhone}
              onClick={handleCheckout}
            >
              {submitting ? 'Creando pedido...' : 'Confirmar pedido'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Order confirmation sheet ── */}
      <Sheet open={!!orderResult} onOpenChange={(open) => { if (!open) { setOrderResult(null); setReceiptUrl(null); } }}>
        <SheetContent side="bottom" className="h-[85vh] overflow-auto rounded-t-3xl">
          {orderResult && (
            <div className="p-6 space-y-5">
              <div className="text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <MaterialIcon name="check_circle" size="xl" className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Pedido creado</h2>
                <p className="text-on-surface-variant">Tu pedido <strong>{orderResult.order.code}</strong> fue creado. Envialo por WhatsApp para confirmarlo.</p>
              </div>

              <a
                href={orderResult.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-700 transition-colors"
              >
                <MaterialIcon name="chat" size="sm" />
                Enviar por WhatsApp
              </a>

              {orderResult.order.paymentMethod === 'transferencia' && pm.transferEnabled && (
                <div className="space-y-4 pt-2">
                  {(pm.transferBankName || pm.transferAccountNumber || pm.transferCbu || pm.transferAlias) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5">
                      <p className="text-sm font-semibold text-blue-900">Datos para transferir</p>
                      {pm.transferBankName && <p className="text-sm text-blue-800"><span className="font-medium">Banco:</span> {pm.transferBankName}</p>}
                      {pm.transferAccountType && <p className="text-sm text-blue-800"><span className="font-medium">Tipo:</span> {pm.transferAccountType}</p>}
                      {pm.transferAccountHolder && <p className="text-sm text-blue-800"><span className="font-medium">Titular:</span> {pm.transferAccountHolder}</p>}
                      {pm.transferAccountNumber && <p className="text-sm text-blue-800"><span className="font-medium">Cuenta:</span> {pm.transferAccountNumber}</p>}
                      {pm.transferCbu && <p className="text-sm text-blue-800"><span className="font-medium">CBU/CVU:</span> {pm.transferCbu}</p>}
                      {pm.transferAlias && <p className="text-sm text-blue-800"><span className="font-medium">Alias:</span> {pm.transferAlias}</p>}
                      {pm.transferNotes && <p className="text-xs text-blue-700 mt-2 italic">{pm.transferNotes}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm">Comprobante (opcional)</Label>
                    {receiptUrl ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                        <MaterialIcon name="check_circle" size="sm" className="text-green-600" />
                        <span className="text-sm text-green-800 flex-1">Comprobante enviado</span>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl py-3 text-sm font-medium transition-colors cursor-pointer active:scale-[0.98]">
                        {uploadingReceipt ? (
                          <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                        ) : (
                          <MaterialIcon name="upload" size="sm" className="text-primary" />
                        )}
                        {uploadingReceipt ? 'Subiendo...' : 'Subir comprobante'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploadingReceipt}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleConfirmationReceiptUpload(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
