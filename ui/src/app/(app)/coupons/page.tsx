'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MaterialIcon } from '@/components/ui/material-icon';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { CouponType, Coupon } from '@/types';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const TYPE_OPTIONS = [
  { value: CouponType.PERCENTAGE, label: 'Porcentaje', hint: 'Ej: 10 = 10% OFF' },
  { value: CouponType.FIXED, label: 'Monto fijo', hint: 'Ej: 500 = $500 OFF' },
  { value: CouponType.FREE_DELIVERY, label: 'Envío gratis', hint: 'Sin costo de delivery' },
];

const TYPE_LABELS: Record<string, string> = {
  [CouponType.PERCENTAGE]: 'Porcentaje',
  [CouponType.FIXED]: 'Monto fijo',
  [CouponType.FREE_DELIVERY]: 'Envío gratis',
};

export default function CouponsPage() {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>(CouponType.PERCENTAGE);
  const [value, setValue] = useState('');
  const [minSubtotal, setMinSubtotal] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Coupon[]>('/coupons');
      setCoupons(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
    fetchCoupons();
  }, [fetchRestaurant, fetchCoupons]);

  const handleCreate = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 2) {
      toast.error('Escribí un código de al menos 2 caracteres.');
      return;
    }
    const valueNum = type === CouponType.FREE_DELIVERY ? 0 : Number(value);
    if (type !== CouponType.FREE_DELIVERY && (!value || valueNum <= 0)) {
      toast.error('Indicá un valor de descuento.');
      return;
    }
    if (type === CouponType.PERCENTAGE && valueNum > 100) {
      toast.error('El porcentaje no puede superar 100.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/coupons', {
        code: trimmed,
        type,
        value: valueNum,
        minSubtotal: Number(minSubtotal) || 0,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      toast.success('Cupón creado');
      setCode('');
      setValue('');
      setMinSubtotal('');
      setExpiresAt('');
      fetchCoupons();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Ese código ya existe.');
      } else {
        toast.error(e instanceof Error ? e.message : 'Error al crear el cupón');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await api.patch(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`¿Eliminar el cupón ${coupon.code}?`)) return;
    try {
      await api.delete(`/coupons/${coupon.id}`);
      toast.success('Cupón eliminado');
      fetchCoupons();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const describe = (c: Coupon): string => {
    if (c.type === CouponType.FREE_DELIVERY) return 'Envío gratis';
    if (c.type === CouponType.PERCENTAGE) return `${c.value}% OFF`;
    return `${formatCurrency(c.value, restaurant?.currency || 'ARS')} OFF`;
  };

  const expired = (c: Coupon): boolean => !!c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Cupones de descuento</h1>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Crear cupón</CardTitle>
          <CardDescription>Creá códigos que tus clientes usan al pagar en el menú</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ej: BIENVENIDO10" className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    size="sm"
                    variant={type === opt.value ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setType(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            {type !== CouponType.FREE_DELIVERY && (
              <div className="space-y-2">
                <Label>{type === CouponType.PERCENTAGE ? 'Porcentaje de descuento' : 'Monto de descuento'}</Label>
                <Input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === CouponType.PERCENTAGE ? 'Ej: 10' : 'Ej: 500'}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Compra mínima (opcional)</Label>
              <Input
                type="number"
                min={0}
                value={minSubtotal}
                onChange={(e) => setMinSubtotal(e.target.value)}
                placeholder="Ej: 10000"
              />
            </div>
            <div className="space-y-2">
              <Label>Vence el (opcional)</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving}>
            <MaterialIcon name="add" size="sm" className="mr-1" />
            {saving ? 'Creando...' : 'Crear cupón'}
          </Button>
          <p className="text-xs text-on-surface-variant">
            {TYPE_OPTIONS.find((o) => o.value === type)?.hint}
            {minSubtotal && Number(minSubtotal) > 0 ? ' · Aplica solo con compras de $' + Number(minSubtotal).toLocaleString() : ''}
          </p>
        </CardContent>
      </Card>

      {/* List */}
      {loading && coupons.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-on-surface-variant">
          <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-primary" />
        </div>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center space-y-3">
            <MaterialIcon name="confirmation_number" size="xl" className="text-on-surface-variant/40" />
            <p className="text-on-surface-variant">Todavía no tenés cupones.</p>
            <p className="text-sm text-on-surface-variant">Creá tu primer código para promocionar tu local.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <Card key={c.id} size="sm" className={`shadow-sm border border-outline-variant/10 ${!c.isActive || expired(c) ? 'opacity-70' : ''}`}>
              <div className="flex items-center gap-4 px-4 py-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MaterialIcon name="confirmation_number" size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold">{c.code}</p>
                    <Badge variant="secondary">{TYPE_LABELS[c.type]}</Badge>
                    {expired(c) && <Badge variant="destructive">Vencido</Badge>}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {describe(c)}
                    {c.minSubtotal > 0 ? ` · mín ${formatCurrency(c.minSubtotal, restaurant?.currency || 'ARS')}` : ''}
                    {c.expiresAt ? ` · vence ${new Date(c.expiresAt).toLocaleDateString('es')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.isActive && !expired(c)}
                      disabled={expired(c)}
                      onCheckedChange={() => handleToggle(c)}
                    />
                    <span className="text-xs text-on-surface-variant w-14">{c.isActive ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
                    <MaterialIcon name="delete" size="sm" className="text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
