'use client';

import { useEffect, useState } from 'react';
import { useRestaurantStore } from '@/stores/restaurant.store';
import { useBillingStore } from '@/stores/billing.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { OperatingHours, DeliveryZone, KitchenAccessToken } from '@/types';
import { PlanTier } from '@/types';
import { toast } from 'sonner';
import { MaterialIcon } from '@/components/ui/material-icon';
import { formatDate } from '@/lib/format';

export default function SettingsPage() {
  const { restaurant, fetch: fetchRestaurant, update } = useRestaurantStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('');
  const [instagram, setInstagram] = useState('');
  const [saving, setSaving] = useState(false);

  // Delivery zones
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZonePrice, setNewZonePrice] = useState('');

  // Kitchen tokens
  const [tokens, setTokens] = useState<KitchenAccessToken[]>([]);

  // Operating hours
  const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const defaultHours: Omit<OperatingHours, 'id' | 'restaurantId'>[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i + 1,
    opensAt: '09:00',
    closesAt: '22:00',
    isClosed: false,
  }));
  const [hours, setHours] = useState(defaultHours);
  const [savingHours, setSavingHours] = useState(false);
  const { updateHours } = useRestaurantStore();

  // Billing
  const billing = useBillingStore();
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchRestaurant();
    loadZones();
    loadTokens();
    billing.fetch();
    billing.fetchHistory();
  }, []);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setDescription(restaurant.description);
      setPhone(restaurant.phone);
      setAddress(restaurant.address);
      setCity(restaurant.city);
      setCurrency(restaurant.currency);
      setInstagram(restaurant.socialLinks?.instagram || '');
    }
  }, [restaurant]);

  const loadZones = async () => {
    const data = await api.get<DeliveryZone[]>('/delivery-zones');
    setZones(data);
  };

  const loadTokens = async () => {
    const data = await api.get<KitchenAccessToken[]>('/kitchen/tokens');
    setTokens(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({
        name, description, phone, address, city, currency,
        socialLinks: { instagram: instagram || undefined },
      });
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName || !newZonePrice) return;
    await api.post('/delivery-zones', { name: newZoneName, price: Number(newZonePrice) });
    setNewZoneName('');
    setNewZonePrice('');
    loadZones();
    toast.success('Zona creada');
  };

  const handleDeleteZone = async (id: string) => {
    await api.delete(`/delivery-zones/${id}`);
    loadZones();
    toast.success('Zona eliminada');
  };

  const handleCreateToken = async () => {
    const name = `Vista ${tokens.length + 1}`;
    await api.post('/kitchen/tokens', { name });
    loadTokens();
    toast.success('Acceso creado');
  };

  const handleRevokeToken = async (id: string) => {
    await api.delete(`/kitchen/tokens/${id}`);
    loadTokens();
    toast.success('Acceso eliminado');
  };

  const getKitchenUrl = (token: string) => `${window.location.origin}/kitchen/${token}`;

  const copyKitchenLink = (token: string) => {
    navigator.clipboard.writeText(getKitchenUrl(token));
    toast.success('Link copiado');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Plan</TabsTrigger>
          <TabsTrigger value="delivery">Zonas de delivery</TabsTrigger>
          <TabsTrigger value="kitchen">Cocina</TabsTrigger>
          <TabsTrigger value="hours">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos del restaurante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Teléfono (WhatsApp)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57..." /></div>
                <div className="space-y-2"><Label>Dirección</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="space-y-2"><Label>Ciudad</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div className="space-y-2"><Label>Moneda</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Sobre nosotros</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Contale a tus clientes sobre tu negocio" /></div>
              <div className="space-y-2 pt-2">
                <Label className="text-base font-semibold">Redes sociales</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Instagram</Label><Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@tucuenta" /></div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </CardContent>
          </Card>
          {restaurant && (
            <Card>
              <CardHeader>
                <CardTitle>Link público</CardTitle>
                <CardDescription>Compartí este link con tus clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input value={`${window.location.origin}/${restaurant.slug}`} readOnly />
                  <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${restaurant.slug}`); toast.success('Link copiado'); }}>
                    <MaterialIcon name="content_copy" size="sm" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 mt-4">
          {/* Current plan */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Free plan card */}
            <Card className={billing.info?.plan === PlanTier.FREE ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gratis</CardTitle>
                  {billing.info?.plan === PlanTier.FREE && <Badge>Plan actual</Badge>}
                </div>
                <CardDescription>Para empezar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Hasta 50 pedidos/mes</li>
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Menú digital completo</li>
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Pedidos por WhatsApp</li>
                  <li className="flex items-center gap-2 text-muted-foreground"><MaterialIcon name="close" size="sm" />Footer "Powered by quiero.menu"</li>
                  <li className="flex items-center gap-2 text-muted-foreground"><MaterialIcon name="close" size="sm" />Sin dominio personalizado</li>
                </ul>
              </CardContent>
            </Card>

            {/* Pro plan card */}
            <Card className={billing.info?.plan === PlanTier.PRO ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><MaterialIcon name="bolt" size="md" className="text-yellow-500" />Pro</CardTitle>
                  {billing.info?.plan === PlanTier.PRO && <Badge>Plan actual</Badge>}
                </div>
                <CardDescription>Para restaurantes en crecimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold">$19<span className="text-sm font-normal text-muted-foreground"> USD/mes</span></p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Pedidos ilimitados</li>
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Menú digital completo</li>
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Pedidos por WhatsApp</li>
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Sin footer de quiero.menu</li>
                  <li className="flex items-center gap-2"><MaterialIcon name="check" size="sm" className="text-green-600" />Dominio personalizado</li>
                </ul>
                {billing.info?.plan === PlanTier.FREE && (
                  <Button className="w-full" disabled={upgrading} onClick={async () => {
                    setUpgrading(true);
                    try {
                      const url = await billing.checkout();
                      window.location.href = url;
                    } catch (err: any) {
                      toast.error(err.message || 'Error al crear checkout');
                    } finally {
                      setUpgrading(false);
                    }
                  }}>
                    <MaterialIcon name="bolt" size="sm" className="mr-2" />{upgrading ? 'Redirigiendo...' : 'Subir a Pro'}
                  </Button>
                )}
                {billing.info?.plan === PlanTier.PRO && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={async () => {
                      try {
                        const url = await billing.getPortalUrl();
                        window.open(url, '_blank');
                      } catch {
                        toast.error('No se pudo obtener el portal de pagos');
                      }
                    }}>Administrar pago</Button>
                    <Button variant="ghost" className="text-destructive" disabled={canceling} onClick={async () => {
                      if (!confirm('¿Seguro que querés cancelar? Perderás acceso a las funciones Pro.')) return;
                      setCanceling(true);
                      try {
                        await billing.cancel();
                        await billing.fetch();
                        toast.success('Suscripción cancelada');
                      } catch (err: any) {
                        toast.error(err.message || 'Error al cancelar');
                      } finally {
                        setCanceling(false);
                      }
                    }}>{canceling ? 'Cancelando...' : 'Cancelar plan'}</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage */}
          {billing.info && (
            <Card>
              <CardHeader>
                <CardTitle>Uso este mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pedidos</span>
                  <span className="text-sm font-medium">
                    {billing.info.usage.ordersThisMonth}
                    {billing.info.limits.maxOrdersPerMonth !== -1 && ` / ${billing.info.limits.maxOrdersPerMonth}`}
                    {billing.info.limits.maxOrdersPerMonth === -1 && ' (ilimitado)'}
                  </span>
                </div>
                {billing.info.limits.maxOrdersPerMonth !== -1 && (
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${billing.info.usage.ordersThisMonth > billing.info.limits.maxOrdersPerMonth ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, (billing.info.usage.ordersThisMonth / billing.info.limits.maxOrdersPerMonth) * 100)}%` }}
                    />
                  </div>
                )}
                {billing.info.usage.ordersThisMonth > billing.info.limits.maxOrdersPerMonth && billing.info.limits.maxOrdersPerMonth !== -1 && (
                  <p className="text-sm text-destructive">
                    Tenés {billing.info.usage.ordersThisMonth - billing.info.limits.maxOrdersPerMonth} pedidos ocultos. Subí a Pro para verlos.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing history */}
          {billing.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de facturación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {billing.history.map((record) => (
                    <div key={record.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">{record.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(record.createdAt)}</p>
                      </div>
                      {record.amountCents > 0 && (
                        <span className="font-medium">${(record.amountCents / 100).toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Zonas de delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Nombre de zona" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} />
                <Input type="number" placeholder="Precio" value={newZonePrice} onChange={(e) => setNewZonePrice(e.target.value)} className="w-32" />
                <Button onClick={handleCreateZone}><MaterialIcon name="add" size="sm" className="mr-1" />Agregar</Button>
              </div>
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <span className="font-medium">{zone.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">${zone.price.toLocaleString()}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteZone(zone.id)}>
                    <MaterialIcon name="delete" size="sm" className="text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kitchen" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Cocina</CardTitle>
              <CardDescription>Creá links para que cocina vea los pedidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateToken}><MaterialIcon name="add" size="sm" className="mr-1" />Crear acceso</Button>
              {tokens.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{t.name || `Vista ${tokens.indexOf(t) + 1}`}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{getKitchenUrl(t.token)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyKitchenLink(t.token)}><MaterialIcon name="content_copy" size="sm" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRevokeToken(t.id)}><MaterialIcon name="delete" size="sm" className="text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Horarios de atención</CardTitle>
              <CardDescription>Configurá los horarios de apertura y cierre para cada día</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hours.map((h, i) => (
                <div key={h.dayOfWeek} className="flex items-center gap-4 rounded-md border p-3">
                  <span className="w-24 font-medium">{DAY_NAMES[i]}</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={h.isClosed} onCheckedChange={(checked) => setHours((prev) => prev.map((row, j) => j === i ? { ...row, isClosed: checked } : row))} />
                    <Label className="text-sm text-muted-foreground">Cerrado</Label>
                  </div>
                  <Input type="time" value={h.opensAt} disabled={h.isClosed} className="w-32" onChange={(e) => setHours((prev) => prev.map((row, j) => j === i ? { ...row, opensAt: e.target.value } : row))} />
                  <span className="text-muted-foreground">a</span>
                  <Input type="time" value={h.closesAt} disabled={h.isClosed} className="w-32" onChange={(e) => setHours((prev) => prev.map((row, j) => j === i ? { ...row, closesAt: e.target.value } : row))} />
                </div>
              ))}
              <Button disabled={savingHours} onClick={async () => {
                setSavingHours(true);
                try {
                  await updateHours(hours);
                  toast.success('Horarios guardados');
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setSavingHours(false);
                }
              }}>{savingHours ? 'Guardando...' : 'Guardar horarios'}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
