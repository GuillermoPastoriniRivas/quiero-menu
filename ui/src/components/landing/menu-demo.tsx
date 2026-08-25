'use client';

import { useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { PhoneFrame } from '@/components/landing/phone-frame';
import { formatARS } from '@/lib/format';
import { cn } from '@/lib/utils';

type Product = {
  id: string;
  name: string;
  desc: string;
  price: number;
  img: string;
  badge?: string;
};

const CATEGORIES = [
  { id: 'pizzas', label: 'Pizzas' },
  { id: 'burgers', label: 'Hamburguesas' },
  { id: 'bebidas', label: 'Bebidas' },
] as const;

const PRODUCTS: Record<string, Product[]> = {
  pizzas: [
    {
      id: 'margherita',
      name: 'Pizza Margherita',
      desc: 'Salsa de tomate, mozzarella fresca y albahaca.',
      price: 12500,
      img: '/demo/margherita.webp',
    },
    {
      id: 'pepperoni',
      name: 'Pizza Pepperoni',
      desc: 'Doble pepperoni con extra mozzarella.',
      price: 14900,
      img: '/demo/pepperoni.webp',
    },
    {
      id: 'pollo-bbq',
      name: 'Pizza Pollo BBQ',
      desc: 'Pollo grillado, cebolla morada y salsa barbacoa.',
      price: 15900,
      img: '/demo/cuatro-quesos.webp',
      badge: 'MÁS PEDIDA',
    },
  ],
  burgers: [
    {
      id: 'doble-cheddar',
      name: 'Doble Cheddar',
      desc: 'Dos medallones, cheddar fundido, lechuga y tomate.',
      price: 11900,
      img: '/demo/burger.webp',
    },
  ],
  bebidas: [
    {
      id: 'gaseosa',
      name: 'Gaseosa 1.5 L',
      desc: 'Bien fría, para compartir en la mesa.',
      price: 3200,
      img: '/demo/gaseosa.webp',
    },
  ],
};

const ALL_PRODUCTS = Object.values(PRODUCTS).flat();

const TRACKING_STEPS = [
  { icon: 'receipt_long', label: 'Recibido' },
  { icon: 'restaurant', label: 'En preparación' },
  { icon: 'check_circle', label: 'Listo' },
  { icon: 'local_shipping', label: 'En camino' },
  { icon: 'handshake', label: 'Entregado' },
];

const SHIPPING = 2500;

export function MenuDemo() {
  const [screen, setScreen] = useState<'menu' | 'cart' | 'tracking'>('menu');
  const [category, setCategory] = useState<string>('pizzas');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [trackingStep, setTrackingStep] = useState(1);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: ALL_PRODUCTS.find((p) => p.id === id)!, qty }))
        .filter((l) => l.product),
    [cart],
  );

  const count = lines.reduce((acc, l) => acc + l.qty, 0);
  const subtotal = lines.reduce((acc, l) => acc + l.product.price * l.qty, 0);

  useEffect(() => {
    if (screen !== 'tracking' || trackingStep >= 4) return;
    const t = setTimeout(() => setTrackingStep((s) => s + 1), 2800);
    return () => clearTimeout(t);
  }, [screen, trackingStep]);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  function remove(id: string) {
    setCart((c) => {
      const next = { ...c };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });
  }

  function reset() {
    setCart({});
    setCategory('pizzas');
    setTrackingStep(1);
    setScreen('menu');
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[115%] w-[125%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="mb-5 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-2 text-xs font-bold text-on-surface-variant shadow-ambient">
          <MaterialIcon name="touch_app" size="xs" className="text-primary" />
          Tocá el menú: es una demo de verdad
        </span>
      </div>

      <PhoneFrame className="animate-float">
        {screen === 'menu' && (
          <>
            <div className="hide-scrollbar h-full w-full overflow-y-auto bg-surface pb-24">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- mockup estático servido desde /public, sin optimizador */}
              <img
                src="/demo/cover-pizzeria.webp"
                alt=""
                width={640}
                height={320}
                className="h-32 w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <div>
                  <p className="text-[13px] font-extrabold leading-tight text-white">Pizzería Napoli</p>
                  <p className="text-[9px] text-white/80">Villa Crespo · Retiro y delivery</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                  <span className="h-1 w-1 rounded-full bg-white" />
                  Abierto
                </span>
              </div>
            </div>

            <div className="flex gap-3 px-3 py-2 text-[9px] text-on-surface-variant">
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="schedule" size="xs" />
                25-40 min
              </span>
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="delivery_dining" size="xs" />
                Envío {formatARS(SHIPPING)}
              </span>
              <span className="flex items-center gap-0.5">
                <MaterialIcon name="payments" size="xs" />
                Efectivo o transferencia
              </span>
            </div>

            <div className="hide-scrollbar sticky top-0 z-10 flex gap-1.5 overflow-x-auto bg-surface/95 px-3 py-2 backdrop-blur">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors',
                    category === c.id
                      ? 'gradient-cta text-white'
                      : 'border border-outline-variant/60 bg-white text-on-surface-variant',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 px-3 pt-1">
              {PRODUCTS[category].map((p, i) => {
                const qty = cart[p.id] ?? 0;
                return (
                  <div
                    key={p.id}
                    className="relative flex gap-2.5 rounded-2xl border border-outline-variant/40 bg-white p-2.5 shadow-sm"
                  >
                    {p.badge && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[7px] font-bold text-amber-800">
                        {p.badge}
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element -- mockup estático servido desde /public, sin optimizador */}
                    <img
                      src={p.img}
                      alt=""
                      width={200}
                      height={200}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold leading-tight text-on-surface">{p.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-on-surface-variant">
                        {p.desc}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-[11px] font-extrabold text-on-surface">{formatARS(p.price)}</p>
                        {qty > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => remove(p.id)}
                              aria-label={`Quitar un ${p.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/60 bg-white text-on-surface-variant"
                            >
                              <MaterialIcon name="remove" size="xs" />
                            </button>
                            <span className="w-3 text-center text-[11px] font-extrabold text-on-surface">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => add(p.id)}
                              aria-label={`Agregar un ${p.name}`}
                              className="gradient-cta flex h-6 w-6 items-center justify-center rounded-full text-white"
                            >
                              <MaterialIcon name="add" size="xs" />
                            </button>
                          </div>
                        ) : (
                          <span className="relative flex">
                            {i === 0 && count === 0 && (
                              <span
                                aria-hidden
                                className="animate-ping-soft absolute inset-0 rounded-full bg-primary"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => add(p.id)}
                              aria-label={`Agregar ${p.name} al pedido`}
                              className="gradient-cta relative flex h-6 w-6 items-center justify-center rounded-full text-white"
                            >
                              <MaterialIcon name="add" size="xs" />
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col items-center gap-0.5 pb-2 text-center">
              <p className="text-[7px] font-bold uppercase tracking-[0.25em] text-outline">Hecho con</p>
              <p className="font-[family-name:var(--font-logo)] text-[11px] font-extrabold text-on-surface">
                quiero<span className="text-primary">.menu</span>
              </p>
            </div>
            </div>
            {count > 0 && (
              <div className="absolute inset-x-3 bottom-3 z-20">
                <button
                  type="button"
                  onClick={() => setScreen('cart')}
                  className="gradient-cta flex w-full items-center justify-between rounded-full px-3.5 py-2.5 text-[11px] font-bold text-white shadow-lg shadow-primary/30"
                >
                  <span className="flex items-center gap-1.5">
                    <MaterialIcon name="shopping_bag" size="sm" />
                    <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[9px]">{count}</span>
                  </span>
                  <span>Ver mi pedido</span>
                  <span className="font-extrabold">{formatARS(subtotal)}</span>
                </button>
              </div>
            )}
          </>
        )}

        {screen === 'cart' && (
          <>
            <div className="hide-scrollbar h-full w-full overflow-y-auto bg-surface pb-24">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-outline-variant/20 bg-white/95 px-3 py-2.5 backdrop-blur">
              <button
                type="button"
                onClick={() => setScreen('menu')}
                aria-label="Volver al menú"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-low text-on-surface"
              >
                <MaterialIcon name="arrow_back" size="xs" />
              </button>
              <p className="text-[12px] font-extrabold text-on-surface">Tu pedido</p>
            </div>

            <div className="space-y-2 px-3 pt-3">
              {lines.map((l) => (
                <div
                  key={l.product.id}
                  className="flex items-center gap-2 rounded-2xl border border-outline-variant/40 bg-white p-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- mockup estático servido desde /public, sin optimizador */}
                  <img
                    src={l.product.img}
                    alt=""
                    width={200}
                    height={200}
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-bold text-on-surface">{l.product.name}</p>
                    <p className="text-[10px] font-extrabold text-primary">
                      {formatARS(l.product.price * l.qty)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => remove(l.product.id)}
                      aria-label={`Quitar un ${l.product.name}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-outline-variant/60 text-on-surface-variant"
                    >
                      <MaterialIcon name="remove" size="xs" />
                    </button>
                    <span className="w-3 text-center text-[10px] font-extrabold">{l.qty}</span>
                    <button
                      type="button"
                      onClick={() => add(l.product.id)}
                      aria-label={`Agregar un ${l.product.name}`}
                      className="gradient-cta flex h-5 w-5 items-center justify-center rounded-full text-white"
                    >
                      <MaterialIcon name="add" size="xs" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="space-y-1 rounded-2xl border border-outline-variant/40 bg-white p-3 text-[10px]">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="font-semibold text-on-surface">{formatARS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Envío</span>
                  <span className="font-semibold text-on-surface">{formatARS(SHIPPING)}</span>
                </div>
                <div className="flex justify-between border-t border-outline-variant/40 pt-1 text-[12px] font-extrabold">
                  <span>Total</span>
                  <span>{formatARS(subtotal + SHIPPING)}</span>
                </div>
                <div className="flex justify-between pt-1 text-[9px] font-bold text-success">
                  <span>Comisión de la app</span>
                  <span>{formatARS(0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border-2 border-primary bg-primary/5 px-2 py-2 text-center text-[9px] font-bold text-primary">
                  Efectivo
                </div>
                <div className="rounded-xl border border-outline-variant/60 bg-white px-2 py-2 text-center text-[9px] font-semibold text-on-surface-variant">
                  Transferencia
                </div>
              </div>
            </div>

            </div>
            <div className="absolute inset-x-3 bottom-3 z-20">
              <button
                type="button"
                onClick={() => setScreen('tracking')}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-green-600 py-2.5 text-[11px] font-bold text-white shadow-lg shadow-green-600/25"
              >
                <MaterialIcon name="chat" size="sm" />
                Confirmar por WhatsApp
              </button>
            </div>
          </>
        )}

        {screen === 'tracking' && (
          <div className="hide-scrollbar h-full w-full overflow-y-auto bg-surface pb-20">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/20 bg-white/95 px-3 py-2.5 backdrop-blur">
              <div>
                <p className="text-[11px] font-extrabold leading-tight text-on-surface">Pizzería Napoli</p>
                <p className="text-[9px] text-on-surface-variant">Seguimiento del pedido</p>
              </div>
              <span className="text-[11px] font-extrabold text-primary">#1042</span>
            </div>

            <div className="px-3 pt-3">
              <div className="rounded-2xl border border-outline-variant/40 bg-white p-3 text-center shadow-sm">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <MaterialIcon
                    name={TRACKING_STEPS[trackingStep].icon}
                    size="md"
                    className="text-primary"
                  />
                </div>
                <p className="mt-2 text-[12px] font-extrabold text-on-surface">
                  {TRACKING_STEPS[trackingStep].label}
                </p>
                <p className="text-[9px] text-on-surface-variant">Se actualiza solo, sin que nadie llame</p>
              </div>
            </div>

            <div className="px-3 pt-2">
              <div className="rounded-2xl border border-outline-variant/40 bg-white p-3 shadow-sm">
                {TRACKING_STEPS.map((s, i) => {
                  const done = i <= trackingStep;
                  return (
                    <div key={s.label} className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-500',
                            done ? 'gradient-cta text-white' : 'bg-surface-container-low text-outline',
                          )}
                        >
                          <MaterialIcon name={done ? 'check' : s.icon} size="xs" />
                        </div>
                        {i < TRACKING_STEPS.length - 1 && (
                          <div
                            className={cn(
                              'my-0.5 h-4 w-0.5 rounded transition-colors duration-500',
                              i < trackingStep ? 'bg-primary' : 'bg-outline-variant/50',
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          'pt-0.5 text-[10px] font-semibold',
                          done ? 'text-on-surface' : 'text-on-surface-variant',
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-3 pt-2">
              <div className="rounded-xl border border-outline-variant/40 bg-white p-2.5">
                <p className="text-[9px] font-bold text-on-surface">Tu pedido</p>
                {lines.map((l) => (
                  <p key={l.product.id} className="text-[9px] text-on-surface-variant">
                    {l.qty}× {l.product.name}
                  </p>
                ))}
                <p className="mt-1 border-t border-outline-variant/40 pt-1 text-[10px] font-extrabold text-on-surface">
                  Total {formatARS(subtotal + SHIPPING)}
                </p>
              </div>
            </div>

            <div className="px-3 pb-3 pt-2">
              <button
                type="button"
                onClick={reset}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-outline-variant/60 bg-white py-2 text-[10px] font-bold text-on-surface-variant"
              >
                <MaterialIcon name="restart_alt" size="xs" />
                Probar la demo otra vez
              </button>
            </div>
          </div>
        )}
      </PhoneFrame>
    </div>
  );
}
