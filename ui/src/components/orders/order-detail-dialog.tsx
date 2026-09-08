'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/material-icon';
import { OrderStatus, DeliveryType } from '@/types';
import type { OrderItem, OrderWithRedaction, Restaurant, OrderFeedbackInfo } from '@/types';
import { formatCurrency, formatDate, formatMinutes, formatRelativeTime } from '@/lib/format';
import { waMeUrl } from '@/lib/utils';
import { NEXT_STATUS, STATUS_BADGE_VARIANT, STATUS_LABELS } from './status';

interface OrderDetailDialogProps {
  order: OrderWithRedaction | null;
  items?: OrderItem[];
  itemsError?: boolean;
  feedback?: OrderFeedbackInfo | null;
  restaurant: Restaurant | null;
  onOpenChange: (open: boolean) => void;
  onRetryItems: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}

export function OrderDetailDialog({
  order,
  items,
  itemsError = false,
  feedback = null,
  restaurant,
  onOpenChange,
  onRetryItems,
  onStatusChange,
}: OrderDetailDialogProps) {
  const currency = restaurant?.currency;
  const nextAction = order ? NEXT_STATUS[order.status] : undefined;
  const trackingHref =
    order && restaurant
      ? order.trackingToken
        ? `/tracking/${order.trackingToken}`
        : `/tracking/${order.code}?slug=${restaurant.slug}`
      : undefined;
  const mapsHref =
    order &&
    (order.customerLatitude || order.customerAddress)
      ? order.customerLatitude && order.customerLongitude
        ? `https://www.google.com/maps?q=${order.customerLatitude},${order.customerLongitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress || '')}`
      : undefined;
  const whatsappHref = waMeUrl(order?.customerPhone, `Hola! Te escribo por tu pedido (${order?.code}).`);

  const timeline: { label: string; at: string; elapsedLabel: string | null }[] =
    (() => {
      if (!order) return [];
      const history = order.statusHistory ?? [];
      if (history.length > 0) {
        const steps: { label: string; at: Date }[] = [
          { label: 'Creado', at: new Date(order.createdAt) },
        ];
        let lastLabel = 'Creado';
        for (const h of history) {
          if (h.status === OrderStatus.NEW) continue;
          const label = STATUS_LABELS[h.status] ?? h.status;
          if (label === lastLabel) continue;
          lastLabel = label;
          steps.push({ label, at: new Date(h.at) });
        }
        steps.sort((a, b) => a.at.getTime() - b.at.getTime());
        return steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].at.getTime() : null;
          const elapsedLabel =
            prev !== null ? formatMinutes((s.at.getTime() - prev) / 60000) : null;
          return { label: s.label, at: s.at.toISOString(), elapsedLabel };
        });
      }
      // Pedidos viejos sin statusHistory: caen al timeline de campos legacy
      return ([
        { label: 'Creado', at: order.createdAt },
        { label: 'Confirmado', at: order.confirmedAt },
        { label: 'Listo', at: order.readyAt },
        { label: 'Entregado', at: order.deliveredAt },
      ] as { label: string; at: string | null }[])
        .filter((t) => t.at)
        .map((t) => ({ label: t.label, at: t.at!, elapsedLabel: null }));
    })();

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span>{order.code}</span>
                <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                  {STATUS_LABELS[order.status]}
                </Badge>
                <span className="ml-auto font-normal text-xs text-on-surface-variant">
                  {formatRelativeTime(order.createdAt)}
                </span>
              </DialogTitle>
            </DialogHeader>

            {order.redacted ? (
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl p-4 text-sm text-on-surface-variant">
                <MaterialIcon name="lock" size="sm" />
                Pedido oculto. Subí a Pro para ver el detalle completo.
              </div>
            ) : (
              <div className="space-y-5">
                {/* Cliente */}
                <section className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cliente</h4>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 font-semibold">
                      <MaterialIcon name="person" size="xs" className="text-on-surface-variant" />
                      {order.customerName}
                      {whatsappHref && (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MaterialIcon name="chat" size="xs" />
                          Escribir
                        </a>
                      )}
                    </p>
                    {order.customerPhone && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MaterialIcon name="phone" size="xs" />
                        {order.customerPhone}
                        <MaterialIcon name="open_in_new" size="xs" />
                      </a>
                    )}
                    <p className="flex items-center gap-2 text-on-surface-variant">
                      <MaterialIcon name={order.deliveryType === DeliveryType.PICKUP ? 'storefront' : 'local_shipping'} size="xs" />
                      {order.deliveryType === DeliveryType.PICKUP ? 'Retiro en local' : 'Delivery'}
                    </p>
                    {order.deliveryType === DeliveryType.DELIVERY && mapsHref && (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MaterialIcon name="location_on" size="xs" />
                        {order.customerAddress || 'Ver ubicacion'}
                        <MaterialIcon name="open_in_new" size="xs" />
                      </a>
                    )}
                  </div>
                </section>

                {/* Items */}
                <section className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Items</h4>
                  {items && items.length > 0 ? (
                    <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <span className="font-semibold">{item.quantity}x {item.menuItemName}</span>
                            {item.variantName && (
                              <span className="text-on-surface-variant"> ({item.variantName})</span>
                            )}
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <p className="text-xs text-on-surface-variant mt-0.5">
                                {item.selectedOptions.map((o) => o.name).join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-xs italic text-on-surface-variant mt-0.5">{item.notes}</p>
                            )}
                          </div>
                          <span className="text-on-surface-variant ml-2 shrink-0">{formatCurrency(item.totalPrice, currency)}</span>
                        </div>
                      ))}
                    </div>
                  ) : itemsError ? (
                    <div className="flex items-center justify-between gap-3 bg-error/5 border border-error/20 rounded-xl p-3 text-sm text-on-surface-variant">
                      <span className="inline-flex items-center gap-2">
                        <MaterialIcon name="error" size="xs" />
                        No se pudieron cargar los items.
                      </span>
                      <Button size="xs" variant="outline" onClick={onRetryItems}>
                        Reintentar
                      </Button>
                    </div>
                  ) : items === undefined ? (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <MaterialIcon name="progress_activity" size="xs" className="animate-spin" />
                      Cargando items...
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">Sin items para este pedido.</p>
                  )}

                  {/* Totales */}
                  <div className="bg-surface-container-low rounded-xl p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Subtotal</span>
                      <span>{formatCurrency(order.subtotal, currency)}</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Envío</span>
                        <span>{formatCurrency(order.deliveryFee, currency)}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Descuento{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                        <span>-{formatCurrency(order.discount, currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>Total</span>
                      <span>{formatCurrency(order.total, currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Pago</span>
                      <span className="capitalize">{order.paymentMethod || '—'}</span>
                    </div>
                  </div>

                  {/* Comprobante */}
                  {order.paymentMethod === 'transferencia' && (
                    order.receiptUrl ? (
                      <a
                        href={order.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 hover:bg-green-100 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MaterialIcon name="check_circle" size="xs" />
                        Ver comprobante
                      </a>
                    ) : (
                      <p className="inline-flex items-center gap-2 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <MaterialIcon name="schedule" size="xs" />
                        Sin comprobante
                      </p>
                    )
                  )}
                </section>

                {/* Notas */}
                {order.notes && (
                  <div className="bg-yellow-100 border border-yellow-200 p-3 rounded-xl flex items-start gap-2">
                    <MaterialIcon name="warning" size="sm" className="text-yellow-700 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-900 font-bold italic">&ldquo;{order.notes}&rdquo;</p>
                  </div>
                )}

                {/* Confirmación del comensal (oráculo) */}
                {feedback?.confirmedAt && (
                  <div className="bg-green-600/10 border border-green-600/20 p-3 rounded-xl flex items-start gap-2">
                    <MaterialIcon name="verified" size="sm" className="text-green-700 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold text-green-800">
                        Confirmado por el cliente
                        {feedback.rating === 'up' && ' · 👍'}
                        {feedback.rating === 'down' && ' · 👎'}
                        {feedback.onTime === true && ' · a tiempo'}
                        {feedback.onTime === false && ' · tarde'}
                      </p>
                      {feedback.couponCode && (
                        <p className="text-xs text-green-700 mt-0.5">
                          Cupón entregado: <span className="font-mono font-bold">{feedback.couponCode}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {timeline.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Línea de tiempo</h4>
                    <div className="space-y-1.5">
                      {timeline.map((t) => (
                        <div key={`${t.label}-${t.at}`} className="flex items-center justify-between text-sm gap-3">
                          <span className="text-on-surface-variant">{t.label}</span>
                          <span className="text-right">
                            <span className="block font-medium">{formatDate(t.at)}</span>
                            {t.elapsedLabel && (
                              <span className="block text-xs text-on-surface-variant">
                                {t.elapsedLabel} desde el paso anterior
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {nextAction && (
                    <Button
                      onClick={() => onStatusChange(order.id, nextAction.status)}
                      className="w-full sm:w-auto shadow-md shadow-primary/20"
                    >
                      <MaterialIcon name={nextAction.icon} size="sm" />
                      {nextAction.label}
                    </Button>
                  )}
                  {trackingHref && (
                    <a
                      href={trackingHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MaterialIcon name="open_in_new" size="sm" />
                      Ver tracking
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}