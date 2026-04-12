'use client';

import { useState, useMemo } from 'react';
import type { StorefrontData, MenuItem, MenuItemVariant, MenuItemOption } from '@/types';
import { useCartStore, CartItem } from '@/stores/cart.store';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Plus, Minus, MapPin, Send, X, Check } from 'lucide-react';
import { DeliveryType } from '@/types';
import type { StorefrontOrderResponse } from '@/types';

type FullMenuItem = MenuItem & { variants: MenuItemVariant[]; options: MenuItemOption[] };

export function StorefrontView({ data, slug }: { data: StorefrontData; slug: string }) {
  const { restaurant, categories, operatingHours, deliveryZones, showPoweredByFooter } = data;
  const cart = useCartStore();

  // Main UI state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<StorefrontOrderResponse | null>(null);

  // Item detail dialog state
  const [selectedItem, setSelectedItem] = useState<FullMenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const openItemDetail = (item: FullMenuItem) => {
    if (!item.isAvailable) return;
    setSelectedItem(item);
    // Auto-select first variant if available
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

  // Derived: selected variant object
  const selectedVariant = useMemo(() => {
    if (!selectedItem || !selectedVariantId) return null;
    return selectedItem.variants.find((v) => v.id === selectedVariantId) ?? null;
  }, [selectedItem, selectedVariantId]);

  // Derived: available options for the selected variant
  const availableOptions = useMemo(() => {
    if (!selectedItem) return [];
    return selectedItem.options.filter(
      (o) => o.isAvailable && (o.variantId === null || o.variantId === selectedVariantId),
    );
  }, [selectedItem, selectedVariantId]);

  // Derived: options grouped by optionGroup
  const optionGroups = useMemo(() => {
    const groups: Record<string, MenuItemOption[]> = {};
    for (const opt of availableOptions) {
      const group = opt.optionGroup || 'Extras';
      if (!groups[group]) groups[group] = [];
      groups[group].push(opt);
    }
    return groups;
  }, [availableOptions]);

  // Derived: max selections for current variant (0 = unlimited)
  const maxSelections = selectedVariant?.maxSelections ?? 0;

  const toggleOption = (optionId: string) => {
    setSelectedOptionIds((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      // Enforce maxSelections
      if (maxSelections > 0 && prev.length >= maxSelections) {
        return prev;
      }
      return [...prev, optionId];
    });
  };

  // Derived: unit price calculation
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
    } catch (err) {
      alert('Error al crear el pedido. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Order confirmation screen ──
  if (orderResult) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Pedido creado</h1>
          <p className="text-muted-foreground">Tu pedido <strong>{orderResult.order.code}</strong> fue creado. Envialo por WhatsApp para confirmarlo.</p>
          <a
            href={orderResult.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Enviar por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      {restaurant.bannerUrl && (
        <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.bannerUrl})` }} />
      )}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          {restaurant.description && <p className="mt-1 text-muted-foreground">{restaurant.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {restaurant.address && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{restaurant.address}</span>
            )}
          </div>
        </div>

        {/* ── Categories & Items ── */}
        {categories.map((cat) => (
          <div key={cat.id} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{cat.name}</h2>
            {cat.description && <p className="mb-3 text-sm text-muted-foreground">{cat.description}</p>}
            <div className="space-y-2">
              {cat.items.map((item) => (
                <div
                  key={item.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  onClick={() => openItemDetail(item)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {!item.isAvailable && <Badge variant="secondary">Agotado</Badge>}
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(item.basePrice, restaurant.currency)}</p>
                  </div>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="ml-3 h-16 w-16 rounded-md object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Powered by footer ── */}
      {showPoweredByFooter && (
        <div className="mx-auto max-w-2xl px-4 pb-20">
          <div className="border-t pt-6 pb-4 text-center">
            <a
              href="https://quiero.menu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Powered by <span className="font-semibold">quiero.menu</span>
            </a>
          </div>
        </div>
      )}

      {/* ── Item detail sheet ── */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => { if (!open) closeItemDetail(); }}>
        <SheetContent side="bottom" className="h-[85vh] overflow-auto">
          {selectedItem && (
            <div className="space-y-5">
              {/* Close button */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                  {selectedItem.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{selectedItem.description}</p>
                  )}
                </div>
                <button onClick={closeItemDetail} className="ml-3 rounded-full p-1 hover:bg-accent">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Item image */}
              {selectedItem.imageUrl && (
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="h-48 w-full rounded-lg object-cover"
                />
              )}

              {/* ── Variants ── */}
              {selectedItem.variants.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Elegí una opción</Label>
                  <div className="flex flex-wrap gap-2">
                    {[...selectedItem.variants]
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((variant) => {
                        const isSelected = selectedVariantId === variant.id;
                        const price = variant.priceOverride ?? selectedItem.basePrice;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              // Clear options that aren't valid for this variant
                              setSelectedOptionIds((prev) =>
                                prev.filter((id) => {
                                  const opt = selectedItem.options.find((o) => o.id === id);
                                  return opt && (opt.variantId === null || opt.variantId === variant.id);
                                }),
                              );
                            }}
                            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:bg-accent'
                            }`}
                          >
                            {variant.name} {formatCurrency(price, restaurant.currency)}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ── Options grouped by optionGroup ── */}
              {Object.keys(optionGroups).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(optionGroups).map(([group, options]) => (
                    <div key={group} className="space-y-2">
                      <Label className="text-sm font-semibold">
                        {group}
                        {maxSelections > 0 && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            (máx. {maxSelections})
                          </span>
                        )}
                      </Label>
                      <div className="space-y-1">
                        {options.map((opt) => {
                          const isChecked = selectedOptionIds.includes(opt.id);
                          const isDisabled = !isChecked && maxSelections > 0 && selectedOptionIds.length >= maxSelections;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => toggleOption(opt.id)}
                              disabled={isDisabled}
                              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                                isChecked
                                  ? 'border-primary bg-primary/10'
                                  : isDisabled
                                    ? 'cursor-not-allowed border-border opacity-50'
                                    : 'border-border hover:bg-accent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                                    isChecked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                                  }`}
                                >
                                  {isChecked && <Check className="h-3 w-3" />}
                                </div>
                                <span>{opt.name}</span>
                              </div>
                              {opt.priceDelta > 0 && (
                                <span className="text-muted-foreground">
                                  +{formatCurrency(opt.priceDelta, restaurant.currency)}
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

              {/* ── Notes ── */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Notas</Label>
                <Input
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Sin cebolla, bien cocido, etc."
                />
              </div>

              {/* ── Quantity selector + Add button ── */}
              <div className="sticky bottom-0 bg-background pt-3 pb-2 border-t space-y-3">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-accent"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2rem] text-center text-lg font-semibold">{itemQuantity}</span>
                  <button
                    onClick={() => setItemQuantity((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-accent"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={addToCart}
                  disabled={selectedItem.variants.length > 0 && !selectedVariantId}
                >
                  Agregar {formatCurrency(itemTotalPrice, restaurant.currency)}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Floating cart bar ── */}
      {cart.items.length > 0 && !checkoutOpen && !selectedItem && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div>
              <span className="font-semibold">{cart.items.length} items</span>
              <span className="ml-2 text-muted-foreground">{formatCurrency(subtotal, restaurant.currency)}</span>
            </div>
            <Button onClick={() => setCheckoutOpen(true)}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ver pedido
            </Button>
          </div>
        </div>
      )}

      {/* ── Checkout sheet ── */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-auto">
          <SheetHeader>
            <SheetTitle>Tu pedido</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {/* Cart items */}
            {cart.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{item.quantity}x {item.menuItemName}</span>
                  {item.variantName && <span className="text-sm text-muted-foreground"> ({item.variantName})</span>}
                  {item.selectedOptionNames.length > 0 && (
                    <p className="text-xs text-muted-foreground">{item.selectedOptionNames.join(', ')}</p>
                  )}
                  {item.notes && (
                    <p className="text-xs italic text-muted-foreground">{item.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{formatCurrency(item.unitPrice * item.quantity, restaurant.currency)}</span>
                  <Button variant="ghost" size="sm" onClick={() => cart.removeItem(i)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 space-y-3">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={cart.customerName} onChange={(e) => cart.setCustomer({ customerName: e.target.value })} placeholder="Tu nombre" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={cart.customerPhone} onChange={(e) => cart.setCustomer({ customerPhone: e.target.value })} placeholder="Tu teléfono" />
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
                    <Label>Dirección</Label>
                    <Input value={cart.customerAddress} onChange={(e) => cart.setCustomer({ customerAddress: e.target.value })} placeholder="Tu dirección" />
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

              {/* ── Payment method ── */}
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'efectivo', label: 'Efectivo' },
                    { value: 'transferencia', label: 'Transferencia' },
                    { value: 'tarjeta', label: 'Tarjeta' },
                  ].map((method) => (
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

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={cart.notes} onChange={(e) => cart.setNotes(e.target.value)} placeholder="Instrucciones especiales" rows={2} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal, restaurant.currency)}</span></div>
              {deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Envío</span><span>{formatCurrency(deliveryFee, restaurant.currency)}</span></div>}
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(total, restaurant.currency)}</span></div>
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
    </div>
  );
}
