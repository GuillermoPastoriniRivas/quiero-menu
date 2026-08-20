'use client';

import { useEffect, useState } from 'react';
import { useBillingStore } from '@/stores/billing.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialIcon } from '@/components/ui/material-icon';
import { PlanTier, Subscription } from '@/types';
import { toast } from 'sonner';
import { formatARS, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CustomDomainCard } from '@/components/custom-domain/custom-domain-card';

const PRO_PRICE = 15000;

const EVENT_META: Record<
  string,
  { label: string; state: 'success' | 'error' | 'neutral' }
> = {
  subscription_created: { label: 'Suscripción activada', state: 'success' },
  subscription_renewed: { label: 'Suscripción renovada', state: 'success' },
  payment_success: { label: 'Cobro mensual', state: 'success' },
  payment_failed: { label: 'Cobro rechazado', state: 'error' },
  subscription_canceled: { label: 'Suscripción cancelada', state: 'neutral' },
  subscription_expired: { label: 'Suscripción vencida', state: 'neutral' },
  subscription_updated: { label: 'Suscripción actualizada', state: 'neutral' },
  plan_changed: { label: 'Cambio de plan', state: 'neutral' },
};

function eventMeta(eventType: string) {
  return (
    EVENT_META[eventType] ?? {
      label: 'Movimiento',
      state: 'neutral' as const,
    }
  );
}

const STATE_BADGE: Record<string, { className: string; label: string }> = {
  success: { className: 'bg-green-100 text-green-700', label: 'Cobrado' },
  error: { className: 'bg-red-100 text-red-700', label: 'Rechazado' },
  neutral: { className: 'bg-gray-100 text-gray-600', label: '' },
};

const STATE_ICON: Record<string, string> = {
  success: 'check_circle',
  error: 'error',
  neutral: 'receipt_long',
};

const STATE_ICON_CLASS: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-500',
};

function subscriptionStatus(sub: Subscription | null): {
  label: string;
  className: string;
} {
  if (!sub) return { label: 'Sin suscripción', className: 'bg-gray-100 text-gray-600' };
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
    authorized: { label: 'Activo', className: 'bg-green-100 text-green-700' },
    on_trial: { label: 'En período de prueba', className: 'bg-blue-100 text-blue-700' },
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
    paused: { label: 'Pausado', className: 'bg-gray-100 text-gray-600' },
    past_due: { label: 'Pago vencido', className: 'bg-red-100 text-red-700' },
    canceled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
    expired: { label: 'Vencido', className: 'bg-gray-100 text-gray-600' },
    finished: { label: 'Vencido', className: 'bg-gray-100 text-gray-600' },
  };
  return map[sub.status] ?? { label: sub.status, className: 'bg-gray-100 text-gray-600' };
}

export default function BillingPage() {
  const billing = useBillingStore();
  const fetchBilling = useBillingStore((s) => s.fetch);
  const fetchHistory = useBillingStore((s) => s.fetchHistory);
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchBilling();
    fetchHistory();
  }, [fetchBilling, fetchHistory]);

  const plan = billing.info?.plan ?? PlanTier.FREE;
  const sub = billing.info?.subscription ?? null;
  const usage = billing.info?.usage;
  const limits = billing.info?.limits;
  const history = billing.history;
  const status = subscriptionStatus(sub);
  const isPro = plan === PlanTier.PRO;

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const url = await billing.checkout();
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear el checkout');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Seguro que querés cancelar la suscripción? Perdés el acceso a las funciones Pro.')) return;
    setCanceling(true);
    try {
      await billing.cancel();
      await billing.fetch();
      toast.success('Suscripción cancelada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cancelar la suscripción');
    } finally {
      setCanceling(false);
    }
  };

  const maxOrders = limits?.maxOrdersPerMonth ?? 50;
  const ordersThisMonth = usage?.ordersThisMonth ?? 0;
  const unlimited = maxOrders === -1;
  const usagePct = unlimited
    ? 0
    : Math.min(100, Math.round((ordersThisMonth / maxOrders) * 100));
  const overLimit = !unlimited && ordersThisMonth > maxOrders;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Plan y facturación</h1>
          <p className="text-sm text-muted-foreground">Administrá tu suscripción, límites y cobros</p>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold', status.className)}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {status.label}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="workspace_premium" size="sm" className="text-primary" />
            Plan actual
          </CardTitle>
          <CardDescription>
            {isPro
              ? 'Tu suscripción Pro está activa'
              : 'Estás en el plan Gratis'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold">
                {isPro ? 'Pro' : 'Gratis'}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}{isPro ? `· ${formatARS(limits?.priceMonthly ?? PRO_PRICE)}/mes` : ' · $0/mes'}
                </span>
              </p>
              {isPro && sub && (
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  {sub.currentPeriodEnd && (
                    <p>Próxima renovación: {formatDate(sub.currentPeriodEnd)}</p>
                  )}
                  <p>Medio de pago: Mercado Pago</p>
                </div>
              )}
            </div>
            {isPro ? (
              <Button
                variant="outline"
                className="text-destructive"
                disabled={canceling}
                onClick={handleCancel}
              >
                <MaterialIcon name="close" size="sm" className="mr-1" />
                {canceling ? 'Cancelando...' : 'Cancelar plan'}
              </Button>
            ) : (
              <Button className="gradient-cta text-white" disabled={upgrading} onClick={handleUpgrade}>
                <MaterialIcon name="bolt" size="sm" className="mr-1" />
                {upgrading ? 'Redirigiendo...' : 'Subir a Pro'}
              </Button>
            )}
          </div>

          {!isPro && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
              <p className="font-bold mb-1">Pro: {formatARS(PRO_PRICE)}/mes con 30 días gratis</p>
              <ul className="text-muted-foreground space-y-1">
                <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Pedidos ilimitados</li>
                <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Sin footer de quiero.menu</li>
                <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Dominio personalizado</li>
                <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Sin comisiones por pedido</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomDomainCard isPro={isPro} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="bar_chart" size="sm" className="text-primary" />
            Uso del mes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Pedidos</span>
            <span className="font-medium">
              {ordersThisMonth}
              {unlimited ? ' (ilimitado)' : ` / ${maxOrders}`}
            </span>
          </div>
          {!unlimited && (
            <>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', overLimit ? 'bg-destructive' : 'bg-primary')}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              {overLimit && (
                <p className="text-sm text-destructive">
                  Superaste el límite del plan Gratis. Subí a Pro para ver todos tus pedidos.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="receipt_long" size="sm" className="text-primary" />
            Historial de cobros
          </CardTitle>
          <CardDescription>Todos los movimientos de tu facturación</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-10">
              <MaterialIcon name="receipt_long" size="lg" className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">Todavía no hay movimientos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cuando se procese un cobro de tu plan, va a aparecer acá.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {history.map((record) => {
                const meta = eventMeta(record.eventType);
                const badge = STATE_BADGE[meta.state];
                return (
                  <div key={record.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', STATE_ICON_CLASS[meta.state])}>
                        <MaterialIcon name={STATE_ICON[meta.state]} size="sm" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(record.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">
                        {record.amountCents > 0 ? formatARS(record.amountCents) : '—'}
                      </p>
                      {badge.label && (
                        <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5', badge.className)}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
