'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import type { TrackingResponse, ConfirmDeliveryResponse } from '@/types';
import { OrderStatus, DeliveryType } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { browserPathParam } from '@/lib/static-route-param';
import { getRoomSocket } from '@/lib/socket';
import { subscribeOrderPush, isPushSupported, isPushSubscribed } from '@/lib/push';
import { getApiBase } from '@/lib/storefront-context';

const STATUS_STEPS = [
  OrderStatus.NEW,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERING,
  OrderStatus.DELIVERED,
];

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.NEW]: 'Recibido',
  [OrderStatus.PREPARING]: 'En preparación',
  [OrderStatus.READY]: 'Listo',
  [OrderStatus.DELIVERING]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

const STATUS_ICONS: Record<string, string> = {
  [OrderStatus.NEW]: 'receipt_long',
  [OrderStatus.PREPARING]: 'restaurant',
  [OrderStatus.READY]: 'check_circle',
  [OrderStatus.DELIVERING]: 'local_shipping',
  [OrderStatus.DELIVERED]: 'handshake',
  [OrderStatus.CANCELLED]: 'cancel',
};

export default function TrackingPage() {
  const params = useParams<{ code: string }>();
  const pathname = usePathname();
  const code = browserPathParam(pathname, params.code);
  const [slug, setSlug] = useState('');
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [pushState, setPushState] = useState<'idle' | 'busy' | 'on'>('idle');
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [onTime, setOnTime] = useState<boolean | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setSlug(search.get('slug') || '');
  }, []);

  const fetchTracking = useCallback(async () => {
    if (!code) return;
    try {
      // Legacy: /tracking/PED-0001?slug=... (por code, scoped al local).
      // Nuevo: /tracking/TOKEN (token global sin slug).
      const url = slug
        ? `${getApiBase()}/storefront/${encodeURIComponent(slug)}/orders/by-code/${encodeURIComponent(code)}`
        : `${getApiBase()}/tracking/${encodeURIComponent(code)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setInvalid(true);
        return;
      }
      const value: TrackingResponse = await res.json();
      setData(value);
      setInvalid(false);
    } catch {
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [code, slug]);

  useEffect(() => {
    if (!code) return;
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000);
    return () => clearInterval(interval);
  }, [code, slug, fetchTracking]);

  useEffect(() => {
    if (!code) return;
    (async () => {
      if (await isPushSupported()) {
        if (await isPushSubscribed()) setPushState('on');
      }
    })();
  }, [code]);

  const handleEnablePush = async () => {
    if (!data) return;
    setPushState('busy');
    try {
      const ok = await subscribeOrderPush(data.order.trackingToken);
      if (ok) setPushState('on');
    } finally {
      setPushState((s) => (s === 'busy' ? 'idle' : s));
    }
  };

  const handleConfirmDelivery = async () => {
    if (!data || confirming) return;
    setConfirming(true);
    setConfirmError('');
    try {
      const res = await fetch(
        `${getApiBase()}/tracking/${encodeURIComponent(data.order.trackingToken)}/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, onTime }),
        },
      );
      if (res.status === 409) {
        setConfirmError('Este pedido todavía no fue entregado.');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const out: ConfirmDeliveryResponse = await res.json();
      if (out.rating) setRating(out.rating);
      if (out.onTime !== null && out.onTime !== undefined)
        setOnTime(out.onTime);
      await fetchTracking();
    } catch {
      setConfirmError('No pudimos registrar tu confirmación. Probá de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  const handleCopyCoupon = async (couponCode: string) => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible: el código igual queda visible.
    }
  };

  const restaurantId = data?.restaurant.id;
  const orderCode = data?.order.code;
  useEffect(() => {
    if (!restaurantId || !orderCode) return;
    const room = `order:${restaurantId}:${orderCode}`;
    const socket = getRoomSocket(room);
    const handler = () => fetchTracking();
    socket.on('order.updated', handler);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off('order.updated', handler);
      socket.disconnect();
    };
  }, [restaurantId, orderCode, fetchTracking]);

  // Título de pestaña: solo el nombre del local. Favicon: el logo del local.
  useEffect(() => {
    if (!data) return;
    document.title = data.restaurant.name;
    if (data.restaurant.logoUrl) {
      document
        .querySelectorAll('link[rel="icon"]')
        .forEach((el) => el.remove());
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = data.restaurant.logoUrl;
      document.head.appendChild(link);
    }
  }, [data]);

  const handleReceiptUpload = async (file: File) => {
    if (!data) return;
    const slugForRestaurant = data.restaurant.slug;
    setUploadingReceipt(true);
    try {
      const res = await fetch(`${getApiBase()}/storefront/${encodeURIComponent(slugForRestaurant)}/receipt-upload`, {
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
      await fetch(`${getApiBase()}/storefront/${encodeURIComponent(slugForRestaurant)}/orders/${data.order.id}/receipt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: publicUrl }),
      });
      await fetchTracking();
    } catch {
      alert('Error al subir el comprobante. Intenta de nuevo.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
      </div>
    );
  }

  if (invalid || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface text-on-surface px-6 text-center">
        <MaterialIcon name="error" size="xl" className="text-error" />
        <p className="text-lg font-medium">Pedido no encontrado</p>
        <p className="text-sm text-on-surface-variant">Este link no existe o ya no está disponible.</p>
        {slug && (
          <Button variant="outline" onClick={() => (window.location.href = `/${slug}`)}>
            Volver al menú
          </Button>
        )}
      </div>
    );
  }

  const { order, items, restaurant } = data;
  const pm = restaurant.paymentMethods;
  const cancelled = order.status === OrderStatus.CANCELLED;
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const whatsappUrl = restaurant.phone
    ? `https://wa.me/${restaurant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Quiero confirmar mi pedido (${order.code}).`)}`
    : '';
  const showTransfer = order.paymentMethod === 'transferencia' && pm.transferEnabled;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/10 flex items-center justify-between w-full px-6 h-16">
        <div className="flex items-center gap-3 min-w-0">
          <MaterialIcon name="local_shipping" size="md" className="text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight truncate">{restaurant.name}</h1>
            <p className="text-xs text-on-surface-variant">Seguimiento de pedido</p>
          </div>
        </div>
        <span className="font-extrabold text-sm text-primary">#{order.code}</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Status card */}
        <section className="bg-white rounded-3xl shadow-ambient p-6 text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            cancelled ? 'bg-error/10' : 'bg-primary/10'
          }`}>
            <MaterialIcon
              name={STATUS_ICONS[order.status]}
              size="xl"
              className={cancelled ? 'text-error' : 'text-primary'}
            />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold" style={{ fontFamily: 'var(--font-heading)' }}>
            {STATUS_LABELS[order.status]}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Pedido creado {formatRelativeTime(order.createdAt)}
          </p>
        </section>

        {/* Timeline */}
        {!cancelled && (
          <section className="bg-white rounded-3xl shadow-ambient p-6">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                        done ? 'bg-primary text-white' : active ? 'gradient-cta text-white shadow-md shadow-primary/20' : 'bg-surface-container-low text-on-surface-variant'
                      }`}>
                        {done ? <MaterialIcon name="check" size="sm" /> : <MaterialIcon name={STATUS_ICONS[step]} size="sm" />}
                      </div>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${active ? 'text-primary' : done ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${i < currentStep ? 'bg-primary' : 'bg-outline-variant/40'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* WhatsApp confirm */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-700 transition-colors"
          >
            <MaterialIcon name="chat" size="sm" />
            Confirmar por WhatsApp
          </a>
        )}

        {/* Delivery confirmation by the comensal (el oráculo) */}
        {!cancelled &&
          (order.status === OrderStatus.DELIVERING ||
            order.status === OrderStatus.DELIVERED) &&
          !data.feedback?.confirmedAt && (
            <section className="bg-white rounded-3xl shadow-ambient p-6 space-y-4">
              <div className="text-center">
                <h3
                  className="text-xl font-extrabold"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  ¿Recibiste tu pedido?
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Confirmalo y te regalamos un 10% off para tu próximo pedido
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  aria-pressed={rating === 'up'}
                  onClick={() => setRating((r) => (r === 'up' ? null : 'up'))}
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${
                    rating === 'up'
                      ? 'border-green-600 bg-green-600/10 text-green-700'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-green-600/40'
                  }`}
                >
                  <MaterialIcon name="thumb_up" size="md" />
                </button>
                <button
                  type="button"
                  aria-pressed={rating === 'down'}
                  onClick={() =>
                    setRating((r) => (r === 'down' ? null : 'down'))
                  }
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${
                    rating === 'down'
                      ? 'border-error bg-error/10 text-error'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-error/40'
                  }`}
                >
                  <MaterialIcon name="thumb_down" size="md" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-on-surface-variant">
                  ¿Llegó a tiempo?
                </span>
                {([true, false] as const).map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    aria-pressed={onTime === v}
                    onClick={() => setOnTime((o) => (o === v ? null : v))}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      onTime === v
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {v ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>

              {confirmError && (
                <p className="text-center text-sm text-error">{confirmError}</p>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={confirming}
                onClick={handleConfirmDelivery}
              >
                {confirming ? 'Confirmando...' : 'Confirmar entrega'}
              </Button>
            </section>
          )}

        {/* Loyalty coupon unlocked by confirming */}
        {data.feedback?.confirmedAt && data.feedback.couponCode && (
          <section className="rounded-3xl shadow-ambient p-6 space-y-3 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MaterialIcon name="confirmation_number" size="lg" />
            </div>
            <h3
              className="text-xl font-extrabold"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ¡Gracias por confirmar! Tenés 10% off
            </h3>
            <p className="text-sm text-on-surface-variant">
              Usá este código en tu próximo pedido en {restaurant.name}
            </p>
            <button
              type="button"
              onClick={() =>
                data.feedback?.couponCode &&
                handleCopyCoupon(data.feedback.couponCode)
              }
              className="mx-auto flex items-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-surface-container-lowest px-6 py-3 font-mono text-2xl font-extrabold tracking-widest text-primary transition-colors hover:border-primary"
            >
              {data.feedback.couponCode}
              <MaterialIcon
                name={copied ? 'check' : 'content_copy'}
                size="sm"
              />
            </button>
            <p className="text-xs text-on-surface-variant">
              {copied ? '¡Copiado!' : 'Tocá para copiar'} · Válido por 30 días
            </p>
          </section>
        )}

        {/* Push notifications */}
        {pushState !== 'on' && (
          <button
            type="button"
            disabled={pushState === 'busy'}
            onClick={handleEnablePush}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
          >
            <MaterialIcon name="notifications" size="sm" />
            {pushState === 'busy' ? 'Activando...' : 'Avísame cuando avance mi pedido'}
          </button>
        )}

        {/* Transfer data + receipt */}
        {showTransfer && (
          <section className="bg-white rounded-3xl shadow-ambient p-6 space-y-4">
            <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Pagar por transferencia</h3>
            {(pm.transferBankName || pm.transferAccountNumber || pm.transferCbu || pm.transferAlias) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5">
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
              <Label className="text-sm">Comprobante</Label>
              {order.receiptUrl ? (
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
                      if (file) handleReceiptUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </section>
        )}

        {/* Items */}
        <section className="bg-white rounded-3xl shadow-ambient p-6 space-y-3">
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Tu pedido</h3>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex-1">
                <span className="font-semibold">{item.quantity}x {item.menuItemName}</span>
                {item.variantName && <span className="text-on-surface-variant"> ({item.variantName})</span>}
                {item.selectedOptions.length > 0 && (
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.selectedOptions.map((o) => o.name).join(', ')}</p>
                )}
                {item.notes && <p className="text-xs italic text-on-surface-variant mt-0.5">{item.notes}</p>}
              </div>
              <span className="text-on-surface-variant ml-2 shrink-0">{formatCurrency(item.totalPrice, restaurant.currency)}</span>
            </div>
          ))}
          <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(order.subtotal, restaurant.currency)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Descuento{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>-{formatCurrency(order.discount, restaurant.currency)}</span>
              </div>
            )}
            {order.deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Envío</span><span>{formatCurrency(order.deliveryFee, restaurant.currency)}</span></div>}
            {order.deliveryType === DeliveryType.DELIVERY && order.deliveryFee === 0 && order.couponCode && (
              <div className="flex justify-between text-sm text-green-700"><span>Envío</span><span>Gratis</span></div>
            )}
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(order.total, restaurant.currency)}</span></div>
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>Pago</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </div>
          </div>
          {order.notes && (
            <p className="text-xs italic text-on-surface-variant bg-surface-container-low rounded-lg p-3">&ldquo;{order.notes}&rdquo;</p>
          )}
        </section>

        {/* Back to menu */}
        <Button className="w-full" variant="outline" onClick={() => (window.location.href = `/${restaurant.slug}`)}>
          Volver al menú del local
        </Button>
      </main>
    </div>
  );
}
